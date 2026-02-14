'use client';

import { useState, useEffect } from 'react';
import { ScrollText, ArrowLeft, Shield, Swords, Moon, Eye, Target, Zap, Heart, Skull, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { CONDITIONS, COMBAT_ACTIONS, REST_RULES, COVER_RULES, DC_TABLE, XP_TABLE, ENCOUNTER_DIFFICULTY } from '@/lib/data/conditions';

const SECTIONS = [
  { id: 'conditions', label: 'Conditions', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'combat', label: 'Combat Actions', icon: <Swords className="w-3.5 h-3.5" /> },
  { id: 'rest', label: 'Resting', icon: <Moon className="w-3.5 h-3.5" /> },
  { id: 'cover', label: 'Cover', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'dc', label: 'Difficulty Class', icon: <Target className="w-3.5 h-3.5" /> },
  { id: 'xp', label: 'XP & Levels', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'encounter', label: 'Encounter Difficulty', icon: <Skull className="w-3.5 h-3.5" /> },
  { id: 'ability', label: 'Ability Checks', icon: <Eye className="w-3.5 h-3.5" /> },
  { id: 'damage', label: 'Damage Types', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'death', label: 'Death & Dying', icon: <Heart className="w-3.5 h-3.5" /> },
];

const DAMAGE_TYPES = [
  { name: 'Acid', description: 'Corrosive spray or dissolving enzymes.' },
  { name: 'Bludgeoning', description: 'Blunt force — hammers, falling, constriction.' },
  { name: 'Cold', description: 'Infernal chill of ice and arctic wind.' },
  { name: 'Fire', description: 'Red dragons and fireballs alike.' },
  { name: 'Force', description: 'Pure magical energy — magic missile, spiritual weapon.' },
  { name: 'Lightning', description: 'A bolt of electricity arcs through the target.' },
  { name: 'Necrotic', description: 'Withering energy that decays living matter.' },
  { name: 'Piercing', description: 'Puncturing and impaling — arrows, fangs, spears.' },
  { name: 'Poison', description: 'Venomous stings and toxic gas.' },
  { name: 'Psychic', description: 'Mental assault that shatters the mind.' },
  { name: 'Radiant', description: 'Holy light searing the undead and fiends.' },
  { name: 'Slashing', description: 'Swords, axes, claws — cutting damage.' },
  { name: 'Thunder', description: 'Concussive burst of sound — shatter, thunderwave.' },
];

export default function RulesPage() {
  const [active, setActive] = useState('conditions');

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && SECTIONS.some(s => s.id === hash)) setActive(hash);
  }, []);

  const scrollTo = (id: string) => {
    setActive(id);
    window.location.hash = id;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar Nav */}
      <nav className="hidden md:block w-48 flex-shrink-0 sticky top-4 self-start space-y-0.5">
        <Link href="/compendium" className="flex items-center gap-2 p-2 hover:bg-surface-2 rounded-lg transition-colors text-sm text-text-secondary mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
              active === s.id ? 'bg-accent/10 text-accent' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-1'
            }`}>
            {s.icon} {s.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-10">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/compendium" className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </Link>
          <ScrollText className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-display font-bold text-text-primary">Rules Reference</h1>
        </div>
        <div className="hidden md:flex items-center gap-3 mb-2">
          <ScrollText className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-display font-bold text-text-primary">Rules Quick Reference</h1>
        </div>

        {/* CONDITIONS */}
        <section id="conditions" className="space-y-3">
          <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" /> Conditions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CONDITIONS.map(c => (
              <div key={c.name} className="p-3 bg-surface-1 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-semibold text-sm text-text-primary">{c.name}</span>
                </div>
                <p className="text-xs text-text-secondary mb-2">{c.description}</p>
                <ul className="space-y-0.5">
                  {c.effects.map((e, i) => (
                    <li key={i} className="text-xs text-text-tertiary flex items-start gap-1.5">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-text-tertiary flex-shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
                {c.endCondition && (
                  <p className="text-xs text-success mt-1.5 italic">Ends: {c.endCondition}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* COMBAT ACTIONS */}
        <section id="combat" className="space-y-3">
          <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <Swords className="w-4 h-4 text-danger" /> Combat Actions
          </h2>
          <div className="space-y-2">
            {COMBAT_ACTIONS.map(a => (
              <div key={a.name} className="p-3 bg-surface-1 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-text-primary">{a.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-surface-2 text-text-tertiary">{a.type}</span>
                </div>
                <p className="text-sm text-text-secondary">{a.description}</p>
                {a.details && a.details.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {a.details.map((r, i) => (
                      <li key={i} className="text-xs text-text-tertiary flex items-start gap-1.5">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-text-tertiary flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* RESTING */}
        <section id="rest" className="space-y-3">
          <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <Moon className="w-4 h-4 text-info" /> Resting
          </h2>
          <div className="space-y-2">
            {REST_RULES.map(r => (
              <div key={r.name} className="p-4 bg-surface-1 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-text-primary">{r.name}</span>
                  <span className="text-xs text-text-tertiary">{r.duration}</span>
                </div>
                <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-1 mt-2">Benefits</h4>
                <ul className="space-y-0.5">
                  {r.benefits.map((b, i) => (
                    <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                      <span className="text-success">✓</span> {b}
                    </li>
                  ))}
                </ul>
                {r.notes && r.notes.length > 0 && (
                  <>
                    <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-1 mt-2">Notes</h4>
                    <ul className="space-y-0.5">
                      {r.notes.map((x, i) => (
                        <li key={i} className="text-xs text-text-tertiary flex items-start gap-1.5">
                          <span className="text-info">•</span> {x}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* COVER */}
        <section id="cover" className="space-y-3">
          <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <Shield className="w-4 h-4 text-warning" /> Cover
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Type</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">AC Bonus</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Dex Save Bonus</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Description</th>
                </tr>
              </thead>
              <tbody>
                {COVER_RULES.map(c => (
                  <tr key={c.name} className="border-b border-border/50">
                    <td className="py-2 px-3 font-medium text-text-primary">{c.name}</td>
                    <td className="py-2 px-3 text-accent font-medium">{c.acBonus}</td>
                    <td className="py-2 px-3 text-accent font-medium">{c.dexSaveBonus}</td>
                    <td className="py-2 px-3 text-text-secondary">{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* DIFFICULTY CLASS */}
        <section id="dc" className="space-y-3">
          <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" /> Difficulty Class Reference
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {DC_TABLE.map(d => (
              <div key={d.dc} className="p-3 bg-surface-1 border border-border rounded-lg text-center">
                <div className="text-2xl font-bold text-accent">{d.dc}</div>
                <div className="text-xs text-text-tertiary">{d.difficulty}</div>
              </div>
            ))}
          </div>
        </section>

        {/* XP & LEVELS */}
        <section id="xp" className="space-y-3">
          <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-success" /> XP & Level Progression
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Level</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">XP Required</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Proficiency Bonus</th>
                </tr>
              </thead>
              <tbody>
                {XP_TABLE.map(row => (
                  <tr key={row.level} className="border-b border-border/50">
                    <td className="py-1.5 px-3 font-medium text-text-primary">{row.level}</td>
                    <td className="py-1.5 px-3 text-text-secondary">{row.xp.toLocaleString()}</td>
                    <td className="py-1.5 px-3 text-accent">+{row.proficiency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ENCOUNTER DIFFICULTY */}
        <section id="encounter" className="space-y-3">
          <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <Skull className="w-4 h-4 text-danger" /> Encounter Difficulty (XP Thresholds per Character)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Level</th>
                  <th className="text-left py-2 px-3 text-xs text-success font-medium uppercase">Easy</th>
                  <th className="text-left py-2 px-3 text-xs text-warning font-medium uppercase">Medium</th>
                  <th className="text-left py-2 px-3 text-xs text-danger font-medium uppercase">Hard</th>
                  <th className="text-left py-2 px-3 text-xs text-red-400 font-medium uppercase">Deadly</th>
                </tr>
              </thead>
              <tbody>
                {ENCOUNTER_DIFFICULTY.map(row => (
                  <tr key={row.level} className="border-b border-border/50">
                    <td className="py-1.5 px-3 font-medium text-text-primary">{row.level}</td>
                    <td className="py-1.5 px-3 text-success">{row.easy}</td>
                    <td className="py-1.5 px-3 text-warning">{row.medium}</td>
                    <td className="py-1.5 px-3 text-danger">{row.hard}</td>
                    <td className="py-1.5 px-3 text-red-400">{row.deadly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ABILITY CHECKS */}
        <section id="ability" className="space-y-3">
          <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <Eye className="w-4 h-4 text-info" /> Ability Checks Quick Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { name: 'Strength', skills: 'Athletics', uses: 'Forcing doors, breaking bonds, lifting, pushing, grappling' },
              { name: 'Dexterity', skills: 'Acrobatics, Sleight of Hand, Stealth', uses: 'Dodging, balancing, hiding, pickpocketing, lockpicking' },
              { name: 'Constitution', skills: '(no associated skills)', uses: 'Forced marches, going without sleep, holding breath, resisting disease' },
              { name: 'Intelligence', skills: 'Arcana, History, Investigation, Nature, Religion', uses: 'Recalling lore, deductions, searching for clues, identifying spells' },
              { name: 'Wisdom', skills: 'Animal Handling, Insight, Medicine, Perception, Survival', uses: 'Spotting things, reading body language, stabilizing dying, tracking' },
              { name: 'Charisma', skills: 'Deception, Intimidation, Performance, Persuasion', uses: 'Influencing, lying, entertaining, commanding presence, disguising intent' },
            ].map(ab => (
              <div key={ab.name} className="p-3 bg-surface-1 border border-border rounded-lg">
                <span className="font-semibold text-sm text-text-primary">{ab.name}</span>
                <p className="text-xs text-accent mt-0.5">{ab.skills}</p>
                <p className="text-xs text-text-tertiary mt-1">{ab.uses}</p>
              </div>
            ))}
          </div>
          <div className="p-3 bg-surface-1 border border-border rounded-lg space-y-1">
            <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase">Advantage & Disadvantage</h4>
            <p className="text-sm text-text-secondary">
              <span className="text-success font-medium">Advantage:</span> Roll 2d20, take the higher result.
            </p>
            <p className="text-sm text-text-secondary">
              <span className="text-danger font-medium">Disadvantage:</span> Roll 2d20, take the lower result.
            </p>
            <p className="text-xs text-text-tertiary mt-1">If you have both, they cancel out regardless of the number of each.</p>
          </div>
        </section>

        {/* DAMAGE TYPES */}
        <section id="damage" className="space-y-3">
          <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" /> Damage Types
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {DAMAGE_TYPES.map(d => (
              <div key={d.name} className="flex items-center gap-3 p-2.5 bg-surface-1 border border-border rounded-lg">
                <span className="text-xs font-semibold text-text-primary w-20">{d.name}</span>
                <span className="text-xs text-text-tertiary">{d.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* DEATH & DYING */}
        <section id="death" className="space-y-3">
          <h2 className="text-lg font-display font-bold text-text-primary flex items-center gap-2">
            <Heart className="w-4 h-4 text-danger" /> Death & Dying
          </h2>
          <div className="space-y-2">
            {[
              { title: 'Dropping to 0 HP', text: 'You fall unconscious and begin making death saving throws at the start of each of your turns.' },
              { title: 'Death Saving Throws', text: 'Roll a d20 — 10 or higher is a success, 9 or lower is a failure. Three successes: you stabilize at 0 HP. Three failures: you die.' },
              { title: 'Rolling a 1', text: 'Counts as two failures.' },
              { title: 'Rolling a 20', text: 'You regain 1 HP and regain consciousness.' },
              { title: 'Taking Damage at 0 HP', text: 'Each hit is an automatic death saving throw failure. Critical hits cause two failures.' },
              { title: 'Instant Death', text: 'If remaining damage after reaching 0 HP equals or exceeds your max HP, you die instantly.' },
              { title: 'Stabilizing', text: 'A stabilized creature regains 1 HP after 1d4 hours. A DC 10 Medicine check can also stabilize.' },
            ].map(rule => (
              <div key={rule.title} className="p-3 bg-surface-1 border border-border rounded-lg">
                <span className="font-semibold text-sm text-text-primary">{rule.title}</span>
                <p className="text-sm text-text-secondary mt-0.5">{rule.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
