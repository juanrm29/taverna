'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Users, Beer, Scroll, Wand2, Skull, Swords, RefreshCw,
  Copy, Plus, Dice6, Map, Crown, Heart, Zap, BookOpen, Star, Shield, Save
} from 'lucide-react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { useToast } from '@/components/Feedback';
import { useTranslation } from '@/lib/i18n';
import {
  RANDOM_NPC_NAMES, RANDOM_TAVERN_NAMES, PLOT_HOOKS,
  RACES, CLASSES, ALIGNMENTS, ALL_CONDITIONS,
  Race, CharacterClass, Alignment, AbilityName
} from '@/lib/types';
import * as api from '@/lib/api-client';
import { useSession } from 'next-auth/react';

// ============================================================
// RANDOM GENERATOR DATA
// ============================================================

const WILD_MAGIC_SURGE = [
  'Roll on this table at the start of each turn for 1 minute. Each roll triggers a new effect.',
  'You cast Fireball centered on yourself (3rd level).',
  'You turn into a potted plant until the start of your next turn.',
  'For the next minute, you can see invisible creatures.',
  'A unicorn controlled by the DM appears within 5ft of you, then disappears after 1 minute.',
  'You cast Magic Missile (5th level).',
  'Roll a d10. Your height changes by that many inches (grow on even, shrink on odd).',
  'You cast Confusion centered on yourself.',
  'For the next minute, you regain 5 HP at the start of each turn.',
  'You grow a long beard of feathers that lasts until you sneeze.',
  'You cast Grease centered on yourself.',
  'Each creature within 30ft becomes invisible for 1 minute (concentration breaks it).',
  'You gain resistance to all damage for 1 minute.',
  'A random creature within 60ft is poisoned for 1d4 hours.',
  'You glow with bright light in a 30ft radius for 1 minute.',
  'You cast Polymorph on yourself. On fail, turn into a sheep.',
  'Illusory butterflies and flower petals flutter near you for 1 minute.',
  'You can take one additional action immediately.',
  'Each creature within 30ft takes 1d10 necrotic damage. You regain equal HP.',
  'You cast Mirror Image.',
  'You cast Fly on a random creature within 60ft.',
  'You become invisible for 1 minute (or until you attack/cast).',
  'If you die in the next minute, you immediately come back with full HP.',
  'Your size increases by one category for 1 minute.',
  'You and all within 30ft gain vulnerability to piercing for 1 minute.',
  'You are surrounded by faint ethereal music for 1 minute.',
  'You regain all expended sorcery points.',
  'You teleport up to 60ft to an unoccupied space you can see.',
  'You are transported to the Astral Plane for 1 round, then return.',
  'Maximize the damage of the next damaging spell you cast within 1 minute.',
  'Roll a d10: 1-5 you shrink, 6-10 you grow. Size changes 1d10 inches.',
  'You cast Levitate on yourself.',
  'A spectral shield hovers near you: +2 AC for 1 minute.',
  'You can\'t speak for 1 minute. Whenever you try, bubbles come out.',
  'A beholder eye appears, stares at you, then vanishes.',
  '1d6 flumphs appear. They are frightened of you and flee.',
  'You regain 2d10 HP.',
  'You turn into a potted plant until the start of your next turn.',
  'For 1 minute, you can teleport up to 20ft as a bonus action.',
  'You cast Confusion centered on yourself.',
  '3d6 gems worth 50gp each appear at your feet.',
  'A large mouth appears on your forehead. It mimics everything you say.',
  'You cast Fog Cloud centered on yourself.',
  'Up to 3 creatures you choose within 30ft take 4d10 lightning damage.',
  'You are frightened by the nearest creature until the end of your next turn.',
  'Each creature within 30ft becomes invisible for 1 minute.',
  'You gain resistance to all damage for 1 minute.',
  'A random creature near you becomes poisoned for 1d4 hours.',
  'Your skin turns vibrant blue. Remove Curse ends it.',
  'A third eye appears on your forehead, granting advantage on Perception for 1 minute.',
];

