// PATCH /api/sessions/[id]/initiative/[entryId] — Update initiative entry (HP, conditions, etc.)
// DELETE /api/sessions/[id]/initiative/[entryId] — Remove initiative entry
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, NotFoundError } from '@/lib/api-utils';
import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';

const updateInitiativeEntrySchema = z.object({
  hp: z.object({ current: z.number().int(), max: z.number().int() }).optional(),
  armorClass: z.number().int().optional(),
  conditions: z.array(z.string()).optional(),
  concentratingOn: z.string().nullable().optional(),
  initiative: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string; entryId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id, entryId } = await params;

    const session = await prisma.gameSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundError('Session tidak ditemukan');
    await requireCampaignMember(session.campaignId, user.id);

    const entry = await prisma.initiativeEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.sessionId !== id) throw new NotFoundError('Initiative entry tidak ditemukan');

    const body = await req.json();
    const data = updateInitiativeEntrySchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.hp !== undefined) updateData.hp = data.hp as unknown as Prisma.InputJsonValue;
    if (data.armorClass !== undefined) updateData.armorClass = data.armorClass;
    if (data.conditions !== undefined) updateData.conditions = data.conditions as unknown as Prisma.InputJsonValue;
    if (data.concentratingOn !== undefined) updateData.concentratingOn = data.concentratingOn;
    if (data.initiative !== undefined) updateData.initiative = data.initiative;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.initiativeEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    // Log HP changes to combat log
    if (data.hp !== undefined && entry.hp) {
      const oldHP = (entry.hp as { current: number; max: number });
      const delta = data.hp.current - oldHP.current;
      if (delta !== 0) {
        await prisma.combatLogEntry.create({
          data: {
            sessionId: id,
            round: session.currentRound,
            turn: entry.name,
            action: delta < 0 ? 'DAMAGE' : 'HEALING',
            result: JSON.stringify({
              text: delta < 0
                ? `${entry.name} takes ${Math.abs(delta)} damage (${data.hp.current}/${data.hp.max} HP)`
                : `${entry.name} heals ${delta} HP (${data.hp.current}/${data.hp.max} HP)`,
              oldHP: oldHP.current,
              newHP: data.hp.current,
              maxHP: data.hp.max,
              delta,
              updatedBy: user.id,
            }),
          },
        });
      }

      // Log death
      if (data.hp.current <= 0 && oldHP.current > 0) {
        await prisma.combatLogEntry.create({
          data: {
            sessionId: id,
            round: session.currentRound,
            turn: entry.name,
            action: 'DEATH',
            result: `${entry.name} falls unconscious!`,
          },
        });

        await prisma.chatMessage.create({
          data: {
            campaignId: session.campaignId,
            senderId: user.id,
            senderName: user.displayName || 'Unknown',
            type: 'COMBAT',
            content: `💀 ${entry.name} falls unconscious!`,
            channel: 'COMBAT',
          },
        });
      }
    }

    // Log condition changes
    if (data.conditions !== undefined) {
      const oldConditions = (entry.conditions as string[]) || [];
      const added = data.conditions.filter(c => !oldConditions.includes(c));
      const removed = oldConditions.filter(c => !data.conditions!.includes(c));

      for (const c of added) {
        await prisma.combatLogEntry.create({
          data: {
            sessionId: id,
            round: session.currentRound,
            turn: entry.name,
            action: 'CONDITION_ADD',
            result: `${entry.name} gains condition: ${c}`,
          },
        });
      }
      for (const c of removed) {
        await prisma.combatLogEntry.create({
          data: {
            sessionId: id,
            round: session.currentRound,
            turn: entry.name,
            action: 'CONDITION_REMOVE',
            result: `${entry.name} loses condition: ${c}`,
          },
        });
      }
    }

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id, entryId } = await params;

    const session = await prisma.gameSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundError('Session tidak ditemukan');
    await requireCampaignMember(session.campaignId, user.id);

    const entry = await prisma.initiativeEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.sessionId !== id) throw new NotFoundError('Initiative entry tidak ditemukan');

    await prisma.initiativeEntry.delete({ where: { id: entryId } });

    await prisma.combatLogEntry.create({
      data: {
        sessionId: id,
        round: session.currentRound,
        turn: entry.name,
        action: 'REMOVED',
        result: `${entry.name} removed from initiative`,
      },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
