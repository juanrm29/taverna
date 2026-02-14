'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Zap, Shield, Heart, Skull, Sparkles,
  Play, Pause, SkipForward, RotateCcw, ChevronDown,
  Crown, Activity, Plus, X, Settings, Clock,
  TrendingUp, Trophy,
} from 'lucide-react';
import { Button, Badge, Input } from '@/components/ui';
import { useToast } from '@/components/Feedback';

// ── Types ──
interface CombatActor {
  id: string; name: string; initiative: number; ac: number;
  maxHp: number; currentHp: number; isPlayer: boolean;
  attackBonus: number; damage: string; damageType: string;
  concentration?: string | null; reactions: number;
  conditions: string[];
  deathSaves?: { success: number; fail: number };
}

interface ResolvedAction {
  id: string; round: number; turnOrder: number; actor: string;
  type: string; target?: string; attackRoll?: number; attackBonus?: number;
  attackTotal?: number; targetAC?: number; isHit?: boolean;
  isCritical?: boolean; isFumble?: boolean; damageRoll?: string;
  damageTotal?: number; damageType?: string; hpBefore?: number; hpAfter?: number;
  saveRoll?: number; saveResult?: boolean;
  concentrationCheck?: boolean; concentrationLost?: boolean;
  description: string;
}

const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Poison', 'Necrotic', 'Radiant', 'Psychic', 'Thunder', 'Force', 'Acid'] as const;

// ── Dice ──
function rollDice(formula: string) {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return { rolls: [0], total: 0 };
  const count = parseInt(match[1]), sides = parseInt(match[2]);
  const mod = match[3] ? parseInt(match[3]) : 0;
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) + mod };
}
function rollD20() { return Math.floor(Math.random() * 20) + 1; }

// ── Resolvers ──
function autoResolveAttack(actor: CombatActor, target: CombatActor, round: number, turnOrder: number): ResolvedAction {
  const attackRoll = rollD20();
  const isCritical = attackRoll === 20, isFumble = attackRoll === 1;
  const attackTotal = attackRoll + actor.attackBonus;
  const isHit = isCritical || (!isFumble && attackTotal >= target.ac);
  let damageTotal = 0;
  if (isHit) {
    const dmg = rollDice(actor.damage);
    damageTotal = isCritical ? dmg.total + rollDice(actor.damage).total - (parseInt(actor.damage.match(/[+-]\d+$/)?.[0] || '0')) : dmg.total;
  }
  const hpBefore = target.currentHp, hpAfter = Math.max(0, hpBefore - damageTotal);
  const description = isHit
    ? `${actor.name} → ${target.name} — ${attackRoll}+${actor.attackBonus}=${attackTotal} vs AC ${target.ac} → HIT! ${damageTotal} ${actor.damageType}. ${target.name}: ${hpBefore}→${hpAfter} HP${hpAfter === 0 ? ' ☠️' : ''}`
    : `${actor.name} → ${target.name} — ${attackRoll}+${actor.attackBonus}=${attackTotal} vs AC ${target.ac} → MISS${isFumble ? ' (Nat 1!)' : ''}`;
  return { id: crypto.randomUUID(), round, turnOrder, actor: actor.name, type: 'ATTACK', target: target.name, attackRoll, attackBonus: actor.attackBonus, attackTotal, targetAC: target.ac, isHit, isCritical, isFumble, damageRoll: actor.damage, damageTotal: isHit ? damageTotal : 0, damageType: actor.damageType, hpBefore, hpAfter, description };
}

function autoResolveDeathSave(actor: CombatActor, round: number, turnOrder: number): ResolvedAction {
  const roll = rollD20();
  const success = roll >= 10;
  let desc = `${actor.name} Death Save: ${roll}`;
  if (roll === 20) desc += ' — NAT 20! Bangun! 🎉';
  else if (roll === 1) desc += ' — NAT 1! 2 fail 💀';
  else desc += success ? ` — ✅` : ` — ❌`;
  return { id: crypto.randomUUID(), round, turnOrder, actor: actor.name, type: 'DEATH_SAVE', saveRoll: roll, saveResult: success, description: desc };
}

function autoResolveConcentration(actor: CombatActor, dmg: number, round: number, turnOrder: number): ResolvedAction {
  const dc = Math.max(10, Math.floor(dmg / 2)), roll = rollD20(), total = roll + 2, pass = total >= dc;
  return { id: crypto.randomUUID(), round, turnOrder, actor: actor.name, type: 'SAVE', saveRoll: roll, saveResult: pass, concentrationCheck: true, concentrationLost: !pass, description: `${actor.name} Concentration DC${dc}: ${total} → ${pass ? '✅' : '❌ Lost ' + (actor.concentration || 'spell')}` };
}

