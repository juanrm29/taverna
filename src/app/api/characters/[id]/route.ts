// GET /api/characters/[id] — Get character detail
// PATCH /api/characters/[id] — Update character
// DELETE /api/characters/[id] — Delete character
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { updateCharacterSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody, NotFoundError, ForbiddenError } from '@/lib/api-utils';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

async function getCharacterWithAuth(characterId: string, userId: string) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { player: { select: { id: true, displayName: true } } },
  });

  if (!character) throw new NotFoundError('Character tidak ditemukan');

  const { isDM } = await requireCampaignMember(character.campaignId, userId);
  const isOwner = character.playerId === userId;

  if (!isOwner && !isDM) {
    throw new ForbiddenError('Anda tidak memiliki akses ke character ini');
  }

  return { character, isDM, isOwner };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { character } = await getCharacterWithAuth(id, user.id);

    return apiSuccess(character);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await getCharacterWithAuth(id, user.id);

    const data = await validateBody(req, updateCharacterSchema);

    // Cast JSON fields for Prisma compatibility
    const prismaData: Record<string, unknown> = { ...data };
    const jsonFields = ['abilityScores', 'hp', 'savingThrows', 'skills', 'spellSlots', 'inventory', 'deathSaves', 'currency', 'knownSpells', 'classLevels', 'feats'];
    for (const field of jsonFields) {
      if (prismaData[field] !== undefined) {
        prismaData[field] = prismaData[field] as unknown as Prisma.InputJsonValue;
      }
    }

    const updated = await prisma.character.update({
      where: { id },
      data: prismaData,
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
    await getCharacterWithAuth(id, user.id);

    await prisma.character.delete({ where: { id } });
    return apiSuccess({ message: 'Character berhasil dihapus' });
  } catch (error) {
    return handleApiError(error);
  }
}
