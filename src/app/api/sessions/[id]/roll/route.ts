// POST /api/sessions/[id]/roll — Roll dice within a session (logged to combat log, visible to all)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, NotFoundError, serverRollDice } from '@/lib/api-utils';
import { z } from 'zod';

const sessionRollSchema = z.object({
  formula: z.string().min(1).max(100).regex(/^\d+d\d+/i, 'Formula dice tidak valid'),
  label: z.string().max(100).optional(),
  characterName: z.string().max(100).optional(),
  isPrivate: z.boolean().default(false), // DM secret roll
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const session = await prisma.gameSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundError('Session tidak ditemukan');

    await requireCampaignMember(session.campaignId, user.id);

    const body = await req.json();
    const data = sessionRollSchema.parse(body);
    const result = serverRollDice(data.formula);

    // Log the roll to combat log
    await prisma.combatLogEntry.create({
      data: {
        sessionId: id,
        round: session.currentRound,
        turn: data.characterName || user.displayName || 'Unknown',
        action: data.isPrivate ? 'SECRET_ROLL' : 'DICE_ROLL',
        result: JSON.stringify({
          formula: data.formula,
          label: data.label,
          rolls: result.rolls,
          total: result.total,
          modifier: result.modifier,
          isCrit: result.rolls.length > 0 && result.rolls[0] === parseInt(data.formula.split('d')[1]),
          isFumble: result.rolls.length > 0 && result.rolls[0] === 1,
          rolledBy: user.displayName,
          userId: user.id,
          characterName: data.characterName,
          isPrivate: data.isPrivate,
        }),
      },
    });

    // Also create a chat message so everyone sees it
    if (!data.isPrivate) {
      await prisma.chatMessage.create({
        data: {
          campaignId: session.campaignId,
          senderId: user.id,
          senderName: user.displayName || 'Unknown',
          type: 'DICE',
          content: `🎲 ${data.characterName || user.displayName} rolled ${data.formula}${data.label ? ` (${data.label})` : ''}: [${result.rolls.join(', ')}] = **${result.total}**`,
          characterName: data.characterName,
          channel: 'COMBAT',
          diceResult: {
            formula: data.formula,
            rolls: result.rolls,
            total: result.total,
            modifier: result.modifier,
          },
        },
      });
    }

    return apiSuccess({
      formula: data.formula,
      label: data.label,
      characterName: data.characterName,
      ...result,
      sessionId: id,
      round: session.currentRound,
      logged: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
