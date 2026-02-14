// PATCH/DELETE /api/notes/[id]
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { updateSessionNoteSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody, NotFoundError, ForbiddenError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const note = await prisma.sessionNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundError('Session note');

    const { isDM } = await requireCampaignMember(note.campaignId, user.id);
    if (note.dmPrivate && !isDM) throw new ForbiddenError();

    const data = await validateBody(req, updateSessionNoteSchema);

    const updated = await prisma.sessionNote.update({ where: { id }, data });
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const note = await prisma.sessionNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundError('Session note');

    const { isDM } = await requireCampaignMember(note.campaignId, user.id);
    if (!isDM) throw new ForbiddenError();

    await prisma.sessionNote.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
