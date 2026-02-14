// GET /api/admin/settings — List all system settings
// POST /api/admin/settings — Create or update a setting
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@/generated/prisma/client';
import { apiSuccess, handleApiError, requireAdmin, createAuditLog, validateBody } from '@/lib/api-utils';
import { adminSystemSettingSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || '';

    const where: Record<string, unknown> = {};
    if (category) where.category = category;

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Group by category
    const grouped: Record<string, typeof settings> = {};
    for (const s of settings) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    }

    return apiSuccess({ settings, grouped });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const data = await validateBody(req, adminSystemSettingSchema);

    const setting = await prisma.systemSetting.upsert({
      where: { key: data.key },
      update: {
        value: data.value as unknown as Prisma.InputJsonValue,
        label: data.label,
        category: data.category,
        type: data.type,
        updatedBy: admin.id,
      },
      create: {
        key: data.key,
        value: data.value as unknown as Prisma.InputJsonValue,
        label: data.label,
        category: data.category,
        type: data.type,
        updatedBy: admin.id,
      },
    });

    await createAuditLog(admin.id, 'settings.update', {
      targetType: 'SystemSetting',
      targetId: setting.id,
      details: { key: data.key, value: data.value },
    });

    return apiSuccess(setting);
  } catch (error) {
    return handleApiError(error);
  }
}
