// GET/PATCH/DELETE /api/npcs/[id] — NPC detail operations (DM only for edit/delete)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { updateNPCSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, requireDM, validateBody, NotFoundError } from '@/lib/api-utils';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

async function getNPC(id: string) {
  const npc = await prisma.nPC.findUnique({ where: { id } });
  if (!npc) throw new NotFoundError('NPC tidak ditemukan');
  return npc;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const npc = await getNPC(id);
    await requireCampaignMember(npc.campaignId, user.id);

    return apiSuccess(npc);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const npc = await getNPC(id);
    await requireDM(npc.campaignId, user.id);

    const data = await validateBody(req, updateNPCSchema);
    const updated = await prisma.nPC.update({
      where: { id },
      data: {
        ...data,
        stats: data.stats !== undefined ? data.stats as unknown as Prisma.InputJsonValue : undefined,
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
    const npc = await getNPC(id);
    await requireDM(npc.campaignId, user.id);

    await prisma.nPC.delete({ where: { id } });
    return apiSuccess({ message: 'NPC berhasil dihapus' });
  } catch (error) {
    return handleApiError(error);
  }
}
