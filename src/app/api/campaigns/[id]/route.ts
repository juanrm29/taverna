// GET /api/campaigns/[id] — Get campaign detail
// PATCH /api/campaigns/[id] — Update campaign (DM only)
// DELETE /api/campaigns/[id] — Delete campaign (DM only)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { updateCampaignSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, requireDM, validateBody } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await requireCampaignMember(id, user.id);

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        dm: { select: { id: true, displayName: true, image: true, email: true } },
        members: {
          include: { user: { select: { id: true, displayName: true, image: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: {
            characters: true,
            npcs: true,
            gameSessions: true,
            mapScenes: true,
            journalEntries: true,
          },
        },
      },
    });

    return apiSuccess(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireDM(id, user.id);

    const data = await validateBody(req, updateCampaignSchema);

    const updated = await prisma.campaign.update({
      where: { id },
      data,
      include: {
        dm: { select: { id: true, displayName: true, image: true } },
        _count: { select: { members: true } },
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
    await requireDM(id, user.id);

    await prisma.campaign.delete({ where: { id } });

    return apiSuccess({ message: 'Campaign berhasil dihapus' });
  } catch (error) {
    return handleApiError(error);
  }
}
