'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Zap, Shield, Heart, Brain, Flame, Target, Dices,
  Play, Pause, SkipForward, RotateCcw, ChevronDown, ChevronRight,
  Eye, Skull, Crown, AlertTriangle, CheckCircle2, XCircle,
  Activity, Clock, TrendingUp, Award, Users, Settings, Plus,
  ArrowRight, Sparkles, Volume2, RefreshCw, History,
  ChevronLeft, Maximize2, Minimize2, ListOrdered, Trophy,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { useToast } from '@/components/Feedback';
import { useTranslation } from '@/lib/i18n';
import * as api from '@/lib/api-client';
import { useSession } from 'next-auth/react';

// ============================================================
// Types & Config
// ============================================================
interface CombatActor {
  id: string;
  name: string;
  initiative: number;
  ac: number;
  maxHp: number;
  currentHp: number;
  isPlayer: boolean;
  attackBonus: number;
  damage: string; // e.g. "1d8+3"
  damageType: string;
  saveDC?: number;
  spellSlots?: number;
  concentration?: string | null;
  reactions: number; // 0 or 1
  conditions: string[];
  deathSaves?: { success: number; fail: number };
}

interface ResolvedAction {
  id: string;
  round: number;
  turnOrder: number;
  actor: string;
  type: string;
  target?: string;
  attackRoll?: number;
  attackBonus?: number;
  attackTotal?: number;
  targetAC?: number;
  isHit?: boolean;
  isCritical?: boolean;
  isFumble?: boolean;
  damageRoll?: string;
  damageTotal?: number;
  damageType?: string;
  hpBefore?: number;
  hpAfter?: number;
  saveType?: string;
  saveDC?: number;
  saveRoll?: number;
  saveResult?: boolean;
  concentrationCheck?: boolean;
  concentrationLost?: boolean;
  reactionUsed?: string;
  description: string;
}

const ACTION_TYPES = [
  { value: 'ATTACK', label: 'Attack', icon: Swords, color: 'text-red-400' },
  { value: 'SPELL', label: 'Spell', icon: Sparkles, color: 'text-purple-400' },
  { value: 'ABILITY', label: 'Ability', icon: Zap, color: 'text-yellow-400' },
  { value: 'HEAL', label: 'Heal', icon: Heart, color: 'text-green-400' },
  { value: 'SAVE', label: 'Save', icon: Shield, color: 'text-blue-400' },
  { value: 'DEATH_SAVE', label: 'Death Save', icon: Skull, color: 'text-gray-400' },
  { value: 'MOVEMENT', label: 'Movement', icon: ArrowRight, color: 'text-cyan-400' },
  { value: 'REACTION', label: 'Reaction', icon: RefreshCw, color: 'text-orange-400' },
  { value: 'BONUS_ACTION', label: 'Bonus Action', icon: Zap, color: 'text-amber-400' },
] as const;

const CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious', 'Exhaustion'] as const;
const DAMAGE_TYPES = ['Slashing', 'Piercing', 'Bludgeoning', 'Fire', 'Cold', 'Lightning', 'Poison', 'Necrotic', 'Radiant', 'Psychic', 'Thunder', 'Force', 'Acid'] as const;

// ============================================================
// Dice helpers
// ============================================================
function rollDice(formula: string): { rolls: number[]; total: number } {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return { rolls: [0], total: 0 };
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const mod = match[3] ? parseInt(match[3]) : 0;
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) + mod };
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