const TREASURE_HOARD_INDIVIDUAL = {
  low: [
    '5d6 copper pieces', '4d6 silver pieces', '3d6 electrum pieces',
    '3d6 gold pieces', 'A small gemstone worth 10gp',
    'A trinket (roll on trinket table)', '2d6 silver + 1d6 gold pieces',
  ],
  medium: [
    '4d6 × 10 silver pieces', '6d6 gold pieces', '2d6 × 10 gold pieces',
    '3d6 platinum pieces', 'A gemstone worth 50gp',
    'A potion of healing', 'A scroll of a 1st-level spell',
  ],
  high: [
    '2d6 × 100 gold pieces', '8d6 × 10 gold pieces', '1d6 × 100 gold pieces + 2d6 platinum',
    'A gemstone worth 500gp', 'A magic item (roll on Magic Item Table A)',
    'A +1 weapon of DM\'s choice', 'A potion of greater healing + 3d6 × 10 gold',
  ],
  legendary: [
    '12d6 × 1000 gold pieces', '8d6 × 1000 gold + 5d6 × 100 platinum',
    'A legendary magic item', 'Scroll of a 7th-level spell + 2d6 gemstones (1000gp each)',
    'Vorpal Sword', 'Staff of Power + 4d6 × 1000 gold',
    'Ring of Three Wishes (1d3 wishes remaining)',
  ],
};

const NPC_TRAITS = [
  'Speaks in rhymes', 'Constantly fidgeting', 'Overly formal', 'Tells terrible jokes',
  'Paranoid about being followed', 'Always hungry', 'Whistles when nervous',
  'Has a distinctive scar', 'Collects unusual trinkets', 'Speaks very softly',
  'Laughs at inappropriate moments', 'Has a catchphrase', 'Extremely polite',
  'Distrusts magic', 'Loves animals', 'Has a secret', 'Former adventurer',
  'Owes a debt', 'Seeking revenge', 'Has prophetic dreams', 'Allergic to something common',
  'Lost something valuable', 'Has an unusual pet', 'Talks to themselves',
  'Never makes eye contact', 'Obsessed with cleanliness', 'Superstitious',
  'Tells stories about "the good old days"', 'Has an identical twin', 'Sleepwalks',
];

const NPC_MOTIVATIONS = [
  'Wealth and luxury', 'Power over others', 'Protecting their family', 'Redemption for past sins',
  'Knowledge and discovery', 'Freedom from oppression', 'Revenge against a wrongdoer',
  'Preserving the natural order', 'Fame and recognition', 'Creating a masterwork',
  'Serving their deity', 'Uniting warring factions', 'Escaping their past',
  'Finding true love', 'Proving themselves worthy', 'Breaking a curse',
];

const ENCOUNTER_ENVIRONMENTS = [
  'Dense Forest Clearing', 'Underground Cavern', 'Crumbling Castle Ruins',
  'River Crossing', 'Mountain Pass', 'Desert Oasis', 'Swamp Bog',
  'City Alleyway', 'Tavern Back Room', 'Ship Deck', 'Ancient Temple',
  'Graveyard at Night', 'Frozen Lake', 'Volcanic Rift', 'Enchanted Garden',
];

const MONSTER_GROUPS_BY_CR = [
  { cr: '1/4', monsters: ['Goblin ×4', 'Kobold ×6', 'Skeleton ×3', 'Wolf ×2'] },
  { cr: '1/2', monsters: ['Orc ×3', 'Hobgoblin ×2', 'Scout ×3', 'Shadow ×2'] },
  { cr: '1', monsters: ['Bugbear ×2', 'Ghoul ×3', 'Spy ×2', 'Dire Wolf'] },
  { cr: '2', monsters: ['Ogre', 'Bandit Captain + Bandits ×4', 'Ghast ×2', 'Ankheg ×2'] },
  { cr: '3', monsters: ['Owlbear', 'Minotaur', 'Manticore', 'Knight + Guards ×3'] },
  { cr: '5', monsters: ['Troll', 'Elemental (any)', 'Hill Giant', 'Wraith + Specters ×3'] },
  { cr: '8', monsters: ['Assassin ×2', 'Frost Giant', 'Hydra', 'Young Dragon'] },
  { cr: '11', monsters: ['Beholder', 'Dao/Djinni/Efreeti/Marid', 'Roc', 'Gynosphinx'] },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function rollStat(): number {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => b - a);
  return rolls[0] + rolls[1] + rolls[2];
}

