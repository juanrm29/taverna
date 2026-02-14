// GET /api/quests/[id] — Get quest detail
// PATCH /api/quests/[id] — Update quest
// DELETE /api/quests/[id] — Delete quest
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const quest = await prisma.quest.findUnique({
      where: { id },
      include: {
        objectives: { orderBy: { sortOrder: 'asc' } },
        children: { include: { objectives: true } },
        parent: { select: { id: true, title: true } },
        giverNpc: { select: { id: true, name: true, imageUrl: true } },
        votes: true,
        rumors: { include: { postedBy: { select: { id: true, displayName: true } } } },
      },
    });
    if (!quest) throw new Error('Quest not found');
    return apiSuccess(quest);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const quest = await prisma.quest.findUnique({ where: { id }, include: { campaign: true } });
    if (!quest) throw new Error('Quest not found');
    if (quest.campaign.dmId !== user.id) throw new Error('Only the DM can edit quests');

    const updated = await prisma.quest.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        giverNpcId: body.giverNpcId,
        rewardXP: body.rewardXP,
        rewardGold: body.rewardGold,
        rewardItems: body.rewardItems,
        parentId: body.parentId,
      },
      include: { objectives: true },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const quest = await prisma.quest.findUnique({ where: { id }, include: { campaign: true } });
    if (!quest) throw new Error('Quest not found');
    if (quest.campaign.dmId !== user.id) throw new Error('Only the DM can delete quests');

    await prisma.quest.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
