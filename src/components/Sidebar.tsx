'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useAppStore } from '@/lib/zustand';
import { useTranslation } from '@/lib/i18n';
import {
  Swords, Map, Users, Settings,
  PanelLeftClose, PanelLeft, Dices, LogOut, Plus, BookOpen,
  Menu, X, Grid3x3, Music, BookMarked, Target, Award, Zap,
  Sparkles, Eye, CalendarDays, GraduationCap, Bot,
  Globe, ScrollText, Sword,
} from 'lucide-react';

type NavItem = { href: string; icon: React.ComponentType<any>; labelKey: keyof ReturnType<typeof useNavLabels>; accent?: boolean; highlight?: boolean; tour?: string };

function useNavLabels() {
  const { t } = useTranslation();
  return {
    liveSession: t.nav.liveSession,
    campaigns: t.nav.campaigns,
    characters: t.nav.characters,
    compendium: t.nav.compendium,
    dice: t.nav.dice,
    tutorial: t.nav.tutorial,
    battleMap: t.nav.battleMap,
    encounters: t.nav.encounters,
    journal: t.nav.journal,
    generators: t.nav.generators,
    schedule: t.nav.schedule,
    audioSfx: t.nav.audioSfx,
    timeline: t.nav.timeline,
    recap: t.nav.recap,
    playerView: t.nav.playerView,
    aiDm: t.nav.aiDm,
    loreWiki: t.nav.loreWiki,
    questBoard: t.nav.questBoard,
    combatAutopilot: t.nav.combatAutopilot,
  };
}

const NAV_ITEMS: NavItem[] = [
  { href: '/session-live', icon: Zap, labelKey: 'liveSession', accent: true, tour: 'sessions' },
  { href: '/dashboard', icon: Map, labelKey: 'campaigns', tour: 'campaigns' },
  { href: '/characters', icon: Users, labelKey: 'characters', tour: 'characters' },
  { href: '/compendium', icon: BookOpen, labelKey: 'compendium' },
  { href: '/dice', icon: Dices, labelKey: 'dice', tour: 'dice' },
  { href: '/tutorial', icon: GraduationCap, labelKey: 'tutorial', highlight: true },
];

