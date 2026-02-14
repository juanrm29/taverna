'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, Dices, RotateCcw,
  Shield, Heart, Footprints, Swords, Sparkles
} from 'lucide-react';
import { Button, Input, Textarea, Card, Badge, StatBlock, Select } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import {
  Race, CharacterClass, Alignment, AbilityName, AbilityScores,
  ALL_SKILLS, CLASS_HIT_DICE, CLASS_SAVING_THROWS,
  getAbilityModifier, formatModifier, getProficiencyBonus,
  Skill
} from '@/lib/types';

const RACES: Race[] = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling', 'Dragonborn'];
const CLASSES: CharacterClass[] = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
const ALIGNMENTS: Alignment[] = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
];

const ABILITY_NAMES: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const RACE_SPEED: Record<Race, number> = {
  Human: 30, Elf: 30, Dwarf: 25, Halfling: 25, Gnome: 25,
  'Half-Elf': 30, 'Half-Orc': 30, Tiefling: 30, Dragonborn: 30,
};

const RACE_ABILITY_BONUSES: Record<Race, Partial<Record<AbilityName, number>>> = {
  Human: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
  Elf: { dexterity: 2 },
  Dwarf: { constitution: 2 },
  Halfling: { dexterity: 2 },
  Gnome: { intelligence: 2 },
  'Half-Elf': { charisma: 2 },
  'Half-Orc': { strength: 2, constitution: 1 },
  Tiefling: { charisma: 2, intelligence: 1 },
  Dragonborn: { strength: 2, charisma: 1 },
};

// Max skill proficiencies per class at level 1
const CLASS_SKILL_COUNT: Record<CharacterClass, number> = {
  Barbarian: 2, Bard: 3, Cleric: 2, Druid: 2, Fighter: 2,
  Monk: 2, Paladin: 2, Ranger: 3, Rogue: 4, Sorcerer: 2,
  Warlock: 2, Wizard: 2,
};

const STEPS = ['Identity', 'Abilities', 'Skills', 'Details', 'Review'] as const;

const CLASS_DESCRIPTIONS: Record<CharacterClass, string> = {
  Barbarian: 'A fierce warrior of primal rage',
  Bard: 'An inspiring magician with music and words',
  Cleric: 'A priestly champion wielding divine magic',
  Druid: 'A priest of the Old Faith, wielding nature',
  Fighter: 'A master of martial combat',
  Monk: 'A master of martial arts, harnessing ki',
  Paladin: 'A holy warrior bound to a sacred oath',
  Ranger: 'A warrior of the wilderness',
  Rogue: 'A scoundrel who uses stealth and trickery',
  Sorcerer: 'A spellcaster with innate magical power',
  Warlock: 'A wielder of magic from an otherworldly pact',
  Wizard: 'A scholarly magic-user of arcane power',
};

