// POST /api/auth/register — Create new user with email + password
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { apiSuccess, apiError, handleApiError, ValidationError, ConflictError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('Email sudah terdaftar. Silakan login atau gunakan email lain.');
    }

    // Hash password with bcrypt (cost factor 12)
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        displayName: data.displayName,
        name: data.displayName,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });

    return apiSuccess(user, 201);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return handleApiError(new ValidationError('Data tidak valid'));
    }
    return handleApiError(error);
  }
}
