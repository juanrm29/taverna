// GET /api/campaigns/[id]/messages — Get messages (paginated, filtered)
// POST /api/campaigns/[id]/messages — Send message
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { sendMessageSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody, getPaginationParams, sanitizeHtml } from '@/lib/api-utils';
import { ChatChannel } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const { cursor, limit, search } = getPaginationParams(req);
    const url = new URL(req.url);
    const channel = url.searchParams.get('channel') as ChatChannel | null;

    const where: Record<string, unknown> = { campaignId: id };

    if (channel) where.channel = channel;

    // Filter whispers: only show if sender or recipient
    if (channel === 'WHISPERS') {
      where.OR = [
        { senderId: user.id },
        { whisperTo: user.id },
      ];
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
        { characterName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    return apiSuccess({
      messages: messages.reverse(),
      nextCursor: hasMore ? messages[0]?.id : null,
      hasMore,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const data = await validateBody(req, sendMessageSchema);

    const message = await prisma.chatMessage.create({
      data: {
        campaignId: id,
        senderId: user.id,
        senderName: (user as Record<string, unknown>).displayName as string || user.name || 'Unknown',
        type: data.type,
        content: sanitizeHtml(data.content),
        channel: data.channel,
        characterName: data.characterName,
        whisperTo: data.whisperTo,
        whisperToName: data.whisperToName,
        diceResult: data.diceResult as Prisma.InputJsonValue ?? undefined,
        combatResult: data.combatResult as Prisma.InputJsonValue ?? undefined,
        replyToId: data.replyToId,
        replyToPreview: data.replyToPreview,
        replyToSender: data.replyToSender,
        mentions: data.mentions as unknown as Prisma.InputJsonValue ?? undefined,
        mentionEveryone: data.mentionEveryone,
      },
    });

    // TODO: Broadcast via WebSocket to campaign channel

    return apiSuccess(message, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
