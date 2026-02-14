// GET /api/sessions/[id]/initiative — List initiative entries
// POST /api/sessions/[id]/initiative — Add initiative entry (DM only)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { addInitiativeSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireDM, requireCampaignMember, validateBody, NotFoundError } from '@/lib/api-utils';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify the user is a member of the campaign this session belongs to
    const session = await prisma.gameSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundError('Session tidak ditemukan');
    await requireCampaignMember(session.campaignId, user.id);

    const entries = await prisma.initiativeEntry.findMany({
      where: { sessionId: id },
      orderBy: { initiative: 'desc' },
    });

    return apiSuccess(entries);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const session = await prisma.gameSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundError('Session tidak ditemukan');

    await requireDM(session.campaignId, user.id);
    const data = await validateBody(req, addInitiativeSchema);

    const entry = await prisma.initiativeEntry.create({
      data: {
        sessionId: id,
        ...data,
        conditions: [] as unknown as Prisma.InputJsonValue,
      },
    });

    return apiSuccess(entry, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
