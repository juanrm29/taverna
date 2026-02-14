// GET /api/campaigns/[id]/lore — List lore entries
// POST /api/campaigns/[id]/lore — Create lore entry
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: campaignId } = await params;

    // Check membership
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, OR: [{ dmId: user.id }, { members: { some: { userId: user.id } } }] },
    });
    if (!campaign) throw new Error('Campaign not found');

    const isDM = campaign.dmId === user.id;

    const entries = await prisma.loreEntry.findMany({
      where: {
        campaignId,
        ...(isDM ? {} : { isSecret: false }),
      },
      include: {
        children: { select: { id: true, title: true, slug: true, category: true } },
        linksFrom: { include: { to: { select: { id: true, title: true, slug: true, category: true } } } },
        linksTo: { include: { from: { select: { id: true, title: true, slug: true, category: true } } } },
        createdBy: { select: { id: true, displayName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return apiSuccess(entries);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: campaignId } = await params;
    const body = await req.json();

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, dmId: user.id },
    });
    if (!campaign) throw new Error('Only the DM can create lore entries');

    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `entry-${Date.now()}`;

    const entry = await prisma.loreEntry.create({
      data: {
        campaignId,
        title: body.title,
        slug,
        category: body.category || 'MISC',
        content: body.content || '',
        summary: body.summary || '',
        imageUrl: body.imageUrl || null,
        tags: body.tags || [],
        isSecret: body.isSecret || false,
        mapPinX: body.mapPinX ?? null,
        mapPinY: body.mapPinY ?? null,
        parentId: body.parentId || null,
        createdById: user.id,
      },
    });

    // Create links if provided
    if (body.linkedEntryIds?.length) {
      await prisma.loreLink.createMany({
        data: body.linkedEntryIds.map((toId: string) => ({
          fromId: entry.id,
          toId,
          label: body.linkLabel || '',
        })),
        skipDuplicates: true,
      });
    }

    return apiSuccess(entry);
  } catch (error) {
    return handleApiError(error);
  }
}
