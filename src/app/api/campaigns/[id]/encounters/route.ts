// CRUD /api/campaigns/[id]/encounters — Encounter templates
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createEncounterSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireDM, validateBody } from '@/lib/api-utils';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireDM(id, user.id);

    const encounters = await prisma.encounterTemplate.findMany({
      where: { campaignId: id },
      orderBy: { name: 'asc' },
    });

    return apiSuccess(encounters);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireDM(id, user.id);

    const data = await validateBody(req, createEncounterSchema);

    const encounter = await prisma.encounterTemplate.create({
      data: {
        ...data,
        campaignId: id,
        createdBy: user.id,
        monsters: data.monsters as unknown as Prisma.InputJsonValue,
      },
    });

    return apiSuccess(encounter, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
