// DELETE /api/encounters/[id] + PATCH /api/encounters/[id]
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createEncounterSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireDM, validateBody, NotFoundError } from '@/lib/api-utils';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const encounter = await prisma.encounterTemplate.findUnique({ where: { id } });
    if (!encounter) throw new NotFoundError('Encounter template');
    await requireDM(encounter.campaignId, user.id);

    return apiSuccess(encounter);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const encounter = await prisma.encounterTemplate.findUnique({ where: { id } });
    if (!encounter) throw new NotFoundError('Encounter template');
    await requireDM(encounter.campaignId, user.id);

    const data = await validateBody(req, createEncounterSchema.partial());

    const updated = await prisma.encounterTemplate.update({
      where: { id },
      data: {
        ...data,
        monsters: data.monsters !== undefined ? data.monsters as unknown as Prisma.InputJsonValue : undefined,
      },
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

    const encounter = await prisma.encounterTemplate.findUnique({ where: { id } });
    if (!encounter) throw new NotFoundError('Encounter template');
    await requireDM(encounter.campaignId, user.id);

    await prisma.encounterTemplate.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
