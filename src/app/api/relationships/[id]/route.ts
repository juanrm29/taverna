// DELETE /api/relationships/[id]
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, NotFoundError, ForbiddenError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const rel = await prisma.characterRelationship.findUnique({ where: { id } });
    if (!rel) throw new NotFoundError('Character relationship');

    const { isDM } = await requireCampaignMember(rel.campaignId, user.id);
    if (!isDM) throw new ForbiddenError();

    await prisma.characterRelationship.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
