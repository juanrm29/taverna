// GET /api/health — Health check endpoint
import prisma from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-utils';

export async function GET() {
  try {
    // Test DB connection
    await prisma.$queryRaw`SELECT 1`;

    return apiSuccess({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        auth: 'ready',
      },
    });
  } catch {
    return apiError('Database connection failed', 503);
  }
}
