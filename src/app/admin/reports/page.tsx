'use client';

import { useState, useEffect, useCallback } from 'react';

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  reporter: { id: string; displayName: string | null; email: string };
  resolvedBy: { id: string; displayName: string | null } | null;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [resolveModal, setResolveModal] = useState<Report | null>(null);
  const [resolveForm, setResolveForm] = useState({ status: 'RESOLVED' as string, resolution: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('targetType', typeFilter);
      const res = await fetch(`/api/admin/reports?${params}`);
      const json = await res.json();
      if (json.success) {
        setReports(json.data.reports);
        setPagination(json.data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleResolve = async () => {
    if (!resolveModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${resolveModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolveForm),
      });
      const json = await res.json();
      if (json.success) {
        setResolveModal(null);
        fetchReports(pagination.page);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus report ini?')) return;
    const res = await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) fetchReports(pagination.page);
  };

  const statusBadge = (status: string) => {
    const m: Record<string, string> = {
      PENDING: 'bg-warning/10 text-warning',
      REVIEWING: 'bg-info/10 text-info',
      RESOLVED: 'bg-success/10 text-success',
      DISMISSED: 'bg-surface-4 text-text-tertiary',
    };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${m[status] || ''}`}>{status}</span>;
  };

  const targetIcon = (type: string) => {
    const m: Record<string, string> = { User: '👤', Campaign: '🗺️', ChatMessage: '💬' };
    return m[type] || '📄';
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reports & Moderation</h1>
        <p className="text-sm text-text-secondary mt-1">{pagination.total} total reports</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-secondary">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-secondary">
          <option value="">All Types</option>
          <option value="User">User</option>
          <option value="Campaign">Campaign</option>
          <option value="ChatMessage">Message</option>
        </select>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-2 border border-border rounded-xl animate-pulse" />
          ))
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
            <span className="text-4xl mb-3">✅</span>
            <p>Tidak ada report</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report.id} className="rounded-xl border border-border bg-surface-2 p-5 hover:border-border-accent transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(report.status)}
                    <span className="text-xs text-text-tertiary">#{report.id.slice(-6)}</span>
                    <span className="text-xs text-text-tertiary">·</span>
                    <span className="text-xs text-text-tertiary">{new Date(report.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <div>
                    <span className="text-sm text-text-primary font-medium">{report.reason}</span>
                    {report.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{report.description}</p>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-tertiary">
                    <span>By: <span className="text-text-secondary">{report.reporter.displayName || report.reporter.email}</span></span>
                    <span>{targetIcon(report.targetType)} {report.targetType}: <code className="text-accent">{report.targetId.slice(-8)}</code></span>
                    {report.resolvedBy && <span>Resolved by: <span className="text-text-secondary">{report.resolvedBy.displayName}</span></span>}
                  </div>
                  {report.resolution && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-surface-3 text-xs text-text-secondary">
                      <span className="text-text-tertiary">Resolution:</span> {report.resolution}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {report.status === 'PENDING' || report.status === 'REVIEWING' ? (
                    <>
                      <button
                        onClick={() => { setResolveModal(report); setResolveForm({ status: 'RESOLVED', resolution: '' }); }}
                        className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => { setResolveModal(report); setResolveForm({ status: 'DISMISSED', resolution: '' }); }}
                        className="px-3 py-1.5 rounded-lg bg-surface-4 text-text-secondary text-xs font-medium hover:bg-surface-3 transition-colors"
                      >
                        Dismiss
                      </button>
                    </>
                  ) : null}
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="px-3 py-1.5 rounded-lg text-xs text-danger hover:bg-danger/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: Math.min(pagination.totalPages, 7) }).map((_, i) => {
            const p = i + 1;
            return (
              <button key={p} onClick={() => fetchReports(p)} className={`w-8 h-8 rounded text-xs font-medium transition-colors ${p === pagination.page ? 'bg-accent text-surface-0' : 'text-text-secondary hover:bg-surface-3'}`}>{p}</button>
            );
          })}
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setResolveModal(null)}>
          <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{resolveForm.status === 'RESOLVED' ? 'Resolve' : 'Dismiss'} Report</h2>
              <p className="text-sm text-text-secondary mt-1">{resolveModal.reason}</p>
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider">Resolution Note</label>
              <textarea
                value={resolveForm.resolution}
                onChange={e => setResolveForm(f => ({ ...f, resolution: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary resize-none"
                placeholder="Catatan resolusi..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setResolveModal(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-3">Cancel</button>
              <button
                onClick={handleResolve}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  resolveForm.status === 'RESOLVED' ? 'bg-success text-white hover:bg-success/80' : 'bg-surface-4 text-text-secondary hover:bg-surface-3'
                }`}
              >
                {actionLoading ? 'Processing...' : resolveForm.status === 'RESOLVED' ? 'Resolve' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
