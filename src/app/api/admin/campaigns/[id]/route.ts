// GET /api/admin/campaigns/[id] — Campaign detail for admin
// DELETE /api/admin/campaigns/[id] — Delete campaign
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAdmin, createAuditLog, NotFoundError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        dm: { select: { id: true, displayName: true, email: true } },
        members: { include: { user: { select: { id: true, displayName: true, email: true } } } },
        _count: {
          select: {
            characters: true,
            chatMessages: true,
            gameSessions: true,
            npcs: true,
            mapScenes: true,
            journalEntries: true,
          },
        },
      },
    });

    if (!campaign) throw new NotFoundError('Campaign tidak ditemukan');
    return apiSuccess(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { name: true, dmId: true },
    });
    if (!campaign) throw new NotFoundError('Campaign tidak ditemukan');

    await prisma.campaign.delete({ where: { id } });

    await createAuditLog(admin.id, 'campaign.delete', {
      targetType: 'Campaign',
      targetId: id,
      details: { name: campaign.name, dmId: campaign.dmId },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
