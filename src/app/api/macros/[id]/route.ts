// PATCH/DELETE /api/macros/[id]
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createMacroSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody, NotFoundError, ForbiddenError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const macro = await prisma.diceMacro.findUnique({ where: { id } });
    if (!macro) throw new NotFoundError('Dice macro');
    await requireCampaignMember(macro.campaignId, user.id);

    if (macro.createdBy !== user.id) throw new ForbiddenError();

    const data = await validateBody(req, createMacroSchema.partial());

    const updated = await prisma.diceMacro.update({ where: { id }, data });
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const macro = await prisma.diceMacro.findUnique({ where: { id } });
    if (!macro) throw new NotFoundError('Dice macro');

    const { isDM } = await requireCampaignMember(macro.campaignId, user.id);
    if (macro.createdBy !== user.id && !isDM) throw new ForbiddenError();

    await prisma.diceMacro.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
