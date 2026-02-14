// GET /api/sessions/[id]/combat-actions — Get combat actions for replay
// POST /api/sessions/[id]/combat-actions — Log a combat action
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id: sessionId } = await params;

    const actions = await prisma.combatAction.findMany({
      where: { sessionId },
      orderBy: [{ round: 'asc' }, { turnOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return apiSuccess(actions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: sessionId } = await params;
    const body = await req.json();

    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { campaign: true },
    });
    if (!session) throw new Error('Session not found');

    const action = await prisma.combatAction.create({
      data: {
        sessionId,
        round: body.round ?? session.currentRound ?? 1,
        turnOrder: body.turnOrder ?? 0,
        actorName: body.actorName,
        actorTokenId: body.actorTokenId || null,
        actionType: body.actionType || 'ATTACK',
        targetName: body.targetName || null,
        targetTokenId: body.targetTokenId || null,
        attackRoll: body.attackRoll,
        attackBonus: body.attackBonus,
        attackTotal: body.attackTotal,
        targetAC: body.targetAC,
        isHit: body.isHit,
        isCritical: body.isCritical,
        isFumble: body.isFumble,
        advantage: body.advantage || 'normal',
        damageRoll: body.damageRoll,
        damageTotal: body.damageTotal,
        damageType: body.damageType,
        hpBefore: body.hpBefore,
        hpAfter: body.hpAfter,
        saveType: body.saveType,
        saveDC: body.saveDC,
        saveRoll: body.saveRoll,
        saveResult: body.saveResult,
        concentrationCheck: body.concentrationCheck ?? false,
        concentrationLost: body.concentrationLost ?? false,
        reactionUsed: body.reactionUsed || null,
        reactionResult: body.reactionResult || null,
        description: body.description || '',
      },
    });

    return apiSuccess(action);
  } catch (error) {
    return handleApiError(error);
  }
}
