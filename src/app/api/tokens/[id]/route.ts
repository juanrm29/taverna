// PATCH /api/tokens/[id] — Update token (move, HP, conditions)
// DELETE /api/tokens/[id] — Remove token
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { updateTokenSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireDM, validateBody, NotFoundError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const token = await prisma.mapToken.findUnique({
      where: { id },
      include: { scene: true },
    });
    if (!token) throw new NotFoundError('Token tidak ditemukan');

    await requireDM(token.scene.campaignId, user.id);
    const data = await validateBody(req, updateTokenSchema);

    const updated = await prisma.mapToken.update({
      where: { id },
      data,
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

    const token = await prisma.mapToken.findUnique({
      where: { id },
      include: { scene: true },
    });
    if (!token) throw new NotFoundError('Token tidak ditemukan');

    await requireDM(token.scene.campaignId, user.id);

    await prisma.mapToken.delete({ where: { id } });
    return apiSuccess({ message: 'Token berhasil dihapus' });
  } catch (error) {
    return handleApiError(error);
  }
}
