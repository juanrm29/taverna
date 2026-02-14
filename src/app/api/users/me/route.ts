// GET/PATCH /api/users/me — Get or update current user profile
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, validateBody } from '@/lib/api-utils';

export async function GET() {
  try {
    const authUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        accounts: { select: { provider: true } },
        _count: {
          select: {
            ownedCampaigns: true,
            memberships: true,
            characters: true,
          },
        },
      },
    });

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await requireAuth();
    const data = await validateBody(req, updateProfileSchema);

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        ...(data.displayName && { displayName: data.displayName, name: data.displayName }),
        ...(data.image !== undefined && { image: data.image }),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        name: true,
        image: true,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
