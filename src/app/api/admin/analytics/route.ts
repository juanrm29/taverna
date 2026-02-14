// GET /api/admin/analytics — Extended analytics data
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { apiSuccess, handleApiError, requireAdmin } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const days = Math.min(Number(url.searchParams.get('days') || 30), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // User growth over time
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const userGrowth: Record<string, number> = {};
    for (const u of users) {
      const d = u.createdAt.toISOString().slice(0, 10);
      userGrowth[d] = (userGrowth[d] || 0) + 1;
    }

    // Message volume over time
    const messages = await prisma.chatMessage.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: 'asc' },
    });

    const messageVolume: Record<string, number> = {};
    const messageByType: Record<string, number> = {};
    for (const m of messages) {
      const d = m.createdAt.toISOString().slice(0, 10);
      messageVolume[d] = (messageVolume[d] || 0) + 1;
      messageByType[m.type] = (messageByType[m.type] || 0) + 1;
    }

    // Campaign creation over time
    const campaigns = await prisma.campaign.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const campaignGrowth: Record<string, number> = {};
    const campaignsByStatus: Record<string, number> = {};
    for (const c of campaigns) {
      const d = c.createdAt.toISOString().slice(0, 10);
      campaignGrowth[d] = (campaignGrowth[d] || 0) + 1;
      campaignsByStatus[c.status] = (campaignsByStatus[c.status] || 0) + 1;
    }

    // Session activity
    const sessions = await prisma.gameSession.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    const sessionsByStatus: Record<string, number> = {};
    for (const s of sessions) {
      sessionsByStatus[s.status] = (sessionsByStatus[s.status] || 0) + 1;
    }

    // Top active users (by messages)
    const topUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { chatMessages: { _count: 'desc' } },
      select: {
        id: true,
        displayName: true,
        email: true,
        image: true,
        createdAt: true,
        _count: { select: { chatMessages: true, characters: true, ownedCampaigns: true } },
      },
    });

    // Role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    return apiSuccess({
      period: { days, since: since.toISOString() },
      userGrowth,
      messageVolume,
      messageByType,
      campaignGrowth,
      campaignsByStatus,
      sessionsByStatus,
      topUsers,
      roleDistribution: roleDistribution.map(r => ({ role: r.role, count: r._count })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
