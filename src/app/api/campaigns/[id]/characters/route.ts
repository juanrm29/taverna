// GET /api/campaigns/[id]/characters — List characters in campaign
// POST /api/campaigns/[id]/characters — Create character
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createCharacterSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody } from '@/lib/api-utils';
import type { Prisma } from '@/generated/prisma/client';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const characters = await prisma.character.findMany({
      where: { campaignId: id },
      include: {
        player: { select: { id: true, displayName: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return apiSuccess(characters);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const data = await validateBody(req, createCharacterSchema);

    const character = await prisma.character.create({
      data: {
        ...data,
        campaignId: id,
        playerId: user.id,
        abilityScores: data.abilityScores as unknown as Prisma.InputJsonValue,
        hp: data.hp as unknown as Prisma.InputJsonValue,
        savingThrows: data.savingThrows as unknown as Prisma.InputJsonValue,
        skills: data.skills as unknown as Prisma.InputJsonValue,
        spellSlots: data.spellSlots as unknown as Prisma.InputJsonValue,
        inventory: data.inventory as unknown as Prisma.InputJsonValue,
        deathSaves: data.deathSaves as unknown as Prisma.InputJsonValue,
        currency: data.currency as unknown as Prisma.InputJsonValue ?? undefined,
        knownSpells: data.knownSpells as unknown as Prisma.InputJsonValue ?? undefined,
        classLevels: data.classLevels as unknown as Prisma.InputJsonValue ?? undefined,
        feats: data.feats as unknown as Prisma.InputJsonValue ?? undefined,
      },
      include: {
        player: { select: { id: true, displayName: true, image: true } },
      },
    });

    return apiSuccess(character, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