type GeneratorTab = 'npc' | 'tavern' | 'encounter' | 'loot' | 'wildmagic' | 'plots';

// ============================================================
// NPC Generator Panel
// ============================================================
function NPCGenerator() {
  const toast = useToast();
  const { t } = useTranslation();
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [npc, setNPC] = useState<{
    name: string; race: Race; class: CharacterClass; alignment: Alignment;
    trait1: string; trait2: string; motivation: string;
    str: number; dex: number; con: number; int: number; wis: number; cha: number;
    hp: number; ac: number; quirk: string;
  } | null>(null);

  const generate = useCallback(() => {
    const race = pick(RACES);
    const cls = pick(CLASSES);
    const [t1, t2] = pickN(NPC_TRAITS, 2);
    const con = rollStat();
    const level = Math.floor(Math.random() * 8) + 1;
    const hitDie = { Barbarian:12,Fighter:10,Paladin:10,Ranger:10,Bard:8,Cleric:8,Druid:8,Monk:8,Rogue:8,Warlock:8,Sorcerer:6,Wizard:6 }[cls];
    const conMod = Math.floor((con - 10) / 2);
    setNPC({
      name: `${pick(RANDOM_NPC_NAMES.first)} ${pick(RANDOM_NPC_NAMES.last)}`,
      race, class: cls,
      alignment: pick(ALIGNMENTS),
      trait1: t1, trait2: t2,
      motivation: pick(NPC_MOTIVATIONS),
      str: rollStat(), dex: rollStat(), con, int: rollStat(), wis: rollStat(), cha: rollStat(),
      hp: Math.max(1, (hitDie + conMod) + (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod)),
      ac: 10 + Math.floor((rollStat() - 10) / 2) + (['Fighter','Paladin','Cleric'].includes(cls) ? 6 : ['Ranger','Rogue','Monk','Barbarian'].includes(cls) ? 2 : 0),
      quirk: pick(NPC_TRAITS),
    });
  }, []);

  // Load user campaigns
  React.useEffect(() => {
    if (user) {
      api.getCampaigns().then(camps => {
        setCampaigns(camps.map((c: any) => ({ id: c.id, name: c.name })));
        if (camps.length > 0 && !selectedCampaign) setSelectedCampaign(camps[0].id);
      }).catch(() => {});
    }
  }, [user, selectedCampaign]);

  return (
    <div className="space-y-4">
      <Button onClick={generate} className="w-full">
        <Sparkles className="w-4 h-4" /> {t.generators.generateNPC}
      </Button>
      {npc && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-display font-bold">{npc.name}</h3>
                <p className="text-sm text-text-secondary">{npc.race} {npc.class} · {npc.alignment}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(`${npc.name} — ${npc.race} ${npc.class}, ${npc.alignment}\nHP: ${npc.hp} AC: ${npc.ac}\nSTR ${npc.str} DEX ${npc.dex} CON ${npc.con} INT ${npc.int} WIS ${npc.wis} CHA ${npc.cha}\nTraits: ${npc.trait1}, ${npc.trait2}\nMotivation: ${npc.motivation}`); toast.success(t.generators.copiedToClipboard); }} className="text-text-tertiary hover:text-accent cursor-pointer">
                <Copy className="w-4 h-4" />
              </button>
              {selectedCampaign && (
                <button onClick={() => {
                  api.createNPC(selectedCampaign, {
                    name: npc.name,
                    race: `${npc.race}`,
                    description: `${npc.race} ${npc.class}, ${npc.alignment}`,
                    personality: `${npc.trait1}. ${npc.trait2}.`,
                    motivation: npc.motivation,
                    stats: { strength: npc.str, dexterity: npc.dex, constitution: npc.con, intelligence: npc.int, wisdom: npc.wis, charisma: npc.cha },
                    hp: npc.hp,
                    armorClass: npc.ac,
                    isAlive: true,
                    notes: `Quirk: ${npc.quirk}`,
                  });
                  toast.success(`${npc.name} saved to campaign!`);
                }} className="text-text-tertiary hover:text-success cursor-pointer" title="Save NPC to campaign">
                  <Save className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {[{l:'STR',v:npc.str},{l:'DEX',v:npc.dex},{l:'CON',v:npc.con},{l:'INT',v:npc.int},{l:'WIS',v:npc.wis},{l:'CHA',v:npc.cha}].map(s => (
                <div key={s.l} className="text-center bg-surface-2 rounded-lg px-1 py-2">
                  <div className="text-[9px] text-text-tertiary font-medium">{s.l}</div>
                  <div className="text-sm font-bold">{s.v}</div>
                  <div className="text-[10px] text-accent font-mono">{Math.floor((s.v-10)/2) >= 0 ? '+' : ''}{Math.floor((s.v-10)/2)}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-danger" /> <span className="text-text-tertiary">HP:</span> <span className="font-bold">{npc.hp}</span></div>
              <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-accent" /> <span className="text-text-tertiary">AC:</span> <span className="font-bold">{npc.ac}</span></div>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-accent text-xs font-medium">{t.generators.personality}</span> <span className="text-text-secondary">{npc.trait1}. {npc.trait2}.</span></div>
              <div><span className="text-accent text-xs font-medium">{t.generators.motivation}</span> <span className="text-text-secondary">{npc.motivation}</span></div>
              <div><span className="text-accent text-xs font-medium">{t.generators.quirk}</span> <span className="text-text-secondary">{npc.quirk}</span></div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Tavern Generator
// ============================================================
function TavernGenerator() {
  const toast = useToast();
  const { t } = useTranslation();
  const [tavern, setTavern] = useState<{ name: string; barkeep: string; specialty: string; rumor: string; atmosphere: string } | null>(null);

  const SPECIALTIES = [
    'Dragon Breath Ale — so spicy it literally smokes',
    'Moonberry Wine — glows faintly blue in the dark',
    'Dwarven Stout — thick enough to stand a spoon in',
    'Elven Mead — tastes of wildflowers and starlight',
    'Halfling Harvest Cider — warm and deceptively potent',
    'Shadow Whiskey — shifts color as you drink',
    'Phoenix Firewater — warms you from the inside out',
    'Giant\'s Gulp — served in comically large tankards',
  ];

  const ATMOSPHERES = [
    'Warm and welcoming, with a roaring fire and lively music',
    'Dimly lit, with hushed conversations and suspicious glances',
    'Rowdy and chaotic, with arm-wrestling and thrown tankards',
    'Elegant and refined, with a string quartet and fine silverware',
    'Cramped and smoky, with a mysterious back room',
    'Open-air beer garden with fairy lights and climbing vines',
    'Nautical themed, with ship parts as decor and salty air',
    'Cave tavern carved from stone, with bioluminescent mushrooms',
  ];

  const generate = () => {
    setTavern({
      name: pick(RANDOM_TAVERN_NAMES),
      barkeep: `${pick(RANDOM_NPC_NAMES.first)} ${pick(RANDOM_NPC_NAMES.last)}`,
      specialty: pick(SPECIALTIES),
      rumor: pick(PLOT_HOOKS),
      atmosphere: pick(ATMOSPHERES),
    });
  };

  return (
    <div className="space-y-4">
      <Button onClick={generate} className="w-full"><Beer className="w-4 h-4" /> {t.generators.generateTavern}</Button>
      {tavern && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-display font-bold">{tavern.name}</h3>
              <button onClick={() => { navigator.clipboard.writeText(`${tavern.name}\nBarkeep: ${tavern.barkeep}\nSpecialty: ${tavern.specialty}\nAtmosphere: ${tavern.atmosphere}\nRumor: ${tavern.rumor}`); toast.success(t.generators.copiedToClipboard); }} className="text-text-tertiary hover:text-accent cursor-pointer"><Copy className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-accent text-xs font-medium">{t.generators.barkeep}</span> <span className="text-text-secondary">{tavern.barkeep}</span></div>
              <div><span className="text-accent text-xs font-medium">{t.generators.houseSpecialty}</span> <span className="text-text-secondary">{tavern.specialty}</span></div>
              <div><span className="text-accent text-xs font-medium">{t.generators.atmosphere}</span> <span className="text-text-secondary">{tavern.atmosphere}</span></div>
              <div className="bg-surface-2 rounded-lg px-3 py-2 border-l-2 border-warning">
                <span className="text-warning text-xs font-medium block mb-0.5">🗣️ {t.generators.overheardRumor}</span>
                <span className="text-text-secondary text-xs italic">&quot;{tavern.rumor}&quot;</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Encounter Generator
// ============================================================
function EncounterGenerator() {
  const [encounter, setEncounter] = useState<{ env: string; monsters: string; twist: string; terrain: string } | null>(null);
  const toast = useToast();
  const { t } = useTranslation();

  const TWISTS = [
    'A third faction arrives mid-combat', 'The terrain starts collapsing',
    'One enemy offers to surrender with info', 'A powerful creature watches from the shadows',
    'The enemies are protecting something valuable', 'Environmental hazard activates each round',
    'An innocent NPC is caught in the crossfire', 'The enemies are an illusion — the real threat is elsewhere',
    'Reinforcements arrive in 1d4 rounds', 'One enemy is actually a polymorphed ally',
  ];
  const TERRAINS = [
    'Difficult terrain (half movement)', 'Elevated positions (high ground advantage)',
    'Cover abundant (half/three-quarters)', 'Narrow chokepoints',
    'Water hazard (swimming required)', 'Darkness (no natural light)',
    'Magical hazard (wild magic zone)', 'Trapped floor (DEX save DC 13)',
  ];

  const generate = () => {
    const group = pick(MONSTER_GROUPS_BY_CR);
    setEncounter({
      env: pick(ENCOUNTER_ENVIRONMENTS),
      monsters: `CR ${group.cr}: ${pick(group.monsters)}`,
      twist: pick(TWISTS),
      terrain: pick(TERRAINS),
    });
  };

  return (
    <div className="space-y-4">
      <Button onClick={generate} className="w-full"><Swords className="w-4 h-4" /> {t.generators.generateEncounter}</Button>
      {encounter && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold">{encounter.env}</h3>
              <button onClick={() => { navigator.clipboard.writeText(`${encounter.env}\n${encounter.monsters}\nTerrain: ${encounter.terrain}\nTwist: ${encounter.twist}`); toast.success(t.generators.copiedToClipboard); }} className="text-text-tertiary hover:text-accent cursor-pointer"><Copy className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-danger text-xs font-medium">{t.generators.enemies}</span> <span className="text-text-secondary">{encounter.monsters}</span></div>
              <div><span className="text-accent text-xs font-medium">{t.generators.terrain}</span> <span className="text-text-secondary">{encounter.terrain}</span></div>
              <div className="bg-warning/5 rounded-lg px-3 py-2 border-l-2 border-warning">
                <span className="text-warning text-xs font-medium">⚡ {t.generators.twist}</span> <span className="text-text-secondary text-xs"> {encounter.twist}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Loot Generator
// ============================================================
function LootGenerator() {
  const [tier, setTier] = useState<'low' | 'medium' | 'high' | 'legendary'>('low');
  const [results, setResults] = useState<string[]>([]);
  const toast = useToast();
  const { t } = useTranslation();

  const generate = () => {
    const count = tier === 'low' ? 3 : tier === 'medium' ? 3 : tier === 'high' ? 2 : 1;
    const items = pickN(TREASURE_HOARD_INDIVIDUAL[tier], count);
    setResults(items);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-1.5">
        {(['low', 'medium', 'high', 'legendary'] as const).map(t => (
          <button key={t} onClick={() => setTier(t)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer capitalize ${tier === t ? 'bg-accent/15 text-accent border border-accent/30' : 'bg-surface-2 text-text-tertiary border border-border hover:border-accent/20'}`}>
            {t}
          </button>
        ))}
      </div>
      <Button onClick={generate} className="w-full"><Crown className="w-4 h-4" /> {t.generators.generateLoot} ({tier})</Button>
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <h3 className="text-xs font-semibold text-text-tertiary uppercase mb-2">{t.generators.lootFound}</h3>
            <div className="space-y-2">
              {results.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Star className="w-3.5 h-3.5 text-warning shrink-0" />
                  <span className="text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(results.join('\n')); toast.success(t.generators.copiedToClipboard); }}
              className="mt-3 text-[10px] text-text-tertiary hover:text-accent cursor-pointer flex items-center gap-1">
              <Copy className="w-3 h-3" /> Copy all
            </button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Wild Magic Surge
// ============================================================
function WildMagicPanel() {
  const [effect, setEffect] = useState<string | null>(null);
  const [rollNum, setRollNum] = useState(0);
  const { t } = useTranslation();

  const surge = () => {
    const roll = Math.floor(Math.random() * WILD_MAGIC_SURGE.length);
    setRollNum(roll + 1);
    setEffect(WILD_MAGIC_SURGE[roll]);
  };

  return (
    <div className="space-y-4">
      <Button onClick={surge} className="w-full"><Wand2 className="w-4 h-4" /> {t.generators.wildMagicSurge}</Button>
      {effect && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌀</span>
              <span className="text-xs text-purple-400 font-mono">Roll: {rollNum}</span>
            </div>
            <p className="text-sm text-text-secondary">{effect}</p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Plot Hook Generator
// ============================================================
function PlotHookPanel() {
  const [hooks, setHooks] = useState<string[]>([]);
  const toast = useToast();
  const { t } = useTranslation();

  const generate = () => setHooks(pickN(PLOT_HOOKS, 3));

  return (
    <div className="space-y-4">
      <Button onClick={generate} className="w-full"><Scroll className="w-4 h-4" /> {t.generators.generatePlotHooks}</Button>
      {hooks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          {hooks.map((hook, i) => (
            <Card key={i} className="!py-3">
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold text-sm">{i + 1}.</span>
                <p className="text-sm text-text-secondary">{hook}</p>
              </div>
            </Card>
          ))}
          <button onClick={() => { navigator.clipboard.writeText(hooks.join('\n')); toast.success(t.generators.copiedToClipboard); }}
            className="text-[10px] text-text-tertiary hover:text-accent cursor-pointer flex items-center gap-1">
            <Copy className="w-3 h-3" /> Copy all
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function GeneratorsPage() {
  const [activeTab, setActiveTab] = useState<GeneratorTab>('npc');
  const { t } = useTranslation();

  const TABS: { key: GeneratorTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'npc', label: t.generators.npc, icon: <Users className="w-4 h-4" />, desc: t.generators.generateNPC },
    { key: 'tavern', label: t.generators.tavern, icon: <Beer className="w-4 h-4" />, desc: t.generators.generateTavern },
    { key: 'encounter', label: t.generators.encounter, icon: <Swords className="w-4 h-4" />, desc: t.generators.generateEncounter },
    { key: 'loot', label: t.generators.loot, icon: <Crown className="w-4 h-4" />, desc: t.generators.generateLoot },
    { key: 'wildmagic', label: t.generators.wildMagic, icon: <Wand2 className="w-4 h-4" />, desc: t.generators.wildMagicSurge },
    { key: 'plots', label: t.generators.plotHooks, icon: <Scroll className="w-4 h-4" />, desc: t.generators.generatePlotHooks },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Sparkles className="w-5 h-5 text-accent" />
        <h1 className="text-2xl font-display font-bold">{t.generators.title}</h1>
      </div>
      <p className="text-text-secondary text-sm mb-6">{t.generators.subtitle}</p>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Tab selector */}
        <div className="space-y-1.5">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'bg-surface-1 text-text-secondary border border-border hover:border-accent/20 hover:bg-surface-2'
              }`}
            >
              <div className={`p-2 rounded-lg ${activeTab === tab.key ? 'bg-accent/15' : 'bg-surface-2'}`}>
                {tab.icon}
              </div>
              <div>
                <span className="text-sm font-medium block">{tab.label}</span>
                <span className="text-[10px] text-text-tertiary">{tab.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Active panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'npc' && <NPCGenerator />}
            {activeTab === 'tavern' && <TavernGenerator />}
            {activeTab === 'encounter' && <EncounterGenerator />}
            {activeTab === 'loot' && <LootGenerator />}
            {activeTab === 'wildmagic' && <WildMagicPanel />}
            {activeTab === 'plots' && <PlotHookPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
