'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Book, Sword, Shield, Sparkles, Skull, Users, ScrollText, Search, ChevronRight, Flame, Wand2, Swords, Bug, Heart } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

// Searchable index of compendium items (name → link + category)
const SEARCH_INDEX: { name: string; category: string; href: string }[] = [
  // Spells
  { name: 'Fire Bolt', category: 'Spells', href: '/compendium/spells' },
  { name: 'Mage Hand', category: 'Spells', href: '/compendium/spells' },
  { name: 'Prestidigitation', category: 'Spells', href: '/compendium/spells' },
  { name: 'Shield', category: 'Spells', href: '/compendium/spells' },
  { name: 'Magic Missile', category: 'Spells', href: '/compendium/spells' },
  { name: 'Cure Wounds', category: 'Spells', href: '/compendium/spells' },
  { name: 'Healing Word', category: 'Spells', href: '/compendium/spells' },
  { name: 'Thunderwave', category: 'Spells', href: '/compendium/spells' },
  { name: 'Fireball', category: 'Spells', href: '/compendium/spells' },
  { name: 'Counterspell', category: 'Spells', href: '/compendium/spells' },
  { name: 'Lightning Bolt', category: 'Spells', href: '/compendium/spells' },
  { name: 'Eldritch Blast', category: 'Spells', href: '/compendium/spells' },
  { name: 'Sacred Flame', category: 'Spells', href: '/compendium/spells' },
  { name: 'Ray of Frost', category: 'Spells', href: '/compendium/spells' },
  { name: 'Misty Step', category: 'Spells', href: '/compendium/spells' },
  // Monsters
  { name: 'Goblin', category: 'Monsters', href: '/compendium/monsters' },
  { name: 'Skeleton', category: 'Monsters', href: '/compendium/monsters' },
  { name: 'Zombie', category: 'Monsters', href: '/compendium/monsters' },
  { name: 'Orc', category: 'Monsters', href: '/compendium/monsters' },
  { name: 'Wolf', category: 'Monsters', href: '/compendium/monsters' },
  { name: 'Dragon', category: 'Monsters', href: '/compendium/monsters' },
  { name: 'Beholder', category: 'Monsters', href: '/compendium/monsters' },
  { name: 'Owlbear', category: 'Monsters', href: '/compendium/monsters' },
  { name: 'Mimic', category: 'Monsters', href: '/compendium/monsters' },
  { name: 'Kobold', category: 'Monsters', href: '/compendium/monsters' },
  // Equipment
  { name: 'Longsword', category: 'Equipment', href: '/compendium/equipment' },
  { name: 'Greatsword', category: 'Equipment', href: '/compendium/equipment' },
  { name: 'Shortbow', category: 'Equipment', href: '/compendium/equipment' },
  { name: 'Longbow', category: 'Equipment', href: '/compendium/equipment' },
  { name: 'Chain Mail', category: 'Equipment', href: '/compendium/equipment' },
  { name: 'Plate Armor', category: 'Equipment', href: '/compendium/equipment' },
  { name: 'Shield', category: 'Equipment', href: '/compendium/equipment' },
  { name: 'Healing Potion', category: 'Equipment', href: '/compendium/equipment' },
  { name: 'Dagger', category: 'Equipment', href: '/compendium/equipment' },
  { name: 'Staff', category: 'Equipment', href: '/compendium/equipment' },
  // Classes
  { name: 'Barbarian', category: 'Classes', href: '/compendium/classes' },
  { name: 'Bard', category: 'Classes', href: '/compendium/classes' },
  { name: 'Cleric', category: 'Classes', href: '/compendium/classes' },
  { name: 'Druid', category: 'Classes', href: '/compendium/classes' },
  { name: 'Fighter', category: 'Classes', href: '/compendium/classes' },
  { name: 'Monk', category: 'Classes', href: '/compendium/classes' },
  { name: 'Paladin', category: 'Classes', href: '/compendium/classes' },
  { name: 'Ranger', category: 'Classes', href: '/compendium/classes' },
  { name: 'Rogue', category: 'Classes', href: '/compendium/classes' },
  { name: 'Sorcerer', category: 'Classes', href: '/compendium/classes' },
  { name: 'Warlock', category: 'Classes', href: '/compendium/classes' },
  { name: 'Wizard', category: 'Classes', href: '/compendium/classes' },
  // Races
  { name: 'Human', category: 'Races', href: '/compendium/races' },
  { name: 'Elf', category: 'Races', href: '/compendium/races' },
  { name: 'Dwarf', category: 'Races', href: '/compendium/races' },
  { name: 'Halfling', category: 'Races', href: '/compendium/races' },
  { name: 'Gnome', category: 'Races', href: '/compendium/races' },
  { name: 'Half-Elf', category: 'Races', href: '/compendium/races' },
  { name: 'Half-Orc', category: 'Races', href: '/compendium/races' },
  { name: 'Tiefling', category: 'Races', href: '/compendium/races' },
  { name: 'Dragonborn', category: 'Races', href: '/compendium/races' },
  // Rules
  { name: 'Blinded', category: 'Rules', href: '/compendium/rules' },
  { name: 'Charmed', category: 'Rules', href: '/compendium/rules' },
  { name: 'Frightened', category: 'Rules', href: '/compendium/rules' },
  { name: 'Grappled', category: 'Rules', href: '/compendium/rules' },
  { name: 'Incapacitated', category: 'Rules', href: '/compendium/rules' },
  { name: 'Poisoned', category: 'Rules', href: '/compendium/rules' },
  { name: 'Prone', category: 'Rules', href: '/compendium/rules' },
  { name: 'Stunned', category: 'Rules', href: '/compendium/rules' },
  { name: 'Attack', category: 'Rules', href: '/compendium/rules' },
  { name: 'Dodge', category: 'Rules', href: '/compendium/rules' },
  { name: 'Dash', category: 'Rules', href: '/compendium/rules' },
  { name: 'Disengage', category: 'Rules', href: '/compendium/rules' },
];

