// Race Data — Placeholder stubs
export interface RaceTrait { name: string; description: string; }
export interface Subrace { name: string; abilityScoreIncrease?: string; traits: RaceTrait[]; }
export interface Race {
  name: string; description: string; speed: string | number; size: string;
  languages: string[]; abilityScoreIncrease: string; traits: RaceTrait[]; subraces?: Subrace[];
}
export interface DraconicAncestry { dragon: string; damageType: string; breathWeapon: string; }
export const RACES: Race[] = [];
export const DRACONIC_ANCESTRY: DraconicAncestry[] = [];
