// GET /api/scenes/[id] — Get full scene with tokens, walls, lights, drawings
// PATCH /api/scenes/[id] — Update scene (DM only)
// DELETE /api/scenes/[id] — Delete scene (DM only)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { updateSceneSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, requireDM, validateBody, NotFoundError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

async function getSceneOrThrow(id: string) {
  const scene = await prisma.mapScene.findUnique({
    where: { id },
    include: { tokens: true, walls: true, lights: true, drawings: true },
  });
  if (!scene) throw new NotFoundError('Scene tidak ditemukan');
  return scene;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const scene = await getSceneOrThrow(id);

    const { isDM } = await requireCampaignMember(scene.campaignId, user.id);

    // Player view filtering: hide hidden tokens & DM-only drawings
    if (!isDM) {
      scene.tokens = scene.tokens.filter(t => !t.hidden);
      scene.drawings = scene.drawings.filter(d => d.visible);
    }

    return apiSuccess(scene);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const scene = await getSceneOrThrow(id);
    await requireDM(scene.campaignId, user.id);

    const data = await validateBody(req, updateSceneSchema);

    const updated = await prisma.mapScene.update({
      where: { id },
      data,
      include: { tokens: true, walls: true, lights: true, drawings: true },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const scene = await getSceneOrThrow(id);
    await requireDM(scene.campaignId, user.id);

    await prisma.mapScene.delete({ where: { id } });
    return apiSuccess({ message: 'Scene berhasil dihapus' });
  } catch (error) {
    return handleApiError(error);
  }
}
