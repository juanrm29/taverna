// POST /api/messages/[id]/pin — Toggle pin (DM only)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth, requireDM, NotFoundError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const message = await prisma.chatMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundError('Pesan tidak ditemukan');

    await requireDM(message.campaignId, user.id);

    const updated = await prisma.chatMessage.update({
      where: { id },
      data: { pinned: !message.pinned },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
