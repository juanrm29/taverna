'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowLeft, ChevronDown, Swords, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CLASSES, FULL_CASTER_SLOTS, HALF_CASTER_SLOTS, WARLOCK_SLOTS } from '@/lib/data/classes';

export default function ClassesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [featureLevel, setFeatureLevel] = useState<Record<string, number>>({});
  const [subclassTab, setSubclassTab] = useState<Record<string, string>>({});
  const [showSlots, setShowSlots] = useState<string | null>(null);

  const selectLevel = (cls: string, level: number) => setFeatureLevel(prev => ({ ...prev, [cls]: level }));
  const selectSubclass = (cls: string, sub: string) => setSubclassTab(prev => ({ ...prev, [cls]: sub }));

  const getSlotTable = (name: string) => {
    if (['Wizard', 'Sorcerer', 'Bard', 'Cleric', 'Druid'].includes(name)) return FULL_CASTER_SLOTS;
    if (['Paladin', 'Ranger'].includes(name)) return HALF_CASTER_SLOTS;
    return null;
  };

  const isWarlock = (name: string) => name === 'Warlock';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/compendium" className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </Link>
        <GraduationCap className="w-6 h-6 text-purple-400" />
        <h1 className="text-2xl font-display font-bold text-text-primary">Character Classes</h1>
        <span className="text-sm text-text-tertiary ml-auto">{CLASSES.length} classes</span>
      </div>

      {/* Class Cards */}
      <div className="space-y-2">
        {CLASSES.map(cls => {
          const isExpanded = expanded === cls.name;
          const selectedLevel = featureLevel[cls.name] || 1;
          const selectedSub = subclassTab[cls.name] || cls.subclasses?.[0]?.name || '';
          const slotTable = getSlotTable(cls.name);

          return (
            <motion.div key={cls.name} layout>
              <button
                onClick={() => setExpanded(isExpanded ? null : cls.name)}
                className="w-full text-left p-4 bg-surface-1 border border-border rounded-lg hover:border-accent-dim transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-text-primary font-display">{cls.name}</span>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{cls.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-tertiary flex-shrink-0">
                    <span className="flex items-center gap-1"><Swords className="w-3 h-3" />{cls.hitDie}</span>
                    <span>{cls.primaryAbility}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 bg-surface-2 border border-t-0 border-border rounded-b-lg space-y-4">
                      <p className="text-sm text-text-secondary">{cls.description}</p>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-2 bg-surface-1 rounded-lg text-center">
                          <div className="text-xs text-text-tertiary">Hit Die</div>
                          <div className="text-sm font-bold text-text-primary">{cls.hitDie}</div>
                        </div>
                        <div className="p-2 bg-surface-1 rounded-lg text-center">
                          <div className="text-xs text-text-tertiary">Primary</div>
                          <div className="text-xs font-medium text-accent">{cls.primaryAbility}</div>
                        </div>
                        <div className="p-2 bg-surface-1 rounded-lg text-center">
                          <div className="text-xs text-text-tertiary">Saves</div>
                          <div className="text-xs font-medium text-text-primary">{cls.savingThrows}</div>
                        </div>
                        <div className="p-2 bg-surface-1 rounded-lg text-center">
                          <div className="text-xs text-text-tertiary">Armor</div>
                          <div className="text-xs font-medium text-text-primary">{cls.armorProficiencies || 'None'}</div>
                        </div>
                      </div>

                      {/* Proficiencies */}
                      <div>
                        <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2">Weapon Proficiencies</h4>
                        <p className="text-sm text-text-secondary">{cls.weaponProficiencies}</p>
                      </div>

                      {/* Skills */}
                      <div>
                        <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2">Skill Choices</h4>
                        <p className="text-sm text-text-secondary">{cls.skillChoices}</p>
                      </div>

                      {/* Features by Level */}
                      <div>
                        <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" /> Features by Level
                        </h4>
                        <div className="flex gap-1.5 flex-wrap mb-3">
                          {Array.from({ length: 20 }, (_, i) => i + 1).map(level => {
                            const hasFeatures = cls.features.some(f => f.level === level);
                            return (
                              <button key={level} onClick={() => selectLevel(cls.name, level)}
                                className={`w-8 h-8 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                  selectedLevel === level
                                    ? 'bg-accent text-surface-0'
                                    : hasFeatures
                                      ? 'bg-surface-1 border border-border text-text-primary hover:border-accent-dim'
                                      : 'bg-surface-1 border border-border text-text-tertiary opacity-40'
                                }`}>
                                {level}
                              </button>
                            );
                          })}
                        </div>
                        <div className="space-y-2">
                          {cls.features.filter(f => f.level === selectedLevel).map(f => (
                            <div key={f.name} className="p-3 bg-surface-1 rounded-lg border border-border">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-text-primary">{f.name}</span>
                                <span className="text-xs text-text-tertiary">Level {f.level}</span>
                              </div>
                              <p className="text-sm text-text-secondary">{f.description}</p>
                            </div>
                          ))}
                          {cls.features.filter(f => f.level === selectedLevel).length === 0 && (
                            <p className="text-sm text-text-tertiary italic text-center py-4">No new features at level {selectedLevel}</p>
                          )}
                        </div>
                      </div>

                      {/* Subclasses */}
                      {cls.subclasses && cls.subclasses.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> {cls.subclassName || 'Subclass'}
                          </h4>
                          <div className="flex gap-2 mb-3 flex-wrap">
                            {cls.subclasses.map(sub => (
                              <button key={sub.name} onClick={() => selectSubclass(cls.name, sub.name)}
                                className={`px-3 py-1.5 rounded-md text-xs border transition-colors cursor-pointer ${selectedSub === sub.name ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'}`}>
                                {sub.name}
                              </button>
                            ))}
                          </div>
                          {cls.subclasses.filter(s => s.name === selectedSub).map(sub => (
                            <div key={sub.name} className="p-3 bg-surface-1 rounded-lg border border-border space-y-2">
                              <p className="text-sm text-text-secondary">{sub.description}</p>
                              {sub.features.map(f => (
                                <div key={f.name} className="text-sm">
                                  <span className="font-semibold text-text-primary italic">{f.name} </span>
                                  <span className="text-xs text-text-tertiary">(Lvl {f.level})</span>
                                  <p className="text-text-secondary mt-0.5">{f.description}</p>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Spell Slots */}
                      {(slotTable || isWarlock(cls.name)) && (
                        <div>
                          <button onClick={() => setShowSlots(showSlots === cls.name ? null : cls.name)}
                            className="flex items-center gap-2 text-sm text-accent hover:underline cursor-pointer">
                            <ChevronDown className={`w-3 h-3 transition-transform ${showSlots === cls.name ? 'rotate-180' : ''}`} />
                            Spell Slot Table
                          </button>
                          <AnimatePresence>
                            {showSlots === cls.name && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                                <div className="overflow-x-auto">
                                  {slotTable ? (
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-border">
                                          <th className="text-left py-1.5 px-2 text-text-tertiary font-medium">Lvl</th>
                                          {slotTable[0]?.slots.map((_, i) => (
                                            <th key={i} className="text-center py-1.5 px-2 text-text-tertiary font-medium">{i + 1}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {slotTable.map(row => (
                                          <tr key={row.level} className="border-b border-border/50">
                                            <td className="py-1 px-2 text-text-primary font-medium">{row.level}</td>
                                            {row.slots.map((s, i) => (
                                              <td key={i} className={`text-center py-1 px-2 ${s > 0 ? 'text-accent' : 'text-text-tertiary opacity-30'}`}>{s || '—'}</td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-border">
                                          <th className="text-left py-1.5 px-2 text-text-tertiary font-medium">Lvl</th>
                                          <th className="text-center py-1.5 px-2 text-text-tertiary font-medium">Cantrips</th>
                                          <th className="text-center py-1.5 px-2 text-text-tertiary font-medium">Slot Lvl</th>
                                          <th className="text-center py-1.5 px-2 text-text-tertiary font-medium">Slots</th>
                                          <th className="text-center py-1.5 px-2 text-text-tertiary font-medium">Invocations</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {WARLOCK_SLOTS.map(row => (
                                          <tr key={row.level} className="border-b border-border/50">
                                            <td className="py-1 px-2 text-text-primary font-medium">{row.level}</td>
                                            <td className="text-center py-1 px-2 text-accent">{row.cantrips}</td>
                                            <td className="text-center py-1 px-2 text-text-secondary">{row.slotLevel}</td>
                                            <td className="text-center py-1 px-2 text-accent">{row.slots}</td>
                                            <td className="text-center py-1 px-2 text-text-secondary">{row.invocations || '—'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
