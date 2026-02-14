// GET /api/sessions/[id]/combat-log — Get combat log for a session
// POST /api/sessions/[id]/combat-log — Add combat log entry (damage, healing, action)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, NotFoundError } from '@/lib/api-utils';
import { z } from 'zod';

const addCombatLogSchema = z.object({
  action: z.enum(['DAMAGE', 'HEALING', 'CONDITION_ADD', 'CONDITION_REMOVE', 'DEATH', 'STABILIZE', 'ACTION', 'SPELL', 'MOVEMENT', 'NARRATION']),
  turn: z.string().max(100),
  result: z.string().max(2000),
  details: z.record(z.string(), z.any()).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const session = await prisma.gameSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundError('Session tidak ditemukan');
    await requireCampaignMember(session.campaignId, user.id);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const round = searchParams.get('round') ? parseInt(searchParams.get('round')!) : undefined;

    const where: Record<string, unknown> = { sessionId: id };
    if (round !== undefined) where.round = round;

    const logs = await prisma.combatLogEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return apiSuccess({ logs, sessionId: id, currentRound: session.currentRound });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const session = await prisma.gameSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundError('Session tidak ditemukan');
    await requireCampaignMember(session.campaignId, user.id);

    const body = await req.json();
    const data = addCombatLogSchema.parse(body);

    const entry = await prisma.combatLogEntry.create({
      data: {
        sessionId: id,
        round: session.currentRound,
        turn: data.turn,
        action: data.action,
        result: data.details ? JSON.stringify({ text: data.result, ...data.details, userId: user.id }) : data.result,
      },
    });

    // If it's damage/healing/death, also post to chat
    if (['DAMAGE', 'HEALING', 'DEATH', 'STABILIZE'].includes(data.action)) {
      const actionEmoji: Record<string, string> = {
        DAMAGE: '⚔️', HEALING: '💚', DEATH: '💀', STABILIZE: '✨',
      };
      await prisma.chatMessage.create({
        data: {
          campaignId: session.campaignId,
          senderId: user.id,
          senderName: user.displayName || 'Unknown',
          type: 'COMBAT',
          content: `${actionEmoji[data.action] || '⚡'} ${data.result}`,
          channel: 'COMBAT',
          combatResult: {
            action: data.action,
            turn: data.turn,
            round: session.currentRound,
            ...(data.details || {}),
          },
        },
      });
    }

    return apiSuccess(entry, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
