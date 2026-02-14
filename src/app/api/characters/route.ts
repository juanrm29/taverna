// GET /api/characters — Get all characters for the current user (across all campaigns)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth } from '@/lib/api-utils';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const characters = await prisma.character.findMany({
      where: { playerId: user.id },
      include: {
        campaign: { select: { id: true, name: true } },
        player: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(characters);
  } catch (error) {
    return handleApiError(error);
  }
}
