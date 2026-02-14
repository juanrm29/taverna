// ============================================================
// Equipment Data — Placeholder stubs (TODO: populate with SRD data)
// ============================================================

export interface Weapon {
  name: string;
  category: 'Simple Melee' | 'Simple Ranged' | 'Martial Melee' | 'Martial Ranged';
  damage: string;
  damageType: string;
  weight: string;
  cost: string;
  properties: string[];
}

export interface Armor {
  name: string;
  category: 'Light' | 'Medium' | 'Heavy' | 'Shield';
  ac: string;
  strRequirement: number | null;
  stealthDisadvantage: boolean;
  weight: string;
  cost: string;
  donTime: string;
  doffTime: string;
}

export interface GearItem {
  name: string;
  cost: string;
  description: string;
  category: string;
  weight: string;
}

export interface MagicItem {
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact';
  attunement: boolean;
  type: string;
  description: string;
}

export interface EquipmentPack {
  name: string;
  cost: string;
  contents: string[];
}

export const WEAPONS: Weapon[] = [];
export const ARMOR: Armor[] = [];
export const GEAR: GearItem[] = [];
export const MAGIC_ITEMS: MagicItem[] = [];
export const EQUIPMENT_PACKS: EquipmentPack[] = [];
export const WEAPON_PROPERTIES: Record<string, string> = {};
export const RARITY_COLORS: Record<string, string> = {
  Common: '#9CA3AF',
  Uncommon: '#10B981',
  Rare: '#3B82F6',
  'Very Rare': '#8B5CF6',
  Legendary: '#F59E0B',
  Artifact: '#EF4444',
};
