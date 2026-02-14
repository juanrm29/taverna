// CRUD /api/campaigns/[id]/notes — Session notes
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createSessionNoteSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { isDM } = await requireCampaignMember(id, user.id);

    const where: Record<string, unknown> = { campaignId: id };
    if (!isDM) where.dmPrivate = false;

    const notes = await prisma.sessionNote.findMany({
      where,
      orderBy: { sessionNumber: 'desc' },
    });

    return apiSuccess(notes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const data = await validateBody(req, createSessionNoteSchema);

    const note = await prisma.sessionNote.create({
      data: { ...data, campaignId: id },
    });

    return apiSuccess(note, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
