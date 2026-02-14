// GET /api/campaigns/[id]/quests — List quests
// POST /api/campaigns/[id]/quests — Create quest
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: campaignId } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, OR: [{ dmId: user.id }, { members: { some: { userId: user.id } } }] },
    });
    if (!campaign) throw new Error('Campaign not found');

    const isDM = campaign.dmId === user.id;

    const quests = await prisma.quest.findMany({
      where: {
        campaignId,
        ...(isDM ? {} : { status: { not: 'HIDDEN' } }),
      },
      include: {
        objectives: { orderBy: { sortOrder: 'asc' } },
        children: { select: { id: true, title: true, status: true } },
        giverNpc: { select: { id: true, name: true, imageUrl: true } },
        votes: { select: { userId: true, vote: true } },
        _count: { select: { rumors: true } },
      },
      orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }],
    });

    return apiSuccess(quests);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: campaignId } = await params;
    const body = await req.json();

    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, dmId: user.id } });
    if (!campaign) throw new Error('Only the DM can create quests');

    const quest = await prisma.quest.create({
      data: {
        campaignId,
        title: body.title,
        description: body.description || '',
        status: body.status || 'HIDDEN',
        priority: body.priority ?? 0,
        giverNpcId: body.giverNpcId || null,
        rewardXP: body.rewardXP ?? 0,
        rewardGold: body.rewardGold ?? 0,
        rewardItems: body.rewardItems || [],
        parentId: body.parentId || null,
        objectives: body.objectives?.length ? {
          create: body.objectives.map((o: any, i: number) => ({
            title: o.title,
            description: o.description || '',
            sortOrder: i,
            branchQuestId: o.branchQuestId || null,
          })),
        } : undefined,
      },
      include: { objectives: true },
    });

    return apiSuccess(quest);
  } catch (error) {
    return handleApiError(error);
  }
}
