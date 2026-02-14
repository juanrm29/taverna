// ============================================================
// TAVERNA — D&D Web Platform Core Types  (Expanded v2)
// ============================================================

// ---- Users & Auth ----
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

// ---- Campaigns ----
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  dmId: string;
  dmName: string;
  players: string[];
  maxPlayers: number;
  status: CampaignStatus;
  ruleSet: '5e' | '5e-2024' | '3.5e' | 'homebrew';
  sessionCount: number;
  createdAt: string;
  lastPlayedAt?: string;
  inviteCode: string;
}

// ---- D&D 5e Character ----
export type AbilityName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export type Race =
  | 'Human' | 'Elf' | 'Dwarf' | 'Halfling' | 'Gnome'
  | 'Half-Elf' | 'Half-Orc' | 'Tiefling' | 'Dragonborn';

export type CharacterClass =
  | 'Barbarian' | 'Bard' | 'Cleric' | 'Druid' | 'Fighter'
  | 'Monk' | 'Paladin' | 'Ranger' | 'Rogue' | 'Sorcerer'
  | 'Warlock' | 'Wizard';

export type Alignment =
  | 'Lawful Good' | 'Neutral Good' | 'Chaotic Good'
  | 'Lawful Neutral' | 'True Neutral' | 'Chaotic Neutral'
  | 'Lawful Evil' | 'Neutral Evil' | 'Chaotic Evil';

export const RACES: Race[] = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling', 'Dragonborn'];
export const CLASSES: CharacterClass[] = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
export const ALIGNMENTS: Alignment[] = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];

export interface HitPoints {
  current: number;
  max: number;
  temp: number;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface SpellSlot {
  level: number;
  total: number;
  used: number;
}

export interface Skill {
  name: string;
  ability: AbilityName;
  proficient: boolean;
  expertise: boolean;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  description?: string;
  equipped?: boolean;
  type?: 'weapon' | 'armor' | 'gear' | 'magic' | 'consumable' | 'treasure' | 'other';
  damage?: string;        // e.g. "1d8"
  damageType?: string;    // e.g. "slashing"
  properties?: string[];  // e.g. ["versatile", "finesse"]
  armorClassBonus?: number;
  value?: number;         // in GP
  rarity?: 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact';
  attunement?: boolean;
  attuned?: boolean;
}

// ---- Currency ----
export interface Currency {
  cp: number;  // copper
  sp: number;  // silver
  ep: number;  // electrum
  gp: number;  // gold
  pp: number;  // platinum
}

// ---- Prepared Spells ----
export interface KnownSpell {
  id: string;
  name: string;
  level: number;       // 0 = cantrip
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  damage?: string;       // e.g. "8d6"
  damageType?: string;   // e.g. "fire"
  savingThrow?: AbilityName;
  description: string;
  prepared: boolean;     // for prepared casters
}

// ---- Multi-class Support ----
export interface ClassLevel {
  class: CharacterClass;
  level: number;
  subclass?: string;
}

// ---- Feats ----
export interface Feat {
  id: string;
  name: string;
  description: string;
  abilityBonus?: Partial<Record<AbilityName, number>>;
}

export interface Character {
  id: string;
  campaignId: string;
  playerId: string;
  name: string;
  race: Race;
  class: CharacterClass;
  level: number;
  alignment: Alignment;
  background: string;
  abilityScores: AbilityScores;
  hp: HitPoints;
  armorClass: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;
  savingThrows: Partial<Record<AbilityName, boolean>>;
  skills: Skill[];
  spellSlots: SpellSlot[];
  inventory: Item[];
  deathSaves: DeathSaves;
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  notes: string;
  avatarUrl?: string;
  createdAt: string;
  // ---- v2 fields ----
  currency?: Currency;
  knownSpells?: KnownSpell[];
  classLevels?: ClassLevel[];     // multi-class
  feats?: Feat[];
  hitDiceRemaining?: number;      // for short rest
  inspirationPoints?: number;
  experiencePoints?: number;
  concentratingOn?: string;      // spell name
  temporaryEffects?: string[];
}

// ---- DM Tools ----
export interface SessionNote {
  id: string;
  campaignId: string;
  sessionNumber: number;
  title: string;
  content: string;
  dmPrivate: boolean;
  createdAt: string;
}

export interface NPC {
  id: string;
  campaignId: string;
  name: string;
  race: string;
  description: string;
  personality: string;
  motivation: string;
  stats?: Partial<AbilityScores>;
  hp?: number;
  armorClass?: number;
  isAlive: boolean;
  location?: string;
  notes: string;
}

// ---- Chat & Communication ----
export type MessageType = 'text' | 'dice' | 'whisper' | 'system' | 'narration' | 'emote' | 'ooc' | 'combat';

export type ChatChannel = 'general' | 'combat' | 'lore' | 'off-topic' | 'whispers';

export const CHAT_CHANNELS: { id: ChatChannel; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'general', label: 'general', icon: '💬', desc: 'Main campaign chat', color: 'text-accent' },
  { id: 'combat', label: 'combat', icon: '⚔️', desc: 'Combat rolls & actions', color: 'text-danger' },
  { id: 'lore', label: 'lore', icon: '📜', desc: 'World-building & lore', color: 'text-warning' },
  { id: 'off-topic', label: 'off-topic', icon: '🎮', desc: 'Out-of-character fun', color: 'text-info' },
  { id: 'whispers', label: 'whispers', icon: '👁️', desc: 'Private messages', color: 'text-purple-400' },
];

