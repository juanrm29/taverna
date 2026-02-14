// GET /api/campaigns/[id]/scenes — List map scenes
// POST /api/campaigns/[id]/scenes — Create scene (DM only)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createSceneSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, requireDM, validateBody } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const scenes = await prisma.mapScene.findMany({
      where: { campaignId: id },
      include: {
        _count: { select: { tokens: true, walls: true, lights: true, drawings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(scenes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireDM(id, user.id);

    const data = await validateBody(req, createSceneSchema);

    // Generate fog grid
    const fogRevealed = Array.from({ length: data.height ?? 20 }, () =>
      Array(data.width ?? 30).fill(false)
    );

    const scene = await prisma.mapScene.create({
      data: {
        ...data,
        campaignId: id,
        fogRevealed,
      },
      include: {
        tokens: true,
        walls: true,
        lights: true,
        drawings: true,
      },
    });

    return apiSuccess(scene, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
