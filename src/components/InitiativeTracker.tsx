'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Plus, Trash2, Heart, Shield,
  SkipForward, X, Skull, Zap, Minus, Eye,
  Target, ShieldAlert, Sparkles, ChevronDown,
  Timer, Pause, Play, Settings, Users,
  Crown, UserPlus, Dices, ChevronUp,
  Flame, Snowflake, Wind, Droplets,
} from 'lucide-react';
import { useChatStore } from '@/lib/chatStore';
import { InitiativeEntry, ALL_CONDITIONS, CONDITION_EFFECTS, Character, getAbilityModifier } from '@/lib/types';
import * as api from '@/lib/api-client';
import { triggerCinematic } from '@/components/CinematicCombat';

// ============================================================
// Class color mapping for avatars
// ============================================================
const CLASS_COLORS: Record<string, string> = {
  Barbarian: '#e74c3c',
  Bard: '#9b59b6',
  Cleric: '#f1c40f',
  Druid: '#27ae60',
  Fighter: '#e67e22',
  Monk: '#3498db',
  Paladin: '#f39c12',
  Ranger: '#2ecc71',
  Rogue: '#34495e',
  Sorcerer: '#e91e63',
  Warlock: '#8e44ad',
  Wizard: '#2980b9',
  Artificer: '#95a5a6',
};

const CLASS_ICONS: Record<string, string> = {
  Barbarian: '\u2694\uFE0F', Bard: '\uD83C\uDFB5', Cleric: '\u271D\uFE0F', Druid: '\uD83C\uDF3F',
  Fighter: '\uD83D\uDDE1\uFE0F', Monk: '\uD83D\uDC4A', Paladin: '\uD83D\uDEE1\uFE0F', Ranger: '\uD83C\uDFF9',
  Rogue: '\uD83D\uDDDD\uFE0F', Sorcerer: '\uD83D\uDD2E', Warlock: '\uD83D\uDC41\uFE0F', Wizard: '\uD83D\uDCD6',
  Artificer: '\u2699\uFE0F',
};

