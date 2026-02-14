// GET /api/campaigns — List user's campaigns
// POST /api/campaigns — Create new campaign
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createCampaignSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, validateBody } from '@/lib/api-utils';

export async function GET() {
  try {
    const user = await requireAuth();

    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { dmId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        dm: { select: { id: true, displayName: true, image: true } },
        _count: { select: { members: true, characters: true, gameSessions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return apiSuccess(campaigns);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await validateBody(req, createCampaignSchema);

    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        dmId: user.id,
        members: {
          create: { userId: user.id, role: 'DM' },
        },
      },
      include: {
        dm: { select: { id: true, displayName: true, image: true } },
        _count: { select: { members: true } },
      },
    });

    return apiSuccess(campaign, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