// ============================================================
// Auto-resolve engine
// ============================================================
function autoResolveAttack(
  actor: CombatActor,
  target: CombatActor,
  round: number,
  turnOrder: number,
  advantage: 'normal' | 'advantage' | 'disadvantage' = 'normal',
): ResolvedAction {
  const roll1 = rollD20();
  const roll2 = rollD20();
  const attackRoll = advantage === 'advantage' ? Math.max(roll1, roll2) :
    advantage === 'disadvantage' ? Math.min(roll1, roll2) : roll1;
  const isCritical = attackRoll === 20;
  const isFumble = attackRoll === 1;
  const attackTotal = attackRoll + actor.attackBonus;
  const isHit = isCritical || (!isFumble && attackTotal >= target.ac);

  let damageTotal = 0;
  let damageDesc = '';
  if (isHit) {
    const dmg = rollDice(actor.damage);
    damageTotal = isCritical ? dmg.total + rollDice(actor.damage).total - (parseInt(actor.damage.match(/[+-]\d+$/)?.[0] || '0')) : dmg.total;
    damageDesc = isCritical ? `💥 CRITICAL! ${damageTotal} ${actor.damageType} damage` : `${damageTotal} ${actor.damageType} damage`;
  }

  const hpBefore = target.currentHp;
  const hpAfter = Math.max(0, hpBefore - damageTotal);

  const description = isHit
    ? `${actor.name} attacks ${target.name} — ${attackRoll}${advantage !== 'normal' ? ` (${advantage})` : ''} + ${actor.attackBonus} = ${attackTotal} vs AC ${target.ac} → HIT! ${damageDesc}. ${target.name}: ${hpBefore} → ${hpAfter} HP${hpAfter === 0 ? ' ☠️' : ''}`
    : `${actor.name} attacks ${target.name} — ${attackRoll} + ${actor.attackBonus} = ${attackTotal} vs AC ${target.ac} → MISS${isFumble ? ' (Natural 1!)' : ''}`;

  return {
    id: crypto.randomUUID(),
    round, turnOrder,
    actor: actor.name,
    type: 'ATTACK',
    target: target.name,
    attackRoll, attackBonus: actor.attackBonus, attackTotal,
    targetAC: target.ac,
    isHit, isCritical, isFumble,
    damageRoll: actor.damage,
    damageTotal: isHit ? damageTotal : 0,
    damageType: actor.damageType,
    hpBefore, hpAfter,
    description,
  };
}

function autoResolveDeathSave(actor: CombatActor, round: number, turnOrder: number): ResolvedAction {
  const roll = rollD20();
  const isNat20 = roll === 20;
  const isNat1 = roll === 1;
  const success = roll >= 10;

  let desc = `${actor.name} makes a Death Save: ${roll}`;
  if (isNat20) desc += ' — NATURAL 20! Regains 1 HP and wakes up! 🎉';
  else if (isNat1) desc += ' — NATURAL 1! Two failures! 💀';
  else if (success) desc += ` — Success (${(actor.deathSaves?.success || 0) + 1}/3)`;
  else desc += ` — Failure (${(actor.deathSaves?.fail || 0) + (isNat1 ? 2 : 1)}/3)`;

  return {
    id: crypto.randomUUID(),
    round, turnOrder,
    actor: actor.name,
    type: 'DEATH_SAVE',
    saveRoll: roll,
    saveResult: success,
    description: desc,
  };
}

