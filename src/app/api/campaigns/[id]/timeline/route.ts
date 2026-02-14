// CRUD /api/campaigns/[id]/timeline — Timeline events
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createTimelineEventSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, requireDM, validateBody } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const events = await prisma.timelineEvent.findMany({
      where: { campaignId: id },
      orderBy: { realDate: 'asc' },
    });

    return apiSuccess(events);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireDM(id, user.id);

    const data = await validateBody(req, createTimelineEventSchema);

    const event = await prisma.timelineEvent.create({
      data: { ...data, campaignId: id },
    });

    return apiSuccess(event, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
