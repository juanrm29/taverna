'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Shield, Heart, Swords, Sparkles, BookOpen,
  Scroll, Wand2, Backpack, Star, Plus, Trash2, Check, X,
  ChevronDown, ChevronUp, Zap, Crown, Coins, GraduationCap
} from 'lucide-react';
import { Button, Card, Badge, Input, Textarea, Select, Modal } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import {
  Character, AbilityName, AbilityScores, Skill, Item, KnownSpell,
  ClassLevel, Feat, Currency, SpellSlot,
  getAbilityModifier, formatModifier, ALL_SKILLS, CLASS_HIT_DICE,
  CLASS_SAVING_THROWS, RACES, CLASSES, ALIGNMENTS,
  FULL_CASTER_SLOTS, HALF_CASTER_SLOTS, WARLOCK_SLOTS,
  FULL_CASTERS, HALF_CASTERS, PACT_CASTERS, NON_CASTERS, PREPARED_CASTERS,
  CharacterClass, Race, Alignment,
} from '@/lib/types';
import { v4 as uuid } from 'uuid';

type EditTab = 'basics' | 'abilities' | 'combat' | 'spells' | 'inventory' | 'feats' | 'personality';

const TABS: { key: EditTab; label: string; icon: React.ReactNode }[] = [
  { key: 'basics', label: 'Basics', icon: <GraduationCap className="w-4 h-4" /> },
  { key: 'abilities', label: 'Abilities & Skills', icon: <Star className="w-4 h-4" /> },
  { key: 'combat', label: 'Combat', icon: <Swords className="w-4 h-4" /> },
  { key: 'spells', label: 'Spells', icon: <Wand2 className="w-4 h-4" /> },
  { key: 'inventory', label: 'Inventory', icon: <Backpack className="w-4 h-4" /> },
  { key: 'feats', label: 'Feats & Features', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'personality', label: 'Personality', icon: <BookOpen className="w-4 h-4" /> },
];

const ABILITIES: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const SPELL_SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];
const DAMAGE_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
const ITEM_TYPES = ['weapon', 'armor', 'shield', 'potion', 'scroll', 'wondrous', 'ring', 'wand', 'rod', 'staff', 'ammunition', 'adventuring-gear', 'tool', 'other'] as const;
const RARITIES = ['common', 'uncommon', 'rare', 'very-rare', 'legendary', 'artifact'] as const;