export interface ChatReaction {
  emoji: string;
  userIds: string[];
}

export interface CombatResult {
  attackRoll?: { roll: number; modifier: number; total: number; isCritical: boolean; isFumble: boolean };
  damageRoll?: { rolls: number[]; modifier: number; total: number; type: string };
  savingThrow?: { ability: AbilityName; dc: number; roll: number; modifier: number; total: number; success: boolean };
  targetName?: string;
  targetAC?: number;
  hit?: boolean;
  spellName?: string;
  healAmount?: number;
}

export interface ChatMessage {
  id: string;
  campaignId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  diceResult?: DiceResult;
  combatResult?: CombatResult;
  whisperTo?: string;
  whisperToName?: string;
  characterName?: string;
  timestamp: string;
  pinned?: boolean;
  // Phase 1 — Discord-level features
  channel?: ChatChannel;
  reactions?: ChatReaction[];
  replyToId?: string;
  replyToPreview?: string;
  replyToSender?: string;
  editedAt?: string;
  mentions?: string[];          // user IDs mentioned
  mentionEveryone?: boolean;
}

export interface DiceResult {
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
  type?: string;
  label?: string;
  isCritical?: boolean;
  isFumble?: boolean;
  isAdvantage?: boolean;
  isDisadvantage?: boolean;
  keptRoll?: number;         // which roll was kept for adv/dis
  discardedRoll?: number;    // which was discarded
}

// ---- Voice Chat (Discord-level) ----
export type VoiceStatus = 'connected' | 'muted' | 'deafened' | 'disconnected';
export type VoiceRoomType = 'table' | 'private' | 'afk' | 'tavern';

export interface VoiceParticipant {
  userId: string;
  displayName: string;
  characterName?: string;
  status: VoiceStatus;
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  volume: number; // 0–200, default 100
  isSelfMuted: boolean;
  isServerMuted: boolean; // DM force-muted
  isServerDeafened: boolean;
  handRaised: boolean;
  speakingDuration: number; // seconds spoke this session
  joinedAt?: string;
  role?: 'dm' | 'player' | 'spectator';
}

export interface VoiceSettings {
  inputVolume: number; // 0–200
  outputVolume: number; // 0–200
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  pushToTalk: boolean;
  pushToTalkKey: string;
  voiceActivityThreshold: number; // 0–100
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  inputVolume: 100,
  outputVolume: 100,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  pushToTalk: false,
  pushToTalkKey: 'KeyV',
  voiceActivityThreshold: 40,
};

export interface VoiceRoom {
  id: VoiceRoomType;
  name: string;
  icon: string;
  description: string;
  maxParticipants?: number;
  locked?: boolean;
}