export default function CharacterCreationPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const toast = useToast();
  const [step, setStep] = useState(0);

  // Form state
  const [name, setName] = useState('');
  const [race, setRace] = useState<Race>('Human');
  const [charClass, setCharClass] = useState<CharacterClass>('Fighter');
  const [alignment, setAlignment] = useState<Alignment>('True Neutral');
  const [background, setBackground] = useState('');

  const [scores, setScores] = useState<AbilityScores>({
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10,
  });
  const [scoreMethod, setScoreMethod] = useState<'roll' | 'standard' | 'manual'>('roll');
  const [rolledSets, setRolledSets] = useState<{ rolls: number[]; kept: number[]; total: number }[]>([]);

  const [proficientSkills, setProficientSkills] = useState<Set<string>>(new Set());

  const [traits, setTraits] = useState('');
  const [ideals, setIdeals] = useState('');
  const [bonds, setBonds] = useState('');
  const [flaws, setFlaws] = useState('');

  // Warn before leaving if form has progress
  useEffect(() => {
    const hasProgress = name.trim() !== '' || step > 0;
    const handler = (e: BeforeUnloadEvent) => {
      if (hasProgress) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [name, step]);
  const [backstory, setBackstory] = useState('');

  const hitDie = CLASS_HIT_DICE[charClass];
  const conMod = getAbilityModifier(scores.constitution);
  const maxHP = hitDie + conMod;
  const profBonus = getProficiencyBonus(1);

  // Roll all 6 ability scores
  const rollAllScores = () => {
    const sets = Array.from({ length: 6 }, () => api.roll4d6DropLowest());
    setRolledSets(sets);
    const newScores: AbilityScores = {
      strength: sets[0].total,
      dexterity: sets[1].total,
      constitution: sets[2].total,
      intelligence: sets[3].total,
      wisdom: sets[4].total,
      charisma: sets[5].total,
    };
    setScores(newScores);
  };

  const applyStandardArray = () => {
    const arr = [15, 14, 13, 12, 10, 8];
    setScores({
      strength: arr[0], dexterity: arr[1], constitution: arr[2],
      intelligence: arr[3], wisdom: arr[4], charisma: arr[5],
    });
    setRolledSets([]);
  };

  const toggleSkill = (skillName: string) => {
    setProficientSkills(prev => {
      const next = new Set(prev);
      if (next.has(skillName)) next.delete(skillName);
      else next.add(skillName);
      return next;
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return true;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  const handleCreate = () => {
    if (!user) return;

    // Apply racial ability bonuses to base scores
    const finalScores = { ...scores };
    const bonuses = RACE_ABILITY_BONUSES[race];
    for (const [ab, bonus] of Object.entries(bonuses)) {
      finalScores[ab as AbilityName] = (finalScores[ab as AbilityName] || 0) + (bonus || 0);
    }

    const skills: Skill[] = ALL_SKILLS.map(s => ({
      name: s.name,
      ability: s.ability,
      proficient: proficientSkills.has(s.name),
      expertise: false,
    }));

    const savingThrows: Partial<Record<AbilityName, boolean>> = {};
    CLASS_SAVING_THROWS[charClass].forEach(ab => { savingThrows[ab] = true; });

    const finalConMod = getAbilityModifier(finalScores.constitution);
    const finalMaxHP = Math.max(hitDie + finalConMod, 1);

    api.createCharacter(campaignId, {
      playerId: user.id,
      name: name.trim(),
      race,
      class: charClass,
      level: 1,
      alignment,
      background: background.trim() || 'Adventurer',
      abilityScores: finalScores,
      hp: { current: finalMaxHP, max: finalMaxHP, temp: 0 },
      armorClass: 10 + getAbilityModifier(finalScores.dexterity),
      initiative: getAbilityModifier(finalScores.dexterity),
      speed: RACE_SPEED[race],
      proficiencyBonus: profBonus,
      savingThrows,
      skills,
      spellSlots: [],
      inventory: [],
      deathSaves: { successes: 0, failures: 0 },
      traits: traits.trim(),
      ideals: ideals.trim(),
      bonds: bonds.trim(),
      flaws: flaws.trim(),
      backstory: backstory.trim(),
      notes: '',
    }).then(() => {
      router.push(`/campaign/${campaignId}`);
      toast.success(`${name.trim()} has been created!`);
    }).catch(err => {
      toast.error('Failed to create character');
      console.error(err);
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <button
          onClick={() => router.push(`/campaign/${campaignId}`)}
          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaign
        </button>
        <h1 className="text-xl font-display font-bold">Create Character</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                  i === step ? 'text-accent font-medium' :
                  i < step ? 'text-success' : 'text-text-tertiary'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === step ? 'bg-accent text-surface-0' :
                  i < step ? 'bg-success/20 text-success' : 'bg-surface-2 text-text-tertiary'
                }`}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 max-w-8 ${i < step ? 'bg-success/30' : 'bg-border'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            {/* Step 0: Identity */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-display font-semibold mb-1">Who are you?</h2>
                  <p className="text-sm text-text-secondary">Every legend starts with a name.</p>
                </div>

                <Input
                  label="Character Name"
                  placeholder="Thorin Ironforge"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />

                {/* Race */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Race</label>
                  <div className="grid grid-cols-3 gap-2">
                    {RACES.map(r => (
                      <button
                        key={r}
                        onClick={() => setRace(r)}
                        className={`px-3 py-2 rounded-md text-sm border transition-colors cursor-pointer ${
                          race === r
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border bg-surface-1 text-text-secondary hover:border-text-tertiary'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {/* Racial bonuses preview */}
                  <div className="mt-2 text-xs text-text-tertiary">
                    <span className="text-accent font-medium">{race}</span>
                    {' · Speed: '}{RACE_SPEED[race]}ft
                    {' · '}
                    {Object.entries(RACE_ABILITY_BONUSES[race]).map(([ab, bonus], i) => (
                      <span key={ab}>
                        {i > 0 ? ', ' : ''}{ab.slice(0, 3).toUpperCase()} +{bonus}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Class */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Class</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CLASSES.map(c => (
                      <button
                        key={c}
                        onClick={() => setCharClass(c)}
                        className={`px-3 py-2 rounded-md text-sm border transition-colors text-left cursor-pointer ${
                          charClass === c
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border bg-surface-1 text-text-secondary hover:border-text-tertiary'
                        }`}
                      >
                        <div className="font-medium">{c}</div>
                        <div className="text-[10px] text-text-tertiary mt-0.5">{CLASS_DESCRIPTIONS[c]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alignment */}
                <Select
                  label="Alignment"
                  value={alignment}
                  onChange={e => setAlignment(e.target.value as Alignment)}
                  options={ALIGNMENTS.map(a => ({ value: a, label: a }))}
                />

                <Input
                  label="Background"
                  placeholder="Soldier, Scholar, Criminal..."
                  value={background}
                  onChange={e => setBackground(e.target.value)}
                />
              </div>
            )}

            {/* Step 1: Ability Scores */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-display font-semibold mb-1">Ability Scores</h2>
                  <p className="text-sm text-text-secondary">Define your character&apos;s core attributes.</p>
                </div>

                {/* Method selector */}
                <div className="flex gap-2">
                  {([
                    { key: 'roll', label: 'Roll 4d6', icon: <Dices className="w-3.5 h-3.5" /> },
                    { key: 'standard', label: 'Standard Array', icon: <Sparkles className="w-3.5 h-3.5" /> },
                    { key: 'manual', label: 'Manual', icon: <Swords className="w-3.5 h-3.5" /> },
                  ] as const).map(m => (
                    <button
                      key={m.key}
                      onClick={() => {
                        setScoreMethod(m.key);
                        if (m.key === 'roll') rollAllScores();
                        if (m.key === 'standard') applyStandardArray();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm border transition-colors cursor-pointer ${
                        scoreMethod === m.key
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-text-secondary hover:border-text-tertiary'
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>

                {scoreMethod === 'roll' && (
                  <Button variant="secondary" size="sm" onClick={rollAllScores}>
                    <RotateCcw className="w-3.5 h-3.5" /> Re-roll All
                  </Button>
                )}

                {/* Score grid */}
                <div className="grid grid-cols-3 gap-4">
                  {ABILITY_NAMES.map((ab, i) => (
                    <Card key={ab}>
                      <div className="text-center">
                        <label className="text-[10px] font-semibold text-text-tertiary tracking-wider uppercase">
                          {ab}
                        </label>

                        {scoreMethod === 'manual' ? (
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={scores[ab]}
                            onChange={e => setScores({ ...scores, [ab]: Math.max(1, Math.min(30, Number.parseInt(e.target.value) || 1)) })}
                            className="w-full text-center text-2xl font-bold bg-transparent border-b border-border focus:border-accent outline-none py-1 mt-1"
                          />
                        ) : (
                          <div className="text-2xl font-bold text-text-primary mt-1">{scores[ab]}</div>
                        )}

                        <div className={`text-sm font-mono mt-1 ${getAbilityModifier(scores[ab]) >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatModifier(getAbilityModifier(scores[ab]))}
                        </div>

                        {scoreMethod === 'roll' && rolledSets[i] && (
                          <div className="text-[10px] text-text-tertiary mt-1 font-mono">
                            [{rolledSets[i].rolls.join(', ')}]
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Derived stats preview */}
                <div className="flex items-center gap-6 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-danger" />
                    HP: <span className="font-bold text-text-primary">{Math.max(maxHP, 1)}</span>
                    <span className="text-text-tertiary text-xs">(d{hitDie} + {formatModifier(conMod)})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    AC: <span className="font-bold text-text-primary">{10 + getAbilityModifier(scores.dexterity)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Footprints className="w-4 h-4" />
                    Init: <span className="font-bold text-text-primary">{formatModifier(getAbilityModifier(scores.dexterity))}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Skills */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-display font-semibold mb-1">Skills</h2>
                  <p className="text-sm text-text-secondary">
                    Choose skill proficiencies ({charClass}: up to {CLASS_SKILL_COUNT[charClass]}). Proficient skills get +{profBonus} bonus.
                  </p>
                  {proficientSkills.size > CLASS_SKILL_COUNT[charClass] && (
                    <p className="text-xs text-warning mt-1">⚠ You&apos;ve selected {proficientSkills.size} skills — {charClass} normally gets {CLASS_SKILL_COUNT[charClass]}.</p>
                  )}
                </div>

                <div className="space-y-1">
                  {ALL_SKILLS.map(skill => {
                    const mod = getAbilityModifier(scores[skill.ability]);
                    const isProficient = proficientSkills.has(skill.name);
                    const totalMod = mod + (isProficient ? profBonus : 0);

                    return (
                      <button
                        key={skill.name}
                        onClick={() => toggleSkill(skill.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                          isProficient
                            ? 'bg-accent/10 border border-accent/30 text-accent'
                            : 'bg-surface-1 border border-transparent text-text-secondary hover:bg-surface-2'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full border-2 ${
                            isProficient ? 'bg-accent border-accent' : 'border-text-tertiary'
                          }`} />
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-xs text-text-tertiary">({skill.ability.slice(0, 3).toUpperCase()})</span>
                        </div>
                        <span className={`font-mono text-sm ${totalMod >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatModifier(totalMod)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Saving throws */}
                <div>
                  <h3 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2">
                    Saving Throw Proficiencies ({charClass})
                  </h3>
                  <div className="flex gap-2">
                    {CLASS_SAVING_THROWS[charClass].map(ab => (
                      <Badge key={ab} variant="accent">
                        {ab.charAt(0).toUpperCase() + ab.slice(1)} {formatModifier(getAbilityModifier(scores[ab]) + profBonus)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-display font-semibold mb-1">Character Details</h2>
                  <p className="text-sm text-text-secondary">Give your character depth and personality.</p>
                </div>

                <Textarea
                  label="Personality Traits"
                  placeholder="I idolize a particular hero and constantly refer to their deeds..."
                  value={traits}
                  onChange={e => setTraits(e.target.value)}
                  rows={2}
                />
                <Textarea
                  label="Ideals"
                  placeholder="Greater Good. Our lot is to protect the people..."
                  value={ideals}
                  onChange={e => setIdeals(e.target.value)}
                  rows={2}
                />
                <Textarea
                  label="Bonds"
                  placeholder="I would still lay down my life for the people I served with..."
                  value={bonds}
                  onChange={e => setBonds(e.target.value)}
                  rows={2}
                />
                <Textarea
                  label="Flaws"
                  placeholder="I have a weakness for the vices of the city..."
                  value={flaws}
                  onChange={e => setFlaws(e.target.value)}
                  rows={2}
                />
                <Textarea
                  label="Backstory"
                  placeholder="Tell your character's story..."
                  value={backstory}
                  onChange={e => setBackstory(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-display font-semibold mb-1">Review</h2>
                  <p className="text-sm text-text-secondary">Make sure everything looks right.</p>
                </div>

                <Card>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-display font-bold">{name || 'Unnamed'}</h3>
                      <p className="text-sm text-text-tertiary">{race} {charClass} · Level 1 · {alignment}</p>
                      {background && <p className="text-xs text-text-tertiary mt-0.5">Background: {background}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="accent">AC {10 + getAbilityModifier(scores.dexterity)}</Badge>
                      <Badge variant="success">HP {Math.max(maxHP, 1)}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {ABILITY_NAMES.map(ab => (
                      <StatBlock
                        key={ab}
                        label={ab.slice(0, 3).toUpperCase()}
                        score={scores[ab]}
                        modifier={getAbilityModifier(scores[ab])}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">Proficient Skills</h4>
                      {proficientSkills.size > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.from(proficientSkills).map(s => (
                            <Badge key={s} variant="default">{s}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-text-tertiary text-xs">None selected</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">Saving Throws</h4>
                      <div className="flex flex-wrap gap-1">
                        {CLASS_SAVING_THROWS[charClass].map(ab => (
                          <Badge key={ab} variant="accent">{ab.charAt(0).toUpperCase() + ab.slice(1)}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-tertiary mt-4 pt-4 border-t border-border">
                    <span>Speed: {RACE_SPEED[race]}ft</span>
                    <span>Initiative: {formatModifier(getAbilityModifier(scores.dexterity))}</span>
                    <span>Hit Die: d{hitDie}</span>
                    <span>Prof Bonus: +{profBonus}</span>
                  </div>
                </Card>

                {(traits || ideals || bonds || flaws || backstory) && (
                  <Card>
                    <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Personality</h4>
                    <div className="space-y-2 text-sm text-text-secondary">
                      {traits && <div><span className="text-accent text-xs font-medium">Traits:</span> {traits}</div>}
                      {ideals && <div><span className="text-accent text-xs font-medium">Ideals:</span> {ideals}</div>}
                      {bonds && <div><span className="text-accent text-xs font-medium">Bonds:</span> {bonds}</div>}
                      {flaws && <div><span className="text-accent text-xs font-medium">Flaws:</span> {flaws}</div>}
                      {backstory && <div><span className="text-accent text-xs font-medium">Backstory:</span> {backstory}</div>}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="border-t border-border px-6 py-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate}>
            <Sparkles className="w-4 h-4" /> Create Character
          </Button>
        )}
      </div>
    </div>
  );
}
