'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, RotateCcw, Zap, Star, Moon, Sun } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import {
  Character, CharacterClass, KnownSpell,
  FULL_CASTER_SLOTS, HALF_CASTER_SLOTS, WARLOCK_SLOTS,
  FULL_CASTERS, HALF_CASTERS, PACT_CASTERS,
} from '@/lib/types';

// ============================================================
// Spell Slot Tracker — Manage spell slots, cast spells, track concentration
// Renders inline on the character detail page
// ============================================================

interface SpellSlotTrackerProps {
  character: Character;
  onUpdate: (updated: Character) => void;
  isOwner: boolean;
}

export default function SpellSlotTracker({ character, onUpdate, isOwner }: SpellSlotTrackerProps) {
  const toast = useToast();
  const spellSlots = character.spellSlots || [];
  const knownSpells = character.knownSpells || [];
  const concentratingOn = character.concentratingOn;
  const cls = character.class;

  // Calculate expected slots from tables
  const getExpectedSlots = () => {
    const lvl = character.level;
    if (FULL_CASTERS.includes(cls)) {
      const row = FULL_CASTER_SLOTS[lvl - 1];
      return row ? row.map((total, i) => ({ level: i + 1, total, used: 0 })).filter(s => s.total > 0) : [];
    }
    if (HALF_CASTERS.includes(cls)) {
      const row = HALF_CASTER_SLOTS[lvl - 1];
      return row ? row.map((total, i) => ({ level: i + 1, total, used: 0 })).filter(s => s.total > 0) : [];
    }
    if (PACT_CASTERS.includes(cls)) {
      const w = WARLOCK_SLOTS[Math.min(lvl - 1, 19)];
      return [{ level: w.level, total: w.slots, used: 0 }];
    }
    return [];
  };

  // Merge expected with stored
  const effectiveSlots = spellSlots.length > 0 ? spellSlots : getExpectedSlots();

  const useSlot = async (level: number) => {
    if (!isOwner) return;
    const newSlots = effectiveSlots.map(s =>
      s.level === level && s.used < s.total ? { ...s, used: s.used + 1 } : { ...s }
    );
    try {
      const updated = await api.updateCharacter(character.id, { spellSlots: newSlots });
      onUpdate(updated); toast.info(`Used level ${level} slot`);
    } catch { toast.error('Failed to update spell slots'); }
  };

  const restoreSlot = async (level: number) => {
    if (!isOwner) return;
    const newSlots = effectiveSlots.map(s =>
      s.level === level && s.used > 0 ? { ...s, used: s.used - 1 } : { ...s }
    );
    try {
      const updated = await api.updateCharacter(character.id, { spellSlots: newSlots });
      onUpdate(updated);
    } catch { toast.error('Failed to restore slot'); }
  };

  const longRest = async () => {
    if (!isOwner) return;
    const newSlots = effectiveSlots.map(s => ({ ...s, used: 0 }));
    try {
      const updated = await api.updateCharacter(character.id, {
        spellSlots: newSlots,
        concentratingOn: null,
        hp: { current: character.hp.max, max: character.hp.max, temp: 0 },
      });
      onUpdate(updated); toast.success('Long rest — all slots restored, HP full!');
    } catch { toast.error('Failed to perform long rest'); }
  };

  const shortRest = async () => {
    if (!isOwner) return;
    // Warlock pact slots restore on short rest
    if (PACT_CASTERS.includes(cls)) {
      const newSlots = effectiveSlots.map(s => ({ ...s, used: 0 }));
      try {
        const updated = await api.updateCharacter(character.id, { spellSlots: newSlots });
        onUpdate(updated); toast.success('Short rest — pact slots restored!');
      } catch { toast.error('Failed to restore pact slots'); return; }
    } else {
      // Hit dice healing
      const hitDiceRemaining = character.hitDiceRemaining ?? character.level;
      if (hitDiceRemaining > 0) {
        const hitDie = { Barbarian:12,Fighter:10,Paladin:10,Ranger:10,Bard:8,Cleric:8,Druid:8,Monk:8,Rogue:8,Warlock:8,Sorcerer:6,Wizard:6 }[cls];
        const roll = Math.floor(Math.random() * hitDie) + 1;
        const conMod = Math.floor((character.abilityScores.constitution - 10) / 2);
        const healed = Math.max(1, roll + conMod);
        const newHP = Math.min(character.hp.max, character.hp.current + healed);
        try {
          const updated = await api.updateCharacter(character.id, {
            hp: { ...character.hp, current: newHP },
            hitDiceRemaining: hitDiceRemaining - 1,
          });
          onUpdate(updated); toast.success(`Short rest — healed ${healed} HP (d${hitDie}+${conMod})`);
        } catch { toast.error('Failed to heal on short rest'); }
      } else {
        toast.warning('No hit dice remaining');
      }
    }
  };

  const castSpell = async (spell: KnownSpell) => {
    if (!isOwner) return;
    if (spell.level === 0) {
      toast.info(`Cast ${spell.name} (cantrip)`);
      return;
    }
    // Find available slot
    const slot = effectiveSlots.find(s => s.level >= spell.level && s.used < s.total);
    if (!slot) {
      toast.error(`No spell slots available for level ${spell.level}+`);
      return;
    }
    const newSlots = effectiveSlots.map(s =>
      s.level === slot.level ? { ...s, used: s.used + 1 } : { ...s }
    );

    const updates: Partial<Character> = { spellSlots: newSlots };

    // Concentration
    if (spell.concentration) {
      if (concentratingOn) {
        toast.warning(`Dropped concentration on ${concentratingOn}`);
      }
      updates.concentratingOn = spell.name;
    }

    try {
      const updated = await api.updateCharacter(character.id, updates);
      onUpdate(updated);
      toast.info(`Cast ${spell.name} (level ${slot.level} slot used)`);
      // Fire dice event for damage spells
      if (spell.damage) {
        const dmg = api.rollDiceLocal(spell.damage);
        window.dispatchEvent(new CustomEvent('taverna:dice-roll', {
          detail: { formula: `${spell.name}: ${spell.damage}`, rolls: dmg.rolls, total: dmg.total, modifier: dmg.modifier, source: 'spell' }
        }));
      }
    } catch { toast.error('Failed to cast spell'); }
  };

  const dropConcentration = async () => {
    if (!isOwner) return;
    try {
      const updated = await api.updateCharacter(character.id, { concentratingOn: null });
      onUpdate(updated); toast.info('Concentration dropped');
    } catch { toast.error('Failed to drop concentration'); }
  };

  const cantrips = knownSpells.filter(s => s.level === 0);
  const spellsByLevel: Record<number, KnownSpell[]> = {};
  knownSpells.filter(s => s.level > 0).forEach(s => {
    if (!spellsByLevel[s.level]) spellsByLevel[s.level] = [];
    spellsByLevel[s.level].push(s);
  });

  if (effectiveSlots.length === 0 && knownSpells.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5" /> Spell Slots & Spells
        </h3>
        {isOwner && (
          <div className="flex gap-1.5">
            <button onClick={shortRest} className="text-[10px] px-2 py-1 bg-surface-2 rounded-md text-text-tertiary hover:text-accent cursor-pointer flex items-center gap-1 transition-colors">
              <Moon className="w-3 h-3" /> Short Rest
            </button>
            <button onClick={longRest} className="text-[10px] px-2 py-1 bg-surface-2 rounded-md text-text-tertiary hover:text-accent cursor-pointer flex items-center gap-1 transition-colors">
              <Sun className="w-3 h-3" /> Long Rest
            </button>
          </div>
        )}
      </div>

      {/* Concentration */}
      {concentratingOn && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2 mb-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-warning animate-pulse" />
            <span className="text-xs text-warning font-medium">Concentrating on: {concentratingOn}</span>
          </div>
          {isOwner && (
            <button onClick={dropConcentration} className="text-[10px] text-warning hover:text-warning/80 cursor-pointer">Drop</button>
          )}
        </motion.div>
      )}

      {/* Spell Slot Circles */}
      <div className="space-y-2 mb-4">
        {effectiveSlots.map(slot => (
          <div key={slot.level} className="flex items-center gap-2">
            <span className="text-[10px] text-text-tertiary w-14 shrink-0">Level {slot.level}</span>
            <div className="flex gap-1">
              {Array.from({ length: slot.total }, (_, i) => {
                const isUsed = i < slot.used;
                return (
                  <button
                    key={i}
                    onClick={() => isUsed ? restoreSlot(slot.level) : useSlot(slot.level)}
                    disabled={!isOwner}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${isOwner ? 'cursor-pointer' : ''} ${
                      isUsed
                        ? 'bg-surface-3 border-surface-3'
                        : 'bg-accent/20 border-accent/40 hover:border-accent'
                    }`}
                    title={isUsed ? 'Click to restore' : 'Click to use'}
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-text-tertiary ml-auto">{slot.total - slot.used}/{slot.total}</span>
          </div>
        ))}
      </div>

      {/* Cantrips */}
      {cantrips.length > 0 && (
        <div className="mb-3">
          <span className="text-[10px] text-text-tertiary font-semibold uppercase block mb-1">Cantrips</span>
          <div className="flex flex-wrap gap-1">
            {cantrips.map(s => (
              <button
                key={s.id}
                onClick={() => isOwner && castSpell(s)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${isOwner ? 'cursor-pointer' : ''} bg-surface-2 text-text-secondary hover:text-accent hover:bg-accent/10`}
                title={s.description}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spells by level */}
      {Object.entries(spellsByLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, spells]) => {
        const lvl = Number(level);
        const slot = effectiveSlots.find(s => s.level === lvl);
        const hasSlots = slot ? slot.used < slot.total : false;

        return (
          <div key={level} className="mb-2">
            <span className="text-[10px] text-text-tertiary font-semibold uppercase block mb-1">Level {level}</span>
            <div className="space-y-0.5">
              {spells.map(s => (
                <button
                  key={s.id}
                  onClick={() => isOwner && castSpell(s)}
                  disabled={!isOwner || (!hasSlots && s.level > 0)}
                  className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${
                    isOwner && hasSlots
                      ? 'cursor-pointer hover:bg-accent/10 text-text-secondary'
                      : 'text-text-tertiary opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{s.name}</span>
                    {s.concentration && <Zap className="w-3 h-3 text-warning" />}
                    {s.ritual && <span className="text-[9px] text-accent">R</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s.damage && <span className="text-[9px] text-danger font-mono">{s.damage}</span>}
                    {s.prepared && <Star className="w-3 h-3 text-accent fill-accent" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </Card>
  );
}
