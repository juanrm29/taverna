'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Badge } from '@/components/ui';
import { BookOpen, Dices, Shield, Heart, Swords, Zap, Eye, Target, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ALL_CONDITIONS, CONDITION_EFFECTS, ALL_SKILLS,
  CR_XP_TABLE, XP_THRESHOLDS,
} from '@/lib/types';
import CombatRoller from '@/components/CombatRoller';

// Quick reference data
const ACTIONS_IN_COMBAT = [
  { name: 'Attack', desc: 'Make a melee or ranged attack.' },
  { name: 'Cast a Spell', desc: 'Cast a spell with a casting time of 1 action.' },
  { name: 'Dash', desc: 'Gain extra movement equal to your speed.' },
  { name: 'Disengage', desc: 'Your movement does not provoke opportunity attacks.' },
  { name: 'Dodge', desc: 'Attacks against you have disadvantage; DEX saves have advantage.' },
  { name: 'Help', desc: 'Give an ally advantage on their next check or attack.' },
  { name: 'Hide', desc: 'Make a Stealth check to hide.' },
  { name: 'Ready', desc: 'Prepare an action to trigger on a specific condition.' },
  { name: 'Search', desc: 'Make a Perception or Investigation check.' },
  { name: 'Use an Object', desc: 'Interact with a second object or use a complex item.' },
  { name: 'Grapple', desc: 'Athletics vs Athletics/Acrobatics. Target is grappled.' },
  { name: 'Shove', desc: 'Athletics vs Athletics/Acrobatics. Prone or push 5ft.' },
];

const COVER_RULES = [
  { type: 'Half Cover', ac: '+2 AC, +2 DEX saves', desc: 'Low wall, furniture, creatures' },
  { type: 'Three-Quarters', ac: '+5 AC, +5 DEX saves', desc: 'Arrow slit, thick tree' },
  { type: 'Total Cover', ac: 'Cannot be targeted', desc: 'Completely concealed' },
];

const TRAVEL_PACE = [
  { pace: 'Fast', mph: '4', mpd: '30 mi', effect: '-5 passive Perception' },
  { pace: 'Normal', mph: '3', mpd: '24 mi', effect: '—' },
  { pace: 'Slow', mph: '2', mpd: '18 mi', effect: 'Can use Stealth' },
];

const LIGHT_RULES = [
  { level: 'Bright Light', desc: 'Normal vision. Most characters can see fine.' },
  { level: 'Dim Light', desc: 'Lightly obscured. Disadvantage on Perception (sight).' },
  { level: 'Darkness', desc: 'Heavily obscured. Effectively blind.' },
];

const DC_TABLE = [
  { difficulty: 'Very Easy', dc: 5 },
  { difficulty: 'Easy', dc: 10 },
  { difficulty: 'Medium', dc: 15 },
  { difficulty: 'Hard', dc: 20 },
  { difficulty: 'Very Hard', dc: 25 },
  { difficulty: 'Nearly Impossible', dc: 30 },
];

const EXHAUSTION = [
  { level: 1, effect: 'Disadvantage on ability checks' },
  { level: 2, effect: 'Speed halved' },
  { level: 3, effect: 'Disadvantage on attack rolls and saving throws' },
  { level: 4, effect: 'Hit point maximum halved' },
  { level: 5, effect: 'Speed reduced to 0' },
  { level: 6, effect: 'Death' },
];

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="!p-0 overflow-hidden rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon} {title}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border">{children}</div>}
    </Card>
  );
}

export default function DMScreenPage() {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">DM Screen</h1>
      <p className="text-text-secondary text-sm mb-6">Quick reference for 5e rules, conditions, and tables.</p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Combat Roller */}
        <Section title="Combat Roller" icon={<Dices className="w-4 h-4 text-accent" />}>
          <div className="mt-3">
            <CombatRoller compact />
          </div>
        </Section>

        {/* Conditions */}
        <Section title="Conditions" icon={<Zap className="w-4 h-4 text-warning" />}>
          <div className="space-y-2 mt-3">
            {ALL_CONDITIONS.map(c => (
              <div key={c} className="flex items-start gap-2">
                <Badge variant="warning">{c}</Badge>
                <span className="text-xs text-text-secondary">{CONDITION_EFFECTS[c]}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Actions in Combat */}
        <Section title="Actions in Combat" icon={<Swords className="w-4 h-4 text-accent" />}>
          <div className="space-y-1.5 mt-3">
            {ACTIONS_IN_COMBAT.map(a => (
              <div key={a.name} className="flex items-start gap-2 text-sm">
                <span className="font-medium text-accent shrink-0 w-24">{a.name}</span>
                <span className="text-text-secondary text-xs">{a.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* DC Table */}
        <Section title="Difficulty Classes" icon={<Target className="w-4 h-4 text-danger" />}>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-xs text-text-tertiary border-b border-border">
                <th className="pb-1">Difficulty</th>
                <th className="pb-1 text-right">DC</th>
              </tr>
            </thead>
            <tbody>
              {DC_TABLE.map(row => (
                <tr key={row.dc} className="border-b border-border/50">
                  <td className="py-1 text-text-secondary">{row.difficulty}</td>
                  <td className="py-1 text-right font-bold text-accent">{row.dc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Cover */}
        <Section title="Cover Rules" icon={<Shield className="w-4 h-4 text-success" />}>
          <div className="space-y-2 mt-3">
            {COVER_RULES.map(c => (
              <div key={c.type} className="bg-surface-2 rounded-md p-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.type}</span>
                  <Badge variant="accent">{c.ac}</Badge>
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">{c.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Exhaustion */}
        <Section title="Exhaustion Levels" icon={<Heart className="w-4 h-4 text-danger" />} defaultOpen={false}>
          <div className="space-y-1 mt-3">
            {EXHAUSTION.map(e => (
              <div key={e.level} className="flex items-center gap-2 text-sm">
                <Badge variant={e.level >= 5 ? 'danger' : e.level >= 3 ? 'warning' : 'default'}>Lv {e.level}</Badge>
                <span className="text-text-secondary text-xs">{e.effect}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Travel Pace */}
        <Section title="Travel Pace" icon={<Eye className="w-4 h-4 text-info" />} defaultOpen={false}>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-xs text-text-tertiary border-b border-border">
                <th className="pb-1">Pace</th>
                <th className="pb-1">Per Hour</th>
                <th className="pb-1">Per Day</th>
                <th className="pb-1">Effect</th>
              </tr>
            </thead>
            <tbody>
              {TRAVEL_PACE.map(t => (
                <tr key={t.pace} className="border-b border-border/50">
                  <td className="py-1 font-medium">{t.pace}</td>
                  <td className="py-1 text-text-secondary">{t.mph}</td>
                  <td className="py-1 text-text-secondary">{t.mpd}</td>
                  <td className="py-1 text-xs text-text-tertiary">{t.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Light Rules */}
        <Section title="Light & Vision" icon={<Zap className="w-4 h-4 text-warning" />} defaultOpen={false}>
          <div className="space-y-2 mt-3">
            {LIGHT_RULES.map(l => (
              <div key={l.level} className="bg-surface-2 rounded-md p-2">
                <span className="text-sm font-medium">{l.level}</span>
                <p className="text-xs text-text-tertiary">{l.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Skills Reference */}
        <Section title="Skills Reference" icon={<BookOpen className="w-4 h-4 text-accent" />} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-1 mt-3">
            {ALL_SKILLS.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-text-secondary">{s.name}</span>
                <Badge>{s.ability.slice(0, 3).toUpperCase()}</Badge>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
