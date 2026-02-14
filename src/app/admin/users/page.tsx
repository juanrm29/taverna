'use client';

import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  displayName: string | null;
  name: string | null;
  image: string | null;
  role: string;
  isBanned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { ownedCampaigns: number; memberships: number; characters: number; chatMessages: number };
}

interface Pagination {
  page: number; limit: number; total: number; totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [bannedFilter, setBannedFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ role: '', isBanned: false, banReason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (bannedFilter) params.set('banned', bannedFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setPagination(json.data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, bannedFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleUpdateUser = async () => {
    if (!editUser) return;
    setActionLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (editForm.role) body.role = editForm.role;
      body.isBanned = editForm.isBanned;
      if (editForm.isBanned && editForm.banReason) body.banReason = editForm.banReason;
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setEditUser(null);
        fetchUsers(pagination.page);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (!selected.size) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userIds: Array.from(selected) }),
      });
      const json = await res.json();
      if (json.success) {
        setSelected(new Set());
        fetchUsers(pagination.page);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini? Semua data akan hilang.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchUsers(pagination.page);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map(u => u.id)));
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-danger/10 text-danger',
      MODERATOR: 'bg-warning/10 text-warning',
      USER: 'bg-surface-4 text-text-secondary',
    };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${colors[role] || colors.USER}`}>{role}</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
        <p className="text-sm text-text-secondary mt-1">{pagination.total} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search email, name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 w-64"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-secondary">
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={bannedFilter} onChange={e => setBannedFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-secondary">
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Banned</option>
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-text-tertiary">{selected.size} selected</span>
            <button onClick={() => handleBulkAction('ban')} disabled={actionLoading} className="px-3 py-1.5 rounded-lg bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20 disabled:opacity-50">Ban</button>
            <button onClick={() => handleBulkAction('unban')} disabled={actionLoading} className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 disabled:opacity-50">Unban</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-3/50">
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.size === users.length && users.length > 0} onChange={toggleAll} className="accent-accent" />
                </th>
                <th className="px-4 py-3 text-left text-xs text-text-tertiary font-medium uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs text-text-tertiary font-medium uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs text-text-tertiary font-medium uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs text-text-tertiary font-medium uppercase tracking-wider">Stats</th>
                <th className="px-4 py-3 text-left text-xs text-text-tertiary font-medium uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-right text-xs text-text-tertiary font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="w-4 h-4 bg-surface-4 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-40 bg-surface-4 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-surface-4 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-surface-4 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-surface-4 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-surface-4 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-surface-4 rounded" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">Tidak ada user ditemukan</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-surface-3/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleSelect(user.id)} className="accent-accent" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-4 flex items-center justify-center text-xs text-text-secondary shrink-0 overflow-hidden">
                          {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : (user.displayName || user.email)?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-text-primary truncate font-medium">{user.displayName || user.name || '—'}</p>
                          <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>
                    <td className="px-4 py-3">
                      {user.isBanned ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger/10 text-danger font-semibold">BANNED</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">ACTIVE</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-text-secondary space-x-2">
                        <span title="Campaigns">{user._count.ownedCampaigns}🗺️</span>
                        <span title="Characters">{user._count.characters}⚔️</span>
                        <span title="Messages">{user._count.chatMessages}💬</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-tertiary">{new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditUser(user);
                            setEditForm({ role: user.role, isBanned: user.isBanned, banReason: user.banReason || '' });
                          }}
                          className="px-2 py-1 rounded text-xs text-accent hover:bg-accent/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-text-tertiary">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 7) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => fetchUsers(p)}
                    className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                      p === pagination.page ? 'bg-accent text-surface-0' : 'text-text-secondary hover:bg-surface-3'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditUser(null)}>
          <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Edit User</h2>
              <p className="text-sm text-text-secondary">{editUser.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider">Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary"
                >
                  <option value="USER">User</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isBanned}
                    onChange={e => setEditForm(f => ({ ...f, isBanned: e.target.checked }))}
                    className="accent-danger w-4 h-4"
                  />
                  <span className="text-sm text-text-primary">Banned</span>
                </label>
              </div>

              {editForm.isBanned && (
                <div>
                  <label className="block text-xs text-text-tertiary mb-1.5 uppercase tracking-wider">Ban Reason</label>
                  <textarea
                    value={editForm.banReason}
                    onChange={e => setEditForm(f => ({ ...f, banReason: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary resize-none"
                    placeholder="Alasan ban..."
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-3 transition-colors">Cancel</button>
              <button
                onClick={handleUpdateUser}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-accent text-surface-0 text-sm font-medium hover:bg-accent-bright transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
