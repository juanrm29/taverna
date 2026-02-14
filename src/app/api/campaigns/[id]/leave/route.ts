// POST /api/campaigns/[id]/leave — Leave campaign
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, ForbiddenError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { isDM } = await requireCampaignMember(id, user.id);

    if (isDM) {
      throw new ForbiddenError('DM tidak bisa meninggalkan campaign. Transfer ownership atau hapus campaign.');
    }

    // Remove membership
    await prisma.campaignMember.delete({
      where: { userId_campaignId: { userId: user.id, campaignId: id } },
    });

    // Remove user's characters from this campaign
    await prisma.character.deleteMany({
      where: { campaignId: id, playerId: user.id },
    });

    return apiSuccess({ message: 'Berhasil keluar dari campaign' });
  } catch (error) {
    return handleApiError(error);
  }
}
