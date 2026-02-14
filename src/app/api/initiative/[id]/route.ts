// PATCH /api/initiative/[id] — Update initiative entry (HP, conditions, concentration)
// DELETE /api/initiative/[id] — Remove from initiative
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth, requireDM, validateBody, NotFoundError } from '@/lib/api-utils';
import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';

const updateInitiativeSchema = z.object({
  hp: z.object({ current: z.number().int(), max: z.number().int() }).optional(),
  armorClass: z.number().int().min(0).max(40).optional(),
  conditions: z.array(z.string().max(50)).optional(),
  concentratingOn: z.string().max(100).nullable().optional(),
  initiative: z.number().int().min(-10).max(50).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const entry = await prisma.initiativeEntry.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!entry) throw new NotFoundError('Initiative entry tidak ditemukan');
    await requireDM(entry.session.campaignId, user.id);

    const body = await validateBody(req, updateInitiativeSchema);

    const updates: Record<string, unknown> = {};
    if (body.hp !== undefined) updates.hp = body.hp;
    if (body.armorClass !== undefined) updates.armorClass = body.armorClass;
    if (body.conditions !== undefined) updates.conditions = body.conditions as unknown as Prisma.InputJsonValue;
    if (body.concentratingOn !== undefined) updates.concentratingOn = body.concentratingOn;
    if (body.initiative !== undefined) updates.initiative = body.initiative;

    const updated = await prisma.initiativeEntry.update({
      where: { id },
      data: updates,
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const entry = await prisma.initiativeEntry.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!entry) throw new NotFoundError('Initiative entry tidak ditemukan');
    await requireDM(entry.session.campaignId, user.id);

    await prisma.initiativeEntry.delete({ where: { id } });
    return apiSuccess({ message: 'Entry dihapus dari initiative' });
  } catch (error) {
    return handleApiError(error);
  }
}