export const VOICE_ROOMS: VoiceRoom[] = [
  { id: 'table', name: 'Game Table', icon: '🎲', description: 'Main voice channel for the session', maxParticipants: 12 },
  { id: 'tavern', name: 'The Tavern', icon: '🍺', description: 'Casual chat & between-session hangout' },
  { id: 'private', name: 'Private Room', icon: '🔒', description: 'DM + selected players only', maxParticipants: 4, locked: true },
  { id: 'afk', name: 'AFK', icon: '💤', description: 'Away from keyboard — auto-muted', maxParticipants: 20 },
];

export interface VoiceChannel {
  id: string;
  campaignId: string;
  name: string;
  room: VoiceRoomType;
  participants: VoiceParticipant[];
  locked?: boolean;
  maxParticipants?: number;
  description?: string;
}

// ---- Session (Live Play) ----
export type SessionStatus = 'lobby' | 'live' | 'paused' | 'ended';

export interface GameSession {
  id: string;
  campaignId: string;
  sessionNumber: number;
  status: SessionStatus;
  startedAt?: string;
  endedAt?: string;
  dmId: string;
  connectedPlayers: string[];
  initiative?: InitiativeEntry[];
  currentRound: number;
  activeSceneId?: string;
  combatLog: CombatLogEntry[];
}

export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  isNPC: boolean;
  isActive: boolean;
  hp?: { current: number; max: number };
  armorClass?: number;
  conditions: string[];
  concentratingOn?: string;
  tokenId?: string;         // link to map token
  characterId?: string;     // link to Character
}

export interface CombatLogEntry {
  id: string;
  round: number;
  turn: string;             // combatant name
  action: string;           // description
  result: string;           // outcome
  timestamp: string;
}

// ---- Tactical Map ----
export interface MapScene {
  id: string;
  campaignId: string;
  name: string;
  gridType: 'square' | 'hex';
  gridSize: number;          // pixels per cell
  width: number;             // grid columns
  height: number;            // grid rows
  backgroundImage?: string;  // base64 or URL
  backgroundColor: string;
  tokens: MapToken[];
  walls: Wall[];
  lights: LightSource[];
  fogRevealed: boolean[][];  // grid of revealed cells
  drawings: MapDrawing[];
  ambientTrackId?: string;
  isActive: boolean;
}

export interface MapToken {
  id: string;
  name: string;
  x: number;                 // grid col
  y: number;                 // grid row
  size: number;              // 1 = 1 cell, 2 = 2x2, etc.
  color: string;
  label: string;             // 1-2 char abbreviation
  isPC: boolean;
  characterId?: string;
  initiativeEntryId?: string;
  hp?: { current: number; max: number };
  conditions: string[];
  vision: number;            // vision range in cells
  darkvision: number;        // darkvision range
  lightRadius: number;       // emitted light radius
  dimLightRadius: number;
  hidden: boolean;           // only visible to DM
  imageUrl?: string;
}

export interface Wall {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  blocksMovement: boolean;
  blocksVision: boolean;
  isDoor: boolean;
  isOpen: boolean;
}

export interface LightSource {
  id: string;
  x: number; y: number;
  brightRadius: number;
  dimRadius: number;
  color: string;
  enabled: boolean;
}

export interface MapDrawing {
  id: string;
  type: 'freehand' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'cone' | 'line-aoe';
  points: { x: number; y: number }[];
  color: string;
  fillColor?: string;
  lineWidth: number;
  text?: string;
  width?: number;
  height?: number;
  radius?: number;
  angle?: number;          // for cone
  length?: number;         // for line/cone
  visible: boolean;        // visible to players
}

