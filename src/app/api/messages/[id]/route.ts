// PATCH /api/messages/[id] — Edit message (owner only)
// DELETE /api/messages/[id] — Delete message (owner or DM)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { editMessageSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody, NotFoundError, ForbiddenError, sanitizeHtml } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const message = await prisma.chatMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundError('Pesan tidak ditemukan');

    if (message.senderId !== user.id) {
      throw new ForbiddenError('Hanya pengirim yang bisa mengedit pesan');
    }

    const data = await validateBody(req, editMessageSchema);

    const updated = await prisma.chatMessage.update({
      where: { id },
      data: {
        content: sanitizeHtml(data.content),
        editedAt: new Date(),
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

    const message = await prisma.chatMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundError('Pesan tidak ditemukan');

    const { isDM } = await requireCampaignMember(message.campaignId, user.id);

    if (message.senderId !== user.id && !isDM) {
      throw new ForbiddenError('Hanya pengirim atau DM yang bisa menghapus pesan');
    }

    await prisma.chatMessage.delete({ where: { id } });
    return apiSuccess({ message: 'Pesan berhasil dihapus' });
  } catch (error) {
    return handleApiError(error);
  }
}
