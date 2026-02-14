// CRUD /api/campaigns/[id]/macros — Dice macros
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createMacroSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const macros = await prisma.diceMacro.findMany({
      where: { campaignId: id },
      orderBy: { name: 'asc' },
    });

    return apiSuccess(macros);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const data = await validateBody(req, createMacroSchema);

    const macro = await prisma.diceMacro.create({
      data: { ...data, campaignId: id, createdBy: user.id },
    });

    return apiSuccess(macro, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
