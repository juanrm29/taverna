// GET /api/campaigns/[id]/rumors — List rumors
// POST /api/campaigns/[id]/rumors — Create rumor
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id: campaignId } = await params;

    const rumors = await prisma.rumor.findMany({
      where: { campaignId },
      include: {
        postedBy: { select: { id: true, displayName: true, image: true } },
        quest: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(rumors);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: campaignId } = await params;
    const body = await req.json();

    const rumor = await prisma.rumor.create({
      data: {
        campaignId,
        content: body.content,
        source: body.source || 'Unknown',
        questId: body.questId || null,
        postedById: user.id,
      },
    });

    return apiSuccess(rumor);
  } catch (error) {
    return handleApiError(error);
  }
}