function ensureDefaults(c: Character): Character {
  return {
    ...c,
    currency: c.currency ?? { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    knownSpells: c.knownSpells ?? [],
    classLevels: c.classLevels ?? [{ class: c.class, level: c.level, subclass: '' }],
    feats: c.feats ?? [],
    hitDiceRemaining: c.hitDiceRemaining ?? c.level,
    inspirationPoints: c.inspirationPoints ?? 0,
    experiencePoints: c.experiencePoints ?? 0,
    temporaryEffects: c.temporaryEffects ?? [],
  };
}

export default function CharacterEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const toast = useToast();

  const [char, setChar] = useState<Character | null>(null);
  const [tab, setTab] = useState<EditTab>('basics');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showAddSpell, setShowAddSpell] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddFeat, setShowAddFeat] = useState(false);

  useEffect(() => {
    api.getCharacter(id).then(c => {
      if (!c) { router.replace('/characters'); return; }
      if (c.playerId !== user?.id) { router.replace(`/characters/${id}`); return; }
      setChar(ensureDefaults(c));
    }).catch(() => router.replace('/characters'));
  }, [id, router, user]);

  // Unsaved changes warning
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const update = useCallback((patch: Partial<Character>) => {
    setChar(prev => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    if (!char) return;
    setSaving(true);
    try {
      const updated = await api.updateCharacter(char.id, char);
      if (updated) {
        setChar(ensureDefaults(updated));
        setDirty(false);
        toast.success('Character saved!');
      } else {
        toast.error('Failed to save');
      }
    } catch (err) {
      toast.error('Failed to save');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [char, toast]);

  if (!char) return null;

  const profBonus = char.proficiencyBonus;
  const hitDie = CLASS_HIT_DICE[char.class];

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/characters/${id}`)} className="text-text-tertiary hover:text-text-secondary cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold">Edit: {char.name}</h1>
            <p className="text-xs text-text-tertiary">{char.race} {char.class} · Level {char.level}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-warning animate-pulse">Unsaved changes</span>}
          <Button variant="secondary" size="sm" onClick={() => router.push(`/characters/${id}`)}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving || !dirty}>
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              tab === t.key ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {tab === 'basics' && <BasicsTab char={char} update={update} />}
          {tab === 'abilities' && <AbilitiesTab char={char} update={update} profBonus={profBonus} />}
          {tab === 'combat' && <CombatTab char={char} update={update} hitDie={hitDie} />}
          {tab === 'spells' && <SpellsTab char={char} update={update} showAdd={showAddSpell} setShowAdd={setShowAddSpell} />}
          {tab === 'inventory' && <InventoryTab char={char} update={update} showAdd={showAddItem} setShowAdd={setShowAddItem} />}
          {tab === 'feats' && <FeatsTab char={char} update={update} showAdd={showAddFeat} setShowAdd={setShowAddFeat} />}
          {tab === 'personality' && <PersonalityTab char={char} update={update} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// BASICS TAB
// ============================================================
function BasicsTab({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Identity</h3>
        <div className="space-y-4">
          <Input label="Name" value={char.name} onChange={e => update({ name: e.target.value })} />
          <Select label="Race" value={char.race} options={RACES.map(r => ({ value: r, label: r }))} onChange={e => update({ race: e.target.value as Race })} />
          <Select label="Class" value={char.class} options={CLASSES.map(c => ({ value: c, label: c }))} onChange={e => update({ class: e.target.value as CharacterClass })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Level" type="number" min={1} max={20} value={char.level} onChange={e => update({ level: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })} />
            <Input label="Experience" type="number" min={0} value={char.experiencePoints} onChange={e => update({ experiencePoints: Math.max(0, parseInt(e.target.value) || 0) })} />
          </div>
          <Select label="Alignment" value={char.alignment} options={ALIGNMENTS.map(a => ({ value: a, label: a }))} onChange={e => update({ alignment: e.target.value as Alignment })} />
          <Input label="Background" value={char.background} onChange={e => update({ background: e.target.value })} />
        </div>
      </Card>

      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Multiclass</h3>
        <p className="text-xs text-text-tertiary mb-3">Add additional class levels for multiclass characters.</p>
        <div className="space-y-2">
          {(char.classLevels ?? []).map((cl, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={cl.class}
                onChange={e => {
                  const cls = [...(char.classLevels ?? [])];
                  cls[i] = { ...cls[i], class: e.target.value as CharacterClass };
                  update({ classLevels: cls });
                }}
                className="flex-1 bg-surface-2 border border-border rounded-md px-2 py-1.5 text-sm"
              >
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                value={cl.level}
                min={1}
                max={20}
                onChange={e => {
                  const cls = [...(char.classLevels ?? [])];
                  cls[i] = { ...cls[i], level: Math.max(1, parseInt(e.target.value) || 1) };
                  update({ classLevels: cls });
                }}
                className="w-16 bg-surface-2 border border-border rounded-md px-2 py-1.5 text-sm text-center"
              />
              <input
                type="text"
                placeholder="Subclass"
                value={cl.subclass || ''}
                onChange={e => {
                  const cls = [...(char.classLevels ?? [])];
                  cls[i] = { ...cls[i], subclass: e.target.value };
                  update({ classLevels: cls });
                }}
                className="flex-1 bg-surface-2 border border-border rounded-md px-2 py-1.5 text-sm"
              />
              {(char.classLevels ?? []).length > 1 && (
                <button onClick={() => {
                  const cls = (char.classLevels ?? []).filter((_, j) => j !== i);
                  update({ classLevels: cls });
                }} className="text-danger hover:text-danger/80 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => update({ classLevels: [...(char.classLevels ?? []), { class: 'Fighter', level: 1 }] })}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors mt-2 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Class
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Avatar</h3>
        <Input label="Avatar URL" placeholder="https://..." value={char.avatarUrl || ''} onChange={e => update({ avatarUrl: e.target.value })} />
        {char.avatarUrl && (
          <div className="mt-3 flex justify-center">
            <img src={char.avatarUrl} alt={char.name} className="w-24 h-24 rounded-full object-cover border-2 border-accent" />
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Inspiration & Effects</h3>
        <div className="space-y-4">
          <Input label="Inspiration Points" type="number" min={0} value={char.inspirationPoints} onChange={e => update({ inspirationPoints: Math.max(0, parseInt(e.target.value) || 0) })} />
          <div>
            <label className="text-xs font-medium text-text-secondary tracking-wide uppercase block mb-1.5">Temporary Effects</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {(char.temporaryEffects ?? []).map((eff, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-warning/15 text-warning text-xs px-2 py-0.5 rounded">
                  {eff}
                  <button onClick={() => update({ temporaryEffects: (char.temporaryEffects ?? []).filter((_, j) => j !== i) })} className="hover:text-danger cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                id="new-effect"
                type="text"
                placeholder="Add effect..."
                className="flex-1 bg-surface-2 border border-border rounded-md px-2 py-1 text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      update({ temporaryEffects: [...(char.temporaryEffects ?? []), val] });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// ABILITIES & SKILLS TAB
// ============================================================
function AbilitiesTab({ char, update, profBonus }: { char: Character; update: (p: Partial<Character>) => void; profBonus: number }) {
  const savingThrowProfs = CLASS_SAVING_THROWS[char.class];

  const updateAbility = (ab: AbilityName, val: number) => {
    update({ abilityScores: { ...char.abilityScores, [ab]: Math.max(1, Math.min(30, val)) } });
  };

  const toggleSkillProficiency = (skillName: string) => {
    const skills = char.skills.map(s =>
      s.name === skillName ? { ...s, proficient: !s.proficient } : s
    );
    update({ skills });
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Ability Scores</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {ABILITIES.map(ab => {
            const score = char.abilityScores[ab];
            const mod = getAbilityModifier(score);
            return (
              <div key={ab} className="bg-surface-2 border border-border rounded-lg p-3 text-center">
                <label className="text-[10px] font-semibold text-text-tertiary tracking-widest uppercase block mb-1">{ab.slice(0, 3)}</label>
                <input
                  type="number"
                  value={score}
                  min={1}
                  max={30}
                  onChange={e => updateAbility(ab, parseInt(e.target.value) || 10)}
                  className="w-16 bg-surface-0 border border-border rounded-md px-2 py-1 text-lg font-bold text-center text-accent mx-auto block"
                />
                <span className="text-xs text-text-secondary mt-1 block">{formatModifier(mod)}</span>
                <span className="text-[10px] text-text-tertiary">
                  Save: {formatModifier(mod + (savingThrowProfs.includes(ab) ? profBonus : 0))}
                  {savingThrowProfs.includes(ab) && ' ★'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Input label="Proficiency Bonus" type="number" min={2} max={6} value={profBonus} onChange={e => update({ proficiencyBonus: Math.max(2, Math.min(6, parseInt(e.target.value) || 2)) })} />
        </div>
      </Card>

      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Skills</h3>
        <p className="text-xs text-text-tertiary mb-3">Click the dot to toggle proficiency.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {ALL_SKILLS.map(skill => {
            const charSkill = char.skills.find(s => s.name === skill.name);
            const isProficient = charSkill?.proficient || false;
            const mod = getAbilityModifier(char.abilityScores[skill.ability]);
            const total = mod + (isProficient ? profBonus : 0);

            return (
              <button
                key={skill.name}
                onClick={() => toggleSkillProficiency(skill.name)}
                className="flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-surface-2 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border-2 transition-colors ${isProficient ? 'bg-accent border-accent' : 'border-text-tertiary'}`} />
                  <span className={isProficient ? 'text-accent' : 'text-text-secondary'}>{skill.name}</span>
                  <span className="text-[10px] text-text-tertiary">({skill.ability.slice(0, 3).toUpperCase()})</span>
                </div>
                <span className={`font-mono text-xs ${total >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatModifier(total)}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// COMBAT TAB
// ============================================================
function CombatTab({ char, update, hitDie }: { char: Character; update: (p: Partial<Character>) => void; hitDie: number }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Hit Points</h3>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Current HP" type="number" min={0} value={char.hp.current} onChange={e => update({ hp: { ...char.hp, current: Math.max(0, parseInt(e.target.value) || 0) } })} />
          <Input label="Max HP" type="number" min={1} value={char.hp.max} onChange={e => update({ hp: { ...char.hp, max: Math.max(1, parseInt(e.target.value) || 1) } })} />
          <Input label="Temp HP" type="number" min={0} value={char.hp.temp} onChange={e => update({ hp: { ...char.hp, temp: Math.max(0, parseInt(e.target.value) || 0) } })} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="text-xs font-medium text-text-secondary tracking-wide uppercase block mb-1.5">Hit Die: d{hitDie}</label>
            <Input label="Remaining" type="number" min={0} max={char.level} value={char.hitDiceRemaining ?? char.level} onChange={e => update({ hitDiceRemaining: Math.max(0, Math.min(char.level, parseInt(e.target.value) || 0)) })} />
          </div>
          <div className="flex items-end">
            <Button variant="secondary" size="sm" onClick={() => {
              const regained = Math.max(1, Math.floor(char.level / 2));
              update({ hitDiceRemaining: Math.min(char.level, (char.hitDiceRemaining ?? char.level) + regained) });
            }}>
              Long Rest (+{Math.max(1, Math.floor(char.level / 2))})
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Defense</h3>
        <div className="space-y-3">
          <Input label="Armor Class" type="number" min={0} value={char.armorClass} onChange={e => update({ armorClass: Math.max(0, parseInt(e.target.value) || 10) })} />
          <Input label="Initiative" type="number" value={char.initiative} onChange={e => update({ initiative: parseInt(e.target.value) || 0 })} />
          <Input label="Speed (ft)" type="number" min={0} value={char.speed} onChange={e => update({ speed: Math.max(0, parseInt(e.target.value) || 30) })} />
        </div>
      </Card>

      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Death Saves</h3>
        <div className="flex items-center gap-8">
          <div>
            <span className="text-xs text-success block mb-1">Successes</span>
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <button
                  key={`s${i}`}
                  onClick={() => {
                    const newVal = i < char.deathSaves.successes ? i : i + 1;
                    update({ deathSaves: { ...char.deathSaves, successes: newVal } });
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-colors cursor-pointer ${
                    i < char.deathSaves.successes ? 'bg-success border-success' : 'border-text-tertiary hover:border-success'
                  }`}
                />
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-danger block mb-1">Failures</span>
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <button
                  key={`f${i}`}
                  onClick={() => {
                    const newVal = i < char.deathSaves.failures ? i : i + 1;
                    update({ deathSaves: { ...char.deathSaves, failures: newVal } });
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-colors cursor-pointer ${
                    i < char.deathSaves.failures ? 'bg-danger border-danger' : 'border-text-tertiary hover:border-danger'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => update({ deathSaves: { successes: 0, failures: 0 } })}
            className="text-xs text-text-tertiary hover:text-text-secondary cursor-pointer"
          >
            Reset
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Spell Slots</h3>
        <div className="space-y-2">
          {char.spellSlots.map((slot, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-text-tertiary w-16">Level {slot.level}</span>
              <div className="flex gap-1 flex-1">
                {Array.from({ length: slot.total }).map((_, j) => (
                  <button
                    key={j}
                    onClick={() => {
                      const slots = [...char.spellSlots];
                      const newUsed = j < slot.used ? j : j + 1;
                      slots[i] = { ...slot, used: newUsed };
                      update({ spellSlots: slots });
                    }}
                    className={`w-6 h-6 rounded transition-colors cursor-pointer ${
                      j < slot.used ? 'bg-surface-3 border border-border' : 'bg-accent/20 border border-accent/40'
                    }`}
                    title={j < slot.used ? 'Used' : 'Available'}
                  />
                ))}
              </div>
              <span className="text-[10px] text-text-tertiary w-10 text-right">{slot.total - slot.used}/{slot.total}</span>
            </div>
          ))}
          <button
            onClick={() => {
              const slots = char.spellSlots.map(s => ({ ...s, used: 0 }));
              update({ spellSlots: slots });
            }}
            className="text-xs text-accent hover:text-accent/80 transition-colors cursor-pointer mt-2"
          >
            ⟳ Long Rest — Reset All Slots
          </button>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// SPELLS TAB
// ============================================================
function SpellsTab({ char, update, showAdd, setShowAdd }: { char: Character; update: (p: Partial<Character>) => void; showAdd: boolean; setShowAdd: (v: boolean) => void }) {
  const [newSpell, setNewSpell] = useState<Partial<KnownSpell>>({
    name: '', level: 0, school: 'Evocation', castingTime: '1 action', range: '60 feet',
    components: 'V, S', duration: 'Instantaneous', concentration: false, ritual: false,
    description: '', prepared: false,
  });

  const isPreparedCaster = PREPARED_CASTERS.includes(char.class);
  const spells = char.knownSpells ?? [];
  const spellsByLevel: Record<number, KnownSpell[]> = {};
  spells.forEach(s => {
    if (!spellsByLevel[s.level]) spellsByLevel[s.level] = [];
    spellsByLevel[s.level].push(s);
  });

  const addSpell = () => {
    if (!newSpell.name) return;
    const spell: KnownSpell = {
      id: uuid(),
      name: newSpell.name!,
      level: newSpell.level ?? 0,
      school: newSpell.school || 'Evocation',
      castingTime: newSpell.castingTime || '1 action',
      range: newSpell.range || 'Self',
      components: newSpell.components || 'V, S',
      duration: newSpell.duration || 'Instantaneous',
      concentration: newSpell.concentration || false,
      ritual: newSpell.ritual || false,
      damage: newSpell.damage,
      damageType: newSpell.damageType,
      savingThrow: newSpell.savingThrow,
      description: newSpell.description || '',
      prepared: newSpell.prepared || false,
    };
    update({ knownSpells: [...spells, spell] });
    setShowAdd(false);
    setNewSpell({ name: '', level: 0, school: 'Evocation', castingTime: '1 action', range: '60 feet', components: 'V, S', duration: 'Instantaneous', concentration: false, ritual: false, description: '', prepared: false });
  };

  const removeSpell = (spellId: string) => {
    update({ knownSpells: spells.filter(s => s.id !== spellId) });
  };

  const togglePrepared = (spellId: string) => {
    update({ knownSpells: spells.map(s => s.id === spellId ? { ...s, prepared: !s.prepared } : s) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Known Spells ({spells.length})</h3>
          {isPreparedCaster && <p className="text-xs text-text-tertiary">Prepared caster — toggle ★ to prepare spells</p>}
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Spell
        </Button>
      </div>

      {/* Concentration indicator */}
      {char.concentratingOn && (
        <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-md px-3 py-2 text-sm">
          <Zap className="w-4 h-4 text-warning" />
          <span className="text-warning">Concentrating on: <strong>{char.concentratingOn}</strong></span>
          <button onClick={() => update({ concentratingOn: undefined })} className="ml-auto text-xs text-text-tertiary hover:text-danger cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {Object.keys(spellsByLevel).sort((a, b) => Number(a) - Number(b)).map(lvl => (
        <Card key={lvl}>
          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            {Number(lvl) === 0 ? 'Cantrips' : `Level ${lvl} Spells`}
          </h4>
          <div className="space-y-2">
            {spellsByLevel[Number(lvl)].map(spell => (
              <div key={spell.id} className="flex items-start justify-between gap-2 bg-surface-2 rounded-md px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPreparedCaster && spell.level > 0 && (
                      <button onClick={() => togglePrepared(spell.id)} className="cursor-pointer" title={spell.prepared ? 'Prepared' : 'Not prepared'}>
                        <Star className={`w-3.5 h-3.5 ${spell.prepared ? 'text-accent fill-accent' : 'text-text-tertiary'}`} />
                      </button>
                    )}
                    <span className="font-medium text-sm">{spell.name}</span>
                    <Badge variant="accent">{spell.school}</Badge>
                    {spell.concentration && <Badge variant="warning">C</Badge>}
                    {spell.ritual && <Badge variant="success">R</Badge>}
                    {spell.damage && <Badge variant="danger">{spell.damage} {spell.damageType}</Badge>}
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{spell.castingTime} · {spell.range} · {spell.duration}</p>
                  {spell.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{spell.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {spell.concentration && (
                    <button
                      onClick={() => update({ concentratingOn: char.concentratingOn === spell.name ? undefined : spell.name })}
                      className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        char.concentratingOn === spell.name ? 'bg-warning/20 text-warning' : 'bg-surface-3 text-text-tertiary hover:text-warning'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                    </button>
                  )}
                  <button onClick={() => removeSpell(spell.id)} className="text-text-tertiary hover:text-danger cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {spells.length === 0 && (
        <Card>
          <p className="text-center text-sm text-text-tertiary py-6">No spells yet. Add your first spell!</p>
        </Card>
      )}

      {/* Add Spell Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Spell">
        <div className="space-y-4">
          <Input label="Spell Name" value={newSpell.name || ''} onChange={e => setNewSpell(p => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Level" value={String(newSpell.level ?? 0)} options={[0,1,2,3,4,5,6,7,8,9].map(l => ({ value: String(l), label: l === 0 ? 'Cantrip' : `Level ${l}` }))} onChange={e => setNewSpell(p => ({ ...p, level: parseInt(e.target.value) }))} />
            <Select label="School" value={newSpell.school || 'Evocation'} options={SPELL_SCHOOLS.map(s => ({ value: s, label: s }))} onChange={e => setNewSpell(p => ({ ...p, school: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Casting Time" value={newSpell.castingTime || ''} onChange={e => setNewSpell(p => ({ ...p, castingTime: e.target.value }))} />
            <Input label="Range" value={newSpell.range || ''} onChange={e => setNewSpell(p => ({ ...p, range: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Components" value={newSpell.components || ''} onChange={e => setNewSpell(p => ({ ...p, components: e.target.value }))} />
            <Input label="Duration" value={newSpell.duration || ''} onChange={e => setNewSpell(p => ({ ...p, duration: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Damage" placeholder="e.g. 8d6" value={newSpell.damage || ''} onChange={e => setNewSpell(p => ({ ...p, damage: e.target.value }))} />
            <Select label="Damage Type" value={newSpell.damageType || ''} options={[{ value: '', label: '—' }, ...DAMAGE_TYPES.map(d => ({ value: d, label: d }))]} onChange={e => setNewSpell(p => ({ ...p, damageType: e.target.value || undefined }))} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={newSpell.concentration || false} onChange={e => setNewSpell(p => ({ ...p, concentration: e.target.checked }))} className="accent-accent" />
              Concentration
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={newSpell.ritual || false} onChange={e => setNewSpell(p => ({ ...p, ritual: e.target.checked }))} className="accent-accent" />
              Ritual
            </label>
            {isPreparedCaster && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newSpell.prepared || false} onChange={e => setNewSpell(p => ({ ...p, prepared: e.target.checked }))} className="accent-accent" />
                Prepared
              </label>
            )}
          </div>
          <Textarea label="Description" value={newSpell.description || ''} onChange={e => setNewSpell(p => ({ ...p, description: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={addSpell} disabled={!newSpell.name}>
              <Plus className="w-3.5 h-3.5" /> Add Spell
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// INVENTORY TAB
// ============================================================
function InventoryTab({ char, update, showAdd, setShowAdd }: { char: Character; update: (p: Partial<Character>) => void; showAdd: boolean; setShowAdd: (v: boolean) => void }) {
  const currency = char.currency ?? { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '', quantity: 1, weight: 0, equipped: false, description: '',
    type: 'other', rarity: 'common',
  });

  const addItem = () => {
    if (!newItem.name) return;
    const item: Item = {
      id: uuid(),
      name: newItem.name!,
      quantity: newItem.quantity ?? 1,
      weight: newItem.weight ?? 0,
      equipped: newItem.equipped ?? false,
      description: newItem.description || '',
      type: (newItem.type as Item['type']) || 'other',
      damage: newItem.damage,
      damageType: newItem.damageType,
      properties: newItem.properties,
      armorClassBonus: newItem.armorClassBonus,
      value: newItem.value,
      rarity: (newItem.rarity as Item['rarity']) || 'common',
      attunement: newItem.attunement ?? false,
      attuned: newItem.attuned ?? false,
    };
    update({ inventory: [...char.inventory, item] });
    setShowAdd(false);
    setNewItem({ name: '', quantity: 1, weight: 0, equipped: false, description: '', type: 'other', rarity: 'common' });
  };

  const removeItem = (itemId: string) => {
    update({ inventory: char.inventory.filter(i => i.id !== itemId) });
  };

  const toggleEquip = (itemId: string) => {
    update({ inventory: char.inventory.map(i => i.id === itemId ? { ...i, equipped: !i.equipped } : i) });
  };

  const totalWeight = char.inventory.reduce((sum, i) => sum + (i.weight * i.quantity), 0);
  const carryCapacity = char.abilityScores.strength * 15;

  return (
    <div className="space-y-6">
      {/* Currency */}
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Coins className="w-4 h-4" /> Currency
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map(coin => (
            <div key={coin} className="text-center">
              <label className="text-[10px] font-semibold text-text-tertiary uppercase block mb-1">{coin}</label>
              <input
                type="number"
                min={0}
                value={currency[coin]}
                onChange={e => update({ currency: { ...currency, [coin]: Math.max(0, parseInt(e.target.value) || 0) } })}
                className="w-full bg-surface-2 border border-border rounded-md px-1 py-1.5 text-center text-sm font-mono"
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-text-tertiary mt-2 text-right">
          Total: {((currency.pp * 10 + currency.gp + currency.ep * 0.5 + currency.sp * 0.1 + currency.cp * 0.01)).toFixed(2)} GP equivalent
        </p>
      </Card>

      {/* Items */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Items ({char.inventory.length})</h3>
          <p className="text-xs text-text-tertiary">
            Weight: {totalWeight.toFixed(1)} / {carryCapacity} lb
            {totalWeight > carryCapacity && <span className="text-danger ml-1">⚠ Encumbered!</span>}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Item
        </Button>
      </div>

      {/* Weight bar */}
      <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${totalWeight > carryCapacity ? 'bg-danger' : 'bg-accent'}`}
          style={{ width: `${Math.min(100, (totalWeight / carryCapacity) * 100)}%` }}
        />
      </div>

      {char.inventory.length === 0 ? (
        <Card><p className="text-center text-sm text-text-tertiary py-6">No items in inventory. Add your first item!</p></Card>
      ) : (
        <div className="space-y-2">
          {char.inventory.map(item => (
            <Card key={item.id} className="!p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{item.name}</span>
                    {item.quantity > 1 && <span className="text-[10px] text-text-tertiary">×{item.quantity}</span>}
                    {item.equipped && <Badge variant="accent">Equipped</Badge>}
                    {item.attunement && item.attuned && <Badge variant="warning">Attuned</Badge>}
                    {item.rarity && item.rarity !== 'common' && (
                      <Badge variant={item.rarity === 'legendary' || item.rarity === 'artifact' ? 'warning' : item.rarity === 'rare' || item.rarity === 'very rare' ? 'accent' : 'default'}>
                        {item.rarity}
                      </Badge>
                    )}
                    {item.type && item.type !== 'other' && <Badge>{item.type}</Badge>}
                  </div>
                  {item.damage && <p className="text-xs text-danger mt-0.5">{item.damage} {item.damageType}</p>}
                  {item.description && <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{item.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-text-tertiary">{item.weight > 0 ? `${item.weight} lb` : ''}</span>
                  <button onClick={() => toggleEquip(item.id)} className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${item.equipped ? 'bg-accent/20 text-accent' : 'bg-surface-3 text-text-tertiary hover:text-text-secondary'}`}>
                    {item.equipped ? 'Unequip' : 'Equip'}
                  </button>
                  <button onClick={() => removeItem(item.id)} className="text-text-tertiary hover:text-danger cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Item">
        <div className="space-y-4">
          <Input label="Name" value={newItem.name || ''} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Quantity" type="number" min={1} value={newItem.quantity ?? 1} onChange={e => setNewItem(p => ({ ...p, quantity: Math.max(1, parseInt(e.target.value) || 1) }))} />
            <Input label="Weight (lb)" type="number" min={0} step={0.1} value={newItem.weight ?? 0} onChange={e => setNewItem(p => ({ ...p, weight: Math.max(0, parseFloat(e.target.value) || 0) }))} />
            <Input label="Value (gp)" type="number" min={0} value={newItem.value ?? 0} onChange={e => setNewItem(p => ({ ...p, value: Math.max(0, parseFloat(e.target.value) || 0) }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={newItem.type || 'other'} options={ITEM_TYPES.map(t => ({ value: t, label: t.replace('-', ' ') }))} onChange={e => setNewItem(p => ({ ...p, type: e.target.value as Item['type'] }))} />
            <Select label="Rarity" value={newItem.rarity || 'common'} options={RARITIES.map(r => ({ value: r, label: r.replace('-', ' ') }))} onChange={e => setNewItem(p => ({ ...p, rarity: e.target.value as Item['rarity'] }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Damage" placeholder="e.g. 1d8" value={newItem.damage || ''} onChange={e => setNewItem(p => ({ ...p, damage: e.target.value }))} />
            <Select label="Damage Type" value={newItem.damageType || ''} options={[{ value: '', label: '—' }, ...DAMAGE_TYPES.map(d => ({ value: d, label: d }))]} onChange={e => setNewItem(p => ({ ...p, damageType: e.target.value || undefined }))} />
          </div>
          <Input label="Properties" placeholder="e.g. Finesse, Light, Versatile (1d10)" value={(newItem.properties || []).join(', ')} onChange={e => setNewItem(p => ({ ...p, properties: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={newItem.equipped || false} onChange={e => setNewItem(p => ({ ...p, equipped: e.target.checked }))} className="accent-accent" />
              Equipped
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={newItem.attunement || false} onChange={e => setNewItem(p => ({ ...p, attunement: e.target.checked }))} className="accent-accent" />
              Requires Attunement
            </label>
          </div>
          <Textarea label="Description" value={newItem.description || ''} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={addItem} disabled={!newItem.name}>
              <Plus className="w-3.5 h-3.5" /> Add Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// FEATS TAB
// ============================================================
function FeatsTab({ char, update, showAdd, setShowAdd }: { char: Character; update: (p: Partial<Character>) => void; showAdd: boolean; setShowAdd: (v: boolean) => void }) {
  const feats = char.feats ?? [];
  const [newFeat, setNewFeat] = useState<Partial<Feat>>({ name: '', description: '' });

  const addFeat = () => {
    if (!newFeat.name) return;
    const feat: Feat = {
      id: uuid(),
      name: newFeat.name!,
      description: newFeat.description || '',
      abilityBonus: newFeat.abilityBonus,
    };
    update({ feats: [...feats, feat] });
    setShowAdd(false);
    setNewFeat({ name: '', description: '' });
  };

  const removeFeat = (featId: string) => {
    update({ feats: feats.filter(f => f.id !== featId) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Feats & Features ({feats.length})</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Feat
        </Button>
      </div>

      {feats.length === 0 ? (
        <Card><p className="text-center text-sm text-text-tertiary py-6">No feats yet.</p></Card>
      ) : (
        <div className="space-y-2">
          {feats.map(feat => (
            <Card key={feat.id} className="!p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-accent" /> {feat.name}
                  </h4>
                  {feat.description && <p className="text-xs text-text-secondary mt-1">{feat.description}</p>}
                  {feat.abilityBonus && Object.entries(feat.abilityBonus).map(([ab, bonus]) => (
                    <Badge key={ab} variant="accent">{ab.slice(0, 3).toUpperCase()} +{bonus}</Badge>
                  ))}
                </div>
                <button onClick={() => removeFeat(feat.id)} className="text-text-tertiary hover:text-danger cursor-pointer shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Feat / Feature">
        <div className="space-y-4">
          <Input label="Name" value={newFeat.name || ''} onChange={e => setNewFeat(p => ({ ...p, name: e.target.value }))} />
          <Textarea label="Description" value={newFeat.description || ''} onChange={e => setNewFeat(p => ({ ...p, description: e.target.value }))} />
          <h4 className="text-xs font-semibold text-text-tertiary uppercase">Ability Bonuses (optional)</h4>
          <div className="grid grid-cols-3 gap-2">
            {ABILITIES.map(ab => (
              <div key={ab} className="flex items-center gap-1">
                <span className="text-[10px] text-text-tertiary w-8">{ab.slice(0, 3).toUpperCase()}</span>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={newFeat.abilityBonus?.[ab] || 0}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 0;
                    const current = newFeat.abilityBonus || {};
                    if (val === 0) {
                      const { [ab]: _, ...rest } = current;
                      setNewFeat(p => ({ ...p, abilityBonus: Object.keys(rest).length ? rest : undefined }));
                    } else {
                      setNewFeat(p => ({ ...p, abilityBonus: { ...current, [ab]: val } }));
                    }
                  }}
                  className="w-12 bg-surface-2 border border-border rounded-md px-1 py-0.5 text-xs text-center"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={addFeat} disabled={!newFeat.name}>
              <Plus className="w-3.5 h-3.5" /> Add Feat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// PERSONALITY TAB
// ============================================================
function PersonalityTab({ char, update }: { char: Character; update: (p: Partial<Character>) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Personality Traits</h3>
        <Textarea value={char.traits || ''} onChange={e => update({ traits: e.target.value })} placeholder="Describe your personality..." />
      </Card>
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Ideals</h3>
        <Textarea value={char.ideals || ''} onChange={e => update({ ideals: e.target.value })} placeholder="What do you believe in?" />
      </Card>
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Bonds</h3>
        <Textarea value={char.bonds || ''} onChange={e => update({ bonds: e.target.value })} placeholder="What connects you to the world?" />
      </Card>
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Flaws</h3>
        <Textarea value={char.flaws || ''} onChange={e => update({ flaws: e.target.value })} placeholder="What are your weaknesses?" />
      </Card>
      <Card className="lg:col-span-2">
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Backstory</h3>
        <Textarea value={char.backstory || ''} onChange={e => update({ backstory: e.target.value })} placeholder="Tell your character's story..." />
      </Card>
      <Card className="lg:col-span-2">
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">Notes</h3>
        <Textarea value={char.notes || ''} onChange={e => update({ notes: e.target.value })} placeholder="Any other notes about your character..." />
      </Card>
    </div>
  );
}
