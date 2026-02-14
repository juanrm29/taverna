'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, ChevronDown, ChevronRight, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { RACES, DRACONIC_ANCESTRY } from '@/lib/data/races';

export default function RacesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subraceTab, setSubraceTab] = useState<Record<string, string>>({});
  const [showDraconic, setShowDraconic] = useState(false);

  const selectSubrace = (raceName: string, subrace: string) => {
    setSubraceTab(prev => ({ ...prev, [raceName]: subrace }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/compendium" className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </Link>
        <Users className="w-6 h-6 text-emerald-400" />
        <h1 className="text-2xl font-display font-bold text-text-primary">Races & Lineages</h1>
        <span className="text-sm text-text-tertiary ml-auto">{RACES.length} races</span>
      </div>

      {/* Race Cards */}
      <div className="space-y-2">
        {RACES.map(race => {
          const isExpanded = expanded === race.name;
          const selectedSub = subraceTab[race.name] || race.subraces?.[0]?.name || '';

          return (
            <motion.div key={race.name} layout>
              <button
                onClick={() => setExpanded(isExpanded ? null : race.name)}
                className="w-full text-left p-4 bg-surface-1 border border-border rounded-lg hover:border-accent-dim transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-text-primary font-display">{race.name}</span>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{race.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-tertiary flex-shrink-0">
                    <span>Speed: {race.speed}</span>
                    <span>{race.size}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 bg-surface-2 border border-t-0 border-border rounded-b-lg space-y-4">
                      <p className="text-sm text-text-secondary">{race.description}</p>

                      {/* Base Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-2 bg-surface-1 rounded-lg text-center">
                          <div className="text-xs text-text-tertiary">Size</div>
                          <div className="text-sm font-medium text-text-primary">{race.size}</div>
                        </div>
                        <div className="p-2 bg-surface-1 rounded-lg text-center">
                          <div className="text-xs text-text-tertiary">Speed</div>
                          <div className="text-sm font-medium text-text-primary">{race.speed}</div>
                        </div>
                        <div className="p-2 bg-surface-1 rounded-lg text-center">
                          <div className="text-xs text-text-tertiary">Languages</div>
                          <div className="text-xs font-medium text-text-primary">{race.languages.join(', ')}</div>
                        </div>
                      </div>

                      {/* Ability Score Increase */}
                      <div>
                        <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2">Ability Score Increase</h4>
                        <span className="px-2 py-1 bg-accent/10 border border-accent/20 rounded-md text-xs text-accent font-medium">
                          {race.abilityScoreIncrease}
                        </span>
                      </div>

                      {/* Racial Traits */}
                      <div>
                        <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2 flex items-center gap-1.5">
                          <Star className="w-3 h-3" /> Racial Traits
                        </h4>
                        <div className="space-y-2">
                          {race.traits.map(trait => (
                            <div key={trait.name} className="text-sm">
                              <span className="font-semibold text-text-primary italic">{trait.name}. </span>
                              <span className="text-text-secondary">{trait.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Subraces */}
                      {race.subraces && race.subraces.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2 flex items-center gap-1.5">
                            <Zap className="w-3 h-3" /> Subraces
                          </h4>
                          <div className="flex gap-2 mb-3 flex-wrap">
                            {race.subraces.map(sub => (
                              <button key={sub.name} onClick={() => selectSubrace(race.name, sub.name)}
                                className={`px-3 py-1.5 rounded-md text-xs border transition-colors cursor-pointer ${selectedSub === sub.name ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'}`}>
                                {sub.name}
                              </button>
                            ))}
                          </div>
                          {race.subraces.filter(s => s.name === selectedSub).map(sub => (
                            <div key={sub.name} className="p-3 bg-surface-1 rounded-lg border border-border space-y-2">
                              {sub.abilityScoreIncrease && (
                                <span className="px-2 py-0.5 bg-accent/10 rounded text-xs text-accent">{sub.abilityScoreIncrease}</span>
                              )}
                              {sub.traits.map(t => (
                                <div key={t.name} className="text-sm">
                                  <span className="font-semibold text-text-primary italic">{t.name}. </span>
                                  <span className="text-text-secondary">{t.description}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Draconic Ancestry (Dragonborn) */}
                      {race.name === 'Dragonborn' && (
                        <div>
                          <button onClick={() => setShowDraconic(!showDraconic)}
                            className="flex items-center gap-2 text-sm text-accent hover:underline cursor-pointer">
                            <ChevronRight className={`w-3 h-3 transition-transform ${showDraconic ? 'rotate-90' : ''}`} />
                            Draconic Ancestry Table
                          </button>
                          <AnimatePresence>
                            {showDraconic && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-border">
                                        <th className="text-left py-2 px-2 text-xs text-text-tertiary font-medium uppercase">Dragon</th>
                                        <th className="text-left py-2 px-2 text-xs text-text-tertiary font-medium uppercase">Damage</th>
                                        <th className="text-left py-2 px-2 text-xs text-text-tertiary font-medium uppercase">Breath Weapon</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {DRACONIC_ANCESTRY.map(d => (
                                        <tr key={d.dragon} className="border-b border-border/50">
                                          <td className="py-1.5 px-2 text-text-primary">{d.dragon}</td>
                                          <td className="py-1.5 px-2 text-text-secondary">{d.damageType}</td>
                                          <td className="py-1.5 px-2 text-xs text-text-tertiary">{d.breathWeapon}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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
