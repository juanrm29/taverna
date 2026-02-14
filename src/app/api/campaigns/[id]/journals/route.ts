// GET /api/campaigns/[id]/journals — List journals (filtered by visibility)
// POST /api/campaigns/[id]/journals — Create journal (DM for secret/handout)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createJournalSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { isDM } = await requireCampaignMember(id, user.id);

    const journals = await prisma.journalEntry.findMany({
      where: { campaignId: id },
      include: {
        author: { select: { id: true, displayName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Filter: DM sees all, players see only visible-to-them entries
    const filtered = isDM
      ? journals
      : journals.filter(j => {
          const visible = j.visibleTo as string[];
          return visible.includes('*') || visible.includes(user.id) || j.type === 'JOURNAL';
        });

    return apiSuccess(filtered);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await requireCampaignMember(id, user.id);

    const data = await validateBody(req, createJournalSchema);

    const journal = await prisma.journalEntry.create({
      data: {
        ...data,
        campaignId: id,
        createdBy: user.id,
      },
    });

    return apiSuccess(journal, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
