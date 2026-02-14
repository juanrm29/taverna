// CRUD /api/campaigns/[id]/audio — Audio tracks
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createAudioTrackSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireDM, validateBody } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireDM(id, user.id);

    const tracks = await prisma.audioTrack.findMany({
      where: { campaignId: id },
      orderBy: { category: 'asc' },
    });

    return apiSuccess(tracks);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireDM(id, user.id);

    const data = await validateBody(req, createAudioTrackSchema);

    const track = await prisma.audioTrack.create({
      data: { ...data, campaignId: id },
    });

    return apiSuccess(track, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
