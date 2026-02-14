'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Shield, Heart, Zap, Target, Crosshair,
  ChevronDown, Sparkles, Skull, X
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import * as api from '@/lib/api-client';
import { useToast } from '@/components/Feedback';
import { triggerCinematic } from '@/components/CinematicCombat';

// ============================================================
// Combat Roller — One-click Attack → Hit Check → Damage → Narrate
// Replaces the tedious Roll20 workflow of manual attack + damage
// ============================================================

interface CombatRollerProps {
  onDamageResult?: (amount: number, targetName: string) => void;
  onHealResult?: (amount: number, targetName: string) => void;
  className?: string;
  compact?: boolean;
}

interface AttackPreset {
  name: string;
  attackBonus: number;
  damageDice: string;
  damageType: string;
  critDice?: string;
}

const COMMON_ATTACKS: AttackPreset[] = [
  { name: 'Longsword', attackBonus: 5, damageDice: '1d8+3', damageType: 'Slashing', critDice: '2d8+3' },
  { name: 'Greatsword', attackBonus: 5, damageDice: '2d6+3', damageType: 'Slashing', critDice: '4d6+3' },
  { name: 'Shortbow', attackBonus: 5, damageDice: '1d6+3', damageType: 'Piercing', critDice: '2d6+3' },
  { name: 'Dagger', attackBonus: 5, damageDice: '1d4+3', damageType: 'Piercing', critDice: '2d4+3' },
  { name: 'Fire Bolt', attackBonus: 5, damageDice: '1d10', damageType: 'Fire', critDice: '2d10' },
  { name: 'Eldritch Blast', attackBonus: 5, damageDice: '1d10+3', damageType: 'Force', critDice: '2d10+3' },
];

const SAVE_SPELLS = [
  { name: 'Fireball', save: 'DEX', dc: 15, damageDice: '8d6', damageType: 'Fire', halfOnSave: true },
  { name: 'Lightning Bolt', save: 'DEX', dc: 15, damageDice: '8d6', damageType: 'Lightning', halfOnSave: true },
  { name: 'Hold Person', save: 'WIS', dc: 15, damageDice: '', damageType: '', halfOnSave: false },
  { name: 'Sacred Flame', save: 'DEX', dc: 14, damageDice: '1d8', damageType: 'Radiant', halfOnSave: false },
  { name: 'Poison Spray', save: 'CON', dc: 14, damageDice: '1d12', damageType: 'Poison', halfOnSave: false },
];

type RollerMode = 'attack' | 'save' | 'custom' | 'heal';

interface CombatResult {
  mode: RollerMode;
  attackRoll?: number;
  attackTotal?: number;
  isCrit?: boolean;
  isFumble?: boolean;
  isAdvantage?: boolean;
  isDisadvantage?: boolean;
  advantageRolls?: [number, number];
  hit?: boolean | 'unknown';
  targetAC?: number;
  damageRolls?: number[];
  damageTotal?: number;
  damageType?: string;
  weaponName?: string;
  saveType?: string;
  saveDC?: number;
  saveRoll?: number;
  saveTotal?: number;
  saveSuccess?: boolean;
  healAmount?: number;
}

