// POST /api/users/me/password — Change password
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { changePasswordSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, validateBody, AuthError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth();
    const data = await validateBody(req, changePasswordSchema);

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new AuthError('Akun OAuth tidak bisa ganti password. Gunakan provider sosmed Anda.');
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AuthError('Password saat ini tidak benar');
    }

    const newHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: authUser.id },
      data: { passwordHash: newHash },
    });

    return apiSuccess({ message: 'Password berhasil diubah' });
  } catch (error) {
    return handleApiError(error);
  }
}
