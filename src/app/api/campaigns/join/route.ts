// POST /api/campaigns/join — Join campaign by invite code
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { joinCampaignSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, validateBody, NotFoundError, ConflictError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await validateBody(req, joinCampaignSchema);

    const campaign = await prisma.campaign.findUnique({
      where: { inviteCode: data.inviteCode },
      include: { _count: { select: { members: true } } },
    });

    if (!campaign) {
      throw new NotFoundError('Kode invite tidak valid');
    }

    // Check if already a member
    const existingMember = await prisma.campaignMember.findUnique({
      where: { userId_campaignId: { userId: user.id, campaignId: campaign.id } },
    });

    if (existingMember || campaign.dmId === user.id) {
      throw new ConflictError('Anda sudah menjadi anggota campaign ini');
    }

    // Check max players
    if (campaign._count.members >= campaign.maxPlayers) {
      throw new ConflictError('Campaign sudah penuh');
    }

    await prisma.campaignMember.create({
      data: {
        userId: user.id,
        campaignId: campaign.id,
        role: 'PLAYER',
      },
    });

    return apiSuccess({ message: 'Berhasil bergabung', campaign: { id: campaign.id, name: campaign.name } });
  } catch (error) {
    return handleApiError(error);
  }
}
