// ============================================================
// Zod Validation Schemas — All API input validation
// ============================================================
import { z } from 'zod';

// ---- Auth ----
export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(100),
  displayName: z.string().min(2, 'Nama minimal 2 karakter').max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---- Campaign ----
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Nama campaign harus diisi').max(100),
  description: z.string().max(2000).default(''),
  setting: z.string().max(500).default(''),
  ruleSet: z.string().default('D&D 5e'),
  maxPlayers: z.number().int().min(1).max(20).default(6),
  imageUrl: z.string().url().optional().nullable(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const joinCampaignSchema = z.object({
  inviteCode: z.string().min(1, 'Kode invite harus diisi'),
});

// ---- Character ----
export const abilityScoresSchema = z.object({
  strength: z.number().int().min(1).max(30),
  dexterity: z.number().int().min(1).max(30),
  constitution: z.number().int().min(1).max(30),
  intelligence: z.number().int().min(1).max(30),
  wisdom: z.number().int().min(1).max(30),
  charisma: z.number().int().min(1).max(30),
});

export const createCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  race: z.string().min(1),
  class: z.string().min(1),
  level: z.number().int().min(1).max(20).default(1),
  alignment: z.string().default('True Neutral'),
  background: z.string().max(100).default(''),
  abilityScores: abilityScoresSchema,
  hp: z.object({
    current: z.number().int().min(0),
    max: z.number().int().min(1),
    temp: z.number().int().min(0).default(0),
  }),
  armorClass: z.number().int().min(0).max(40).default(10),
  initiative: z.number().int().default(0),
  speed: z.number().int().min(0).default(30),
  proficiencyBonus: z.number().int().min(1).max(9).default(2),
  savingThrows: z.record(z.string(), z.boolean()).default({}),
  skills: z.array(z.any()).default([]),
  spellSlots: z.array(z.any()).default([]),
  inventory: z.array(z.any()).default([]),
  deathSaves: z.object({
    successes: z.number().int().min(0).max(3),
    failures: z.number().int().min(0).max(3),
  }).default({ successes: 0, failures: 0 }),
  traits: z.string().max(2000).default(''),
  ideals: z.string().max(2000).default(''),
  bonds: z.string().max(2000).default(''),
  flaws: z.string().max(2000).default(''),
  backstory: z.string().max(10000).default(''),
  notes: z.string().max(10000).default(''),
  avatarUrl: z.string().url().optional().nullable(),
  currency: z.object({
    cp: z.number().int().min(0),
    sp: z.number().int().min(0),
    ep: z.number().int().min(0),
    gp: z.number().int().min(0),
    pp: z.number().int().min(0),
  }).optional(),
  knownSpells: z.array(z.any()).optional(),
  classLevels: z.array(z.any()).optional(),
  feats: z.array(z.any()).optional(),
  hitDiceRemaining: z.number().int().min(0).optional(),
  inspirationPoints: z.number().int().min(0).default(0),
  experiencePoints: z.number().int().min(0).default(0),
});

export const updateCharacterSchema = createCharacterSchema.partial();

// ---- NPC ----
export const createNPCSchema = z.object({
  name: z.string().min(1).max(100),
  race: z.string().max(50).default(''),
  description: z.string().max(5000).default(''),
  personality: z.string().max(2000).default(''),
  motivation: z.string().max(2000).default(''),
  stats: z.record(z.string(), z.number()).optional(),
  hp: z.number().int().min(0).optional(),
  armorClass: z.number().int().min(0).max(40).optional(),
  isAlive: z.boolean().default(true),
  location: z.string().max(200).optional(),
  notes: z.string().max(5000).default(''),
  imageUrl: z.string().url().optional().nullable(),
});

export const updateNPCSchema = createNPCSchema.partial();

// ---- Chat Message ----
export const sendMessageSchema = z.object({
  type: z.enum(['TEXT', 'DICE', 'WHISPER', 'SYSTEM', 'NARRATION', 'EMOTE', 'OOC', 'COMBAT']),
  content: z.string().min(1).max(4000),
  channel: z.enum(['GENERAL', 'COMBAT', 'LORE', 'OFF_TOPIC', 'WHISPERS']).default('GENERAL'),
  characterName: z.string().max(100).optional(),
  whisperTo: z.string().optional(),
  whisperToName: z.string().optional(),
  diceResult: z.any().optional(),
  combatResult: z.any().optional(),
  replyToId: z.string().optional(),
  replyToPreview: z.string().max(200).optional(),
  replyToSender: z.string().max(100).optional(),
  mentions: z.array(z.string()).optional(),
  mentionEveryone: z.boolean().default(false),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(4),
});

// ---- Session ----
export const createSessionSchema = z.object({
  sessionNumber: z.number().int().min(1),
});

export const updateSessionStatusSchema = z.object({
  status: z.enum(['LOBBY', 'LIVE', 'PAUSED', 'ENDED']),
});

// ---- Initiative ----
export const addInitiativeSchema = z.object({
  name: z.string().min(1).max(100),
  initiative: z.number().int().min(-10).max(50),
  isNPC: z.boolean().default(false),
  hp: z.object({
    current: z.number().int(),
    max: z.number().int(),
  }).optional(),
  armorClass: z.number().int().optional(),
  characterId: z.string().optional(),
});

export const updateInitiativeHPSchema = z.object({
  hp: z.object({
    current: z.number().int(),
    max: z.number().int(),
  }),
});

export const conditionSchema = z.object({
  condition: z.string().min(1).max(50),
});

export const concentrationSchema = z.object({
  spellName: z.string().max(100).optional().nullable(),
});

