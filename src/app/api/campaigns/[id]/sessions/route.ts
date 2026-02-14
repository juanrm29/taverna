// GET /api/campaigns/[id]/sessions — List sessions
// POST /api/campaigns/[id]/sessions — Create session (DM only)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createSessionSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, requireDM, validateBody } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const sessions = await prisma.gameSession.findMany({
      where: { campaignId: id },
      include: {
        _count: { select: { initiativeEntries: true, combatLog: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(sessions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireDM(id, user.id);

    const data = await validateBody(req, createSessionSchema);

    const session = await prisma.gameSession.create({
      data: {
        campaignId: id,
        dmId: user.id,
        sessionNumber: data.sessionNumber,
        connectedPlayers: [user.id],
      },
      include: {
        initiativeEntries: true,
        combatLog: true,
      },
    });

    // Update campaign sessionCount
    await prisma.campaign.update({
      where: { id },
      data: {
        sessionCount: data.sessionNumber,
        lastPlayedAt: new Date(),
      },
    });

    return apiSuccess(session, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
