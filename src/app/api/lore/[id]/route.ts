// GET /api/lore/[id] — Get single lore entry
// PATCH /api/lore/[id] — Update lore entry
// DELETE /api/lore/[id] — Delete lore entry
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAuth } from '@/lib/api-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const entry = await prisma.loreEntry.findUnique({
      where: { id },
      include: {
        children: { select: { id: true, title: true, slug: true, category: true } },
        parent: { select: { id: true, title: true, slug: true } },
        linksFrom: { include: { to: { select: { id: true, title: true, slug: true, category: true } } } },
        linksTo: { include: { from: { select: { id: true, title: true, slug: true, category: true } } } },
        createdBy: { select: { id: true, displayName: true } },
      },
    });
    if (!entry) throw new Error('Lore entry not found');

    return apiSuccess(entry);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.loreEntry.findUnique({ where: { id }, include: { campaign: true } });
    if (!existing) throw new Error('Lore entry not found');
    if (existing.campaign.dmId !== user.id) throw new Error('Only the DM can edit lore entries');

    const updated = await prisma.loreEntry.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.title
          ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          : undefined,
        category: body.category,
        content: body.content,
        summary: body.summary,
        imageUrl: body.imageUrl,
        tags: body.tags,
        isSecret: body.isSecret,
        mapPinX: body.mapPinX,
        mapPinY: body.mapPinY,
        parentId: body.parentId,
      },
    });

    // Update links if provided
    if (body.linkedEntryIds !== undefined) {
      await prisma.loreLink.deleteMany({ where: { fromId: id } });
      if (body.linkedEntryIds.length) {
        await prisma.loreLink.createMany({
          data: body.linkedEntryIds.map((toId: string) => ({
            fromId: id,
            toId,
            label: body.linkLabel || '',
          })),
          skipDuplicates: true,
        });
      }
    }

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const entry = await prisma.loreEntry.findUnique({ where: { id }, include: { campaign: true } });
    if (!entry) throw new Error('Lore entry not found');
    if (entry.campaign.dmId !== user.id) throw new Error('Only the DM can delete lore entries');

    await prisma.loreEntry.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
