// GET /api/sessions/[id] — Get session detail
// PATCH /api/sessions/[id] — Update session status (DM only)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { updateSessionStatusSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, requireDM, validateBody, NotFoundError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const session = await prisma.gameSession.findUnique({
      where: { id },
      include: {
        initiativeEntries: { orderBy: { initiative: 'desc' } },
        combatLog: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!session) throw new NotFoundError('Session tidak ditemukan');
    await requireCampaignMember(session.campaignId, user.id);

    return apiSuccess(session);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const session = await prisma.gameSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundError('Session tidak ditemukan');

    await requireDM(session.campaignId, user.id);
    const data = await validateBody(req, updateSessionStatusSchema);

    const updates: Record<string, unknown> = { status: data.status };
    if (data.status === 'LIVE' && !session.startedAt) {
      updates.startedAt = new Date();
    }
    if (data.status === 'ENDED') {
      updates.endedAt = new Date();
    }

    const updated = await prisma.gameSession.update({
      where: { id },
      data: updates,
      include: {
        initiativeEntries: { orderBy: { initiative: 'desc' } },
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