// ============================================================
// QuickHPChanger
// ============================================================
function QuickHPChanger({ onApply, onClose }: { onApply: (delta: number) => void; onClose: () => void }) {
  const [val, setVal] = useState(1);
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="flex items-center gap-1.5 bg-surface-3/80 backdrop-blur-md border border-border rounded-xl px-2.5 py-1.5 shadow-lg"
    >
      <button onClick={() => setVal(v => Math.max(1, v - 1))}
        className="w-6 h-6 rounded-lg bg-surface-2 text-text-tertiary hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors">
        <Minus className="w-3 h-3" />
      </button>
      <input type="number" value={val} onChange={e => setVal(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-12 text-center text-xs font-mono bg-transparent border-b border-accent/40 text-text-primary focus:border-accent outline-none" />
      <button onClick={() => setVal(v => v + 1)}
        className="w-6 h-6 rounded-lg bg-surface-2 text-text-tertiary hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors">
        <Plus className="w-3 h-3" />
      </button>
      <div className="w-px h-5 bg-border mx-0.5" />
      <button onClick={() => { onApply(-val); onClose(); }}
        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-danger/15 text-danger hover:bg-danger/25 cursor-pointer transition-colors">
        DMG
      </button>
      <button onClick={() => { onApply(val); onClose(); }}
        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-success/15 text-success hover:bg-success/25 cursor-pointer transition-colors">
        HEAL
      </button>
      <button onClick={onClose} className="p-0.5 text-text-tertiary hover:text-text-secondary cursor-pointer">
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// ============================================================
// Condition Picker
// ============================================================
function ConditionPicker({ current, onToggle, onClose }: {
  current: string[];
  onToggle: (c: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden mt-2"
    >
      <div className="bg-surface-3/60 backdrop-blur-sm border border-border/50 rounded-xl p-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Conditions</span>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {ALL_CONDITIONS.map(c => (
            <button
              key={c}
              onClick={() => onToggle(c)}
              title={CONDITION_EFFECTS[c] || c}
              className={`text-[9px] px-2 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                current.includes(c)
                  ? 'bg-warning/20 text-warning border border-warning/30 shadow-sm shadow-warning/10'
                  : 'bg-surface-2/60 text-text-tertiary border border-transparent hover:bg-surface-2 hover:text-text-secondary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Initiative Card
// ============================================================
function InitiativeCard({ entry, isDM, rank, onRemove, onUpdateHP, onAddCondition, onRemoveCondition, onSetConcentration }: {
  entry: InitiativeEntry;
  isDM: boolean;
  rank: number;
  onRemove?: () => void;
  onUpdateHP?: (hp: { current: number; max: number }) => void;
  onAddCondition?: (c: string) => void;
  onRemoveCondition?: (c: string) => void;
  onSetConcentration?: (spell: string | null) => void;
}) {
  const isDown = entry.hp && entry.hp.current <= 0;
  const [editingHP, setEditingHP] = useState(false);
  const [hpVal, setHpVal] = useState(entry.hp?.current || 0);
  const [showQuickHP, setShowQuickHP] = useState(false);
  const [showConditions, setShowConditions] = useState(false);

  useEffect(() => { setHpVal(entry.hp?.current || 0); }, [entry.hp?.current]);

  const applyHPDelta = (delta: number) => {
    if (!entry.hp || !onUpdateHP) return;
    const newHP = Math.max(0, Math.min(entry.hp.max, entry.hp.current + delta));
    onUpdateHP({ current: newHP, max: entry.hp.max });
  };

  const toggleCondition = (c: string) => {
    if (!onAddCondition || !onRemoveCondition) return;
    if ((entry.conditions || []).includes(c)) onRemoveCondition(c);
    else onAddCondition(c);
  };

  const hpPct = entry.hp ? (entry.hp.current / entry.hp.max) * 100 : 100;
  const hpColor = hpPct > 60 ? 'bg-success' : hpPct > 30 ? 'bg-warning' : 'bg-danger';
  const hpGlow = hpPct > 60 ? 'shadow-success/20' : hpPct > 30 ? 'shadow-warning/20' : 'shadow-danger/20';
  const avatarColor = entry.isNPC ? '#6b7280' : '#c9a96e';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`relative group ${isDown ? 'opacity-50' : ''}`}
    >
      {entry.isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-accent/8 border border-accent/25 -z-10"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          layoutId="active-glow"
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      )}

      <div className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
        entry.isActive
          ? 'bg-gradient-to-r from-accent/10 via-surface-2/80 to-surface-2/60 border border-accent/30 shadow-lg shadow-accent/10'
          : isDown
            ? 'bg-surface-2/30 border border-danger/20'
            : 'bg-surface-2/50 border border-border/50 hover:border-border hover:bg-surface-2/70'
      }`}>
        {entry.isActive && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
        )}

        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
              entry.isActive
                ? 'bg-accent text-surface-0 shadow-md shadow-accent/30'
                : rank === 1 ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/20'
                : 'bg-surface-3/80 text-text-tertiary border border-border/30'
            }`}>
              {entry.initiative}
              {entry.isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-accent/50"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 uppercase ${
              isDown ? 'grayscale' : ''
            }`}
              style={{ backgroundColor: avatarColor, boxShadow: entry.isActive ? '0 0 12px ' + avatarColor + '40' : 'none' }}
            >
              {isDown ? <Skull className="w-3.5 h-3.5" /> : entry.name.slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold truncate ${
                  entry.isActive ? 'text-accent' : isDown ? 'text-danger line-through' : 'text-text-primary'
                }`}>
                  {entry.name}
                </span>
                {entry.isActive && (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full"
                  >
                    TURN
                  </motion.span>
                )}
                {entry.isNPC && (
                  <span className="text-[8px] bg-surface-3/80 text-text-tertiary px-1.5 py-0.5 rounded-md uppercase tracking-widest font-bold border border-border/30">
                    NPC
                  </span>
                )}
              </div>
              {entry.conditions && entry.conditions.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {entry.conditions.map(c => (
                    <button
                      key={c}
                      onClick={() => isDM && onRemoveCondition?.(c)}
                      className={`text-[8px] bg-warning/10 text-warning px-1.5 py-0.5 rounded-md font-medium border border-warning/15 ${isDM ? 'cursor-pointer hover:bg-warning/20' : ''}`}
                      title={isDM ? 'Remove ' + c : (CONDITION_EFFECTS[c] || c)}
                    >
                      {c}{isDM && <span className="ml-0.5 opacity-60">\u00d7</span>}
                    </button>
                  ))}
                </div>
              )}
              {entry.concentratingOn && (
                <span className="text-[8px] bg-info/10 text-info px-1.5 py-0.5 rounded-md flex items-center gap-0.5 w-fit mt-0.5 font-medium border border-info/15">
                  <Sparkles className="w-2.5 h-2.5" /> {entry.concentratingOn}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {entry.hp && (
                <div className="flex flex-col items-center">
                  {isDM && editingHP ? (
                    <span className="flex items-center gap-0.5 text-xs font-mono">
                      <Heart className="w-3 h-3 text-danger" />
                      <input type="number" value={hpVal}
                        onChange={e => setHpVal(parseInt(e.target.value) || 0)}
                        onBlur={() => { onUpdateHP?.({ current: Math.max(0, hpVal), max: entry.hp!.max }); setEditingHP(false); }}
                        onKeyDown={e => { if (e.key === 'Enter') { onUpdateHP?.({ current: Math.max(0, hpVal), max: entry.hp!.max }); setEditingHP(false); } }}
                        className="w-10 bg-transparent border-b border-accent text-center text-xs" autoFocus />
                      <span className="text-text-tertiary">/{entry.hp.max}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => { if (isDM) setShowQuickHP(!showQuickHP); }}
                      className={`flex items-center gap-1 text-xs font-mono font-bold transition-colors ${isDM ? 'cursor-pointer hover:text-accent' : ''} ${
                        hpPct <= 25 ? 'text-danger' : hpPct <= 50 ? 'text-warning' : 'text-text-secondary'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${hpPct <= 25 ? 'text-danger' : hpPct <= 50 ? 'text-warning' : 'text-success'}`} />
                      {isDM || !entry.isNPC ? '' + entry.hp.current : '???'}
                    </button>
                  )}
                  {entry.hp && (isDM || !entry.isNPC) && (
                    <div className={`w-10 h-1 bg-surface-3/80 rounded-full overflow-hidden mt-0.5 shadow-sm ${hpGlow}`}>
                      <motion.div
                        className={`h-full rounded-full ${hpColor}`}
                        initial={false}
                        animate={{ width: Math.max(0, hpPct) + '%' }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                  )}
                </div>
              )}
              {entry.armorClass && (
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-0.5 text-xs text-text-tertiary font-mono font-bold">
                    <Shield className="w-3 h-3 text-blue-400/60" />
                    {isDM || !entry.isNPC ? entry.armorClass : '??'}
                  </span>
                </div>
              )}
            </div>

            {isDM && (
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setShowConditions(!showConditions)} title="Conditions"
                  className="p-1.5 text-text-tertiary hover:text-warning transition-colors cursor-pointer rounded-lg hover:bg-warning/10">
                  <Zap className="w-3 h-3" />
                </button>
                <button onClick={onRemove} title="Remove"
                  className="p-1.5 text-text-tertiary hover:text-danger transition-colors cursor-pointer rounded-lg hover:bg-danger/10">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showQuickHP && isDM && entry.hp && (
          <div className="mt-1.5 flex justify-center">
            <QuickHPChanger onApply={applyHPDelta} onClose={() => setShowQuickHP(false)} />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConditions && isDM && (
          <ConditionPicker
            current={entry.conditions || []}
            onToggle={toggleCondition}
            onClose={() => setShowConditions(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Party Quick-Add Panel
// ============================================================
function PartyQuickAdd({ campaignId, onAddCharacter, existingNames }: {
  campaignId: string;
  onAddCharacter: (ch: Character) => void;
  existingNames: string[];
}) {
  const [characters, setCharacters] = useState<Character[]>([]);
  useEffect(() => {
    api.getCharactersByCampaign(campaignId).then(chars => setCharacters(chars || [])).catch(() => setCharacters([]));
  }, [campaignId]);

  if (characters.length === 0) return (
    <div className="px-3 py-3 text-center">
      <Users className="w-5 h-5 text-text-tertiary/30 mx-auto mb-1" />
      <p className="text-[10px] text-text-tertiary">No characters in this campaign</p>
    </div>
  );

  const available = characters.filter(ch => !existingNames.includes(ch.name));
  const alreadyAdded = characters.filter(ch => existingNames.includes(ch.name));

  return (
    <div className="p-2.5 space-y-1.5">
      <div className="flex items-center gap-1.5 px-1 mb-1">
        <Users className="w-3 h-3 text-accent" />
        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Party Members</span>
        <span className="text-[9px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-full font-medium ml-auto">{characters.length}</span>
      </div>

      {available.length > 0 && (
        <div className="space-y-1">
          {available.map(ch => (
            <motion.button
              key={ch.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onAddCharacter(ch)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface-2/40 border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group/ch"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: CLASS_COLORS[ch.class] || '#6b7280' }}>
                {ch.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="text-[11px] font-semibold text-text-primary truncate group-hover/ch:text-accent transition-colors">
                  {ch.name}
                </div>
                <div className="text-[9px] text-text-tertiary">
                  {CLASS_ICONS[ch.class] || '\u2694\uFE0F'} Lv.{ch.level} {ch.race} {ch.class}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[9px] font-mono text-text-tertiary">
                <span className="flex items-center gap-0.5">
                  <Heart className="w-2.5 h-2.5 text-danger/60" />{ch.hp.max}
                </span>
                <span className="flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5 text-blue-400/60" />{ch.armorClass}
                </span>
              </div>

              <UserPlus className="w-3.5 h-3.5 text-accent/0 group-hover/ch:text-accent transition-colors shrink-0" />
            </motion.button>
          ))}
        </div>
      )}

      {available.length > 1 && (
        <button
          onClick={() => available.forEach(ch => onAddCharacter(ch))}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold hover:bg-accent/15 transition-colors cursor-pointer mt-1"
        >
          <Users className="w-3 h-3" /> Add All ({available.length})
        </button>
      )}

      {alreadyAdded.length > 0 && (
        <div className="space-y-1 mt-2">
          <span className="text-[9px] text-text-tertiary/60 px-1 uppercase tracking-wider font-medium">Already in Combat</span>
          {alreadyAdded.map(ch => (
            <div key={ch.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-2/20 opacity-50">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: CLASS_COLORS[ch.class] || '#6b7280' }}>
                {ch.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-[10px] text-text-tertiary truncate">{ch.name}</span>
              <span className="text-[8px] text-success ml-auto">\u2713</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Add Entry Form
// ============================================================
function AddEntryForm({ onAdd, onClose }: {
  onAdd: (name: string, init: number, isNPC: boolean, hp?: { current: number; max: number }, ac?: number) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [init, setInit] = useState('');
  const [isNPC, setIsNPC] = useState(false);
  const [hpMax, setHpMax] = useState('');
  const [ac, setAc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !init) return;
    const hp = hpMax ? { current: parseInt(hpMax), max: parseInt(hpMax) } : undefined;
    onAdd(name.trim(), parseInt(init), isNPC, hp, ac ? parseInt(ac) : undefined);
    setName('');
    setInit('');
    setHpMax('');
    setAc('');
  };

  return (
    <motion.form
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      onSubmit={handleSubmit}
      className="overflow-hidden"
    >
      <div className="p-3 bg-surface-2/50 backdrop-blur-sm border-t border-border space-y-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Plus className="w-3 h-3 text-accent" />
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Manual Add</span>
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)}
            className="flex-1 text-xs bg-surface-3/60 border border-border/50 rounded-lg px-2.5 py-1.5 text-text-primary placeholder:text-text-tertiary/50 focus:border-accent/50 outline-none transition-colors"
            autoFocus />
          <input type="number" placeholder="Init" value={init} onChange={e => setInit(e.target.value)}
            className="w-16 text-xs text-center bg-surface-3/60 border border-border/50 rounded-lg px-2 py-1.5 text-text-primary placeholder:text-text-tertiary/50 focus:border-accent/50 outline-none" />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1 flex-1">
            <Heart className="w-3 h-3 text-danger/50 shrink-0" />
            <input type="number" placeholder="HP" value={hpMax} onChange={e => setHpMax(e.target.value)}
              className="w-full text-xs text-center bg-surface-3/60 border border-border/50 rounded-lg px-2 py-1.5 text-text-primary placeholder:text-text-tertiary/50 focus:border-accent/50 outline-none" />
          </div>
          <div className="flex items-center gap-1 flex-1">
            <Shield className="w-3 h-3 text-blue-400/50 shrink-0" />
            <input type="number" placeholder="AC" value={ac} onChange={e => setAc(e.target.value)}
              className="w-full text-xs text-center bg-surface-3/60 border border-border/50 rounded-lg px-2 py-1.5 text-text-primary placeholder:text-text-tertiary/50 focus:border-accent/50 outline-none" />
          </div>
          <label className="flex items-center gap-1.5 text-[10px] text-text-secondary cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={isNPC} onChange={e => setIsNPC(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-accent cursor-pointer" />
            NPC
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-[10px] text-text-tertiary hover:text-text-secondary cursor-pointer transition-colors rounded-lg">
            Cancel
          </button>
          <button type="submit" disabled={!name.trim() || !init}
            className="px-4 py-1.5 bg-gradient-to-r from-accent to-accent-dim text-surface-0 rounded-lg text-[10px] font-bold hover:brightness-110 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm shadow-accent/20">
            Add Combatant
          </button>
        </div>
      </div>
    </motion.form>
  );
}

// ============================================================
// Turn Timer Component
// ============================================================
function TurnTimerBar({ isDM }: { isDM: boolean }) {
  const { turnTimerEnabled, turnTimerSeconds, turnTimerRemaining,
    setTurnTimer, tickTimer, resetTimer } = useChatStore();
  const [showSettings, setShowSettings] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!turnTimerEnabled || isPaused) return;
    const iv = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(iv);
  }, [turnTimerEnabled, isPaused, tickTimer]);

  useEffect(() => {
    if (turnTimerEnabled && turnTimerRemaining <= 0 && !isPaused) setIsPaused(true);
  }, [turnTimerRemaining, turnTimerEnabled, isPaused]);

  if (!turnTimerEnabled && !isDM) return null;

  const pct = turnTimerSeconds > 0 ? (turnTimerRemaining / turnTimerSeconds) * 100 : 0;
  const isLow = turnTimerRemaining <= 10 && turnTimerRemaining > 0;
  const isExpired = turnTimerRemaining <= 0;
  const mins = Math.floor(turnTimerRemaining / 60);
  const secs = turnTimerRemaining % 60;

  return (
    <div className="px-3 py-2 border-b border-border/50">
      <AnimatePresence>
        {showSettings && isDM && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="text-[9px] text-text-tertiary font-medium">Timer:</span>
              {[30, 60, 90, 120, 180, 300].map(s => (
                <button key={s} onClick={() => setTurnTimer(true, s)}
                  className={`text-[9px] px-2 py-1 rounded-lg cursor-pointer transition-all font-medium ${
                    turnTimerSeconds === s ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-surface-3/60 text-text-tertiary hover:text-text-secondary border border-transparent'
                  }`}>
                  {s >= 60 ? '' + (s / 60) + 'm' : '' + s + 's'}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {turnTimerEnabled ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Timer className={`w-3.5 h-3.5 ${isExpired ? 'text-danger animate-pulse' : isLow ? 'text-warning animate-pulse' : 'text-accent'}`} />
            <span className={`text-base font-mono font-black tabular-nums tracking-tight ${
              isExpired ? 'text-danger' : isLow ? 'text-warning' : 'text-text-primary'
            }`}>
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
            {isDM && (
              <div className="flex items-center gap-0.5 ml-auto">
                <button onClick={() => setIsPaused(!isPaused)} title={isPaused ? 'Resume' : 'Pause'}
                  className="p-1.5 text-text-tertiary hover:text-accent cursor-pointer rounded-lg hover:bg-surface-2/80 transition-colors">
                  {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
                <button onClick={() => { resetTimer(); setIsPaused(false); }} title="Reset"
                  className="p-1.5 text-text-tertiary hover:text-accent cursor-pointer rounded-lg hover:bg-surface-2/80 transition-colors">
                  <SkipForward className="w-3 h-3" />
                </button>
                <button onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 text-text-tertiary hover:text-accent cursor-pointer rounded-lg hover:bg-surface-2/80 transition-colors">
                  <Settings className="w-3 h-3" />
                </button>
                <button onClick={() => setTurnTimer(false, turnTimerSeconds)}
                  className="p-1.5 text-text-tertiary hover:text-danger cursor-pointer rounded-lg hover:bg-danger/10 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <div className="h-1.5 bg-surface-3/50 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors ${
                isExpired ? 'bg-danger shadow-sm shadow-danger/30' : isLow ? 'bg-warning shadow-sm shadow-warning/30' : 'bg-accent shadow-sm shadow-accent/30'
              }`}
              initial={false}
              animate={{ width: pct + '%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      ) : isDM ? (
        <div className="flex items-center justify-between">
          <button onClick={() => { setTurnTimer(true, turnTimerSeconds); setIsPaused(false); }}
            className="flex items-center gap-1.5 text-[10px] text-text-tertiary hover:text-accent cursor-pointer transition-colors font-medium">
            <Timer className="w-3 h-3" /> Enable Turn Timer
          </button>
          <button onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-text-tertiary hover:text-accent cursor-pointer rounded hover:bg-surface-2">
            <Settings className="w-3 h-3" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ============================================================
// Initiative Tracker (Main) with Party Integration
// ============================================================
interface InitiativeTrackerProps {
  isDM: boolean;
  campaignId?: string;
  className?: string;
}

export default function InitiativeTracker({ isDM, campaignId, className = '' }: InitiativeTrackerProps) {
  const { session, addInitiative, removeInitiative, nextTurn, updateInitiativeHP,
    addConditionToEntry, removeConditionFromEntry, setConcentration,
    turnTimerEnabled, resetTimer } = useChatStore();
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<'party' | 'manual'>('party');

  const entries = session?.initiative || [];
  const roundNumber = session?.currentRound || 1;
  const existingNames = entries.map(e => e.name);

  const handleNextTurn = useCallback(() => {
    nextTurn();
    if (turnTimerEnabled) resetTimer();
  }, [nextTurn, turnTimerEnabled, resetTimer]);

  const handleAddCharacter = useCallback((ch: Character) => {
    const dexMod = getAbilityModifier(ch.abilityScores.dexterity);
    const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod + (ch.initiative || 0);
    addInitiative(
      ch.name,
      initRoll,
      false,
      { current: ch.hp.current, max: ch.hp.max },
      ch.armorClass,
      ch.id
    );
    // Trigger cinematic when first combatant enters
    if (entries.length === 0) {
      triggerCinematic('initiativeStart');
    }
  }, [addInitiative, entries.length]);

  const pcCount = entries.filter(e => !e.isNPC).length;
  const npcCount = entries.filter(e => e.isNPC).length;
  const activeEntry = entries.find(e => e.isActive);

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="shrink-0 bg-surface-1/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <Swords className="w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-display font-bold text-text-primary tracking-wide">Combat</span>
                {entries.length > 0 && (
                  <span className="text-[9px] bg-gradient-to-r from-accent/15 to-accent/5 text-accent px-2 py-0.5 rounded-full font-bold border border-accent/10">
                    Round {roundNumber}
                  </span>
                )}
              </div>
              {entries.length > 0 && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-text-tertiary">{pcCount} PC{pcCount !== 1 ? 's' : ''}</span>
                  <span className="text-[9px] text-text-tertiary/30">\u2022</span>
                  <span className="text-[9px] text-text-tertiary">{npcCount} NPC{npcCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isDM && entries.length > 0 && (
              <button onClick={handleNextTurn}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-surface-0 bg-gradient-to-r from-accent to-accent-dim rounded-lg hover:brightness-110 transition-all cursor-pointer shadow-sm shadow-accent/20">
                <SkipForward className="w-3 h-3" /> Next
              </button>
            )}
            {isDM && (
              <button onClick={() => setShowAdd(!showAdd)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  showAdd ? 'bg-accent/15 text-accent' : 'text-text-tertiary hover:text-accent hover:bg-surface-2/80'
                }`}>
                <Plus className={`w-4 h-4 transition-transform ${showAdd ? 'rotate-45' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {activeEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-3 pb-2"
          >
            <div className="flex items-center gap-2 bg-accent/8 border border-accent/15 rounded-lg px-2.5 py-1.5">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-accent"
              >
                <Swords className="w-3 h-3" />
              </motion.div>
              <span className="text-[10px] text-accent font-bold truncate">{activeEntry.name}&#39;s Turn</span>
              {activeEntry.hp && (
                <span className="text-[9px] text-accent/60 font-mono ml-auto">{activeEntry.hp.current}/{activeEntry.hp.max} HP</span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Turn Timer */}
      <TurnTimerBar isDM={isDM} />

      {/* Add Panel */}
      <AnimatePresence>
        {showAdd && isDM && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/50 shrink-0"
          >
            <div className="flex border-b border-border/30 bg-surface-2/30">
              <button
                onClick={() => setActiveTab('party')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-bold cursor-pointer transition-all ${
                  activeTab === 'party'
                    ? 'text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <Users className="w-3 h-3" /> Party
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-bold cursor-pointer transition-all ${
                  activeTab === 'manual'
                    ? 'text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <Plus className="w-3 h-3" /> Manual
              </button>
            </div>

            {activeTab === 'party' && campaignId ? (
              <PartyQuickAdd
                campaignId={campaignId}
                onAddCharacter={handleAddCharacter}
                existingNames={existingNames}
              />
            ) : activeTab === 'party' && !campaignId ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[10px] text-text-tertiary">No campaign selected</p>
              </div>
            ) : (
              <AddEntryForm
                onAdd={(name, init, isNPC, hp, ac) => addInitiative(name, init, isNPC, hp, ac)}
                onClose={() => setShowAdd(false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1.5">
        {entries.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-2/50 border border-border/30 flex items-center justify-center">
              <Swords className="w-7 h-7 text-text-tertiary/20" />
            </div>
            <p className="text-xs font-semibold text-text-tertiary/60">No Combat Active</p>
            {isDM && (
              <p className="text-[10px] text-text-tertiary/40 mt-1 leading-relaxed">
                Click <span className="text-accent font-bold">+</span> to add combatants from your party or manually
              </p>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {entries.map((entry, idx) => (
              <InitiativeCard
                key={entry.id}
                entry={entry}
                isDM={isDM}
                rank={idx + 1}
                onRemove={() => removeInitiative(entry.id)}
                onUpdateHP={(hp) => updateInitiativeHP(entry.id, hp)}
                onAddCondition={(c) => addConditionToEntry(entry.id, c)}
                onRemoveCondition={(c) => removeConditionFromEntry(entry.id, c)}
                onSetConcentration={(spell) => setConcentration(entry.id, spell ?? undefined)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
