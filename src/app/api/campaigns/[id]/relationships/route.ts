// CRUD /api/campaigns/[id]/relationships — Character relationships
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createRelationshipSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const relationships = await prisma.characterRelationship.findMany({
      where: { campaignId: id },
    });

    return apiSuccess(relationships);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const data = await validateBody(req, createRelationshipSchema);

    const relationship = await prisma.characterRelationship.create({
      data: { ...data, campaignId: id },
    });

    return apiSuccess(relationship, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
