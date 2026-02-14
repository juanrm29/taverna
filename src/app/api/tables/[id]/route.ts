// GET/DELETE /api/tables/[id] + POST /api/tables/[id]/roll
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, NotFoundError, ForbiddenError, serverRollDice } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const table = await prisma.rollableTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundError('Rollable table');
    await requireCampaignMember(table.campaignId, user.id);

    return apiSuccess(table);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const table = await prisma.rollableTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundError('Rollable table');

    const { isDM } = await requireCampaignMember(table.campaignId, user.id);
    if (table.createdBy !== user.id && !isDM) throw new ForbiddenError();

    await prisma.rollableTable.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
