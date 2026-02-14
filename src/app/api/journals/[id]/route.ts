// GET/PATCH/DELETE /api/journals/[id]
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { updateJournalSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, requireCampaignMember, validateBody, NotFoundError, ForbiddenError } from '@/lib/api-utils';

type Params = { params: Promise<{ id: string }> };

async function getJournalWithAuth(journalId: string, userId: string) {
  const journal = await prisma.journalEntry.findUnique({ where: { id: journalId } });
  if (!journal) throw new NotFoundError('Journal entry');
  const { isDM } = await requireCampaignMember(journal.campaignId, userId);
  return { journal, isDM };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { journal, isDM } = await getJournalWithAuth(id, user.id);

    // Check visibility for non-DM
    if (!isDM) {
      const visible = journal.visibleTo as string[];
      if (!visible.includes('*') && !visible.includes(user.id) && journal.type !== 'JOURNAL') {
        throw new ForbiddenError();
      }
    }

    return apiSuccess(journal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { journal, isDM } = await getJournalWithAuth(id, user.id);

    // Owner or DM can edit
    if (journal.createdBy !== user.id && !isDM) throw new ForbiddenError();

    const data = await validateBody(req, updateJournalSchema);

    const updated = await prisma.journalEntry.update({
      where: { id },
      data,
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
    const { journal, isDM } = await getJournalWithAuth(id, user.id);

    if (journal.createdBy !== user.id && !isDM) throw new ForbiddenError();

    await prisma.journalEntry.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
