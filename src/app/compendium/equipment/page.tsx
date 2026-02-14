'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Search, Shield, Package, Wand2, ArrowLeft, ChevronDown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { WEAPONS, ARMOR, GEAR, MAGIC_ITEMS, EQUIPMENT_PACKS, WEAPON_PROPERTIES, RARITY_COLORS } from '@/lib/data/equipment';

type Tab = 'weapons' | 'armor' | 'gear' | 'magic-items' | 'packs';

export default function EquipmentPage() {
  const [tab, setTab] = useState<Tab>('weapons');
  const [search, setSearch] = useState('');
  const [weaponCat, setWeaponCat] = useState('');
  const [armorCat, setArmorCat] = useState('');
  const [magicRarity, setMagicRarity] = useState('');
  const [expandedProp, setExpandedProp] = useState<string | null>(null);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'weapons', label: 'Weapons', icon: <Sword className="w-4 h-4" />, count: WEAPONS.length },
    { id: 'armor', label: 'Armor', icon: <Shield className="w-4 h-4" />, count: ARMOR.length },
    { id: 'gear', label: 'Gear', icon: <Package className="w-4 h-4" />, count: GEAR.length },
    { id: 'magic-items', label: 'Magic Items', icon: <Wand2 className="w-4 h-4" />, count: MAGIC_ITEMS.length },
    { id: 'packs', label: 'Packs', icon: <Package className="w-4 h-4" />, count: EQUIPMENT_PACKS.length },
  ];

  const filteredWeapons = useMemo(() =>
    WEAPONS.filter(w => {
      if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (weaponCat && w.category !== weaponCat) return false;
      return true;
    }), [search, weaponCat]);

  const filteredArmor = useMemo(() =>
    ARMOR.filter(a => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (armorCat && a.category !== armorCat) return false;
      return true;
    }), [search, armorCat]);

  const filteredGear = useMemo(() =>
    GEAR.filter(g => search ? g.name.toLowerCase().includes(search.toLowerCase()) : true), [search]);

  const filteredMagic = useMemo(() =>
    MAGIC_ITEMS.filter(m => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (magicRarity && m.rarity !== magicRarity) return false;
      return true;
    }), [search, magicRarity]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/compendium" className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </Link>
        <Sword className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-display font-bold text-text-primary">Equipment & Items</h1>
      </div>

      {/* Tabs — underline style matching campaign page */}
      <div className="flex gap-4 border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); }}
            className={`flex items-center gap-1.5 pb-2.5 px-1 text-sm whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              tab === t.id ? 'border-accent text-accent' : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}>
            {t.icon} {t.label}
            <span className="text-xs opacity-60">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input type="text" placeholder={`Search ${tab}...`} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4" />
      </div>

      {/* WEAPONS TAB */}
      {tab === 'weapons' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['Simple Melee', 'Simple Ranged', 'Martial Melee', 'Martial Ranged'].map(cat => (
              <button key={cat} onClick={() => setWeaponCat(weaponCat === cat ? '' : cat)}
                className={`px-3 py-1.5 rounded-md text-xs border transition-colors cursor-pointer ${weaponCat === cat ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Name</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Damage</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Weight</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Cost</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Properties</th>
                </tr>
              </thead>
              <tbody>
                {filteredWeapons.map(w => (
                  <tr key={w.name} className="border-b border-border/50 hover:bg-surface-1 transition-colors">
                    <td className="py-2 px-3 font-medium text-text-primary">{w.name}</td>
                    <td className="py-2 px-3 text-text-secondary">{w.damage} {w.damageType}</td>
                    <td className="py-2 px-3 text-text-tertiary">{w.weight}</td>
                    <td className="py-2 px-3 text-accent">{w.cost}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {w.properties.map(p => (
                          <span key={p} className="px-1.5 py-0.5 text-xs bg-surface-2 rounded text-text-tertiary">{p}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Weapon Properties Reference */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-text-tertiary tracking-wider uppercase">Weapon Properties</h3>
            {Object.entries(WEAPON_PROPERTIES).map(([name, desc]) => (
              <button key={name} onClick={() => setExpandedProp(expandedProp === name ? null : name)}
                className="w-full text-left cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-1 rounded-lg border border-border hover:border-accent-dim transition-colors">
                  <span className="text-sm font-medium text-text-primary">{name}</span>
                  <ChevronDown className={`w-3 h-3 text-text-tertiary ml-auto transition-transform ${expandedProp === name ? 'rotate-180' : ''}`} />
                </div>
                {expandedProp === name && (
                  <p className="text-sm text-text-secondary px-3 py-2 bg-surface-2 rounded-b-lg border border-t-0 border-border">{desc}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ARMOR TAB */}
      {tab === 'armor' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['Light', 'Medium', 'Heavy', 'Shield'].map(cat => (
              <button key={cat} onClick={() => setArmorCat(armorCat === cat ? '' : cat)}
                className={`px-3 py-1.5 rounded-md text-xs border transition-colors cursor-pointer ${armorCat === cat ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Name</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">AC</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Str</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Stealth</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Weight</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Cost</th>
                  <th className="text-left py-2 px-3 text-xs text-text-tertiary font-medium uppercase">Don/Doff</th>
                </tr>
              </thead>
              <tbody>
                {filteredArmor.map(a => (
                  <tr key={a.name} className="border-b border-border/50 hover:bg-surface-1 transition-colors">
                    <td className="py-2 px-3 font-medium text-text-primary">{a.name}</td>
                    <td className="py-2 px-3 text-accent font-medium">{a.ac}</td>
                    <td className="py-2 px-3 text-text-tertiary">{a.strRequirement ? `${a.strRequirement}` : '—'}</td>
                    <td className="py-2 px-3">{a.stealthDisadvantage ? <span className="text-danger text-xs">Disadv.</span> : <span className="text-text-tertiary">—</span>}</td>
                    <td className="py-2 px-3 text-text-tertiary">{a.weight}</td>
                    <td className="py-2 px-3 text-text-secondary">{a.cost}</td>
                    <td className="py-2 px-3 text-xs text-text-tertiary">{a.donTime} / {a.doffTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GEAR TAB */}
      {tab === 'gear' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filteredGear.map(g => (
            <div key={g.name} className="p-3 bg-surface-1 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-text-primary">{g.name}</span>
                <span className="text-xs text-accent">{g.cost}</span>
              </div>
              <p className="text-xs text-text-secondary">{g.description}</p>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-text-tertiary">
                <span>{g.category}</span>
                <span>•</span>
                <span>{g.weight}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MAGIC ITEMS TAB */}
      {tab === 'magic-items' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'].map(r => (
              <button key={r} onClick={() => setMagicRarity(magicRarity === r ? '' : r)}
                className={`px-3 py-1.5 rounded-md text-xs border transition-colors cursor-pointer ${magicRarity === r ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'}`}>
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: RARITY_COLORS[r] }} />
                {r}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredMagic.map(item => (
              <div key={item.name} className="p-3 bg-surface-1 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: RARITY_COLORS[item.rarity] }} />
                  <span className="font-medium text-sm" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</span>
                  {item.attunement && <span className="text-xs text-text-tertiary ml-auto">(requires attunement)</span>}
                </div>
                <div className="text-xs text-text-tertiary mb-1">{item.type} — {item.rarity}</div>
                <p className="text-sm text-text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PACKS TAB */}
      {tab === 'packs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EQUIPMENT_PACKS.map(pack => (
            <div key={pack.name} className="p-4 bg-surface-1 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-text-primary">{pack.name}</span>
                <span className="text-sm text-accent">{pack.cost}</span>
              </div>
              <ul className="space-y-0.5">
                {pack.contents.map((item, i) => (
                  <li key={i} className="text-sm text-text-secondary flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
