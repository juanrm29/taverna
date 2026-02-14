// POST /api/messages/[id]/reactions — Toggle reaction
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { reactionSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody, NotFoundError } from '@/lib/api-utils';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

interface ChatReaction {
  emoji: string;
  userIds: string[];
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const data = await validateBody(req, reactionSchema);

    const message = await prisma.chatMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundError('Pesan tidak ditemukan');

    await requireCampaignMember(message.campaignId, user.id);

    // Toggle reaction
    const reactions = (message.reactions as ChatReaction[] | null) || [];
    const existing = reactions.find(r => r.emoji === data.emoji);

    if (existing) {
      if (existing.userIds.includes(user.id)) {
        existing.userIds = existing.userIds.filter(uid => uid !== user.id);
        if (existing.userIds.length === 0) {
          const idx = reactions.indexOf(existing);
          reactions.splice(idx, 1);
        }
      } else {
        existing.userIds.push(user.id);
      }
    } else {
      reactions.push({ emoji: data.emoji, userIds: [user.id] });
    }

    const updated = await prisma.chatMessage.update({
      where: { id },
      data: { reactions: reactions as unknown as Prisma.InputJsonValue },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
