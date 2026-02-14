// PATCH /api/quests/[id]/objectives — Update objectives (toggle complete/fail)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth } from '@/lib/api-utils';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: questId } = await params;
    const body = await req.json();

    // body = { objectiveId, isCompleted?, isFailed? }
    const quest = await prisma.quest.findUnique({ where: { id: questId }, include: { campaign: true } });
    if (!quest) throw new Error('Quest not found');
    if (quest.campaign.dmId !== user.id) throw new Error('Only the DM can update objectives');

    const objective = await prisma.questObjective.update({
      where: { id: body.objectiveId },
      data: {
        isCompleted: body.isCompleted,
        isFailed: body.isFailed,
      },
    });

    // If objective has a branch quest, reveal it
    if (body.isCompleted && objective.branchQuestId) {
      await prisma.quest.update({
        where: { id: objective.branchQuestId },
        data: { status: 'AVAILABLE' },
      });
    }

    return apiSuccess(objective);
  } catch (error) {
    return handleApiError(error);
  }
}
