// GET /api/admin/reports — List reports with filters
// POST /api/admin/reports — Create a new report (from users)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAdmin, requireAuth, validateBody } from '@/lib/api-utils';
import { createReportSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100);
    const status = url.searchParams.get('status') || '';
    const targetType = url.searchParams.get('targetType') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (targetType) where.targetType = targetType;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, displayName: true, email: true } },
          resolvedBy: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return apiSuccess({
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Public users can also submit reports
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await validateBody(req, createReportSchema);

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
      },
      include: {
        reporter: { select: { displayName: true } },
      },
    });

    return apiSuccess(report, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
