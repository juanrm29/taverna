// POST /api/campaigns/[id]/achievements — Grant achievement
// GET /api/campaigns/[id]/achievements — List achievements
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { grantAchievementSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, requireDM, validateBody } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const achievements = await prisma.achievement.findMany({
      where: { campaignId: id },
      include: { player: { select: { id: true, displayName: true } } },
      orderBy: { earnedAt: 'desc' },
    });

    return apiSuccess(achievements);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireDM(id, user.id);

    const data = await validateBody(req, grantAchievementSchema);

    // Upsert to prevent duplicates
    const achievement = await prisma.achievement.upsert({
      where: {
        name_playerId: { name: data.name, playerId: data.playerId },
      },
      create: {
        ...data,
        campaignId: id,
      },
      update: {},
    });

    return apiSuccess(achievement, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