function useCompendiumSections() {
  const { t } = useTranslation();
  return [
    { title: t.compendium.spells, description: t.compendium.spellsDesc, icon: Sparkles, href: '/compendium/spells', count: '30+', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: t.compendium.monsters, description: t.compendium.monstersDesc, icon: Skull, href: '/compendium/monsters', count: '20+', color: 'text-red-400', bg: 'bg-red-500/10' },
    { title: t.compendium.equipment, description: t.compendium.equipmentDesc, icon: Sword, href: '/compendium/equipment', count: '100+', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: t.compendium.classes, description: t.compendium.classesDesc, icon: Shield, href: '/compendium/classes', count: '12', color: 'text-success', bg: 'bg-success/10' },
    { title: t.compendium.races, description: t.compendium.racesDesc, icon: Users, href: '/compendium/races', count: '12', color: 'text-warning', bg: 'bg-warning/10' },
    { title: t.compendium.rules, description: t.compendium.rulesDesc, icon: ScrollText, href: '/compendium/rules', count: '50+', color: 'text-accent', bg: 'bg-accent/10' },
  ];
}

function useQuickRefs() {
  const { t } = useTranslation();
  return [
    { label: t.compendium.rules, icon: Bug, href: '/compendium/rules#conditions' },
    { label: t.compendium.rules, icon: Swords, href: '/compendium/rules#actions' },
    { label: t.compendium.equipment, icon: Heart, href: '/compendium/equipment' },
    { label: t.compendium.classes, icon: Flame, href: '/compendium/classes' },
    { label: t.compendium.spells, icon: Wand2, href: '/compendium/spells' },
  ];
}

export default function CompendiumPage() {
  const { t } = useTranslation();
  const COMPENDIUM_SECTIONS = useCompendiumSections();
  const QUICK_REFS = useQuickRefs();
  const [search, setSearch] = useState('');

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return SEARCH_INDEX.filter(item =>
      item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [search]);

  const filteredSections = COMPENDIUM_SECTIONS.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Book className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-display font-bold text-text-primary">{t.compendium.title}</h1>
        </div>
        <p className="text-sm text-text-secondary max-w-xl">
          {t.compendium.subtitle}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder={t.compendium.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4"
        />
      </motion.div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-2">
            Search Results ({searchResults.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {searchResults.map(item => (
              <Link key={`${item.name}-${item.category}`} href={item.href}>
                <div className="flex items-center justify-between px-3 py-2 bg-surface-1 border border-border rounded-lg hover:border-accent-dim transition-colors cursor-pointer group">
                  <div>
                    <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{item.name}</span>
                    <span className="text-[10px] text-text-tertiary ml-2">{item.category}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-accent transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {search && searchResults.length === 0 && (
        <p className="text-sm text-text-tertiary">No results for &quot;{search}&quot;</p>
      )}

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSections.map((section, i) => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
            <Link href={section.href}>
              <Card hover>
                <div className="flex items-start gap-4 group">
                  <div className={`p-2.5 rounded-lg ${section.bg}`}>
                    <section.icon className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                        {section.title}
                      </h3>
                      <span className="text-xs text-text-tertiary bg-surface-2 px-2 py-0.5 rounded-full">
                        {section.count}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{section.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors mt-1" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Reference */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <h2 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase mb-3">{t.compendium.quickRef}</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_REFS.map(ref => (
            <Link key={ref.label} href={ref.href}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-1 border border-border rounded-lg text-sm text-text-secondary hover:text-accent hover:border-accent-dim transition-colors cursor-pointer">
                <ref.icon className="w-3.5 h-3.5" />
                {ref.label}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* DM / Player Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-accent/20">
            <h3 className="font-semibold text-accent mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> {t.compendium.forDMs}
            </h3>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              <li>• Use the <strong>Monster Bestiary</strong> to quickly look up stat blocks</li>
              <li>• Reference the <strong>Encounter Difficulty Table</strong> to balance fights</li>
              <li>• Check <strong>DC Reference Table</strong> for appropriate difficulty</li>
              <li>• Browse <strong>Magic Items</strong> for treasure and loot ideas</li>
            </ul>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="border-accent/20">
            <h3 className="font-semibold text-accent mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> {t.compendium.forPlayers}
            </h3>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              <li>• Look up your <strong>Class Features</strong> and level-up progression</li>
              <li>• Browse <strong>Spells</strong> filtered by your class to plan your build</li>
              <li>• Check <strong>Race Traits</strong> for your character&apos;s special abilities</li>
              <li>• Reference <strong>Conditions</strong> to understand status effects in combat</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
