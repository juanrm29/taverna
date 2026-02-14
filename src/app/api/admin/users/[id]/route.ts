// GET /api/admin/users/[id] — Get user details
// PATCH /api/admin/users/[id] — Update user (role, ban, etc.)
// DELETE /api/admin/users/[id] — Delete user (hard delete)
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAdmin, createAuditLog, validateBody, NotFoundError, ForbiddenError } from '@/lib/api-utils';
import { adminUpdateUserSchema } from '@/lib/validations';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        updatedAt: true,
        lastLoginAt: true,
        accounts: { select: { provider: true, type: true } },
        _count: {
          select: {
            ownedCampaigns: true,
            memberships: true,
            characters: true,
            chatMessages: true,
            diceMacros: true,
            auditLogs: true,
            reportsSubmitted: true,
          },
        },
        ownedCampaigns: {
          take: 10,
          select: { id: true, name: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        characters: {
          take: 10,
          select: { id: true, name: true, class: true, level: true },
        },
      },
    });

    if (!user) throw new NotFoundError('User tidak ditemukan');
    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const data = await validateBody(req, adminUpdateUserSchema);

    // Prevent editing yourself to non-admin or self-ban
    if (id === admin.id) {
      if (data.role && data.role !== 'ADMIN') {
        throw new ForbiddenError('Tidak bisa mengubah role sendiri');
      }
      if (data.isBanned) {
        throw new ForbiddenError('Tidak bisa ban diri sendiri');
      }
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) throw new NotFoundError('User tidak ditemukan');

    // Only ADMIN can change roles or manage other admins
    if (target.role === 'ADMIN' && admin.role !== 'ADMIN') {
      throw new ForbiddenError('Moderator tidak bisa mengedit admin');
    }
    if (data.role && admin.role !== 'ADMIN') {
      throw new ForbiddenError('Hanya admin yang bisa mengubah role');
    }

    const updateData: Record<string, unknown> = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isBanned !== undefined) {
      updateData.isBanned = data.isBanned;
      updateData.bannedAt = data.isBanned ? new Date() : null;
      updateData.banReason = data.isBanned ? (data.banReason || 'Banned by admin') : null;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, displayName: true, role: true, isBanned: true, banReason: true },
    });

    await createAuditLog(admin.id, 'user.update', {
      targetType: 'User',
      targetId: id,
      details: updateData as Record<string, unknown>,
    });

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    if (admin.role !== 'ADMIN') {
      throw new ForbiddenError('Hanya admin yang bisa menghapus user');
    }
    if (id === admin.id) {
      throw new ForbiddenError('Tidak bisa menghapus akun sendiri');
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
    if (!target) throw new NotFoundError('User tidak ditemukan');
    if (target.role === 'ADMIN') throw new ForbiddenError('Tidak bisa menghapus admin lain');

    await prisma.user.delete({ where: { id } });

    await createAuditLog(admin.id, 'user.delete', {
      targetType: 'User',
      targetId: id,
      details: { email: target.email },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