// ---- Journal & Handout ----
export interface JournalEntry {
  id: string;
  campaignId: string;
  title: string;
  content: string;          // rich text (HTML)
  type: 'journal' | 'handout' | 'secret';
  imageUrl?: string;
  visibleTo: string[];      // player IDs, empty = DM only, ['*'] = all
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Dice Macros & Rollable Tables ----
export interface DiceMacro {
  id: string;
  campaignId: string;
  name: string;
  formula: string;          // e.g. "2d6+5"
  label?: string;           // e.g. "Longsword Attack"
  createdBy: string;
}

export interface RollableTable {
  id: string;
  campaignId: string;
  name: string;
  entries: RollableTableEntry[];
  diceFormula: string;       // e.g. "1d100"
  createdBy: string;
}

export interface RollableTableEntry {
  id: string;
  rangeMin: number;
  rangeMax: number;
  text: string;
  weight: number;
}

// ---- Ambient Audio ----
export interface AudioTrack {
  id: string;
  campaignId: string;
  name: string;
  url: string;              // URL or bundled path
  type: 'ambient' | 'sfx';
  volume: number;           // 0-1
  loop: boolean;
  category: string;         // "combat", "tavern", "forest", etc.
}

// ---- Timeline & Achievements ----
export interface TimelineEvent {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  inGameDate?: string;
  realDate: string;
  sessionNumber: number;
  type: 'story' | 'combat' | 'discovery' | 'milestone' | 'death' | 'custom';
  icon?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  campaignId?: string;
  playerId?: string;
  type: 'combat' | 'roleplay' | 'exploration' | 'milestone' | 'fun';
}

// ---- Character Relationships ----
export interface CharacterRelationship {
  id: string;
  campaignId: string;
  fromCharacterId: string;
  fromCharacterName: string;
  toCharacterId: string;
  toCharacterName: string;
  type: 'ally' | 'rival' | 'romantic' | 'family' | 'mentor' | 'enemy' | 'neutral';
  description: string;
}

// ---- Encounter Builder ----
export interface EncounterTemplate {
  id: string;
  campaignId: string;
  name: string;
  monsters: { name: string; cr: number; count: number; hp: number; ac: number }[];
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  xpTotal: number;
  notes: string;
  createdBy: string;
}

// ---- Turn Timer ----
export interface TurnTimer {
  enabled: boolean;
  seconds: number;          // seconds per turn
  remaining: number;
  isPaused: boolean;
}

// ============================================================
// D&D 5e CONDITIONS (full reference)
// ============================================================

export const ALL_CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened',
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed',
  'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned',
  'Unconscious',
] as const;

export type Condition = typeof ALL_CONDITIONS[number];

export const CONDITION_EFFECTS: Record<string, string> = {
  'Blinded': 'Auto-fail sight checks. Attack rolls have disadvantage. Attacks against have advantage.',
  'Charmed': 'Cannot attack charmer. Charmer has advantage on social checks.',
  'Deafened': 'Auto-fail hearing checks.',
  'Exhaustion': 'Cumulative penalties. 6 levels = death.',
  'Frightened': 'Disadvantage on ability checks/attacks while source visible. Cannot move closer.',
  'Grappled': 'Speed becomes 0. Ends if grappler incapacitated or forced apart.',
  'Incapacitated': 'Cannot take actions or reactions.',
  'Invisible': 'Impossible to see without magic. Advantage on attacks, attacks against have disadvantage.',
  'Paralyzed': 'Incapacitated, auto-fail STR/DEX saves. Attacks have advantage, melee crits.',
  'Petrified': 'Weight x10, no aging. Incapacitated, auto-fail STR/DEX. Resistance to all damage.',
  'Poisoned': 'Disadvantage on attack rolls and ability checks.',
  'Prone': 'Disadvantage on attacks. Melee attacks have advantage, ranged disadvantage. Costs half movement.',
  'Restrained': 'Speed 0. Disadvantage on attacks and DEX saves. Attacks against have advantage.',
  'Stunned': 'Incapacitated, auto-fail STR/DEX saves. Attacks against have advantage.',
  'Unconscious': 'Incapacitated, drop everything, fall prone. Auto-fail STR/DEX. Attacks advantage, melee crits.',
};

// ============================================================
// ENCOUNTER DIFFICULTY XP THRESHOLDS
// ============================================================

export const XP_THRESHOLDS: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

export const CR_XP_TABLE: Record<string, number> = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
  '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
  '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
  '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
  '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
  '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
};

