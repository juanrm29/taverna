'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/campaigns', label: 'Campaigns', icon: '🗺️' },
  { href: '/admin/reports', label: 'Reports', icon: '🚩' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/audit-log', label: 'Audit Log', icon: '📋' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-0 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col border-r border-border bg-surface-1 transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center text-surface-0 font-bold text-sm">
            T
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-text-primary truncate">Taverna Admin</span>
              <span className="text-[10px] text-accent">Control Panel</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto hidden lg:flex w-6 h-6 items-center justify-center rounded hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary border border-transparent'
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
                {isActive && item.href === '/admin/reports' && !collapsed && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-danger animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-border shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-3 transition-colors"
          >
            <span>←</span>
            {!collapsed && <span>Back to App</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center gap-4 px-6 border-b border-border bg-surface-1/80 backdrop-blur-xl">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-3 text-text-secondary"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary font-mono uppercase tracking-widest">Admin Panel</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
