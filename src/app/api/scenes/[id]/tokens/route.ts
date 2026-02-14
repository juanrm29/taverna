// POST /api/scenes/[id]/tokens — Add token to scene
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { addTokenSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireDM, validateBody, NotFoundError } from '@/lib/api-utils';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const scene = await prisma.mapScene.findUnique({ where: { id } });
    if (!scene) throw new NotFoundError('Scene tidak ditemukan');

    await requireDM(scene.campaignId, user.id);
    const data = await validateBody(req, addTokenSchema);

    const token = await prisma.mapToken.create({
      data: {
        ...data,
        sceneId: id,
        conditions: (data.conditions ?? []) as unknown as Prisma.InputJsonValue,
        hp: data.hp as unknown as Prisma.InputJsonValue ?? undefined,
      },
    });

    return apiSuccess(token, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
