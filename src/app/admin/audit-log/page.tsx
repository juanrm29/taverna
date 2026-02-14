'use client';

import { useState, useEffect, useCallback } from 'react';

interface AuditEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; displayName: string | null; email: string; image: string | null };
}

const ACTION_COLORS: Record<string, string> = {
  'user.ban': 'text-danger',
  'user.unban': 'text-success',
  'user.bulk_ban': 'text-danger',
  'user.bulk_unban': 'text-success',
  'user.role_change': 'text-warning',
  'user.update': 'text-info',
  'user.delete': 'text-danger',
  'campaign.delete': 'text-danger',
  'report.resolve': 'text-success',
  'report.dismiss': 'text-warning',
  'report.delete': 'text-danger',
  'settings.update': 'text-info',
};

const ACTION_ICONS: Record<string, string> = {
  'user.ban': '🚫',
  'user.unban': '✅',
  'user.bulk_ban': '🚫',
  'user.bulk_unban': '✅',
  'user.role_change': '👑',
  'user.update': '✏️',
  'user.delete': '🗑️',
  'campaign.delete': '🗑️',
  'report.resolve': '✅',
  'report.dismiss': '❌',
  'report.delete': '🗑️',
  'settings.update': '⚙️',
};

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 25;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (actionFilter) params.set('action', actionFilter);
      if (targetTypeFilter) params.set('targetType', targetTypeFilter);
      const res = await fetch(`/api/admin/audit-log?${params}`);
      const json = await res.json();
      if (json.success) {
        setEntries(json.data.entries);
        setTotal(json.data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, targetTypeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
    return d.toLocaleDateString();
  };

  const allActions = [
    'user.ban', 'user.unban', 'user.bulk_ban', 'user.bulk_unban',
    'user.role_change', 'user.update', 'user.delete',
    'campaign.delete',
    'report.resolve', 'report.dismiss', 'report.delete',
    'settings.update',
  ];
  const allTargetTypes = ['User', 'Campaign', 'Report', 'SystemSetting'];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Audit Log</h1>
        <p className="text-sm text-text-secondary mt-1">Track all admin actions across the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-surface-3 text-text-secondary text-xs px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-accent"
        >
          <option value="">All Actions</option>
          {allActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={targetTypeFilter}
          onChange={e => { setTargetTypeFilter(e.target.value); setPage(1); }}
          className="bg-surface-3 text-text-secondary text-xs px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-accent"
        >
          <option value="">All Target Types</option>
          {allTargetTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-xs text-text-muted ml-auto">{total.toLocaleString()} entries</span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-[1px] bg-border hidden sm:block" />

        <div className="space-y-1">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 px-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-surface-3 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-surface-3 rounded" />
                  <div className="h-2.5 w-1/3 bg-surface-3 rounded" />
                </div>
              </div>
            ))
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-text-tertiary text-sm">
              <p className="text-3xl mb-3">📋</p>
              <p>No audit log entries found</p>
            </div>
          ) : (
            entries.map(entry => (
              <div key={entry.id}>
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="w-full flex items-start gap-3 py-3 px-4 rounded-lg hover:bg-surface-2 transition-colors text-left group"
                >
                  {/* Icon dot */}
                  <div className="relative w-10 h-10 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center text-sm shrink-0 z-10">
                    {ACTION_ICONS[entry.action] || '📝'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${ACTION_COLORS[entry.action] || 'text-text-primary'}`}>
                        {entry.action}
                      </span>
                      {entry.targetType && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-4 text-text-tertiary">
                          {entry.targetType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-surface-4 overflow-hidden shrink-0">
                          {entry.user.image ? (
                            <img src={entry.user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-text-muted">
                              {(entry.user.displayName || entry.user.email)?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-text-secondary truncate max-w-32">
                          {entry.user.displayName || entry.user.email}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted">•</span>
                      <span className="text-[10px] text-text-muted">{formatTime(entry.createdAt)}</span>
                      {entry.ipAddress && (
                        <>
                          <span className="text-[10px] text-text-muted hidden sm:inline">•</span>
                          <span className="text-[10px] text-text-muted font-mono hidden sm:inline">{entry.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <svg
                    className={`w-4 h-4 text-text-muted transition-transform shrink-0 mt-1 ${expandedId === entry.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded Details */}
                {expandedId === entry.id && (
                  <div className="ml-[52px] mr-4 mb-2 p-3 bg-surface-3 rounded-lg text-xs space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-text-muted">Entry ID</span>
                        <p className="text-text-secondary font-mono text-[10px] truncate">{entry.id}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Target ID</span>
                        <p className="text-text-secondary font-mono text-[10px] truncate">{entry.targetId || '—'}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">Timestamp</span>
                        <p className="text-text-secondary">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-text-muted">IP Address</span>
                        <p className="text-text-secondary font-mono">{entry.ipAddress || '—'}</p>
                      </div>
                    </div>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <div>
                        <span className="text-text-muted block mb-1">Details</span>
                        <pre className="text-[10px] text-text-secondary font-mono bg-surface-2 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-surface-3 text-text-secondary hover:bg-surface-4 disabled:opacity-30 transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                    p === page ? 'bg-accent text-surface-0' : 'bg-surface-3 text-text-secondary hover:bg-surface-4'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs rounded-lg bg-surface-3 text-text-secondary hover:bg-surface-4 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