interface CombatAutopilotPanelProps {
  isDM: boolean;
}

export default function CombatAutopilotPanel({ isDM }: CombatAutopilotPanelProps) {
  const toast = useToast();

  const [actors, setActors] = useState<CombatActor[]>([
    { id: '1', name: 'Wizard', initiative: 18, ac: 14, maxHp: 32, currentHp: 32, isPlayer: true, attackBonus: 7, damage: '4d10+0', damageType: 'Fire', concentration: 'Haste', reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } },
    { id: '2', name: 'Fighter', initiative: 15, ac: 20, maxHp: 58, currentHp: 58, isPlayer: true, attackBonus: 8, damage: '1d8+5', damageType: 'Slashing', reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } },
    { id: '3', name: 'Goblin Boss', initiative: 12, ac: 17, maxHp: 21, currentHp: 21, isPlayer: false, attackBonus: 4, damage: '1d6+2', damageType: 'Slashing', reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } },
    { id: '4', name: 'Goblin A', initiative: 10, ac: 15, maxHp: 7, currentHp: 7, isPlayer: false, attackBonus: 4, damage: '1d6+2', damageType: 'Slashing', reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } },
  ]);
  const [actionLog, setActionLog] = useState<ResolvedAction[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [autopilotMode, setAutopilotMode] = useState<'full' | 'monsters-only' | 'manual'>('monsters-only');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [showAddActor, setShowAddActor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const sortedActors = useMemo(() => [...actors].sort((a, b) => b.initiative - a.initiative), [actors]);
  const aliveActors = useMemo(() => sortedActors.filter(a => a.currentHp > 0), [sortedActors]);
  const currentActor = sortedActors[currentTurn % sortedActors.length];
  const combatOver = aliveActors.every(a => a.isPlayer) || aliveActors.every(a => !a.isPlayer);

  const advanceTurn = useCallback(() => {
    setCurrentTurn(prev => {
      const next = prev + 1;
      if (next >= sortedActors.length) {
        setCurrentRound(r => r + 1);
        setActors(pa => pa.map(a => ({ ...a, reactions: 1 })));
        return 0;
      }
      return next;
    });
  }, [sortedActors.length]);

  const executeTurn = useCallback(() => {
    if (combatOver || !currentActor) return;
    if (currentActor.currentHp <= 0) {
      if (currentActor.isPlayer && currentActor.deathSaves) {
        const result = autoResolveDeathSave(currentActor, currentRound, currentTurn);
        setActionLog(p => [...p, result]);
        setActors(p => p.map(a => {
          if (a.id !== currentActor.id || !a.deathSaves) return a;
          if (result.saveRoll === 20) return { ...a, currentHp: 1, deathSaves: { success: 0, fail: 0 }, conditions: a.conditions.filter(c => c !== 'Unconscious') };
          const ds = { ...a.deathSaves };
          if (result.saveResult) ds.success += 1; else ds.fail += result.saveRoll === 1 ? 2 : 1;
          return { ...a, deathSaves: ds };
        }));
      }
      advanceTurn(); return;
    }
    const targets = aliveActors.filter(a => a.isPlayer !== currentActor.isPlayer);
    if (!targets.length) return;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const result = autoResolveAttack(currentActor, target, currentRound, currentTurn);
    setActionLog(p => [...p, result]);
    if (result.isHit && result.damageTotal) {
      setActors(p => p.map(a => {
        if (a.id !== target.id) return a;
        const newHp = Math.max(0, a.currentHp - (result.damageTotal || 0));
        return { ...a, currentHp: newHp, conditions: newHp === 0 ? [...a.conditions, 'Unconscious'] : a.conditions };
      }));
      if (target.concentration && result.damageTotal > 0) {
        const conResult = autoResolveConcentration(target, result.damageTotal, currentRound, currentTurn);
        setActionLog(p => [...p, conResult]);
        if (conResult.concentrationLost) setActors(p => p.map(a => a.id === target.id ? { ...a, concentration: null } : a));
      }
    }
    advanceTurn();
  }, [currentActor, currentRound, currentTurn, combatOver, aliveActors, advanceTurn]);

  useEffect(() => {
    if (!isRunning || combatOver) return;
    const actor = sortedActors[currentTurn % sortedActors.length];
    if (!actor) return;
    if (autopilotMode === 'monsters-only' && actor.isPlayer && actor.currentHp > 0) { setIsRunning(false); return; }
    const timer = setTimeout(executeTurn, speed);
    return () => clearTimeout(timer);
  }, [isRunning, currentTurn, speed, combatOver, executeTurn, autopilotMode, sortedActors]);

  const executeManualAction = useCallback(() => {
    if (!currentActor || currentActor.currentHp <= 0) return;
    const target = actors.find(a => a.id === selectedTarget);
    if (!target) { toast.error('Pilih target!'); return; }
    const result = autoResolveAttack(currentActor, target, currentRound, currentTurn);
    setActionLog(p => [...p, result]);
    if (result.isHit && result.damageTotal) {
      setActors(p => p.map(a => {
        if (a.id !== target.id) return a;
        const newHp = Math.max(0, a.currentHp - (result.damageTotal || 0));
        return { ...a, currentHp: newHp, conditions: newHp === 0 ? [...a.conditions, 'Unconscious'] : a.conditions };
      }));
      if (target.concentration && result.damageTotal > 0) {
        const conResult = autoResolveConcentration(target, result.damageTotal, currentRound, currentTurn);
        setActionLog(p => [...p, conResult]);
        if (conResult.concentrationLost) setActors(p => p.map(a => a.id === target.id ? { ...a, concentration: null } : a));
      }
    }
    advanceTurn();
  }, [currentActor, selectedTarget, actors, currentRound, currentTurn, advanceTurn, toast]);

  const resetCombat = useCallback(() => {
    setActors(p => p.map(a => ({ ...a, currentHp: a.maxHp, conditions: [], reactions: 1, deathSaves: { success: 0, fail: 0 }, concentration: a.id === '1' ? 'Haste' : null })));
    setActionLog([]); setCurrentRound(1); setCurrentTurn(0); setIsRunning(false);
  }, []);

  const [newActor, setNewActor] = useState({ name: '', ac: 15, hp: 20, initiative: 10, isPlayer: false, attackBonus: 4, damage: '1d8+2', damageType: 'Slashing' });
  const addActor = () => {
    if (!newActor.name.trim()) return;
    setActors(p => [...p, { id: crypto.randomUUID(), name: newActor.name, initiative: newActor.initiative, ac: newActor.ac, maxHp: newActor.hp, currentHp: newActor.hp, isPlayer: newActor.isPlayer, attackBonus: newActor.attackBonus, damage: newActor.damage, damageType: newActor.damageType, reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } }]);
    setShowAddActor(false);
    setNewActor({ name: '', ac: 15, hp: 20, initiative: 10, isPlayer: false, attackBonus: 4, damage: '1d8+2', damageType: 'Slashing' });
    toast.success('Combatant ditambahkan!');
  };

  const stats = useMemo(() => {
    const hits = actionLog.filter(a => a.type === 'ATTACK' && a.isHit).length;
    const attacks = actionLog.filter(a => a.type === 'ATTACK').length;
    const crits = actionLog.filter(a => a.isCritical).length;
    const totalDmg = actionLog.reduce((s, a) => s + (a.damageTotal || 0), 0);
    return { hits, attacks, crits, totalDmg, hitRate: attacks > 0 ? Math.round((hits / attacks) * 100) : 0 };
  }, [actionLog]);

  return (
    <div className="p-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <Swords className="w-3.5 h-3.5 text-red-400" />
        <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Combat Autopilot</span>
        <span className="ml-auto text-[9px] text-text-muted">R{currentRound}</span>
        <button onClick={() => setShowSettings(!showSettings)} className="p-0.5 rounded hover:bg-surface-3 text-text-muted"><Settings size={11} /></button>
      </div>

      {/* Settings dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-2">
            <div className="p-2 bg-surface-2/50 border border-border/30 rounded-lg space-y-2">
              <div>
                <span className="text-[8px] font-bold text-text-tertiary uppercase">Mode</span>
                <div className="flex gap-1 mt-0.5">
                  {(['full', 'monsters-only', 'manual'] as const).map(m => (
                    <button key={m} onClick={() => setAutopilotMode(m)}
                      className={`flex-1 py-1 rounded text-[8px] font-medium transition ${autopilotMode === m ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-text-muted'}`}>
                      {m === 'full' ? 'Auto' : m === 'monsters-only' ? 'Monster' : 'Manual'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[8px] font-bold text-text-tertiary uppercase">Speed</span>
                <div className="flex gap-1 mt-0.5">
                  {[{ ms: 1500, l: '0.5×' }, { ms: 800, l: '1×' }, { ms: 400, l: '2×' }, { ms: 150, l: '5×' }].map(s => (
                    <button key={s.ms} onClick={() => setSpeed(s.ms)}
                      className={`flex-1 py-1 rounded text-[8px] font-medium transition ${speed === s.ms ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-text-muted'}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-1 mb-2">
        {combatOver ? (
          <div className="flex-1 py-1.5 text-center rounded-lg bg-green-500/10 text-green-400 text-[10px] font-medium">
            <Trophy size={10} className="inline mr-1" />
            {aliveActors.every(a => a.isPlayer) ? 'Players win! 🎉' : 'Monsters win! 💀'}
          </div>
        ) : (
          <>
            <button onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition ${isRunning ? 'bg-amber-500/15 text-amber-400' : 'bg-accent/10 text-accent'}`}>
              {isRunning ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Run</>}
            </button>
            <button onClick={executeTurn}
              className="flex items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg bg-surface-2 text-text-secondary text-[10px] hover:bg-surface-3 transition">
              <SkipForward size={10} /> Next
            </button>
          </>
        )}
        <button onClick={resetCombat}
          className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-surface-2 text-text-muted text-[10px] hover:bg-surface-3 transition">
          <RotateCcw size={10} />
        </button>
      </div>

      {/* Manual action (player turn) */}
      {!isRunning && currentActor && currentActor.isPlayer && currentActor.currentHp > 0 && autopilotMode !== 'full' && !combatOver && (
        <div className="mb-2 p-2 bg-accent/5 border border-accent/20 rounded-lg">
          <span className="text-[9px] font-bold text-accent flex items-center gap-1 mb-1">
            <Crown size={9} /> {currentActor.name} — Pilih Aksi
          </span>
          <div className="flex gap-1">
            <select value={selectedTarget} onChange={e => setSelectedTarget(e.target.value)}
              className="flex-1 bg-surface-2 border border-border rounded px-1.5 py-1 text-[9px] text-text-primary">
              <option value="">Target...</option>
              {aliveActors.filter(a => a.id !== currentActor.id).map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.currentHp}HP)</option>
              ))}
            </select>
            <button onClick={executeManualAction}
              className="px-2 py-1 bg-red-500/15 text-red-400 rounded text-[9px] font-medium hover:bg-red-500/25 transition">
              <Swords size={9} className="inline mr-0.5" /> Attack
            </button>
          </div>
        </div>
      )}

      {/* Initiative list */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-text-tertiary uppercase">Initiative</span>
          <button onClick={() => setShowAddActor(true)} className="text-[8px] text-accent hover:underline flex items-center gap-0.5">
            <Plus size={8} /> Add
          </button>
        </div>
        {sortedActors.map((actor, i) => {
          const isActive = i === currentTurn % sortedActors.length;
          const isDead = actor.currentHp <= 0;
          const hpPerc = (actor.currentHp / actor.maxHp) * 100;
          return (
            <div key={actor.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition ${
              isActive ? 'bg-accent/10 border-accent/30' : isDead ? 'bg-surface-3/30 border-border/20 opacity-40' : 'bg-surface-2/40 border-border/20'
            }`}>
              <span className={`w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center shrink-0 ${actor.isPlayer ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'}`}>
                {actor.initiative}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {isActive && <span className="text-accent animate-pulse text-[9px]">▶</span>}
                  <span className={`text-[10px] font-medium truncate ${isDead ? 'line-through text-text-muted' : 'text-text-primary'}`}>{actor.name}</span>
                  {actor.concentration && <Sparkles size={8} className="text-purple-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex-1 h-1 bg-surface-1 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${hpPerc > 50 ? 'bg-green-500' : hpPerc > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${hpPerc}%` }} />
                  </div>
                  <span className="text-[8px] text-text-muted shrink-0">{actor.currentHp}/{actor.maxHp}</span>
                </div>
                {isDead && actor.isPlayer && actor.deathSaves && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[0, 1, 2].map(j => <span key={`s${j}`} className={`w-1.5 h-1.5 rounded-full ${j < (actor.deathSaves?.success || 0) ? 'bg-green-500' : 'bg-surface-1 border border-border'}`} />)}
                    <span className="text-[7px] text-text-muted mx-0.5">|</span>
                    {[0, 1, 2].map(j => <span key={`f${j}`} className={`w-1.5 h-1.5 rounded-full ${j < (actor.deathSaves?.fail || 0) ? 'bg-red-500' : 'bg-surface-1 border border-border'}`} />)}
                  </div>
                )}
              </div>
              <span className="text-[8px] text-text-muted flex items-center gap-0.5 shrink-0"><Shield size={8} />{actor.ac}</span>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        {[
          { v: `${stats.hitRate}%`, l: 'Hit', c: 'text-accent' },
          { v: stats.totalDmg, l: 'Dmg', c: 'text-red-400' },
          { v: stats.crits, l: 'Crit', c: 'text-amber-400' },
          { v: actionLog.length, l: 'Acts', c: 'text-text-primary' },
        ].map(s => (
          <div key={s.l} className="bg-surface-2/50 rounded p-1 text-center">
            <div className={`text-xs font-bold ${s.c}`}>{s.v}</div>
            <div className="text-[7px] text-text-muted">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Action log */}
      <div className="flex-1 overflow-y-auto space-y-1">
        <span className="text-[8px] font-bold text-text-tertiary uppercase flex items-center gap-1">
          <Activity size={8} /> Combat Log
        </span>
        {actionLog.length === 0 ? (
          <div className="text-center py-6 text-text-muted">
            <Swords size={20} className="mx-auto mb-1 opacity-30" />
            <p className="text-[9px]">Press Run or Next</p>
          </div>
        ) : (
          <div className="space-y-1">
            {actionLog.slice(-20).map(action => (
              <motion.div key={action.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className={`px-2 py-1 rounded border text-[9px] ${
                  action.isCritical ? 'bg-amber-500/10 border-amber-500/20' :
                  action.concentrationLost ? 'bg-purple-500/10 border-purple-500/20' :
                  action.type === 'DEATH_SAVE' ? 'bg-gray-500/10 border-gray-500/20' :
                  action.isHit ? 'bg-green-500/5 border-green-500/15' :
                  'bg-surface-2/50 border-border/20'
                }`}>
                <span className="text-text-secondary leading-relaxed">{action.description}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add actor modal */}
      <AnimatePresence>
        {showAddActor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowAddActor(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-surface-1 rounded-xl border border-border p-4 space-y-2">
              <h3 className="text-sm font-bold text-text-primary mb-2">Tambah Combatant</h3>
              <Input value={newActor.name} onChange={e => setNewActor(p => ({ ...p, name: e.target.value }))} placeholder="Nama..." className="text-xs h-8" />
              <div className="grid grid-cols-3 gap-1.5">
                <div><label className="text-[8px] text-text-muted">Init</label><Input type="number" value={newActor.initiative} onChange={e => setNewActor(p => ({ ...p, initiative: +e.target.value }))} className="text-xs h-7" /></div>
                <div><label className="text-[8px] text-text-muted">AC</label><Input type="number" value={newActor.ac} onChange={e => setNewActor(p => ({ ...p, ac: +e.target.value }))} className="text-xs h-7" /></div>
                <div><label className="text-[8px] text-text-muted">HP</label><Input type="number" value={newActor.hp} onChange={e => setNewActor(p => ({ ...p, hp: +e.target.value }))} className="text-xs h-7" /></div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div><label className="text-[8px] text-text-muted">Atk+</label><Input type="number" value={newActor.attackBonus} onChange={e => setNewActor(p => ({ ...p, attackBonus: +e.target.value }))} className="text-xs h-7" /></div>
                <div><label className="text-[8px] text-text-muted">Dmg</label><Input value={newActor.damage} onChange={e => setNewActor(p => ({ ...p, damage: e.target.value }))} className="text-xs h-7" /></div>
                <div><label className="text-[8px] text-text-muted">Type</label>
                  <select value={newActor.damageType} onChange={e => setNewActor(p => ({ ...p, damageType: e.target.value }))}
                    className="w-full px-1 py-1 rounded bg-surface-3 border border-border text-[9px] text-text-primary h-7">
                    {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-1.5 text-[10px] text-text-secondary cursor-pointer">
                <input type="checkbox" checked={newActor.isPlayer} onChange={e => setNewActor(p => ({ ...p, isPlayer: e.target.checked }))} className="accent-accent" />
                Player Character
              </label>
              <div className="flex gap-2 pt-1">
                <Button onClick={addActor} size="sm" className="bg-accent/10 text-accent flex-1 text-xs">Tambah</Button>
                <Button onClick={() => setShowAddActor(false)} size="sm" variant="ghost" className="text-xs">Batal</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
