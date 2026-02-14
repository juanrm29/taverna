// ============================================================
// API Utilities — Response helpers, error handling, auth guard
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ZodError, ZodSchema } from 'zod';
import prisma from '@/lib/db';

// ---- Standardized API Response ----
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, errors?: Record<string, string[]>) {
  return NextResponse.json({ success: false, error: message, errors }, { status });
}

// ---- Get authenticated user or return error ----
export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) {
    throw new AuthError('Unauthorized — silakan login terlebih dahulu');
  }
  return user;
}

// ---- Require ADMIN or MODERATOR role ----
export async function requireAdmin() {
  const user = await requireAuth();
  const role = (user as unknown as Record<string, unknown>).role as string | undefined;
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    throw new ForbiddenError('Akses ditolak — hanya admin yang bisa mengakses');
  }
  return { ...user, role: role as 'ADMIN' | 'MODERATOR' };
}

// ---- Create audit log entry ----
export async function createAuditLog(
  userId: string,
  action: string,
  opts?: { targetType?: string; targetId?: string; details?: Record<string, unknown>; ipAddress?: string }
) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      targetType: opts?.targetType,
      targetId: opts?.targetId,
      details: opts?.details ? (opts.details as unknown as import('@/generated/prisma/client').Prisma.InputJsonValue) : undefined,
      ipAddress: opts?.ipAddress,
    },
  });
}

// ---- Campaign membership check ----
export async function requireCampaignMember(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { members: { select: { userId: true, role: true } } },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign tidak ditemukan');
  }

  const isDM = campaign.dmId === userId;
  const membership = campaign.members.find(m => m.userId === userId);

  if (!isDM && !membership) {
    throw new ForbiddenError('Anda bukan anggota campaign ini');
  }

  return { campaign, isDM, role: isDM ? 'DM' as const : membership!.role };
}

export async function requireDM(campaignId: string, userId: string) {
  const { campaign, isDM } = await requireCampaignMember(campaignId, userId);
  if (!isDM) {
    throw new ForbiddenError('Hanya DM yang bisa melakukan aksi ini');
  }
  return campaign;
}

// ---- Validate request body with Zod ----
export async function validateBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      }
      throw new ValidationError('Data tidak valid', errors);
    }
    throw new ValidationError('Request body tidak valid');
  }
}

// ---- Custom Error Classes ----
export class AuthError extends Error {
  status = 401;
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  status = 404;
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  status = 422;
  errors?: Record<string, string[]>;
  constructor(message = 'Validation Error', errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class ConflictError extends Error {
  status = 409;
  constructor(message = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

// ---- Global error handler for API routes ----
export function handleApiError(error: unknown) {
  console.error('[API Error]', error);

  if (error instanceof AuthError) {
    return apiError(error.message, error.status);
  }
  if (error instanceof ForbiddenError) {
    return apiError(error.message, error.status);
  }
  if (error instanceof NotFoundError) {
    return apiError(error.message, error.status);
  }
  if (error instanceof ValidationError) {
    return apiError(error.message, error.status, error.errors);
  }
  if (error instanceof ConflictError) {
    return apiError(error.message, error.status);
  }

  // Unknown error
  const message = error instanceof Error ? error.message : 'Internal Server Error';
  return apiError(message, 500);
}

// ---- Pagination helpers ----
export function getPaginationParams(req: NextRequest) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);
  const search = url.searchParams.get('search') || undefined;
  return { cursor, limit, search };
}

// ---- Server-side dice roller (cryptographically secure) ----
export function serverRollDice(formula: string): {
  rolls: number[];
  modifier: number;
  total: number;
  kept?: number[];
  dropped?: number[];
  isCritical: boolean;
  isFumble: boolean;
} {
  const match = formula.match(/^(\d+)d(\d+)(?:k([hl])(\d+))?([+-]\d+)?$/i);
  if (!match) return { rolls: [0], modifier: 0, total: 0, isCritical: false, isFumble: false };

  const count = Number.parseInt(match[1]);
  const sides = Number.parseInt(match[2]);
  const keepDir = match[3]?.toLowerCase() || null;
  const keepCount = match[4] ? Number.parseInt(match[4]) : null;
  const modifier = match[5] ? Number.parseInt(match[5]) : 0;

  // Use crypto for secure randomness
  const rolls: number[] = [];
  const randomBytes = new Uint32Array(count);
  crypto.getRandomValues(randomBytes);

  for (let i = 0; i < count; i++) {
    rolls.push((randomBytes[i] % sides) + 1);
  }

  let kept = rolls;
  let dropped: number[] = [];

  if (keepDir && keepCount !== null && keepCount < count) {
    const sorted = [...rolls].sort((a, b) => b - a);
    if (keepDir === 'h') {
      kept = sorted.slice(0, keepCount);
      dropped = sorted.slice(keepCount);
    } else {
      kept = sorted.slice(count - keepCount);
      dropped = sorted.slice(0, count - keepCount);
    }
  }

  const sum = kept.reduce((a, b) => a + b, 0);
  const total = sum + modifier;

  // Check for critical/fumble on d20 rolls
  const isCritical = sides === 20 && count === 1 && rolls[0] === 20;
  const isFumble = sides === 20 && count === 1 && rolls[0] === 1;

  return { rolls, modifier, total, kept: keepDir ? kept : undefined, dropped: dropped.length > 0 ? dropped : undefined, isCritical, isFumble };
}

// ---- Sanitize HTML (prevent XSS) ----
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