function autoResolveConcentration(actor: CombatActor, damageTaken: number, round: number, turnOrder: number): ResolvedAction {
  const dc = Math.max(10, Math.floor(damageTaken / 2));
  const conMod = 2; // Simplified — could be prop
  const roll = rollD20();
  const total = roll + conMod;
  const pass = total >= dc;

  return {
    id: crypto.randomUUID(),
    round, turnOrder,
    actor: actor.name,
    type: 'SAVE',
    saveType: 'CON',
    saveDC: dc,
    saveRoll: roll,
    saveResult: pass,
    concentrationCheck: true,
    concentrationLost: !pass,
    description: `${actor.name} Concentration check (DC ${dc}): ${roll} + ${conMod} = ${total} → ${pass ? '✅ Maintained!' : '❌ Lost concentration on ' + (actor.concentration || 'spell')}`,
  };
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function CombatAutopilotPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const { t } = useTranslation();
  const replayRef = useRef<HTMLDivElement>(null);

  // Tab: simulator | replay
  const [tab, setTab] = useState<'simulator' | 'replay'>('simulator');

  // ── Simulator state ──
  const [actors, setActors] = useState<CombatActor[]>([
    // Pre-populated demo actors
    { id: '1', name: 'Aelindra (Wizard)', initiative: 18, ac: 14, maxHp: 32, currentHp: 32, isPlayer: true, attackBonus: 7, damage: '4d10+0', damageType: 'Fire', saveDC: 15, concentration: 'Haste', reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } },
    { id: '2', name: 'Thorin (Fighter)', initiative: 15, ac: 20, maxHp: 58, currentHp: 58, isPlayer: true, attackBonus: 8, damage: '1d8+5', damageType: 'Slashing', reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } },
    { id: '3', name: 'Shadow (Rogue)', initiative: 20, ac: 16, maxHp: 38, currentHp: 38, isPlayer: true, attackBonus: 8, damage: '1d6+4', damageType: 'Piercing', reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } },
    { id: '4', name: 'Goblin Boss', initiative: 12, ac: 17, maxHp: 21, currentHp: 21, isPlayer: false, attackBonus: 4, damage: '1d6+2', damageType: 'Slashing', reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } },
    { id: '5', name: 'Goblin A', initiative: 10, ac: 15, maxHp: 7, currentHp: 7, isPlayer: false, attackBonus: 4, damage: '1d6+2', damageType: 'Slashing', reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } },
    { id: '6', name: 'Goblin B', initiative: 8, ac: 15, maxHp: 7, currentHp: 7, isPlayer: false, attackBonus: 4, damage: '1d6+2', damageType: 'Slashing', reactions: 1, conditions: [], deathSaves: { success: 0, fail: 0 } },
  ]);
  const [actionLog, setActionLog] = useState<ResolvedAction[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(800); // ms between actions
  const [showAddActor, setShowAddActor] = useState(false);
  const [autopilotMode, setAutopilotMode] = useState<'full' | 'monsters-only' | 'manual'>('monsters-only');
  const [selectedAction, setSelectedAction] = useState<string>('ATTACK');
  const [selectedTarget, setSelectedTarget] = useState<string>('');

  // ── Replay state ──
  const [replaySessions, setReplaySessions] = useState<any[]>([]);
  const [replayActions, setReplayActions] = useState<ResolvedAction[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);

  // Sorted by initiative
  const sortedActors = useMemo(
    () => [...actors].sort((a, b) => b.initiative - a.initiative),
    [actors]
  );

  const aliveActors = useMemo(
    () => sortedActors.filter(a => a.currentHp > 0),
    [sortedActors]
  );

  const currentActor = sortedActors[currentTurn % sortedActors.length];
  const combatOver = aliveActors.every(a => a.isPlayer) || aliveActors.every(a => !a.isPlayer);

  // ── Execute one turn ──
  const executeTurn = useCallback(() => {
    if (combatOver || !currentActor) return;

    const actor = currentActor;

    // If actor is dead — death save or skip
    if (actor.currentHp <= 0) {
      if (actor.isPlayer && actor.deathSaves) {
        const result = autoResolveDeathSave(actor, currentRound, currentTurn);
        setActionLog(prev => [...prev, result]);

        // Update death saves
        setActors(prev => prev.map(a => {
          if (a.id !== actor.id || !a.deathSaves) return a;
          const newDS = { ...a.deathSaves };
          if (result.saveRoll === 20) {
            return { ...a, currentHp: 1, deathSaves: { success: 0, fail: 0 }, conditions: a.conditions.filter(c => c !== 'Unconscious') };
          }
          if (result.saveResult) newDS.success += 1;
          else newDS.fail += result.saveRoll === 1 ? 2 : 1;
          return { ...a, deathSaves: newDS };
        }));
      }
      // Advance turn
      advanceTurn();
      return;
    }

    // Pick target — enemies attack players, players attack enemies
    const targets = aliveActors.filter(a => a.isPlayer !== actor.isPlayer);
    if (targets.length === 0) return; // Combat over

    const target = targets[Math.floor(Math.random() * targets.length)];
    const result = autoResolveAttack(actor, target, currentRound, currentTurn);
    setActionLog(prev => [...prev, result]);

    // Apply damage
    if (result.isHit && result.damageTotal) {
      setActors(prev => prev.map(a => {
        if (a.id !== target.id) return a;
        const newHp = Math.max(0, a.currentHp - (result.damageTotal || 0));
        const newConditions = newHp === 0 ? [...a.conditions, 'Unconscious'] : a.conditions;
        return { ...a, currentHp: newHp, conditions: newConditions };
      }));

      // Concentration check
      if (target.concentration && result.damageTotal > 0) {
        const conResult = autoResolveConcentration(target, result.damageTotal, currentRound, currentTurn);
        setActionLog(prev => [...prev, conResult]);
        if (conResult.concentrationLost) {
          setActors(prev => prev.map(a => a.id === target.id ? { ...a, concentration: null } : a));
        }
      }
    }

    advanceTurn();
  }, [currentActor, currentRound, currentTurn, combatOver, aliveActors, actors]);

  const advanceTurn = useCallback(() => {
    setCurrentTurn(prev => {
      const next = prev + 1;
      if (next >= sortedActors.length) {
        setCurrentRound(r => r + 1);
        // Reset reactions
        setActors(prevActors => prevActors.map(a => ({ ...a, reactions: 1 })));
        return 0;
      }
      return next;
    });
  }, [sortedActors.length]);

  // ── Auto-run ──
  useEffect(() => {
    if (!isRunning || combatOver) return;
    const actor = sortedActors[currentTurn % sortedActors.length];
    if (!actor) return;

    // In monsters-only mode, pause when it's a living player's turn
    if (autopilotMode === 'monsters-only' && actor.isPlayer && actor.currentHp > 0) {
      setIsRunning(false);
      return;
    }

    const timer = setTimeout(executeTurn, speed);
    return () => clearTimeout(timer);
  }, [isRunning, currentTurn, speed, combatOver, executeTurn, autopilotMode, sortedActors]);

  // ── Manual action (for player turns) ──
  const executeManualAction = useCallback(() => {
    if (!currentActor || currentActor.currentHp <= 0) return;
    const target = actors.find(a => a.id === selectedTarget);
    if (!target) {
      toast.error('Pilih target terlebih dahulu');
      return;
    }
    const result = autoResolveAttack(currentActor, target, currentRound, currentTurn);
    setActionLog(prev => [...prev, result]);

    if (result.isHit && result.damageTotal) {
      setActors(prev => prev.map(a => {
        if (a.id !== target.id) return a;
        const newHp = Math.max(0, a.currentHp - (result.damageTotal || 0));
        return { ...a, currentHp: newHp, conditions: newHp === 0 ? [...a.conditions, 'Unconscious'] : a.conditions };
      }));

      if (target.concentration && result.damageTotal > 0) {
        const conResult = autoResolveConcentration(target, result.damageTotal, currentRound, currentTurn);
        setActionLog(prev => [...prev, conResult]);
        if (conResult.concentrationLost) {
          setActors(prev => prev.map(a => a.id === target.id ? { ...a, concentration: null } : a));
        }
      }
    }
    advanceTurn();
  }, [currentActor, selectedTarget, actors, currentRound, currentTurn, advanceTurn, toast]);

  // ── Reset combat ──
  const resetCombat = useCallback(() => {
    setActors(prev => prev.map(a => ({
      ...a,
      currentHp: a.maxHp,
      conditions: [],
      reactions: 1,
      deathSaves: { success: 0, fail: 0 },
      concentration: a.id === '1' ? 'Haste' : null,
    })));
    setActionLog([]);
    setCurrentRound(1);
    setCurrentTurn(0);
    setIsRunning(false);
  }, []);

  // ── Add custom actor ──
  const [newActor, setNewActor] = useState({
    name: '', ac: 15, hp: 20, initiative: 10, isPlayer: false,
    attackBonus: 4, damage: '1d8+2', damageType: 'Slashing',
  });

  const addActor = () => {
    if (!newActor.name.trim()) return;
    setActors(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newActor.name,
      initiative: newActor.initiative,
      ac: newActor.ac,
      maxHp: newActor.hp,
      currentHp: newActor.hp,
      isPlayer: newActor.isPlayer,
      attackBonus: newActor.attackBonus,
      damage: newActor.damage,
      damageType: newActor.damageType,
      reactions: 1,
      conditions: [],
      deathSaves: { success: 0, fail: 0 },
    }]);
    setShowAddActor(false);
    setNewActor({ name: '', ac: 15, hp: 20, initiative: 10, isPlayer: false, attackBonus: 4, damage: '1d8+2', damageType: 'Slashing' });
    toast.success(`${newActor.name} ditambahkan ke combat!`);
  };

  // ── Replay from API ──
  const loadSessions = useCallback(async () => {
    try {
      const camps = await api.getCampaigns();
      if (camps.length > 0) {
        const sessions = await api.getSessions(camps[0].id);
        setReplaySessions(sessions);
      }
    } catch {}
  }, []);

  useEffect(() => { if (tab === 'replay') loadSessions(); }, [tab, loadSessions]);

  const loadReplay = useCallback(async (sessionId: string) => {
    try {
      const actions = await api.getCombatActions(sessionId);
      setReplayActions(actions.map((a: any) => ({
        ...a,
        description: a.description || `${a.actorName} → ${a.targetName || '?'}`,
        actor: a.actorName,
        target: a.targetName,
      })));
      setReplayIndex(0);
      toast.success('Combat replay loaded!');
    } catch {
      toast.info('Belum ada combat log untuk sesi ini');
    }
  }, [toast]);

  // ── Replay auto-play ──
  useEffect(() => {
    if (!isReplaying || replayIndex >= replayActions.length) {
      setIsReplaying(false);
      return;
    }
    const timer = setTimeout(() => setReplayIndex(i => i + 1), speed);
    return () => clearTimeout(timer);
  }, [isReplaying, replayIndex, replayActions.length, speed]);

  // ── Stats ──
  const stats = useMemo(() => {
    const hits = actionLog.filter(a => a.type === 'ATTACK' && a.isHit).length;
    const attacks = actionLog.filter(a => a.type === 'ATTACK').length;
    const crits = actionLog.filter(a => a.isCritical).length;
    const totalDmg = actionLog.reduce((s, a) => s + (a.damageTotal || 0), 0);
    return { hits, attacks, crits, totalDmg, hitRate: attacks > 0 ? Math.round((hits / attacks) * 100) : 0 };
  }, [actionLog]);

  return (
    <div className="min-h-screen bg-surface-0 pb-24 pt-12 md:pt-0">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 md:mt-8">
        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium mb-3 border border-red-500/15">
            <Swords className="w-3.5 h-3.5" />
            Combat Autopilot
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary mb-2">
            Smart Combat Autopilot ⚔️
          </h1>
          <p className="text-text-secondary text-sm max-w-2xl">
            Auto-resolve serangan, concentration check, death save, & reactions. Jalankan combat penuh secara otomatis
            atau biarkan monster autopilot sementara player memilih aksi manual.
          </p>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'simulator' as const, label: '⚔️ Combat Simulator', icon: Swords },
            { key: 'replay' as const, label: '📼 Combat Replay', icon: History },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                tab === t.key ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-surface-2 text-text-secondary hover:bg-surface-3 border border-border'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'simulator' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ── Left: Initiative & Controls ── */}
            <div className="xl:col-span-1 space-y-4">
              {/* Mode selector */}
              <Card className="p-4">
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-accent" /> Autopilot Mode
                </h3>
                <div className="space-y-2">
                  {[
                    { value: 'full' as const, label: 'Full Auto', desc: 'Semua aksi dijalankan otomatis' },
                    { value: 'monsters-only' as const, label: 'Monsters Only', desc: 'Monster otomatis, player manual' },
                    { value: 'manual' as const, label: 'Manual', desc: 'Semua aksi manual, step-by-step' },
                  ].map(m => (
                    <button
                      key={m.value}
                      onClick={() => setAutopilotMode(m.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all cursor-pointer ${
                        autopilotMode === m.value
                          ? 'bg-accent/10 text-accent border border-accent/20'
                          : 'bg-surface-3 text-text-secondary hover:bg-surface-2 border border-transparent'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${autopilotMode === m.value ? 'bg-accent' : 'bg-surface-1'}`} />
                      <div>
                        <span className="font-medium text-text-primary block">{m.label}</span>
                        <span className="text-[10px] text-text-muted">{m.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Speed control */}
              <Card className="p-4">
                <h3 className="text-xs font-bold text-text-muted mb-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Kecepatan
                </h3>
                <div className="flex items-center gap-2">
                  {[
                    { ms: 1500, label: '0.5×' },
                    { ms: 800, label: '1×' },
                    { ms: 400, label: '2×' },
                    { ms: 150, label: '5×' },
                  ].map(s => (
                    <button
                      key={s.ms}
                      onClick={() => setSpeed(s.ms)}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                        speed === s.ms ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-text-muted hover:bg-surface-2'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Initiative tracker */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-amber-400" />
                    Initiative — Round {currentRound}
                  </h3>
                  <button onClick={() => setShowAddActor(true)} className="text-accent text-xs hover:underline cursor-pointer flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tambah
                  </button>
                </div>

                <div className="space-y-1.5">
                  {sortedActors.map((actor, i) => {
                    const isActive = i === currentTurn % sortedActors.length;
                    const isDead = actor.currentHp <= 0;
                    const hpPerc = (actor.currentHp / actor.maxHp) * 100;
                    return (
                      <motion.div
                        key={actor.id}
                        layout
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          isActive ? 'bg-accent/10 border-accent/30 shadow-[0_0_10px_rgba(124,58,237,0.15)]' :
                          isDead ? 'bg-surface-3/30 border-border/30 opacity-50' :
                          'bg-surface-2 border-border hover:bg-surface-3'
                        }`}
                      >
                        {/* Initiative badge */}
                        <span className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          actor.isPlayer ? 'bg-blue-500/15 text-blue-400' : 'bg-red-500/15 text-red-400'
                        }`}>
                          {actor.initiative}
                        </span>
                        {/* Name & status */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isActive && <span className="text-accent animate-pulse text-xs">▶</span>}
                            <span className={`text-xs font-medium truncate ${isDead ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                              {actor.name}
                            </span>
                            {actor.concentration && <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />}
                          </div>
                          {/* HP bar */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex-1 h-1.5 bg-surface-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  hpPerc > 50 ? 'bg-green-500' : hpPerc > 25 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${hpPerc}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-text-muted shrink-0">{actor.currentHp}/{actor.maxHp}</span>
                          </div>
                          {/* Conditions */}
                          {actor.conditions.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {actor.conditions.map(c => (
                                <span key={c} className="text-[8px] px-1 py-0.5 bg-amber-500/10 text-amber-400 rounded">{c}</span>
                              ))}
                            </div>
                          )}
                          {/* Death saves */}
                          {isDead && actor.isPlayer && actor.deathSaves && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[8px] text-text-muted">Saves:</span>
                              {[0, 1, 2].map(i => (
                                <span key={`s${i}`} className={`w-2 h-2 rounded-full ${i < (actor.deathSaves?.success || 0) ? 'bg-green-500' : 'bg-surface-1 border border-border'}`} />
                              ))}
                              <span className="text-[8px] text-text-muted mx-0.5">|</span>
                              {[0, 1, 2].map(i => (
                                <span key={`f${i}`} className={`w-2 h-2 rounded-full ${i < (actor.deathSaves?.fail || 0) ? 'bg-red-500' : 'bg-surface-1 border border-border'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        {/* AC badge */}
                        <span className="text-[10px] text-text-muted flex items-center gap-0.5 shrink-0">
                          <Shield className="w-3 h-3" /> {actor.ac}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>

              {/* Stats */}
              <Card className="p-4">
                <h3 className="text-xs font-bold text-text-muted mb-2 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> Statistik Combat
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-3/60 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-accent">{stats.hitRate}%</div>
                    <div className="text-[9px] text-text-muted">Hit Rate</div>
                  </div>
                  <div className="bg-surface-3/60 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-red-400">{stats.totalDmg}</div>
                    <div className="text-[9px] text-text-muted">Total Damage</div>
                  </div>
                  <div className="bg-surface-3/60 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-amber-400">{stats.crits}</div>
                    <div className="text-[9px] text-text-muted">Critical Hits</div>
                  </div>
                  <div className="bg-surface-3/60 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-text-primary">{actionLog.length}</div>
                    <div className="text-[9px] text-text-muted">Total Actions</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Right: Action Log & Controls ── */}
            <div className="xl:col-span-2 space-y-4">
              {/* Control bar */}
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {combatOver ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success font-medium text-sm border border-success/20">
                      <Trophy className="w-4 h-4" />
                      Combat selesai! {aliveActors.every(a => a.isPlayer) ? 'Pemain menang! 🎉' : 'Monster menang! 💀'}
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`flex items-center gap-2 ${isRunning ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-accent/10 text-accent border-accent/20'}`}
                      >
                        {isRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> {autopilotMode === 'full' ? 'Run Full Auto' : 'Run'}</>}
                      </Button>
                      <Button onClick={executeTurn} className="bg-surface-2 text-text-primary border-border">
                        <SkipForward className="w-4 h-4" /> Next Turn
                      </Button>
                    </>
                  )}
                  <Button onClick={resetCombat} className="bg-surface-2 text-text-secondary border-border ml-auto">
                    <RotateCcw className="w-4 h-4" /> Reset
                  </Button>
                </div>

                {/* Manual action for player turn */}
                {!isRunning && currentActor && currentActor.isPlayer && currentActor.currentHp > 0 && autopilotMode !== 'full' && !combatOver && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    <h4 className="text-xs font-bold text-accent mb-2 flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5" /> Giliran {currentActor.name} — Pilih Aksi
                    </h4>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-[10px] text-text-muted block mb-1">Target</label>
                        <select
                          value={selectedTarget}
                          onChange={e => setSelectedTarget(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-border text-sm text-text-primary"
                        >
                          <option value="">Pilih target...</option>
                          {aliveActors.filter(a => a.id !== currentActor.id).map(a => (
                            <option key={a.id} value={a.id}>{a.name} (HP {a.currentHp}/{a.maxHp}, AC {a.ac})</option>
                          ))}
                        </select>
                      </div>
                      <Button onClick={executeManualAction} className="bg-red-500/10 text-red-400 border-red-500/20">
                        <Swords className="w-4 h-4" /> Attack!
                      </Button>
                    </div>
                  </motion.div>
                )}
              </Card>

              {/* Action log */}
              <Card className="p-4 max-h-[600px] overflow-y-auto">
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2 sticky top-0 bg-surface-1 py-2 z-10">
                  <Activity className="w-4 h-4 text-red-400" /> Combat Log
                  <span className="text-[10px] text-text-muted ml-auto">Round {currentRound}</span>
                </h3>
                {actionLog.length === 0 ? (
                  <div className="text-center py-12 text-text-muted text-sm">
                    <Swords className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Tekan Play atau Next Turn untuk mulai combat
                  </div>
                ) : (
                  <div className="space-y-2">
                    {actionLog.map((action, i) => (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${
                          action.isCritical ? 'bg-amber-500/10 border-amber-500/20' :
                          action.isFumble ? 'bg-red-500/10 border-red-500/20' :
                          action.concentrationLost ? 'bg-purple-500/10 border-purple-500/20' :
                          action.type === 'DEATH_SAVE' ? 'bg-gray-500/10 border-gray-500/20' :
                          action.isHit ? 'bg-green-500/5 border-green-500/15' :
                          'bg-surface-2 border-border'
                        }`}
                      >
                        <span className="text-[10px] text-text-muted shrink-0 w-5 text-right mt-0.5">
                          {action.round}.{action.turnOrder}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-text-secondary leading-relaxed">{action.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {tab === 'replay' && (
          <div className="space-y-6">
            {/* Session picker */}
            <Card className="p-4">
              <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-accent" /> Pilih Sesi untuk Replay
              </h3>
              {replaySessions.length === 0 ? (
                <p className="text-sm text-text-muted">Tidak ada sesi yang tersedia. Buat campaign dan mulai sesi game terlebih dahulu.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {replaySessions.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => loadReplay(s.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-2 border border-border hover:border-accent/20 transition-all cursor-pointer text-left"
                    >
                      <Play className="w-4 h-4 text-accent shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-text-primary">{s.title || `Sesi ${s.sessionNumber}`}</p>
                        <p className="text-[10px] text-text-muted">{new Date(s.date || s.createdAt).toLocaleDateString('id-ID')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Replay player */}
            {replayActions.length > 0 && (
              <Card className="p-4">
                <div ref={replayRef}></div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Play className="w-4 h-4 text-green-400" /> Combat Replay
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setIsReplaying(!isReplaying)}
                      className={`text-xs ${isReplaying ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-accent/10 text-accent border-accent/20'}`}
                    >
                      {isReplaying ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Play</>}
                    </Button>
                    <Button onClick={() => setReplayIndex(0)} className="text-xs bg-surface-2 text-text-secondary border-border">
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                    <span>Action {Math.min(replayIndex + 1, replayActions.length)} / {replayActions.length}</span>
                    <span>{Math.round(((replayIndex + 1) / replayActions.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent to-success rounded-full"
                      animate={{ width: `${((replayIndex + 1) / replayActions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {replayActions.slice(0, replayIndex + 1).map((action, i) => (
                    <motion.div
                      key={action.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`px-3 py-2 rounded-lg border text-xs ${
                        i === replayIndex ? 'bg-accent/10 border-accent/20' : 'bg-surface-2 border-border'
                      }`}
                    >
                      <span className="text-[10px] text-text-muted mr-2">R{action.round}.{action.turnOrder}</span>
                      <span className="text-text-secondary">{action.description}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* ── Add Actor Modal ── */}
      <AnimatePresence>
        {showAddActor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowAddActor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-surface-1 rounded-xl border border-border p-6"
            >
              <h3 className="text-base font-bold text-text-primary mb-4">Tambah Combatant</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-muted block mb-1">Nama</label>
                  <Input value={newActor.name} onChange={e => setNewActor(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Orc Warchief" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Initiative</label>
                    <Input type="number" value={newActor.initiative} onChange={e => setNewActor(p => ({ ...p, initiative: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">AC</label>
                    <Input type="number" value={newActor.ac} onChange={e => setNewActor(p => ({ ...p, ac: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">HP</label>
                    <Input type="number" value={newActor.hp} onChange={e => setNewActor(p => ({ ...p, hp: +e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Attack +</label>
                    <Input type="number" value={newActor.attackBonus} onChange={e => setNewActor(p => ({ ...p, attackBonus: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Damage</label>
                    <Input value={newActor.damage} onChange={e => setNewActor(p => ({ ...p, damage: e.target.value }))} placeholder="1d8+3" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Type</label>
                    <select
                      value={newActor.damageType}
                      onChange={e => setNewActor(p => ({ ...p, damageType: e.target.value }))}
                      className="w-full px-2 py-2 rounded-lg bg-surface-3 border border-border text-xs text-text-primary"
                    >
                      {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newActor.isPlayer}
                      onChange={e => setNewActor(p => ({ ...p, isPlayer: e.target.checked }))}
                      className="accent-accent"
                    />
                    <span className="text-text-secondary">Player Character</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <Button onClick={() => setShowAddActor(false)} className="bg-surface-2 text-text-secondary border-border">Batal</Button>
                <Button onClick={addActor} className="bg-accent/10 text-accent border-accent/20">Tambahkan</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
