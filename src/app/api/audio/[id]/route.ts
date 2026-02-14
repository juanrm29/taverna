// DELETE /api/audio/[id] + PATCH
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createAudioTrackSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireDM, validateBody, NotFoundError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const track = await prisma.audioTrack.findUnique({ where: { id } });
    if (!track) throw new NotFoundError('Audio track');
    await requireDM(track.campaignId, user.id);

    const data = await validateBody(req, createAudioTrackSchema.partial());

    const updated = await prisma.audioTrack.update({ where: { id }, data });
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const track = await prisma.audioTrack.findUnique({ where: { id } });
    if (!track) throw new NotFoundError('Audio track');
    await requireDM(track.campaignId, user.id);

    await prisma.audioTrack.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
