'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Map, Users, Dices, Grid3x3, Music, BookMarked, Target,
  Shield, BookOpen, Award, Settings, Plus, Swords, Zap,
  Command, ArrowRight, Play, Heart, Eye
} from 'lucide-react';
import * as api from '@/lib/api-client';
import { useSession } from 'next-auth/react';

// ============================================================
// Command Types
// ============================================================
interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: 'navigate' | 'action' | 'roll' | 'search';
  keywords: string[];
  action: () => void;
}

// ============================================================
// Command Palette Component
// ============================================================
export default function CommandPalette() {
  const router = useRouter();
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Quick dice roll from palette
  const quickRoll = useCallback((formula: string) => {
    const result = api.rollDiceLocal(formula);
    // dispatch custom event so LiveSession or any listener can pick it up
    window.dispatchEvent(new CustomEvent('taverna:dice-roll', {
      detail: { formula, ...result, source: 'command-palette' }
    }));
    setOpen(false);
  }, []);

  // Build command list
  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Campaigns', description: 'Go to campaign dashboard', icon: <Map className="w-4 h-4" />, category: 'navigate', keywords: ['campaigns', 'dashboard', 'home'], action: () => { router.push('/dashboard'); setOpen(false); } },
    { id: 'nav-characters', label: 'Characters', description: 'Manage your characters', icon: <Users className="w-4 h-4" />, category: 'navigate', keywords: ['characters', 'player', 'pc'], action: () => { router.push('/characters'); setOpen(false); } },
    { id: 'nav-battle-map', label: 'Battle Map', description: 'Open the tactical battle map', icon: <Grid3x3 className="w-4 h-4" />, category: 'navigate', keywords: ['battle', 'map', 'grid', 'tactical', 'combat'], action: () => { router.push('/battle-map'); setOpen(false); } },
    { id: 'nav-encounters', label: 'Encounter Builder', description: 'Design balanced encounters', icon: <Target className="w-4 h-4" />, category: 'navigate', keywords: ['encounter', 'monster', 'cr', 'combat'], action: () => { router.push('/encounters'); setOpen(false); } },
    { id: 'nav-dice', label: 'Dice Roller', description: 'Roll dice with macros', icon: <Dices className="w-4 h-4" />, category: 'navigate', keywords: ['dice', 'roll', 'macro'], action: () => { router.push('/dice'); setOpen(false); } },
    { id: 'nav-journal', label: 'Journal', description: 'Session journal & handouts', icon: <BookMarked className="w-4 h-4" />, category: 'navigate', keywords: ['journal', 'notes', 'handout'], action: () => { router.push('/journal'); setOpen(false); } },
    { id: 'nav-dm-screen', label: 'DM Screen', description: 'Quick reference for DMs', icon: <Shield className="w-4 h-4" />, category: 'navigate', keywords: ['dm', 'screen', 'reference', 'rules'], action: () => { router.push('/dm-screen'); setOpen(false); } },
    { id: 'nav-audio', label: 'Audio & SFX', description: 'Background music and sounds', icon: <Music className="w-4 h-4" />, category: 'navigate', keywords: ['audio', 'music', 'sfx', 'sound', 'ambiance'], action: () => { router.push('/audio'); setOpen(false); } },
    { id: 'nav-compendium', label: 'Compendium', description: 'Rules, spells, monsters', icon: <BookOpen className="w-4 h-4" />, category: 'navigate', keywords: ['compendium', 'spells', 'monsters', 'rules', 'equipment'], action: () => { router.push('/compendium'); setOpen(false); } },
    { id: 'nav-timeline', label: 'Timeline', description: 'Campaign timeline', icon: <Award className="w-4 h-4" />, category: 'navigate', keywords: ['timeline', 'history', 'events'], action: () => { router.push('/timeline'); setOpen(false); } },
    { id: 'nav-settings', label: 'Settings', description: 'App settings', icon: <Settings className="w-4 h-4" />, category: 'navigate', keywords: ['settings', 'preferences', 'config'], action: () => { router.push('/settings'); setOpen(false); } },
    { id: 'nav-live-session', label: 'Live Session', description: 'Unified DM cockpit — all tools in one view', icon: <Zap className="w-4 h-4" />, category: 'navigate', keywords: ['live', 'session', 'play', 'cockpit', 'unified'], action: () => { router.push('/session-live'); setOpen(false); } },

    // Actions
    { id: 'act-new-campaign', label: 'New Campaign', description: 'Create a new campaign', icon: <Plus className="w-4 h-4" />, category: 'action', keywords: ['new', 'create', 'campaign'], action: () => { router.push('/dashboard?create=true'); setOpen(false); } },
    { id: 'act-new-character', label: 'New Character', description: 'Create a character for a campaign', icon: <Users className="w-4 h-4" />, category: 'action', keywords: ['new', 'create', 'character'], action: () => { router.push('/characters'); setOpen(false); } },

    // Quick rolls
    { id: 'roll-d20', label: 'Roll d20', description: 'Quick roll 1d20', icon: <Dices className="w-4 h-4" />, category: 'roll', keywords: ['roll', 'd20', 'attack', 'check'], action: () => quickRoll('1d20') },
    { id: 'roll-advantage', label: 'Roll Advantage', description: 'Roll 2d20 keep highest', icon: <Dices className="w-4 h-4" />, category: 'roll', keywords: ['advantage', 'adv', 'roll'], action: () => quickRoll('2d20kh1') },
    { id: 'roll-disadvantage', label: 'Roll Disadvantage', description: 'Roll 2d20 keep lowest', icon: <Dices className="w-4 h-4" />, category: 'roll', keywords: ['disadvantage', 'dis', 'roll'], action: () => quickRoll('2d20kl1') },
    { id: 'roll-stats', label: 'Roll Stats (4d6kh3)', description: 'Roll ability scores', icon: <Dices className="w-4 h-4" />, category: 'roll', keywords: ['stats', 'ability', 'score', '4d6'], action: () => quickRoll('4d6kh3') },
    { id: 'roll-d6', label: 'Roll d6', description: 'Quick roll 1d6', icon: <Dices className="w-4 h-4" />, category: 'roll', keywords: ['roll', 'd6'], action: () => quickRoll('1d6') },
    { id: 'roll-d8', label: 'Roll d8', description: 'Quick roll 1d8', icon: <Dices className="w-4 h-4" />, category: 'roll', keywords: ['roll', 'd8'], action: () => quickRoll('1d8') },
    { id: 'roll-d10', label: 'Roll d10', description: 'Quick roll 1d10', icon: <Dices className="w-4 h-4" />, category: 'roll', keywords: ['roll', 'd10'], action: () => quickRoll('1d10') },
    { id: 'roll-d12', label: 'Roll d12', description: 'Quick roll 1d12', icon: <Dices className="w-4 h-4" />, category: 'roll', keywords: ['roll', 'd12'], action: () => quickRoll('1d12') },
    { id: 'roll-2d6', label: 'Roll 2d6', description: 'Greatsword / misc', icon: <Dices className="w-4 h-4" />, category: 'roll', keywords: ['roll', '2d6', 'greatsword'], action: () => quickRoll('2d6') },
    { id: 'roll-d100', label: 'Roll d100', description: 'Percentile roll', icon: <Dices className="w-4 h-4" />, category: 'roll', keywords: ['roll', 'd100', 'percentile'], action: () => quickRoll('1d100') },
  ];

  // Detect custom formula typed like "2d8+4"
  const isDiceFormula = /^\d+d\d+/i.test(query.trim());

  // Filter
  const filtered = query.trim()
    ? commands.filter(c => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) ||
               c.description?.toLowerCase().includes(q) ||
               c.keywords.some(k => k.includes(q));
      })
    : commands;

  // Global keyboard listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery('');
        setSelectedIdx(0);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Focus input when open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIdx] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIdx]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = filtered.length + (isDiceFormula ? 1 : 0);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => (i + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => (i - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isDiceFormula && selectedIdx === 0) {
        quickRoll(query.trim());
      } else {
        const idx = isDiceFormula ? selectedIdx - 1 : selectedIdx;
        if (filtered[idx]) filtered[idx].action();
      }
    }
  };

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'navigate': return 'Navigate';
      case 'action': return 'Actions';
      case 'roll': return 'Quick Roll';
      case 'search': return 'Search';
      default: return cat;
    }
  };

  // Group commands
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  let flatIdx = isDiceFormula ? 1 : 0;

  if (!user) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[560px] max-w-[90vw] bg-surface-1 border border-border rounded-xl shadow-2xl z-[101] overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-text-tertiary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, navigate, roll dice..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary bg-surface-2 border border-border rounded">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
              {/* Custom dice formula */}
              {isDiceFormula && (
                <button
                  onClick={() => quickRoll(query.trim())}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selectedIdx === 0 ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-2'
                  }`}
                >
                  <Dices className="w-4 h-4 text-accent" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Roll {query.trim()}</span>
                    <span className="text-xs text-text-tertiary ml-2">Custom dice roll</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" />
                </button>
              )}

              {/* Grouped commands */}
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="px-4 py-1">
                    <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                      {categoryLabel(cat)}
                    </span>
                  </div>
                  {items.map(cmd => {
                    const thisIdx = flatIdx++;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                          selectedIdx === thisIdx ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-2'
                        }`}
                      >
                        <span className={selectedIdx === thisIdx ? 'text-accent' : 'text-text-tertiary'}>{cmd.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{cmd.label}</span>
                          {cmd.description && <span className="text-xs text-text-tertiary ml-2">{cmd.description}</span>}
                        </div>
                        <ArrowRight className="w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              ))}

              {filtered.length === 0 && !isDiceFormula && (
                <div className="px-4 py-8 text-center">
                  <Search className="w-6 h-6 text-text-tertiary/30 mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary">No results for &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-text-tertiary/60 mt-1">Try typing a dice formula like &ldquo;2d8+4&rdquo;</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-surface-2/50 text-[10px] text-text-tertiary">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 border border-border rounded font-mono">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 border border-border rounded font-mono">⏎</kbd> Select</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 border border-border rounded font-mono">esc</kbd> Close</span>
              <span className="ml-auto flex items-center gap-1">
                <Command className="w-3 h-3" /> Taverna Command Palette
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