// ---- Map Scene ----
export const createSceneSchema = z.object({
  name: z.string().min(1).max(200),
  gridType: z.enum(['square', 'hex']).default('square'),
  gridSize: z.number().int().min(10).max(200).default(40),
  width: z.number().int().min(5).max(100).default(30),
  height: z.number().int().min(5).max(100).default(20),
  backgroundImage: z.string().optional(),
  backgroundColor: z.string().default('#1a1a2e'),
});

export const updateSceneSchema = createSceneSchema.partial();

// ---- Map Token ----
export const addTokenSchema = z.object({
  name: z.string().min(1).max(100),
  x: z.number().int().min(0).default(0),
  y: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(6).default(1),
  color: z.string().default('#c9a96e'),
  label: z.string().max(4).default(''),
  isPC: z.boolean().default(false),
  characterId: z.string().optional(),
  hp: z.object({
    current: z.number().int(),
    max: z.number().int(),
  }).optional(),
  conditions: z.array(z.string()).default([]),
  vision: z.number().int().default(6),
  darkvision: z.number().int().default(0),
  lightRadius: z.number().int().default(0),
  dimLightRadius: z.number().int().default(0),
  hidden: z.boolean().default(false),
  imageUrl: z.string().url().optional().nullable(),
});

export const moveTokenSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

export const updateTokenSchema = addTokenSchema.partial();

// ---- Journal ----
export const createJournalSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000).default(''),
  type: z.enum(['JOURNAL', 'HANDOUT', 'SECRET']).default('JOURNAL'),
  imageUrl: z.string().url().optional().nullable(),
  visibleTo: z.array(z.string()).default([]),
});

export const updateJournalSchema = createJournalSchema.partial();

// ---- Dice ----
export const rollDiceSchema = z.object({
  formula: z.string().min(1).max(100).regex(/^\d+d\d+/i, 'Formula dice tidak valid'),
  label: z.string().max(100).optional(),
  characterName: z.string().max(100).optional(),
});

// ---- Dice Macro ----
export const createMacroSchema = z.object({
  name: z.string().min(1).max(100),
  formula: z.string().min(1).max(100),
  label: z.string().max(100).optional(),
});

// ---- Rollable Table ----
export const createRollableTableSchema = z.object({
  name: z.string().min(1).max(200),
  entries: z.array(z.object({
    id: z.string(),
    rangeMin: z.number().int(),
    rangeMax: z.number().int(),
    text: z.string(),
    weight: z.number().default(1),
  })),
  diceFormula: z.string().default('1d100'),
});

// ---- Session Note ----
export const createSessionNoteSchema = z.object({
  sessionNumber: z.number().int().min(1),
  title: z.string().min(1).max(200),
  content: z.string().max(50000).default(''),
  dmPrivate: z.boolean().default(false),
});

export const updateSessionNoteSchema = createSessionNoteSchema.partial();

// ---- Timeline ----
export const createTimelineEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  inGameDate: z.string().optional(),
  sessionNumber: z.number().int().default(1),
  type: z.enum(['story', 'combat', 'discovery', 'milestone', 'death', 'custom']).default('story'),
  icon: z.string().max(4).optional(),
});

// ---- Achievement ----
export const grantAchievementSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  icon: z.string().max(4).default('⭐'),
  type: z.enum(['combat', 'roleplay', 'exploration', 'milestone', 'fun']).default('milestone'),
  playerId: z.string(),
});

// ---- Encounter ----
export const createEncounterSchema = z.object({
  name: z.string().min(1).max(200),
  monsters: z.array(z.object({
    name: z.string(),
    cr: z.number(),
    count: z.number().int().min(1),
    hp: z.number().int(),
    ac: z.number().int(),
  })),
  difficulty: z.enum(['easy', 'medium', 'hard', 'deadly']).default('medium'),
  xpTotal: z.number().int().default(0),
  notes: z.string().max(5000).default(''),
});

// ---- Relationship ----
export const createRelationshipSchema = z.object({
  fromCharacterId: z.string(),
  fromCharacterName: z.string().max(100),
  toCharacterId: z.string(),
  toCharacterName: z.string().max(100),
  type: z.enum(['ally', 'rival', 'romantic', 'family', 'mentor', 'enemy', 'neutral']).default('neutral'),
  description: z.string().max(2000).default(''),
});

// ---- Audio Track ----
export const createAudioTrackSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  type: z.enum(['ambient', 'sfx']).default('ambient'),
  volume: z.number().min(0).max(1).default(0.5),
  loop: z.boolean().default(true),
  category: z.string().max(50).default('general'),
});

// ---- Fog of War ----
export const revealFogSchema = z.object({
  cells: z.array(z.object({
    row: z.number().int().min(0),
    col: z.number().int().min(0),
  })),
});

// ---- User Profile ----
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  image: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

// ---- Admin ----
export const adminUpdateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  isBanned: z.boolean().optional(),
  banReason: z.string().max(500).optional().nullable(),
  displayName: z.string().min(2).max(50).optional(),
});

export const adminResolveReportSchema = z.object({
  status: z.enum(['REVIEWING', 'RESOLVED', 'DISMISSED']),
  resolution: z.string().max(2000).optional(),
});

export const createReportSchema = z.object({
  targetType: z.enum(['User', 'Campaign', 'ChatMessage']),
  targetId: z.string().min(1),
  reason: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
});

export const adminSystemSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(),
  label: z.string().min(1).max(200),
  category: z.enum(['general', 'security', 'limits', 'features']).default('general'),
  type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
});
