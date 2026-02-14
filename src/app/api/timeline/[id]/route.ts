// PATCH/DELETE /api/timeline/[id]
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createTimelineEventSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireDM, validateBody, NotFoundError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const event = await prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Timeline event');
    await requireDM(event.campaignId, user.id);

    const data = await validateBody(req, createTimelineEventSchema.partial());

    const updated = await prisma.timelineEvent.update({ where: { id }, data });
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const event = await prisma.timelineEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Timeline event');
    await requireDM(event.campaignId, user.id);

    await prisma.timelineEvent.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
