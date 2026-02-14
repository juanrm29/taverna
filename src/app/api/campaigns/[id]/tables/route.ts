// CRUD /api/campaigns/[id]/tables — Rollable tables
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createRollableTableSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody } from '@/lib/api-utils';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const tables = await prisma.rollableTable.findMany({
      where: { campaignId: id },
      orderBy: { name: 'asc' },
    });

    return apiSuccess(tables);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const data = await validateBody(req, createRollableTableSchema);

    const table = await prisma.rollableTable.create({
      data: {
        ...data,
        campaignId: id,
        createdBy: user.id,
        entries: data.entries as unknown as Prisma.InputJsonValue,
      },
    });

    return apiSuccess(table, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
