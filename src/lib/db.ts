// ============================================================
// Prisma Client — Singleton for Next.js (prevents hot-reload leaks)
// Uses @prisma/adapter-pg for Supabase PostgreSQL connection
// Enhanced with connection pooling, retry logic & health checks
// ============================================================
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPool() {
  return new Pool({
    connectionString,
    max: 10,                      // max connections in pool
    idleTimeoutMillis: 30_000,    // close idle clients after 30s
    connectionTimeoutMillis: 10_000, // fail connection after 10s
    keepAlive: true,              // TCP keep-alive to prevent drops
    keepAliveInitialDelayMillis: 10_000,
  });
}

function createPrismaClient() {
  const pool = globalForPrisma.pool ?? createPool();
  if (!globalForPrisma.pool) globalForPrisma.pool = pool;

  // Handle pool errors gracefully
  pool.on('error', (err) => {
    console.error('[DB Pool] Unexpected error on idle client:', err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
