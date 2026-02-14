'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, ChevronDown, Clock, Zap, Eye, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SPELLS, SPELL_SCHOOL_COLORS, SPELL_LEVELS, type Spell, type SpellSchool } from '@/lib/data/spells';

const CLASSES = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];

export default function SpellsPage() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [schoolFilter, setSchoolFilter] = useState<SpellSchool | ''>('');
  const [classFilter, setClassFilter] = useState('');
  const [concentrationOnly, setConcentrationOnly] = useState(false);
  const [ritualOnly, setRitualOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return SPELLS.filter(s => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (levelFilter !== null && s.level !== levelFilter) return false;
      if (schoolFilter && s.school !== schoolFilter) return false;
      if (classFilter && !s.classes.includes(classFilter)) return false;
      if (concentrationOnly && !s.concentration) return false;
      if (ritualOnly && !s.ritual) return false;
      return true;
    });
  }, [search, levelFilter, schoolFilter, classFilter, concentrationOnly, ritualOnly]);

  const groupedByLevel = useMemo(() => {
    const groups: Record<number, Spell[]> = {};
    filtered.forEach(s => {
      if (!groups[s.level]) groups[s.level] = [];
      groups[s.level].push(s);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/compendium" className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </Link>
        <Sparkles className="w-6 h-6 text-purple-400" />
        <h1 className="text-2xl font-display font-bold text-text-primary">Spell Reference</h1>
        <span className="text-sm text-text-tertiary ml-auto">{filtered.length} spells</span>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input type="text" placeholder="Search spells..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={levelFilter ?? ''} onChange={e => setLevelFilter(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">All Levels</option>
            {SPELL_LEVELS.map((l, i) => <option key={i} value={l.level}>{l.label}</option>)}
          </select>
          <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value as SpellSchool | '')}>
            <option value="">All Schools</option>
            {Object.keys(SPELL_SCHOOL_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setConcentrationOnly(!concentrationOnly)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors cursor-pointer ${concentrationOnly ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'}`}>
            <Eye className="w-3.5 h-3.5 inline mr-1" />Concentration
          </button>
          <button onClick={() => setRitualOnly(!ritualOnly)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors cursor-pointer ${ritualOnly ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'}`}>
            <BookOpen className="w-3.5 h-3.5 inline mr-1" />Ritual
          </button>
          {(levelFilter !== null || schoolFilter || classFilter || concentrationOnly || ritualOnly) && (
            <button onClick={() => { setLevelFilter(null); setSchoolFilter(''); setClassFilter(''); setConcentrationOnly(false); setRitualOnly(false); }}
              className="px-3 py-1.5 text-sm text-accent hover:underline cursor-pointer">Clear All</button>
          )}
        </div>
      </div>

      {/* Spell List */}
      {Object.keys(groupedByLevel).sort((a, b) => Number(a) - Number(b)).map(lvl => (
        <div key={lvl}>
          <h2 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2 sticky top-0 bg-surface-0 py-1 z-10">
            {SPELL_LEVELS[Number(lvl)]?.label || `Level ${lvl}`}
          </h2>
          <div className="space-y-1">
            {groupedByLevel[Number(lvl)].map(spell => (
              <motion.div key={spell.name} layout>
                <button
                  onClick={() => setExpanded(expanded === spell.name ? null : spell.name)}
                  className="w-full text-left p-3 bg-surface-1 border border-border rounded-lg hover:border-accent-dim transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SPELL_SCHOOL_COLORS[spell.school] }} />
                    <span className="font-medium text-text-primary flex-1">{spell.name}</span>
                    <span className="text-xs text-text-tertiary">{spell.school}</span>
                    {spell.concentration && <span title="Concentration"><Eye className="w-3.5 h-3.5 text-warning" /></span>}
                    {spell.ritual && <span title="Ritual"><BookOpen className="w-3.5 h-3.5 text-info" /></span>}
                    <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${expanded === spell.name ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {expanded === spell.name && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 bg-surface-2 border border-t-0 border-border rounded-b-lg space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-text-tertiary block text-xs">Casting Time</span>
                            <span className="text-text-primary flex items-center gap-1"><Clock className="w-3 h-3" />{spell.castingTime}</span>
                          </div>
                          <div>
                            <span className="text-text-tertiary block text-xs">Range</span>
                            <span className="text-text-primary">{spell.range}</span>
                          </div>
                          <div>
                            <span className="text-text-tertiary block text-xs">Components</span>
                            <span className="text-text-primary">{spell.components}</span>
                          </div>
                          <div>
                            <span className="text-text-tertiary block text-xs">Duration</span>
                            <span className="text-text-primary flex items-center gap-1">
                              {spell.concentration && <Eye className="w-3 h-3 text-warning" />}
                              {spell.duration}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">{spell.description}</p>
                        {spell.higherLevels && (
                          <div className="text-sm">
                            <span className="text-accent font-medium">At Higher Levels: </span>
                            <span className="text-text-secondary">{spell.higherLevels}</span>
                          </div>
                        )}
                        {spell.damage && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-danger/10 border border-danger/20 rounded text-xs text-danger">
                            <Zap className="w-3 h-3" /> {spell.damage}
                            {spell.saveType && <span className="text-text-tertiary">({spell.saveType} save)</span>}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {spell.classes.map(c => (
                            <span key={c} className="px-2 py-0.5 text-xs bg-surface-1 border border-border rounded-full text-text-tertiary">{c}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-tertiary">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No spells match your filters</p>
        </div>
      )}
    </div>
  );
}
