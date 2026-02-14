// POST /api/tables/[id]/roll — Roll on a rollable table
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, NotFoundError, serverRollDice } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const table = await prisma.rollableTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundError('Rollable table');
    await requireCampaignMember(table.campaignId, user.id);

    const entries = table.entries as { min: number; max: number; result: string }[];
    if (!entries.length) {
      return apiSuccess({ result: 'Table is empty', roll: 0 });
    }

    // Find max range
    const maxVal = Math.max(...entries.map(e => e.max));
    const formula = `1d${maxVal}`;
    const rollResult = serverRollDice(formula);

    // Find matching entry
    const matched = entries.find(e => rollResult.total >= e.min && rollResult.total <= e.max);

    return apiSuccess({
      tableName: table.name,
      formula,
      roll: rollResult.total,
      result: matched?.result ?? 'No match found',
      entries,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
