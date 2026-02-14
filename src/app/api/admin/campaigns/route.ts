// GET /api/admin/campaigns — List all campaigns
// DELETE handled per campaign via /api/admin/campaigns/[id]
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAdmin } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortDir = (url.searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          ruleSet: true,
          maxPlayers: true,
          inviteCode: true,
          createdAt: true,
          updatedAt: true,
          dm: { select: { id: true, displayName: true, email: true } },
          _count: {
            select: { members: true, characters: true, chatMessages: true, gameSessions: true },
          },
        },
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return apiSuccess({
      campaigns,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
