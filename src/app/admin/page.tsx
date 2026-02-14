'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface DashboardData {
  overview: {
    totalUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
    bannedUsers: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalCharacters: number;
    totalMessages: number;
    messagesWeek: number;
    totalSessions: number;
    liveSessions: number;
    pendingReports: number;
    totalReports: number;
  };
  registrationsByDay: Record<string, number>;
  topCampaigns: {
    id: string;
    name: string;
    status: string;
    _count: { members: number; characters: number; chatMessages: number };
  }[];
  recentAudit: {
    id: string;
    action: string;
    targetType: string | null;
    createdAt: string;
    user: { displayName: string | null; email: string };
  }[];
}

function StatCard({ label, value, sub, accent, icon }: {
  label: string; value: number | string; sub?: string; accent?: boolean; icon: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 transition-all hover:border-accent/30 ${
      accent ? 'border-accent/20 bg-accent/[0.03]' : 'border-border bg-surface-2'
    }`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-text-tertiary uppercase tracking-wider font-medium">{label}</p>
          <p className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-text-primary'}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {sub && <p className="text-xs text-text-secondary">{sub}</p>}
        </div>
        <span className="text-2xl opacity-50">{icon}</span>
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (!entries.length) return <p className="text-text-tertiary text-xs">No data</p>;
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex items-end gap-1 h-20">
      {entries.map(([day, count]) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-accent/60 rounded-t-sm min-h-[2px] transition-all hover:bg-accent"
            style={{ height: `${(count / max) * 100}%` }}
            title={`${day}: ${count}`}
          />
          <span className="text-[8px] text-text-muted">{day.slice(-2)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load');
    } catch {
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-3 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface-2 rounded-xl border border-border" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <span className="text-4xl">🔒</span>
        <p className="text-danger font-medium">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-surface-3 text-text-secondary text-sm hover:bg-surface-4 transition-colors">Retry</button>
      </div>
    );
  }

  if (!data) return null;
  const o = data.overview;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Overview keseluruhan platform Taverna</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Users" value={o.totalUsers} sub={`+${o.newUsersToday} hari ini`} accent />
        <StatCard icon="🗺️" label="Campaigns" value={o.totalCampaigns} sub={`${o.activeCampaigns} active`} />
        <StatCard icon="⚔️" label="Characters" value={o.totalCharacters} />
        <StatCard icon="💬" label="Messages" value={o.totalMessages} sub={`+${o.messagesWeek} minggu ini`} />
        <StatCard icon="🎮" label="Sessions" value={o.totalSessions} sub={`${o.liveSessions} live now`} />
        <StatCard icon="📝" label="New Users (Week)" value={o.newUsersWeek} sub={`${o.newUsersMonth} month`} />
        <StatCard icon="🚩" label="Pending Reports" value={o.pendingReports} sub={`${o.totalReports} total`} accent={o.pendingReports > 0} />
        <StatCard icon="🚫" label="Banned Users" value={o.bannedUsers} />
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Chart */}
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">User Registrations (7 days)</h3>
          <MiniBarChart data={data.registrationsByDay} />
        </div>

        {/* Top Campaigns */}
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Top Campaigns</h3>
            <Link href="/admin/campaigns" className="text-xs text-accent hover:text-accent-bright">View all →</Link>
          </div>
          <div className="space-y-2">
            {data.topCampaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-3 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm text-text-primary truncate">{c.name}</p>
                  <p className="text-xs text-text-tertiary">{c._count.members} members · {c._count.chatMessages} messages</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  c.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-surface-4 text-text-tertiary'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
            {!data.topCampaigns.length && <p className="text-xs text-text-tertiary text-center py-4">Belum ada campaign</p>}
          </div>
        </div>
      </div>

      {/* Recent Audit Log */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
          <Link href="/admin/audit-log" className="text-xs text-accent hover:text-accent-bright">View all →</Link>
        </div>
        <div className="space-y-1">
          {data.recentAudit.map(log => (
            <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-3 text-xs transition-colors">
              <span className="text-text-tertiary font-mono w-32 shrink-0">{new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span className="text-text-secondary truncate">{log.user.displayName || log.user.email}</span>
              <span className="px-2 py-0.5 rounded bg-surface-4 text-accent font-mono">{log.action}</span>
              {log.targetType && <span className="text-text-tertiary">{log.targetType}</span>}
            </div>
          ))}
          {!data.recentAudit.length && <p className="text-xs text-text-tertiary text-center py-4">Belum ada aktivitas</p>}
        </div>
      </div>
    </div>
  );
}
