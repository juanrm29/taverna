// POST /api/sessions/[id]/next-turn — Advance to next turn (DM only)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth, requireDM, NotFoundError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const session = await prisma.gameSession.findUnique({
      where: { id },
      include: { initiativeEntries: { orderBy: { initiative: 'desc' } } },
    });

    if (!session) throw new NotFoundError('Session tidak ditemukan');
    await requireDM(session.campaignId, user.id);

    const entries = session.initiativeEntries;
    if (entries.length === 0) return apiSuccess(session);

    const activeIdx = entries.findIndex(e => e.isActive);

    // Deactivate all
    await prisma.initiativeEntry.updateMany({
      where: { sessionId: id },
      data: { isActive: false },
    });

    // Activate next
    const nextIdx = (activeIdx + 1) % entries.length;
    await prisma.initiativeEntry.update({
      where: { id: entries[nextIdx].id },
      data: { isActive: true },
    });

    // If wrapped around, increment round
    if (nextIdx === 0 && activeIdx >= 0) {
      await prisma.gameSession.update({
        where: { id },
        data: { currentRound: session.currentRound + 1 },
      });
    }

    // First activation — set round to 1 if still 0
    if (activeIdx === -1 && session.currentRound === 0) {
      await prisma.gameSession.update({
        where: { id },
        data: { currentRound: 1 },
      });
    }

    // Fetch updated session
    const updated = await prisma.gameSession.findUnique({
      where: { id },
      include: { initiativeEntries: { orderBy: { initiative: 'desc' } } },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
