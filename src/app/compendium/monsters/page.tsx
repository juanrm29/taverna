'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Search, ChevronDown, Heart, Shield, Swords, ArrowLeft, Flame } from 'lucide-react';
import Link from 'next/link';
import { MONSTERS, CREATURE_TYPES, CREATURE_SIZES, type CreatureType, type CreatureSize } from '@/lib/data/monsters';

function getAbilityMod(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function MonstersPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CreatureType | ''>('');
  const [sizeFilter, setSizeFilter] = useState<CreatureSize | ''>('');
  const [crFilter, setCrFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const crOptions = useMemo(() => {
    const crs = [...new Set(MONSTERS.map(m => m.cr))];
    return crs.sort((a, b) => {
      const toNum = (v: string) => v.includes('/') ? Number(v.split('/')[0]) / Number(v.split('/')[1]) : Number(v);
      return toNum(a) - toNum(b);
    });
  }, []);

  const filtered = useMemo(() => {
    return MONSTERS.filter(m => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && m.type !== typeFilter) return false;
      if (sizeFilter && m.size !== sizeFilter) return false;
      if (crFilter && m.cr !== crFilter) return false;
      return true;
    }).sort((a, b) => {
      const toNum = (v: string) => v.includes('/') ? Number(v.split('/')[0]) / Number(v.split('/')[1]) : Number(v);
      return toNum(a.cr) - toNum(b.cr);
    });
  }, [search, typeFilter, sizeFilter, crFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/compendium" className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </Link>
        <Skull className="w-6 h-6 text-red-400" />
        <h1 className="text-2xl font-display font-bold text-text-primary">Monster Bestiary</h1>
        <span className="text-sm text-text-tertiary ml-auto">{filtered.length} creatures</span>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input type="text" placeholder="Search monsters..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as CreatureType | '')}>
            <option value="">All Types</option>
            {CREATURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value as CreatureSize | '')}>
            <option value="">All Sizes</option>
            {CREATURE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={crFilter} onChange={e => setCrFilter(e.target.value)}>
            <option value="">All CR</option>
            {crOptions.map(cr => <option key={cr} value={cr}>CR {cr}</option>)}
          </select>
          {(typeFilter || sizeFilter || crFilter) && (
            <button onClick={() => { setTypeFilter(''); setSizeFilter(''); setCrFilter(''); }}
              className="px-3 py-1.5 text-sm text-accent hover:underline cursor-pointer">Clear</button>
          )}
        </div>
      </div>

      {/* Monster List */}
      <div className="space-y-2">
        {filtered.map(monster => (
          <motion.div key={monster.name} layout>
            <button
              onClick={() => setExpanded(expanded === monster.name ? null : monster.name)}
              className="w-full text-left p-3 bg-surface-1 border border-border rounded-lg hover:border-accent-dim transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 text-red-400 font-bold text-sm flex-shrink-0">
                  {monster.cr}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-text-primary">{monster.name}</span>
                  <span className="text-xs text-text-tertiary ml-2">{monster.size} {monster.type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{monster.ac}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{monster.hp}</span>
                  <span>{monster.xp.toLocaleString()} XP</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${expanded === monster.name ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {expanded === monster.name && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 bg-surface-2 border border-t-0 border-border rounded-b-lg space-y-4">
                    <div className="text-xs text-text-tertiary italic">{monster.size} {monster.type}, {monster.alignment}</div>
                    {monster.description && <p className="text-sm text-text-secondary italic">{monster.description}</p>}

                    {/* AC / HP / Speed */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 bg-surface-1 rounded-lg text-center">
                        <div className="text-xs text-text-tertiary">Armor Class</div>
                        <div className="text-lg font-bold text-text-primary">{monster.ac}</div>
                        {monster.acType && <div className="text-xs text-text-tertiary">{monster.acType}</div>}
                      </div>
                      <div className="p-2 bg-surface-1 rounded-lg text-center">
                        <div className="text-xs text-text-tertiary">Hit Points</div>
                        <div className="text-lg font-bold text-text-primary">{monster.hp}</div>
                        <div className="text-xs text-text-tertiary">{monster.hpFormula}</div>
                      </div>
                      <div className="p-2 bg-surface-1 rounded-lg text-center">
                        <div className="text-xs text-text-tertiary">Speed</div>
                        <div className="text-sm font-medium text-text-primary">{monster.speed}</div>
                      </div>
                    </div>

                    {/* Ability Scores */}
                    <div className="grid grid-cols-6 gap-2">
                      {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(ab => (
                        <div key={ab} className="p-2 bg-surface-1 rounded-lg text-center">
                          <div className="text-xs text-text-tertiary uppercase font-medium">{ab}</div>
                          <div className="text-base font-bold text-text-primary">{monster[ab]}</div>
                          <div className="text-xs text-text-secondary">{getAbilityMod(monster[ab])}</div>
                        </div>
                      ))}
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-1 text-sm">
                      {monster.savingThrows && <div><span className="text-text-tertiary">Saving Throws</span> <span className="text-text-secondary">{monster.savingThrows}</span></div>}
                      {monster.skills && <div><span className="text-text-tertiary">Skills</span> <span className="text-text-secondary">{monster.skills}</span></div>}
                      {monster.damageResistances && <div><span className="text-text-tertiary">Damage Resistances</span> <span className="text-text-secondary">{monster.damageResistances}</span></div>}
                      {monster.damageImmunities && <div><span className="text-text-tertiary">Damage Immunities</span> <span className="text-text-secondary">{monster.damageImmunities}</span></div>}
                      {monster.conditionImmunities && <div><span className="text-text-tertiary">Condition Immunities</span> <span className="text-text-secondary">{monster.conditionImmunities}</span></div>}
                      <div><span className="text-text-tertiary">Senses</span> <span className="text-text-secondary">{monster.senses}</span></div>
                      <div><span className="text-text-tertiary">Languages</span> <span className="text-text-secondary">{monster.languages}</span></div>
                    </div>

                    {/* Traits */}
                    {monster.traits && monster.traits.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase">Traits</h4>
                        {monster.traits.map(t => (
                          <div key={t.name} className="text-sm">
                            <span className="font-semibold text-text-primary italic">{t.name}. </span>
                            <span className="text-text-secondary">{t.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-danger tracking-wider uppercase flex items-center gap-1.5">
                        <Swords className="w-3.5 h-3.5" /> Actions
                      </h4>
                      {monster.actions.map(a => (
                        <div key={a.name} className="text-sm">
                          <span className="font-semibold text-text-primary italic">{a.name}. </span>
                          <span className="text-text-secondary">{a.description}</span>
                        </div>
                      ))}
                    </div>

                    {/* Legendary Actions */}
                    {monster.legendaryActions && monster.legendaryActions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-accent tracking-wider uppercase flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" /> Legendary Actions
                        </h4>
                        <p className="text-xs text-text-tertiary">
                          The creature can take 3 legendary actions. Only one at a time and only at the end of another creature&apos;s turn.
                        </p>
                        {monster.legendaryActions.map(a => (
                          <div key={a.name} className="text-sm">
                            <span className="font-semibold text-text-primary italic">{a.name}. </span>
                            <span className="text-text-secondary">{a.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Environment */}
                    {monster.environment && monster.environment.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs text-text-tertiary">Found in:</span>
                        {monster.environment.map(e => (
                          <span key={e} className="px-2 py-0.5 text-xs bg-surface-1 border border-border rounded-full text-text-tertiary capitalize">{e}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-tertiary">
          <Skull className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No monsters match your filters</p>
        </div>
      )}
    </div>
  );
}
