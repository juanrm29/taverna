'use client';

import { useState, useEffect, useCallback } from 'react';

interface AnalyticsData {
  period: { days: number; since: string };
  userGrowth: Record<string, number>;
  messageVolume: Record<string, number>;
  messageByType: Record<string, number>;
  campaignGrowth: Record<string, number>;
  campaignsByStatus: Record<string, number>;
  sessionsByStatus: Record<string, number>;
  topUsers: {
    id: string;
    displayName: string | null;
    email: string;
    image: string | null;
    _count: { chatMessages: number; characters: number; ownedCampaigns: number };
  }[];
  roleDistribution: { role: string; count: number }[];
}

function BarChart({ data, label, color = 'accent' }: { data: Record<string, number>; label: string; color?: string }) {
  const entries = Object.entries(data);
  if (!entries.length) return <p className="text-text-tertiary text-xs py-4 text-center">No data</p>;
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-tertiary uppercase tracking-wider">{label}</span>
        <span className="text-xs text-text-secondary font-mono">{total.toLocaleString()} total</span>
      </div>
      <div className="flex items-end gap-[2px] h-28">
        {entries.map(([key, val]) => (
          <div key={key} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-6 opacity-0 group-hover:opacity-100 text-[9px] text-text-secondary bg-surface-4 px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
              {key}: {val}
            </div>
            <div
              className={`w-full rounded-t-sm min-h-[2px] transition-all group-hover:opacity-100 opacity-70 ${
                color === 'info' ? 'bg-info' : color === 'success' ? 'bg-success' : 'bg-accent'
              }`}
              style={{ height: `${(val / max) * 100}%` }}
            />
            <span className="text-[7px] text-text-muted hidden sm:block">{key.slice(-2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributionBar({ items, total }: { items: { label: string; value: number; color: string }[]; total: number }) {
  if (!total) return <p className="text-xs text-text-tertiary">No data</p>;
  return (
    <div className="space-y-2">
      <div className="flex rounded-full h-3 overflow-hidden bg-surface-4">
        {items.map(item => (
          <div
            key={item.label}
            className={`h-full transition-all ${item.color}`}
            style={{ width: `${(item.value / total) * 100}%` }}
            title={`${item.label}: ${item.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="text-text-secondary">{item.label}</span>
            <span className="text-text-tertiary font-mono">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-3 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-52 bg-surface-2 rounded-xl border border-border" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const roleColors: Record<string, string> = { ADMIN: 'bg-danger', MODERATOR: 'bg-warning', USER: 'bg-info' };
  const statusColors: Record<string, string> = { ACTIVE: 'bg-success', PAUSED: 'bg-warning', COMPLETED: 'bg-info', ARCHIVED: 'bg-surface-4', LOBBY: 'bg-surface-4', LIVE: 'bg-success', ENDED: 'bg-text-tertiary' };

  const totalRoles = data.roleDistribution.reduce((s, r) => s + r.count, 0);
  const totalStatuses = Object.values(data.campaignsByStatus).reduce((s, v) => s + v, 0);
  const totalSessions = Object.values(data.sessionsByStatus).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Platform insights & trends</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90, 365].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                days === d ? 'bg-accent text-surface-0' : 'text-text-secondary hover:bg-surface-3'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <BarChart data={data.userGrowth} label="User Registrations" color="accent" />
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <BarChart data={data.messageVolume} label="Message Volume" color="info" />
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <BarChart data={data.campaignGrowth} label="Campaign Creation" color="success" />
        </div>

        {/* Message Types */}
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <span className="text-xs text-text-tertiary uppercase tracking-wider">Message Types</span>
          <div className="mt-3 space-y-2">
            {Object.entries(data.messageByType).sort(([, a], [, b]) => b - a).map(([type, count]) => {
              const total = Object.values(data.messageByType).reduce((s, v) => s + v, 0);
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-16 shrink-0">{type}</span>
                  <div className="flex-1 h-2 bg-surface-4 rounded-full overflow-hidden">
                    <div className="h-full bg-accent/60 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-xs text-text-tertiary font-mono w-8 text-right">{count}</span>
                </div>
              );
            })}
            {!Object.keys(data.messageByType).length && <p className="text-xs text-text-tertiary text-center py-4">No messages yet</p>}
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <span className="text-xs text-text-tertiary uppercase tracking-wider block mb-3">Role Distribution</span>
          <DistributionBar
            items={data.roleDistribution.map(r => ({ label: r.role, value: r.count, color: roleColors[r.role] || 'bg-surface-4' }))}
            total={totalRoles}
          />
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <span className="text-xs text-text-tertiary uppercase tracking-wider block mb-3">Campaign Status</span>
          <DistributionBar
            items={Object.entries(data.campaignsByStatus).map(([k, v]) => ({ label: k, value: v, color: statusColors[k] || 'bg-surface-4' }))}
            total={totalStatuses}
          />
        </div>
        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <span className="text-xs text-text-tertiary uppercase tracking-wider block mb-3">Sessions</span>
          <DistributionBar
            items={Object.entries(data.sessionsByStatus).map(([k, v]) => ({ label: k, value: v, color: statusColors[k] || 'bg-surface-4' }))}
            total={totalSessions}
          />
        </div>
      </div>

      {/* Top Users */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <span className="text-xs text-text-tertiary uppercase tracking-wider block mb-4">Top Active Users</span>
        <div className="space-y-2">
          {data.topUsers.map((u, i) => (
            <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-3 transition-colors">
              <span className="w-5 text-xs text-text-muted text-center font-mono">{i + 1}</span>
              <div className="w-7 h-7 rounded-full bg-surface-4 flex items-center justify-center text-xs text-text-secondary overflow-hidden shrink-0">
                {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : (u.displayName || u.email)?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{u.displayName || u.email}</p>
              </div>
              <div className="text-xs text-text-tertiary space-x-3 shrink-0">
                <span>{u._count.chatMessages} 💬</span>
                <span>{u._count.characters} ⚔️</span>
                <span>{u._count.ownedCampaigns} 🗺️</span>
              </div>
            </div>
          ))}
          {!data.topUsers.length && <p className="text-xs text-text-tertiary text-center py-4">No users yet</p>}
        </div>
      </div>
    </div>
  );
}
