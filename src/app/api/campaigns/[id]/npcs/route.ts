// GET /api/campaigns/[id]/npcs — List NPCs
// POST /api/campaigns/[id]/npcs — Create NPC (DM only)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createNPCSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, requireDM, validateBody } from '@/lib/api-utils';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const npcs = await prisma.nPC.findMany({
      where: { campaignId: id },
      orderBy: { name: 'asc' },
    });

    return apiSuccess(npcs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireDM(id, user.id);

    const data = await validateBody(req, createNPCSchema);

    const npc = await prisma.nPC.create({
      data: {
        ...data,
        campaignId: id,
        stats: data.stats as unknown as Prisma.InputJsonValue ?? undefined,
      },
    });

    return apiSuccess(npc, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
