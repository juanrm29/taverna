// POST /api/scenes/[id]/fog — Reveal/reset fog of war (DM only)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { revealFogSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireDM, validateBody, NotFoundError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const scene = await prisma.mapScene.findUnique({ where: { id } });
    if (!scene) throw new NotFoundError('Scene tidak ditemukan');

    await requireDM(scene.campaignId, user.id);
    const data = await validateBody(req, revealFogSchema);

    const fog = scene.fogRevealed as boolean[][];

    for (const { row, col } of data.cells) {
      if (fog[row] && col < fog[row].length) {
        fog[row][col] = true;
      }
    }

    const updated = await prisma.mapScene.update({
      where: { id },
      data: { fogRevealed: fog },
    });

    return apiSuccess({ fogRevealed: updated.fogRevealed });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE — Reset fog
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const scene = await prisma.mapScene.findUnique({ where: { id } });
    if (!scene) throw new NotFoundError('Scene tidak ditemukan');

    await requireDM(scene.campaignId, user.id);

    const freshFog = Array.from({ length: scene.height }, () =>
      Array(scene.width).fill(false)
    );

    await prisma.mapScene.update({
      where: { id },
      data: { fogRevealed: freshFog },
    });

    return apiSuccess({ message: 'Fog of war direset' });
  } catch (error) {
    return handleApiError(error);
  }
}
