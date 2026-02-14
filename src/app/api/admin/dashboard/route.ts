// GET /api/admin/dashboard — Admin dashboard stats overview
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAdmin } from '@/lib/api-utils';

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      bannedUsers,
      totalCampaigns,
      activeCampaigns,
      totalCharacters,
      totalMessages,
      messagesWeek,
      totalSessions,
      liveSessions,
      pendingReports,
      totalReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.character.count(),
      prisma.chatMessage.count(),
      prisma.chatMessage.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.gameSession.count(),
      prisma.gameSession.count({ where: { status: 'LIVE' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count(),
    ]);

    // Recent registrations (last 7 days, grouped by day)
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const registrationsByDay: Record<string, number> = {};
    for (const u of recentUsers) {
      const day = u.createdAt.toISOString().slice(0, 10);
      registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
    }

    // Top campaigns by member count
    const topCampaigns = await prisma.campaign.findMany({
      take: 5,
      orderBy: { members: { _count: 'desc' } },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        _count: { select: { members: true, characters: true, chatMessages: true } },
      },
    });

    // Recent activity
    const recentAudit = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { displayName: true, email: true } } },
    });

    return apiSuccess({
      overview: {
        totalUsers,
        newUsersToday,
        newUsersWeek,
        newUsersMonth,
        bannedUsers,
        totalCampaigns,
        activeCampaigns,
        totalCharacters,
        totalMessages,
        messagesWeek,
        totalSessions,
        liveSessions,
        pendingReports,
        totalReports,
      },
      registrationsByDay,
      topCampaigns,
      recentAudit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