export default function CombatRoller({ onDamageResult, onHealResult, className = '', compact = false }: CombatRollerProps) {
  const toast = useToast();
  const [mode, setMode] = useState<RollerMode>('attack');
  const [result, setResult] = useState<CombatResult | null>(null);

  // Attack state
  const [attackBonus, setAttackBonus] = useState(5);
  const [targetAC, setTargetAC] = useState(15);
  const [damageDice, setDamageDice] = useState('1d8+3');
  const [critDice, setCritDice] = useState('2d8+3');
  const [damageType, setDamageType] = useState('Slashing');
  const [advantage, setAdvantage] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [weaponName, setWeaponName] = useState('Longsword');

  // Save state
  const [saveDC, setSaveDC] = useState(15);
  const [saveBonus, setSaveBonus] = useState(3);
  const [saveDamage, setSaveDamage] = useState('8d6');
  const [saveType, setSaveType] = useState('DEX');
  const [halfOnSave, setHalfOnSave] = useState(true);

  // Heal state
  const [healDice, setHealDice] = useState('2d8+3');

  // ---- Execute attack roll ----
  const rollAttack = useCallback(() => {
    let attackRoll: number;
    let isAdv = false, isDis = false;
    let advRolls: [number, number] | undefined;

    if (advantage === 'advantage') {
      const r = api.rollAdvantage(0);
      attackRoll = r.kept;
      advRolls = [r.roll1, r.roll2];
      isAdv = true;
    } else if (advantage === 'disadvantage') {
      const r = api.rollDisadvantage(0);
      attackRoll = r.kept;
      advRolls = [r.roll1, r.roll2];
      isDis = true;
    } else {
      attackRoll = Math.floor(Math.random() * 20) + 1;
    }

    const isCrit = attackRoll === 20;
    const isFumble = attackRoll === 1;
    const attackTotal = attackRoll + attackBonus;
    const hit = isFumble ? false : isCrit ? true : attackTotal >= targetAC;

    // Damage roll (auto if hit)
    let damageTotal = 0;
    let damageRolls: number[] = [];
    if (hit) {
      const formula = isCrit ? critDice : damageDice;
      const dmgResult = api.rollDiceLocal(formula);
      damageRolls = dmgResult.rolls;
      damageTotal = dmgResult.total;
    }

    const res: CombatResult = {
      mode: 'attack',
      attackRoll, attackTotal, isCrit, isFumble,
      isAdvantage: isAdv, isDisadvantage: isDis,
      advantageRolls: advRolls,
      hit, targetAC,
      damageRolls, damageTotal, damageType,
      weaponName,
    };
    setResult(res);

    // Trigger cinematic narration
    if (isCrit) {
      triggerCinematic('crit', { attacker: 'You', target: 'Enemy', weapon: weaponName, damage: damageTotal });
    } else if (isFumble || !hit) {
      triggerCinematic('miss', { attacker: 'You', target: 'Enemy' });
    } else {
      triggerCinematic('attack', { attacker: 'You', target: 'Enemy', weapon: weaponName });
    }

    // Dispatch for DiceOverlay
    window.dispatchEvent(new CustomEvent('taverna:dice-roll', {
      detail: {
        formula: hit ? `${weaponName}: ${attackRoll}+${attackBonus}=${attackTotal} → ${isCrit ? critDice : damageDice}` : `${weaponName}: ${attackRoll}+${attackBonus}=${attackTotal} MISS`,
        rolls: hit ? damageRolls : [attackRoll],
        total: hit ? damageTotal : attackTotal,
        modifier: hit ? 0 : attackBonus,
        source: 'combat-roller',
      }
    }));
  }, [attackBonus, targetAC, damageDice, critDice, damageType, advantage, weaponName]);

  // ---- Execute saving throw ----
  const rollSave = useCallback(() => {
    const saveRoll = Math.floor(Math.random() * 20) + 1;
    const saveTotal = saveRoll + saveBonus;
    const saveSuccess = saveTotal >= saveDC;

    let damageTotal = 0;
    let damageRolls: number[] = [];
    if (saveDamage) {
      const dmgResult = api.rollDiceLocal(saveDamage);
      damageRolls = dmgResult.rolls;
      damageTotal = dmgResult.total;
      if (saveSuccess && halfOnSave) damageTotal = Math.floor(damageTotal / 2);
      if (saveSuccess && !halfOnSave) damageTotal = 0;
    }

    setResult({
      mode: 'save', saveType, saveDC, saveRoll, saveTotal, saveSuccess,
      damageRolls, damageTotal, damageType,
    });
  }, [saveBonus, saveDC, saveDamage, saveType, halfOnSave, damageType]);

  // ---- Execute heal ----
  const rollHeal = useCallback(() => {
    const healResult = api.rollDiceLocal(healDice);
    setResult({
      mode: 'heal', healAmount: healResult.total,
      damageRolls: healResult.rolls, damageTotal: healResult.total,
    });

    // Trigger cinematic heal
    triggerCinematic('heal', { target: 'Ally', amount: healResult.total });
  }, [healDice]);

  // ---- Load preset ----
  const loadAttackPreset = (preset: AttackPreset) => {
    setWeaponName(preset.name);
    setAttackBonus(preset.attackBonus);
    setDamageDice(preset.damageDice);
    setDamageType(preset.damageType);
    setCritDice(preset.critDice || preset.damageDice);
  };

  const loadSavePreset = (preset: typeof SAVE_SPELLS[0]) => {
    setSaveType(preset.save);
    setSaveDC(preset.dc);
    setSaveDamage(preset.damageDice);
    setDamageType(preset.damageType);
    setHalfOnSave(preset.halfOnSave);
  };

  return (
    <div className={className}>
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <Crosshair className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold">Combat Roller</h2>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-1 mb-4 bg-surface-1 rounded-lg p-1">
        {([
          { key: 'attack' as RollerMode, icon: <Swords className="w-3 h-3" />, label: 'Attack' },
          { key: 'save' as RollerMode, icon: <Shield className="w-3 h-3" />, label: 'Save' },
          { key: 'heal' as RollerMode, icon: <Heart className="w-3 h-3" />, label: 'Heal' },
        ]).map(tab => (
          <button key={tab.key} onClick={() => { setMode(tab.key); setResult(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
              mode === tab.key ? 'bg-accent/15 text-accent shadow-sm' : 'text-text-tertiary hover:text-text-secondary'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ATTACK MODE */}
      {mode === 'attack' && (
        <div className="space-y-3">
          {/* Presets */}
          <div>
            <span className="text-[10px] text-text-tertiary uppercase font-semibold block mb-1.5">Quick Presets</span>
            <div className="flex flex-wrap gap-1">
              {COMMON_ATTACKS.map(p => (
                <button key={p.name} onClick={() => loadAttackPreset(p)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    weaponName === p.name ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
                  }`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input label="Attack Bonus" type="number" value={attackBonus} onChange={e => setAttackBonus(parseInt(e.target.value) || 0)} />
            <Input label="Target AC" type="number" value={targetAC} onChange={e => setTargetAC(parseInt(e.target.value) || 10)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Damage Dice" value={damageDice} onChange={e => setDamageDice(e.target.value)} placeholder="1d8+3" />
            <Input label="Crit Dice" value={critDice} onChange={e => setCritDice(e.target.value)} placeholder="2d8+3" />
          </div>
          <Input label="Damage Type" value={damageType} onChange={e => setDamageType(e.target.value)} />

          {/* Advantage selector */}
          <div className="flex gap-1">
            {(['normal', 'advantage', 'disadvantage'] as const).map(a => (
              <button key={a} onClick={() => setAdvantage(a)}
                className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium cursor-pointer transition-all ${
                  advantage === a
                    ? a === 'advantage' ? 'bg-success/15 text-success' : a === 'disadvantage' ? 'bg-danger/15 text-danger' : 'bg-accent/15 text-accent'
                    : 'bg-surface-2 text-text-tertiary'
                }`}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>

          <Button onClick={rollAttack} className="w-full">
            <Swords className="w-4 h-4" /> Roll Attack!
          </Button>
        </div>
      )}

      {/* SAVE MODE */}
      {mode === 'save' && (
        <div className="space-y-3">
          <div>
            <span className="text-[10px] text-text-tertiary uppercase font-semibold block mb-1.5">Spell Presets</span>
            <div className="flex flex-wrap gap-1">
              {SAVE_SPELLS.map(p => (
                <button key={p.name} onClick={() => loadSavePreset(p)}
                  className="px-2 py-1 rounded text-[10px] font-medium bg-surface-2 text-text-tertiary hover:text-text-secondary cursor-pointer transition-colors">
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input label="Save Type" value={saveType} onChange={e => setSaveType(e.target.value)} />
            <Input label="DC" type="number" value={saveDC} onChange={e => setSaveDC(parseInt(e.target.value) || 10)} />
            <Input label="Save Bonus" type="number" value={saveBonus} onChange={e => setSaveBonus(parseInt(e.target.value) || 0)} />
          </div>
          <Input label="Damage Dice" value={saveDamage} onChange={e => setSaveDamage(e.target.value)} placeholder="8d6" />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={halfOnSave} onChange={e => setHalfOnSave(e.target.checked)} className="accent-accent" />
            Half damage on save
          </label>
          <Button onClick={rollSave} className="w-full">
            <Shield className="w-4 h-4" /> Roll Save!
          </Button>
        </div>
      )}

      {/* HEAL MODE */}
      {mode === 'heal' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1 mb-2">
            {['1d8+3', '2d8+3', '1d4+3', '4d8+4', '70'].map(f => (
              <button key={f} onClick={() => setHealDice(f)}
                className={`px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-colors ${healDice === f ? 'bg-success/15 text-success' : 'bg-surface-2 text-text-tertiary'}`}>
                {f}
              </button>
            ))}
          </div>
          <Input label="Healing Formula" value={healDice} onChange={e => setHealDice(e.target.value)} placeholder="2d8+3" />
          <Button onClick={rollHeal} className="w-full">
            <Heart className="w-4 h-4" /> Roll Healing!
          </Button>
        </div>
      )}

      {/* RESULT DISPLAY */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4"
          >
            {result.mode === 'attack' && (
              <Card className={`!p-4 ${result.isCrit ? 'border-success/40 bg-success/5' : result.isFumble ? 'border-danger/40 bg-danger/5' : result.hit ? 'border-accent/30' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-tertiary uppercase">{result.weaponName} Attack</span>
                  {result.isCrit && <span className="text-success text-xs font-bold">⚡ CRITICAL HIT!</span>}
                  {result.isFumble && <span className="text-danger text-xs font-bold">💀 FUMBLE!</span>}
                </div>

                {/* Attack roll */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-center">
                    <div className={`text-2xl font-bold font-mono ${result.isCrit ? 'text-success' : result.isFumble ? 'text-danger' : 'text-accent'}`}>
                      {result.attackTotal}
                    </div>
                    <div className="text-[10px] text-text-tertiary">
                      {result.advantageRolls ? `(${result.advantageRolls[0]}, ${result.advantageRolls[1]})` : `(${result.attackRoll})`} +{attackBonus}
                    </div>
                  </div>
                  <div className="text-lg text-text-tertiary">vs</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono text-text-secondary">{result.targetAC}</div>
                    <div className="text-[10px] text-text-tertiary">AC</div>
                  </div>
                  <div className="ml-auto">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.hit ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                      {result.hit ? 'HIT!' : 'MISS'}
                    </span>
                  </div>
                </div>

                {/* Damage */}
                {result.hit && result.damageTotal !== undefined && result.damageTotal > 0 && (
                  <div className="bg-surface-2 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-text-tertiary">Damage: </span>
                      <span className="text-lg font-bold text-danger font-mono">{result.damageTotal}</span>
                      <span className="text-xs text-text-tertiary ml-1">{result.damageType}</span>
                      <span className="text-[10px] text-text-tertiary ml-2">[{result.damageRolls?.join(', ')}]</span>
                    </div>
                    {onDamageResult && (
                      <button onClick={() => onDamageResult(result.damageTotal!, result.weaponName || 'Attack')}
                        className="text-[10px] text-danger hover:text-danger/80 cursor-pointer font-medium">
                        Apply →
                      </button>
                    )}
                  </div>
                )}
              </Card>
            )}

            {result.mode === 'save' && (
              <Card className={`!p-4 ${result.saveSuccess ? 'border-success/30' : 'border-danger/30'}`}>
                <div className="text-xs font-semibold text-text-tertiary uppercase mb-2">{result.saveType} Saving Throw</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-center">
                    <div className={`text-2xl font-bold font-mono ${result.saveSuccess ? 'text-success' : 'text-danger'}`}>{result.saveTotal}</div>
                    <div className="text-[10px] text-text-tertiary">({result.saveRoll}) +{saveBonus}</div>
                  </div>
                  <div className="text-lg text-text-tertiary">vs DC</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono text-text-secondary">{result.saveDC}</div>
                  </div>
                  <div className="ml-auto">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.saveSuccess ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                      {result.saveSuccess ? 'SAVED' : 'FAILED'}
                    </span>
                  </div>
                </div>
                {result.damageTotal !== undefined && result.damageTotal > 0 && (
                  <div className="bg-surface-2 rounded-lg px-3 py-2">
                    <span className="text-xs text-text-tertiary">Damage: </span>
                    <span className="text-lg font-bold text-danger font-mono">{result.damageTotal}</span>
                    {result.saveSuccess && halfOnSave && <span className="text-[10px] text-success ml-2">(halved)</span>}
                    <span className="text-[10px] text-text-tertiary ml-2">[{result.damageRolls?.join(', ')}]</span>
                  </div>
                )}
              </Card>
            )}

            {result.mode === 'heal' && (
              <Card className="!p-4 border-success/30 bg-success/5">
                <div className="text-xs font-semibold text-text-tertiary uppercase mb-2">Healing</div>
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-success" />
                  <div>
                    <span className="text-2xl font-bold text-success font-mono">{result.healAmount}</span>
                    <span className="text-xs text-text-tertiary ml-2">HP restored</span>
                  </div>
                  <span className="text-[10px] text-text-tertiary ml-auto">[{result.damageRolls?.join(', ')}]</span>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
