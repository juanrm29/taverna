// Monster Data — Placeholder stubs
export type CreatureType = 'Aberration' | 'Beast' | 'Celestial' | 'Construct' | 'Dragon' | 'Elemental' | 'Fey' | 'Fiend' | 'Giant' | 'Humanoid' | 'Monstrosity' | 'Ooze' | 'Plant' | 'Undead';
export type CreatureSize = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
export interface MonsterTrait { name: string; description: string; }
export interface Monster {
  name: string; type: CreatureType; size: CreatureSize; cr: string; ac: number; hp: number; xp: number;
  alignment: string; description?: string; acType?: string; hpFormula: string; speed: string;
  str: number; dex: number; con: number; int: number; wis: number; cha: number;
  savingThrows?: string; skills?: string; damageResistances?: string; damageImmunities?: string;
  conditionImmunities?: string; senses: string; languages: string;
  traits?: MonsterTrait[]; actions: MonsterTrait[]; legendaryActions?: MonsterTrait[]; environment?: string[];
}
export const MONSTERS: Monster[] = [];
export const CREATURE_TYPES: CreatureType[] = ['Aberration','Beast','Celestial','Construct','Dragon','Elemental','Fey','Fiend','Giant','Humanoid','Monstrosity','Ooze','Plant','Undead'];
export const CREATURE_SIZES: CreatureSize[] = ['Tiny','Small','Medium','Large','Huge','Gargantuan'];
