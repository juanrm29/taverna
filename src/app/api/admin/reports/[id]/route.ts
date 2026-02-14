// PATCH /api/admin/reports/[id] — Resolve/dismiss a report
// DELETE /api/admin/reports/[id] — Delete a report
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAdmin, createAuditLog, validateBody, NotFoundError } from '@/lib/api-utils';
import { adminResolveReportSchema } from '@/lib/validations';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const data = await validateBody(req, adminResolveReportSchema);

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Report tidak ditemukan');

    const report = await prisma.report.update({
      where: { id },
      data: {
        status: data.status,
        resolution: data.resolution,
        resolvedById: admin.id,
      },
      include: {
        reporter: { select: { displayName: true } },
        resolvedBy: { select: { displayName: true } },
      },
    });

    await createAuditLog(admin.id, `report.${data.status.toLowerCase()}`, {
      targetType: 'Report',
      targetId: id,
      details: { reason: existing.reason, resolution: data.resolution },
    });

    return apiSuccess(report);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Report tidak ditemukan');

    await prisma.report.delete({ where: { id } });

    await createAuditLog(admin.id, 'report.delete', {
      targetType: 'Report',
      targetId: id,
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