const TOOL_ITEMS: NavItem[] = [
  { href: '/ai-dm', icon: Bot, labelKey: 'aiDm', accent: true },
  { href: '/lore-wiki', icon: Globe, labelKey: 'loreWiki', accent: true },
  { href: '/quest-board', icon: ScrollText, labelKey: 'questBoard', accent: true },
  { href: '/combat-autopilot', icon: Sword, labelKey: 'combatAutopilot', accent: true },
  { href: '/battle-map', icon: Grid3x3, labelKey: 'battleMap' },
  { href: '/encounters', icon: Target, labelKey: 'encounters' },
  { href: '/journal', icon: BookMarked, labelKey: 'journal' },
  { href: '/generators', icon: Sparkles, labelKey: 'generators' },
  { href: '/schedule', icon: CalendarDays, labelKey: 'schedule' },
  { href: '/audio', icon: Music, labelKey: 'audioSfx' },
  { href: '/timeline', icon: Award, labelKey: 'timeline' },
  { href: '/recap', icon: BookOpen, labelKey: 'recap' },
  { href: '/player-view', icon: Eye, labelKey: 'playerView' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { t } = useTranslation();
  const navLabels = useNavLabels();
  const user = session?.user;

  const handleLogout = async () => {
    await signOut({ redirectTo: '/' });
  };

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      useAppStore.setState({ sidebarOpen: false });
    }
  }, [pathname]);

  // Close sidebar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
        useAppStore.setState({ sidebarOpen: false });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarOpen]);

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-surface-1/90 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 z-50">
        <button
          onClick={toggleSidebar}
          className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer p-1"
          aria-label={t.nav.toggleMenu}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-b from-accent/20 to-accent/5 border border-accent/15 flex items-center justify-center">
            <Swords className="w-3.5 h-3.5 text-accent" />
          </div>
          <span className="font-display text-sm font-semibold tracking-tight">Taverna</span>
        </div>
        <div className="w-6" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => useAppStore.setState({ sidebarOpen: false })}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-surface-1 border-r border-border flex flex-col z-50 transition-all duration-200
          ${sidebarOpen ? 'w-56 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-accent/20 to-accent/5 border border-accent/15 flex items-center justify-center shrink-0 shadow-[0_0_15px_var(--color-accent-glow)]">
              <Swords className="w-4 h-4 text-accent" />
            </div>
            {sidebarOpen && (
              <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
                Taverna
              </span>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => useAppStore.setState({ sidebarOpen: false })}
              className="md:hidden text-text-tertiary hover:text-text-primary cursor-pointer p-1 rounded-md hover:bg-surface-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href);
            const isAccent = item.accent;
            const isHighlight = item.highlight;
            const label = navLabels[item.labelKey];
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? label : undefined}
                aria-current={active ? 'page' : undefined}
                data-tour={item.tour}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  active
                    ? 'bg-accent/10 text-accent font-medium shadow-[inset_0_0_20px_var(--color-accent-glow)]'
                    : isAccent
                    ? 'text-accent hover:bg-accent/10 font-medium'
                    : isHighlight
                    ? 'text-[#c084fc] hover:bg-[#c084fc]/10 font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/80'
                }`}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full shadow-[0_0_8px_var(--color-accent-glow)]" />}
                <item.icon className={`w-4 h-4 shrink-0 ${isAccent && !active ? 'animate-pulse' : ''}`} />
                {sidebarOpen && <span className="truncate">{label}</span>}
                {!sidebarOpen && (
                  <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1.5 text-xs bg-surface-2 text-text-primary border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Tools section divider */}
          {sidebarOpen && (
            <div className="mt-5 mb-2 px-3 flex items-center gap-2">
              <span className="text-[10px] font-semibold text-text-muted tracking-[0.15em] uppercase">
                {t.nav.tools}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
            </div>
          )}
          {!sidebarOpen && <div className="my-2 mx-3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />}

          {TOOL_ITEMS.map(item => {
            const active = pathname.startsWith(item.href);
            const label = navLabels[item.labelKey];
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? label : undefined}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  active
                    ? 'bg-accent/10 text-accent font-medium shadow-[inset_0_0_20px_var(--color-accent-glow)]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/80'
                }`}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full shadow-[0_0_8px_var(--color-accent-glow)]" />}
                <item.icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{label}</span>}
                {!sidebarOpen && (
                  <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1.5 text-xs bg-surface-2 text-text-primary border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Quick section divider */}
          {sidebarOpen && (
            <div className="mt-5 mb-2 px-3 flex items-center gap-2">
              <span className="text-[10px] font-semibold text-text-muted tracking-[0.15em] uppercase">
                {t.nav.quick}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
            </div>
          )}

          <Link
            href="/dashboard?create=true"
            title={!sidebarOpen ? t.nav.newCampaign : undefined}
            className="group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-accent hover:bg-accent/5 transition-all duration-200"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>{t.nav.newCampaign}</span>}
            {!sidebarOpen && (
              <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1.5 text-xs bg-surface-2 text-text-primary border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                {t.nav.newCampaign}
              </span>
            )}
          </Link>

          <Link
            href="/settings"
            title={!sidebarOpen ? t.nav.settings : undefined}
            className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              pathname === '/settings'
                ? 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/80'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>{t.nav.settings}</span>}
            {!sidebarOpen && (
              <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1.5 text-xs bg-surface-2 text-text-primary border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                {t.nav.settings}
              </span>
            )}
          </Link>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2 flex flex-col gap-1">
          <button
            onClick={toggleSidebar}
            className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-tertiary hover:text-text-primary hover:bg-surface-2/80 transition-all duration-200 w-full cursor-pointer"
            title={sidebarOpen ? t.nav.collapseSidebar : t.nav.expandSidebar}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            {sidebarOpen && <span>{t.nav.collapse}</span>}
          </button>

          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-2/60 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-accent/20 to-accent/5 text-accent text-xs font-bold flex items-center justify-center shrink-0 border border-accent/15">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{user.name}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-text-tertiary hover:text-danger transition-colors cursor-pointer p-1 rounded-md hover:bg-danger/10"
                title={t.auth.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
