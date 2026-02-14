// POST /api/quests/[id]/vote — Vote on a quest
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth } from '@/lib/api-utils';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: questId } = await params;
    const body = await req.json();

    const vote = await prisma.questVote.upsert({
      where: { questId_userId: { questId, userId: user.id } },
      update: { vote: body.vote ?? 1 },
      create: { questId, userId: user.id, vote: body.vote ?? 1 },
    });

    return apiSuccess(vote);
  } catch (error) {
    return handleApiError(error);
  }
}
