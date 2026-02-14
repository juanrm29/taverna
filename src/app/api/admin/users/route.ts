// GET /api/admin/users — List all users with filters
// POST /api/admin/users — Bulk operations
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAdmin, createAuditLog } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const banned = url.searchParams.get('banned');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortDir = (url.searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (banned === 'true') where.isBanned = true;
    if (banned === 'false') where.isBanned = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          name: true,
          image: true,
          role: true,
          isBanned: true,
          banReason: true,
          bannedAt: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              ownedCampaigns: true,
              memberships: true,
              characters: true,
              chatMessages: true,
            },
          },
        },
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    void admin; // used for auth check

    return apiSuccess({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { action, userIds } = body as { action: string; userIds: string[] };

    if (!action || !userIds?.length) {
      return handleApiError(new Error('Action dan userIds diperlukan'));
    }

    let result;
    switch (action) {
      case 'ban':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds }, role: { not: 'ADMIN' } },
          data: { isBanned: true, bannedAt: new Date(), banReason: body.reason || 'Banned by admin' },
        });
        break;
      case 'unban':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isBanned: false, bannedAt: null, banReason: null },
        });
        break;
      default:
        return handleApiError(new Error(`Unknown action: ${action}`));
    }

    await createAuditLog(admin.id, `user.bulk.${action}`, {
      targetType: 'User',
      details: { userIds, count: result.count },
    });

    return apiSuccess({ action, affected: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
