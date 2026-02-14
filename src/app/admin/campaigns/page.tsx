'use client';

import { useState, useEffect, useCallback } from 'react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  ruleSet: string;
  maxPlayers: number;
  inviteCode: string;
  createdAt: string;
  dm: { id: string; displayName: string | null; email: string };
  _count: { members: number; characters: number; chatMessages: number; sessions: number };
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCampaigns = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/campaigns?${params}`);
      const json = await res.json();
      if (json.success) {
        setCampaigns(json.data.campaigns);
        setPagination(json.data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus campaign "${name}"? Semua data terkait akan hilang permanen.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDetail(null);
        fetchCampaigns(pagination.page);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const m: Record<string, string> = {
      ACTIVE: 'bg-success/10 text-success',
      PAUSED: 'bg-warning/10 text-warning',
      COMPLETED: 'bg-info/10 text-info',
      ARCHIVED: 'bg-surface-4 text-text-tertiary',
    };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${m[status] || m.ARCHIVED}`}>{status}</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Campaign Management</h1>
        <p className="text-sm text-text-secondary mt-1">{pagination.total} total campaigns</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search campaigns..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 w-64"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-secondary">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-3/50">
                <th className="px-4 py-3 text-left text-xs text-text-tertiary font-medium uppercase tracking-wider">Campaign</th>
                <th className="px-4 py-3 text-left text-xs text-text-tertiary font-medium uppercase tracking-wider">DM</th>
                <th className="px-4 py-3 text-left text-xs text-text-tertiary font-medium uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs text-text-tertiary font-medium uppercase tracking-wider">Stats</th>
                <th className="px-4 py-3 text-left text-xs text-text-tertiary font-medium uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs text-text-tertiary font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-24 bg-surface-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-text-tertiary">Tidak ada campaign</td></tr>
              ) : (
                campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-surface-3/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-text-primary font-medium truncate">{c.name}</p>
                        <p className="text-xs text-text-tertiary truncate">{c.ruleSet} · max {c.maxPlayers} players</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{c.dm.displayName || c.dm.email}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-text-secondary space-x-2">
                        <span>{c._count.members}👥</span>
                        <span>{c._count.characters}⚔️</span>
                        <span>{c._count.chatMessages}💬</span>
                        <span>{c._count.sessions}🎮</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-tertiary">{new Date(c.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetail(c)} className="px-2 py-1 rounded text-xs text-accent hover:bg-accent/10 transition-colors">Detail</button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={actionLoading}
                          className="px-2 py-1 rounded text-xs text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-text-tertiary">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 7) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => fetchCampaigns(p)} className={`w-8 h-8 rounded text-xs font-medium transition-colors ${p === pagination.page ? 'bg-accent text-surface-0' : 'text-text-secondary hover:bg-surface-3'}`}>{p}</button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{detail.name}</h2>
                <p className="text-xs text-text-tertiary">DM: {detail.dm.displayName || detail.dm.email}</p>
              </div>
              {statusBadge(detail.status)}
            </div>
            {detail.description && <p className="text-sm text-text-secondary">{detail.description}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-surface-3"><span className="text-text-tertiary text-xs">Members</span><p className="text-text-primary font-semibold">{detail._count.members}</p></div>
              <div className="p-3 rounded-lg bg-surface-3"><span className="text-text-tertiary text-xs">Characters</span><p className="text-text-primary font-semibold">{detail._count.characters}</p></div>
              <div className="p-3 rounded-lg bg-surface-3"><span className="text-text-tertiary text-xs">Messages</span><p className="text-text-primary font-semibold">{detail._count.chatMessages}</p></div>
              <div className="p-3 rounded-lg bg-surface-3"><span className="text-text-tertiary text-xs">Sessions</span><p className="text-text-primary font-semibold">{detail._count.sessions}</p></div>
            </div>
            <div className="flex items-center justify-between text-xs text-text-tertiary">
              <span>Invite: <code className="text-accent">{detail.inviteCode}</code></span>
              <span>Created: {new Date(detail.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDetail(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-3">Close</button>
              <button onClick={() => handleDelete(detail.id, detail.name)} disabled={actionLoading} className="px-4 py-2 rounded-lg bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 disabled:opacity-50">Delete Campaign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