// Encounter multiplier based on number of monsters
export function getEncounterMultiplier(monsterCount: number): number {
  if (monsterCount <= 1) return 1;
  if (monsterCount === 2) return 1.5;
  if (monsterCount <= 6) return 2;
  if (monsterCount <= 10) return 2.5;
  if (monsterCount <= 14) return 3;
  return 4;
}

// ---- SPELL SLOT TABLE (full casters) ----
export const FULL_CASTER_SLOTS: number[][] = [
  //        1  2  3  4  5  6  7  8  9
  /* 1  */ [2, 0, 0, 0, 0, 0, 0, 0, 0],
  /* 2  */ [3, 0, 0, 0, 0, 0, 0, 0, 0],
  /* 3  */ [4, 2, 0, 0, 0, 0, 0, 0, 0],
  /* 4  */ [4, 3, 0, 0, 0, 0, 0, 0, 0],
  /* 5  */ [4, 3, 2, 0, 0, 0, 0, 0, 0],
  /* 6  */ [4, 3, 3, 0, 0, 0, 0, 0, 0],
  /* 7  */ [4, 3, 3, 1, 0, 0, 0, 0, 0],
  /* 8  */ [4, 3, 3, 2, 0, 0, 0, 0, 0],
  /* 9  */ [4, 3, 3, 3, 1, 0, 0, 0, 0],
  /* 10 */ [4, 3, 3, 3, 2, 0, 0, 0, 0],
  /* 11 */ [4, 3, 3, 3, 2, 1, 0, 0, 0],
  /* 12 */ [4, 3, 3, 3, 2, 1, 0, 0, 0],
  /* 13 */ [4, 3, 3, 3, 2, 1, 1, 0, 0],
  /* 14 */ [4, 3, 3, 3, 2, 1, 1, 0, 0],
  /* 15 */ [4, 3, 3, 3, 2, 1, 1, 1, 0],
  /* 16 */ [4, 3, 3, 3, 2, 1, 1, 1, 0],
  /* 17 */ [4, 3, 3, 3, 2, 1, 1, 1, 1],
  /* 18 */ [4, 3, 3, 3, 3, 1, 1, 1, 1],
  /* 19 */ [4, 3, 3, 3, 3, 2, 1, 1, 1],
  /* 20 */ [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

export const HALF_CASTER_SLOTS: number[][] = [
  /* 1  */ [0, 0, 0, 0, 0],
  /* 2  */ [2, 0, 0, 0, 0],
  /* 3  */ [3, 0, 0, 0, 0],
  /* 4  */ [3, 0, 0, 0, 0],
  /* 5  */ [4, 2, 0, 0, 0],
  /* 6  */ [4, 2, 0, 0, 0],
  /* 7  */ [4, 3, 0, 0, 0],
  /* 8  */ [4, 3, 0, 0, 0],
  /* 9  */ [4, 3, 2, 0, 0],
  /* 10 */ [4, 3, 2, 0, 0],
  /* 11 */ [4, 3, 3, 0, 0],
  /* 12 */ [4, 3, 3, 0, 0],
  /* 13 */ [4, 3, 3, 1, 0],
  /* 14 */ [4, 3, 3, 1, 0],
  /* 15 */ [4, 3, 3, 2, 0],
  /* 16 */ [4, 3, 3, 2, 0],
  /* 17 */ [4, 3, 3, 3, 1],
  /* 18 */ [4, 3, 3, 3, 1],
  /* 19 */ [4, 3, 3, 3, 2],
  /* 20 */ [4, 3, 3, 3, 2],
];

export const WARLOCK_SLOTS: { slots: number; level: number }[] = [
  { slots: 1, level: 1 }, { slots: 2, level: 1 }, { slots: 2, level: 2 },
  { slots: 2, level: 2 }, { slots: 2, level: 3 }, { slots: 2, level: 3 },
  { slots: 2, level: 4 }, { slots: 2, level: 4 }, { slots: 2, level: 5 },
  { slots: 2, level: 5 }, { slots: 3, level: 5 }, { slots: 3, level: 5 },
  { slots: 3, level: 5 }, { slots: 3, level: 5 }, { slots: 3, level: 5 },
  { slots: 3, level: 5 }, { slots: 4, level: 5 }, { slots: 4, level: 5 },
  { slots: 4, level: 5 }, { slots: 4, level: 5 },
];

export const FULL_CASTERS: CharacterClass[] = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'];
export const HALF_CASTERS: CharacterClass[] = ['Paladin', 'Ranger'];
export const PACT_CASTERS: CharacterClass[] = ['Warlock'];
export const NON_CASTERS: CharacterClass[] = ['Barbarian', 'Fighter', 'Monk', 'Rogue'];
export const PREPARED_CASTERS: CharacterClass[] = ['Cleric', 'Druid', 'Paladin', 'Wizard'];

// ============================================================
// DM SCREEN GENERATORS
// ============================================================

export const RANDOM_NPC_NAMES = {
  first: ['Aldric','Brenna','Caden','Delia','Einar','Fiora','Gareth','Helene','Idris','Johanna','Kelvar','Liara','Magnus','Nyla','Orin','Petra','Quinn','Rosalind','Soren','Thalia','Ulric','Vara','Wren','Xara','Yoric','Zara','Alden','Bren','Cyra','Doran','Elara','Fenris','Gwen','Hadrian','Isla','Jareth','Kira','Leoric','Mira','Nadir','Orla','Pike','Rael','Sera','Torvin','Una','Vex','Wynne','Xander','Yara'],
  last: ['Blackwood','Ironforge','Stormwind','Shadowmere','Brightblade','Thornwall','Ashford','Goldleaf','Frostborn','Darkhollow','Stoneheart','Silvercrest','Moonwhisper','Fireforge','Deepwater','Windrider','Oakenshield','Ravencroft','Duskwalker','Sunspear','Nightingale','Starfall','Bloodhorn','Grimshaw','Whitmore','Copperfield','Ridgewell','Marshwood','Clifton','Holloway'],
};

export const RANDOM_TAVERN_NAMES = [
  'The Rusty Dragon', 'The Prancing Pony', 'The Yawning Portal', 'The Green Dragon',
  'The Silver Eel', 'The Broken Blade', 'The Gilded Rose', 'The Crimson Flask',
  'The Drunken Mermaid', 'The Laughing Goblin', 'The Iron Tankard', 'The Wandering Wyvern',
  'The Blue Boar', 'The Red Rooster', 'The Golden Griffin', 'The Blind Basilisk',
  'The Tipsy Troll', 'The Sleeping Giant', 'The Salty Dog', 'The Dancing Bear',
];

export const PLOT_HOOKS = [
  'A mysterious stranger offers a map to a legendary treasure.',
  'Children are disappearing from a nearby village.',
  'A dragon has been spotted flying over the mountains.',
  'An ancient tomb has been unearthed during construction.',
  'A noble asks the party to find their missing heir.',
  'Strange lights appear in the forest at night.',
  'A plague is spreading and the cure requires a rare herb.',
  'A long-dead king rises from his tomb.',
  'Pirates have blockaded the harbor.',
  'An artifact has been stolen from the temple.',
  'A portal to another plane has opened in the town square.',
  'A powerful mage has gone mad and threatens the city.',
  'Undead armies are marching from the north.',
  'A prophecy speaks of heroes who will save the realm.',
  'A rival adventuring party is competing for the same goal.',
  'The local guild master has a secret that could destroy the town.',
  'An earthquake reveals caverns beneath the city.',
  'A deity\'s avatar appears and demands a quest be completed.',
  'Wild magic surges have been increasing in frequency.',
  'A war between two kingdoms is about to engulf the region.',
];

// ---- PREDEFINED ACHIEVEMENT DEFINITIONS ----
export const ACHIEVEMENT_DEFS: Omit<Achievement, 'id' | 'earnedAt' | 'campaignId' | 'playerId'>[] = [
  { name: 'First Blood', description: 'Land your first hit in combat.', icon: '⚔️', type: 'combat' },
  { name: 'Critical Master', description: 'Roll a Natural 20.', icon: '🎯', type: 'combat' },
  { name: 'Fumble King', description: 'Roll a Natural 1.', icon: '💀', type: 'fun' },
  { name: 'Dragon Slayer', description: 'Defeat a dragon.', icon: '🐉', type: 'combat' },
  { name: 'Dungeon Delver', description: 'Complete your first dungeon.', icon: '🏰', type: 'exploration' },
  { name: 'Socialite', description: 'Successfully persuade an NPC.', icon: '🗣️', type: 'roleplay' },
  { name: 'Treasure Hunter', description: 'Find a rare item.', icon: '💎', type: 'exploration' },
  { name: 'Level 5', description: 'Reach character level 5.', icon: '⭐', type: 'milestone' },
  { name: 'Level 10', description: 'Reach character level 10.', icon: '🌟', type: 'milestone' },
  { name: 'Level 20', description: 'Reach character level 20.', icon: '👑', type: 'milestone' },
  { name: 'Party Wipe Survivor', description: 'Be the last one standing.', icon: '🛡️', type: 'combat' },
  { name: 'Roleplay Master', description: 'Stay in character for an entire session.', icon: '🎭', type: 'roleplay' },
  { name: '100 Dice Rolls', description: 'Roll 100 dice total.', icon: '🎲', type: 'fun' },
  { name: 'First Death', description: 'Your character dies for the first time.', icon: '💀', type: 'combat' },
  { name: 'Resurrection', description: 'Come back from the dead.', icon: '✨', type: 'milestone' },
  { name: 'Veteran', description: 'Play 10 sessions.', icon: '🏅', type: 'milestone' },
  { name: 'Marathon', description: 'Play 50 sessions.', icon: '🏆', type: 'milestone' },
  { name: 'Overkill', description: 'Deal 50+ damage in a single hit.', icon: '💥', type: 'combat' },
  { name: 'Healer', description: 'Heal 100+ total HP across sessions.', icon: '❤️‍🩹', type: 'roleplay' },
  { name: 'Cartographer', description: 'Explore 10 different map scenes.', icon: '🗺️', type: 'exploration' },
];

// ---- Utility ----
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

// 5e Skills mapped to abilities
export const SKILLS_BY_ABILITY: Record<AbilityName, string[]> = {
  strength: ['Athletics'],
  dexterity: ['Acrobatics', 'Sleight of Hand', 'Stealth'],
  constitution: [],
  intelligence: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
  wisdom: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
  charisma: ['Deception', 'Intimidation', 'Performance', 'Persuasion'],
};

export const ALL_SKILLS: { name: string; ability: AbilityName }[] = Object.entries(SKILLS_BY_ABILITY)
  .flatMap(([ability, skills]) =>
    skills.map(name => ({ name, ability: ability as AbilityName }))
  )
  .sort((a, b) => a.name.localeCompare(b.name));

// Class hit dice
export const CLASS_HIT_DICE: Record<CharacterClass, number> = {
  Barbarian: 12,
  Bard: 8,
  Cleric: 8,
  Druid: 8,
  Fighter: 10,
  Monk: 8,
  Paladin: 10,
  Ranger: 10,
  Rogue: 8,
  Sorcerer: 6,
  Warlock: 8,
  Wizard: 6,
};

// Class saving throw proficiencies
export const CLASS_SAVING_THROWS: Record<CharacterClass, AbilityName[]> = {
  Barbarian: ['strength', 'constitution'],
  Bard: ['dexterity', 'charisma'],
  Cleric: ['wisdom', 'charisma'],
  Druid: ['intelligence', 'wisdom'],
  Fighter: ['strength', 'constitution'],
  Monk: ['strength', 'dexterity'],
  Paladin: ['wisdom', 'charisma'],
  Ranger: ['strength', 'dexterity'],
  Rogue: ['dexterity', 'intelligence'],
  Sorcerer: ['constitution', 'charisma'],
  Warlock: ['wisdom', 'charisma'],
  Wizard: ['intelligence', 'wisdom'],
};

// XP per level (5e standard)
export const XP_PER_LEVEL: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500,
  6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
  11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000,
  16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000,
};
