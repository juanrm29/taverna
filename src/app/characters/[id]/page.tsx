'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Heart, Shield, Footprints, Swords, Save,
  BookOpen, Scroll, Sparkles, Zap, Crown, Edit3, Wand2, Coins, Star
} from 'lucide-react';
import { Button, Card, Badge, StatBlock } from '@/components/ui';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import {
  AbilityName, getAbilityModifier, formatModifier, CLASS_HIT_DICE,
  CLASS_SAVING_THROWS, ALL_SKILLS
} from '@/lib/types';
import SpellSlotTracker from '@/components/SpellSlotTracker';
import CharacterExport from '@/components/CharacterExport';

const ABILITIES: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const toast = useToast();

  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editHP, setEditHP] = useState(false);
  const [hpCurrent, setHpCurrent] = useState(0);
  const [hpTemp, setHpTemp] = useState(0);

  const loadCharacter = useCallback(async () => {
    try {
      const c = await api.getCharacter(id);
      if (!c) { router.replace('/characters'); return; }
      setCharacter(c);
      setHpCurrent(c.hp?.current || 0);
      setHpTemp(c.hp?.temp || 0);
    } catch {
      router.replace('/characters');
    } finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { if (user) loadCharacter(); }, [user, loadCharacter]);

  const saveHP = async () => {
    if (!character) return;
    try {
      const updated = await api.updateCharacter(character.id, {
        hp: { ...character.hp, current: Math.max(0, hpCurrent), temp: Math.max(0, hpTemp) }
      });
      setCharacter(updated);
      setEditHP(false);
      toast.success('HP updated');
    } catch (err: any) { toast.error(err.message); }
  };

  const updateChar = async (data: any) => {
    if (!character) return;
    try {
      const updated = await api.updateCharacter(character.id, data);
      setCharacter(updated);
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!character) return null;

  const isOwner = character.playerId === user?.id;
  const hitDie = CLASS_HIT_DICE[character.class as keyof typeof CLASS_HIT_DICE] || 8;
  const proficientSkills = (character.skills || []).filter((s: any) => s.proficient);
  const savingThrowProfs = CLASS_SAVING_THROWS[character.class as keyof typeof CLASS_SAVING_THROWS] || [];
  const currency = character.currency ?? { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  const knownSpells = character.knownSpells ?? [];
  const feats = character.feats ?? [];
  const inventory = character.inventory ?? [];

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-4 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">{character.name}</h1>
            <p className="text-text-secondary text-sm">{character.race} {character.class} · Level {character.level} · {character.alignment}</p>
            {character.background && <p className="text-text-tertiary text-xs mt-0.5">Background: {character.background}</p>}
            {character.campaign && (
              <button onClick={() => router.push(`/campaign/${character.campaign.id || character.campaignId}`)} className="text-xs text-accent hover:underline mt-1 cursor-pointer">
                📜 {character.campaign.name}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CharacterExport character={character} variant="icon" />
            {isOwner && (
              <Button variant="secondary" size="sm" onClick={() => router.push(`/characters/${character.id}/edit`)}>
                <Edit3 className="w-3 h-3" /> Edit
              </Button>
            )}
            <Badge variant="accent"><Shield className="w-3 h-3" /> AC {character.armorClass}</Badge>
            <div className="flex items-center gap-1">
              <Badge variant={(character.hp?.current || 0) > (character.hp?.max || 1) / 2 ? 'success' : 'danger'}>
                <Heart className="w-3 h-3" /> {editHP ? (
                  <span className="flex items-center gap-1">
                    <input type="number" value={hpCurrent} onChange={e => setHpCurrent(parseInt(e.target.value) || 0)} className="w-10 bg-transparent border-b border-current text-center text-xs" onClick={e => e.stopPropagation()} />
                    /{character.hp?.max || 0}
                  </span>
                ) : (
                  <span>{character.hp?.current || 0}/{character.hp?.max || 0}</span>
                )}
              </Badge>
              {isOwner && (editHP ? (
                <button onClick={saveHP} className="text-success hover:text-success/80 cursor-pointer"><Save className="w-3.5 h-3.5" /></button>
              ) : (
                <button onClick={() => setEditHP(true)} className="text-text-tertiary hover:text-text-secondary cursor-pointer"><Sparkles className="w-3 h-3" /></button>
              ))}
            </div>
            {(character.hp?.temp || 0) > 0 && <Badge variant="warning">Temp HP: {character.hp.temp}</Badge>}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Ability Scores</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ABILITIES.map(ab => (
                  <StatBlock key={ab} label={ab.slice(0, 3).toUpperCase()} score={character.abilityScores?.[ab] || 10} modifier={getAbilityModifier(character.abilityScores?.[ab] || 10)} proficient={savingThrowProfs.includes(ab)} />
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Skills</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {ALL_SKILLS.map(skill => {
                  const charSkill = (character.skills || []).find((s: any) => s.name === skill.name);
                  const isProficient = charSkill?.proficient || false;
                  const mod = getAbilityModifier(character.abilityScores?.[skill.ability] || 10);
                  const total = mod + (isProficient ? character.proficiencyBonus : 0);
                  return (
                    <div key={skill.name} className={`flex items-center justify-between px-2 py-1.5 rounded text-sm ${isProficient ? 'text-accent' : 'text-text-secondary'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isProficient ? 'bg-accent' : 'bg-surface-3'}`} />
                        <span>{skill.name}</span>
                        <span className="text-[10px] text-text-tertiary">({skill.ability.slice(0, 3).toUpperCase()})</span>
                      </div>
                      <span className={`font-mono text-xs ${total >= 0 ? 'text-success' : 'text-danger'}`}>{formatModifier(total)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {(character.traits || character.ideals || character.bonds || character.flaws || character.backstory) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Personality</h3>
                <div className="space-y-3 text-sm text-text-secondary">
                  {character.traits && <div><span className="text-accent text-xs font-medium block mb-0.5">Traits</span><p>{character.traits}</p></div>}
                  {character.ideals && <div><span className="text-accent text-xs font-medium block mb-0.5">Ideals</span><p>{character.ideals}</p></div>}
                  {character.bonds && <div><span className="text-accent text-xs font-medium block mb-0.5">Bonds</span><p>{character.bonds}</p></div>}
                  {character.flaws && <div><span className="text-accent text-xs font-medium block mb-0.5">Flaws</span><p>{character.flaws}</p></div>}
                  {character.backstory && <div><span className="text-accent text-xs font-medium block mb-0.5">Backstory</span><p className="whitespace-pre-wrap">{character.backstory}</p></div>}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Combat</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-tertiary flex items-center gap-1"><Shield className="w-3 h-3" /> Armor Class</span><span className="font-bold">{character.armorClass}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary flex items-center gap-1"><Swords className="w-3 h-3" /> Initiative</span><span className="font-bold font-mono">{formatModifier(character.initiative)}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary flex items-center gap-1"><Footprints className="w-3 h-3" /> Speed</span><span className="font-bold">{character.speed} ft</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary flex items-center gap-1"><Zap className="w-3 h-3" /> Hit Die</span><span className="font-bold">d{hitDie}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary flex items-center gap-1"><Crown className="w-3 h-3" /> Prof Bonus</span><span className="font-bold">+{character.proficiencyBonus}</span></div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Saving Throws</h3>
            <div className="space-y-1.5">
              {ABILITIES.map(ab => {
                const isProficient = savingThrowProfs.includes(ab);
                const mod = getAbilityModifier(character.abilityScores?.[ab] || 10);
                const total = mod + (isProficient ? character.proficiencyBonus : 0);
                return (
                  <div key={ab} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isProficient ? 'bg-accent' : 'bg-surface-3'}`} />
                      <span className={isProficient ? 'text-accent' : 'text-text-secondary'}>{ab.charAt(0).toUpperCase() + ab.slice(1)}</span>
                    </div>
                    <span className={`font-mono text-xs ${total >= 0 ? 'text-success' : 'text-danger'}`}>{formatModifier(total)}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Death Saves</h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-success block mb-1">Successes</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <button key={`s${i}`} onClick={() => {
                      if (!isOwner) return;
                      const ds = character.deathSaves || { successes: 0, failures: 0 };
                      const newSuccesses = i < ds.successes ? i : i + 1;
                      updateChar({ deathSaves: { ...ds, successes: newSuccesses } });
                    }} className={`w-5 h-5 rounded-full border-2 transition-colors ${isOwner ? 'cursor-pointer hover:border-success' : ''} ${i < (character.deathSaves?.successes || 0) ? 'bg-success border-success' : 'border-text-tertiary'}`} />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-danger block mb-1">Failures</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <button key={`f${i}`} onClick={() => {
                      if (!isOwner) return;
                      const ds = character.deathSaves || { successes: 0, failures: 0 };
                      const newFailures = i < ds.failures ? i : i + 1;
                      updateChar({ deathSaves: { ...ds, failures: newFailures } });
                    }} className={`w-5 h-5 rounded-full border-2 transition-colors ${isOwner ? 'cursor-pointer hover:border-danger' : ''} ${i < (character.deathSaves?.failures || 0) ? 'bg-danger border-danger' : 'border-text-tertiary'}`} />
                  ))}
                </div>
              </div>
            </div>
            {isOwner && ((character.deathSaves?.successes || 0) > 0 || (character.deathSaves?.failures || 0) > 0) && (
              <button onClick={() => updateChar({ deathSaves: { successes: 0, failures: 0 } })} className="mt-2 text-[10px] text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer">Reset saves</button>
            )}
          </Card>

          <Card>
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Inventory</h3>
            {inventory.length === 0 ? (
              <p className="text-xs text-text-tertiary">No items yet</p>
            ) : (
              <div className="space-y-1">
                {inventory.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary">{item.name}</span>
                      {item.quantity > 1 && <span className="text-[10px] text-text-tertiary">×{item.quantity}</span>}
                      {item.equipped && <Badge variant="accent">Equipped</Badge>}
                    </div>
                    {item.weight > 0 && <span className="text-[10px] text-text-tertiary">{item.weight} lb</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {(currency.cp > 0 || currency.sp > 0 || currency.ep > 0 || currency.gp > 0 || currency.pp > 0) && (
            <Card>
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> Currency</h3>
              <div className="grid grid-cols-5 gap-1 text-center text-xs">
                {currency.pp > 0 && <div><span className="font-bold text-accent">{currency.pp}</span><br /><span className="text-text-tertiary">PP</span></div>}
                {currency.gp > 0 && <div><span className="font-bold text-warning">{currency.gp}</span><br /><span className="text-text-tertiary">GP</span></div>}
                {currency.ep > 0 && <div><span className="font-bold text-text-secondary">{currency.ep}</span><br /><span className="text-text-tertiary">EP</span></div>}
                {currency.sp > 0 && <div><span className="font-bold text-text-secondary">{currency.sp}</span><br /><span className="text-text-tertiary">SP</span></div>}
                {currency.cp > 0 && <div><span className="font-bold text-text-secondary">{currency.cp}</span><br /><span className="text-text-tertiary">CP</span></div>}
              </div>
            </Card>
          )}

          {knownSpells.length > 0 && (
            <Card>
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-1"><Wand2 className="w-3.5 h-3.5" /> Spells ({knownSpells.length})</h3>
              <div className="space-y-1">
                {knownSpells.filter((s: any) => s.prepared || s.level === 0).slice(0, 10).map((spell: any) => (
                  <div key={spell.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      {spell.level === 0 ? <span className="text-[10px] text-text-tertiary">C</span> : <span className="text-[10px] text-accent">{spell.level}</span>}
                      <span className="text-text-primary">{spell.name}</span>
                      {spell.concentration && <Zap className="w-3 h-3 text-warning" />}
                    </div>
                    {spell.prepared && <Star className="w-3 h-3 text-accent fill-accent" />}
                  </div>
                ))}
                {knownSpells.length > 10 && <p className="text-[10px] text-text-tertiary">+{knownSpells.length - 10} more...</p>}
              </div>
            </Card>
          )}

          <SpellSlotTracker character={character} onUpdate={setCharacter} isOwner={isOwner} />

          {feats.length > 0 && (
            <Card>
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Feats ({feats.length})</h3>
              <div className="flex flex-wrap gap-1">
                {feats.map((f: any) => <Badge key={f.id} variant="accent">{f.name}</Badge>)}
              </div>
            </Card>
          )}

          {proficientSkills.length > 0 && (
            <Card>
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Proficiencies</h3>
              <div className="flex flex-wrap gap-1">
                {proficientSkills.map((s: any) => <Badge key={s.name} variant="accent">{s.name}</Badge>)}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
