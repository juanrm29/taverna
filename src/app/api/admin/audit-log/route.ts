// GET /api/admin/audit-log — List audit log entries
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAdmin } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
    const action = url.searchParams.get('action') || '';
    const userId = url.searchParams.get('userId') || '';
    const targetType = url.searchParams.get('targetType') || '';

    const where: Record<string, unknown> = {};
    if (action) where.action = { contains: action };
    if (userId) where.userId = userId;
    if (targetType) where.targetType = targetType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, displayName: true, email: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return apiSuccess({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
