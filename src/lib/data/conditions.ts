// ============================================================
// D&D 5e (2024) — Conditions Reference
// SRD-compatible content
// ============================================================

export interface Condition {
  name: string;
  icon: string;
  description: string;
  effects: string[];
  endCondition?: string;
}

export const CONDITIONS: Condition[] = [
  {
    name: 'Blinded',
    icon: '🙈',
    description: 'A blinded creature can\'t see and automatically fails any ability check that requires sight.',
    effects: [
      'Can\'t see, auto-fails checks requiring sight',
      'Attack rolls against the creature have Advantage',
      'The creature\'s attack rolls have Disadvantage',
    ],
  },
  {
    name: 'Charmed',
    icon: '💖',
    description: 'A charmed creature can\'t attack the charmer or target the charmer with harmful abilities or magical effects.',
    effects: [
      'Can\'t attack or target the charmer with harmful effects',
      'The charmer has Advantage on ability checks to interact socially with the creature',
    ],
  },
  {
    name: 'Deafened',
    icon: '🔇',
    description: 'A deafened creature can\'t hear and automatically fails any ability check that requires hearing.',
    effects: [
      'Can\'t hear',
      'Auto-fails ability checks requiring hearing',
    ],
  },
  {
    name: 'Exhaustion',
    icon: '😩',
    description: 'Exhaustion is measured in levels (1-6). Effects are cumulative. Finishing a Long Rest reduces by 1 level (with food/drink).',
    effects: [
      'Level 1: Disadvantage on ability checks',
      'Level 2: Speed halved',
      'Level 3: Disadvantage on attack rolls and saving throws',
      'Level 4: Hit point maximum halved',
      'Level 5: Speed reduced to 0',
      'Level 6: Death',
    ],
    endCondition: 'Long Rest reduces by 1 level (requires food and drink)',
  },
  {
    name: 'Frightened',
    icon: '😨',
    description: 'A frightened creature has Disadvantage on ability checks and attack rolls while the source of fear is in line of sight.',
    effects: [
      'Disadvantage on ability checks and attack rolls while source is visible',
      'Can\'t willingly move closer to the source of fear',
    ],
  },
  {
    name: 'Grappled',
    icon: '🤼',
    description: 'A grappled creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed.',
    effects: [
      'Speed becomes 0',
      'Can\'t benefit from bonuses to speed',
      'Ends if grappler is Incapacitated',
      'Ends if moved out of grappler\'s reach by an effect',
    ],
    endCondition: 'Escape using Action: Athletics or Acrobatics vs grappler\'s Athletics',
  },
  {
    name: 'Incapacitated',
    icon: '💫',
    description: 'An incapacitated creature can\'t take actions or reactions.',
    effects: [
      'Can\'t take Actions or Reactions',
    ],
  },
  {
    name: 'Invisible',
    icon: '👻',
    description: 'An invisible creature is impossible to see without magic or a special sense. The creature is heavily obscured for Hide purposes.',
    effects: [
      'Impossible to see without magic/special sense',
      'Considered heavily obscured',
      'Attack rolls against the creature have Disadvantage',
      'The creature\'s attack rolls have Advantage',
    ],
  },
  {
    name: 'Paralyzed',
    icon: '⚡',
    description: 'A paralyzed creature is incapacitated and can\'t move or speak.',
    effects: [
      'Incapacitated (can\'t take Actions or Reactions)',
      'Can\'t move or speak',
      'Auto-fails Strength and Dexterity saving throws',
      'Attack rolls against the creature have Advantage',
      'Melee hits within 5 ft are automatic Critical Hits',
    ],
  },
  {
    name: 'Petrified',
    icon: '🗿',
    description: 'A petrified creature is transformed into a solid inanimate substance (usually stone).',
    effects: [
      'Transformed into inanimate substance with all nonmagical objects',
      'Weight increases by factor of 10',
      'Ceases aging',
      'Incapacitated, can\'t move or speak, unaware of surroundings',
      'Attack rolls against have Advantage',
      'Auto-fails Strength and Dexterity saving throws',
      'Resistance to all damage',
      'Immune to poison and disease (existing ones suspended)',
    ],
  },
  {
    name: 'Poisoned',
    icon: '🤢',
    description: 'A poisoned creature has Disadvantage on attack rolls and ability checks.',
    effects: [
      'Disadvantage on attack rolls',
      'Disadvantage on ability checks',
    ],
  },
  {
    name: 'Prone',
    icon: '🔽',
    description: 'A prone creature\'s only movement option is to crawl (costs extra movement) unless it stands up.',
    effects: [
      'Can only crawl (every 1 ft costs 1 extra ft)',
      'Disadvantage on attack rolls',
      'Attack rolls within 5 ft have Advantage against creature',
      'Attack rolls beyond 5 ft have Disadvantage against creature',
    ],
    endCondition: 'Stand up by spending half your movement speed',
  },
  {
    name: 'Restrained',
    icon: '⛓️',
    description: 'A restrained creature\'s speed becomes 0 and it can\'t benefit from bonuses to speed.',
    effects: [
      'Speed becomes 0, no bonus to speed',
      'Attack rolls against the creature have Advantage',
      'The creature\'s attack rolls have Disadvantage',
      'Disadvantage on Dexterity saving throws',
    ],
  },
  {
    name: 'Stunned',
    icon: '💥',
    description: 'A stunned creature is incapacitated, can\'t move, and can speak only falteringly.',
    effects: [
      'Incapacitated (can\'t take Actions or Reactions)',
      'Can\'t move',
      'Can speak only falteringly',
      'Auto-fails Strength and Dexterity saving throws',
      'Attack rolls against the creature have Advantage',
    ],
  },
  {
    name: 'Unconscious',
    icon: '😴',
    description: 'An unconscious creature is incapacitated, can\'t move or speak, and is unaware of surroundings.',
    effects: [
      'Incapacitated, can\'t move or speak',
      'Unaware of surroundings',
      'Drops whatever it\'s holding, falls Prone',
      'Auto-fails Strength and Dexterity saving throws',
      'Attack rolls against have Advantage',
      'Melee hits within 5 ft are automatic Critical Hits',
    ],
  },
];

// ============================================================
// Combat Actions Reference
// ============================================================

export interface CombatAction {
  name: string;
  type: 'action' | 'bonus' | 'reaction' | 'movement' | 'free';
  description: string;
  details?: string[];
}

export const COMBAT_ACTIONS: CombatAction[] = [
  {
    name: 'Attack',
    type: 'action',
    description: 'Make a melee or ranged attack. At certain levels, you can make multiple attacks.',
    details: [
      'Melee: Strength mod + proficiency vs AC',
      'Ranged: Dexterity mod + proficiency vs AC',
      'Finesse: Choose Str or Dex',
      'Critical Hit on natural 20 (double damage dice)',
      'Critical Miss on natural 1 (auto-miss)',
    ],
  },
  {
    name: 'Cast a Spell',
    type: 'action',
    description: 'Cast a spell with a casting time of 1 action. Some spells use bonus actions or reactions.',
    details: [
      'Must have spell prepared/known',
      'Expends a spell slot (unless cantrip)',
      'Some require Concentration',
      'Verbal (V), Somatic (S), Material (M) components',
    ],
  },
  {
    name: 'Dash',
    type: 'action',
    description: 'Gain extra movement equal to your speed for the current turn.',
    details: ['Effectively doubles your movement for the turn'],
  },
  {
    name: 'Disengage',
    type: 'action',
    description: 'Your movement doesn\'t provoke opportunity attacks for the rest of the turn.',
  },
  {
    name: 'Dodge',
    type: 'action',
    description: 'Focus on avoiding attacks. Attack rolls against you have Disadvantage if you can see the attacker.',
    details: [
      'Disadvantage on attacks against you',
      'Advantage on Dexterity saving throws',
      'Lost if Incapacitated or speed drops to 0',
    ],
  },
  {
    name: 'Help',
    type: 'action',
    description: 'Aid an ally in attacking a creature or on an ability check.',
    details: [
      'Attack: Ally gets Advantage on next attack vs target',
      'Ability Check: Ally gets Advantage on next check',
      'Must be within 5 ft of target (for attack help)',
    ],
  },
  {
    name: 'Hide',
    type: 'action',
    description: 'Attempt to hide by making a Dexterity (Stealth) check.',
    details: [
      'Must be heavily obscured or behind cover',
      'Stealth check vs passive Perception of searchers',
      'Revealed if you make noise, attack, or are found',
    ],
  },
  {
    name: 'Ready',
    type: 'action',
    description: 'Prepare to act later using your Reaction when a trigger occurs.',
    details: [
      'Specify trigger and action to take',
      'Uses your Reaction when triggered',
      'Readied spells require Concentration',
    ],
  },
  {
    name: 'Search',
    type: 'action',
    description: 'Devote your attention to finding something. Make a Perception or Investigation check.',
  },
  {
    name: 'Use an Object',
    type: 'action',
    description: 'Interact with a second object or use a special object like a potion.',
    details: [
      'Free: Interact with one object (draw weapon, open door)',
      'Action: Second object interaction or complex use',
    ],
  },
  {
    name: 'Grapple',
    type: 'action',
    description: 'Special melee attack to grab a creature. Athletics vs Athletics/Acrobatics.',
    details: [
      'Target must be no more than one size larger',
      'Free hand required',
      'Target\'s speed becomes 0 on success',
      'Escape: Target uses action, Athletics/Acrobatics vs your Athletics',
    ],
  },
  {
    name: 'Shove',
    type: 'action',
    description: 'Special melee attack to push a creature prone or away from you.',
    details: [
      'Athletics vs Athletics/Acrobatics',
      'Target must be no more than one size larger',
      'Push 5 ft away or knock Prone',
    ],
  },
  {
    name: 'Two-Weapon Fighting',
    type: 'bonus',
    description: 'When you Attack with a light melee weapon, you can use a bonus action to attack with a different light melee weapon in your other hand.',
    details: ['Don\'t add ability modifier to bonus attack damage (unless negative)', 'Both weapons must have Light property'],
  },
  {
    name: 'Opportunity Attack',
    type: 'reaction',
    description: 'When a hostile creature you can see moves out of your reach, you can make one melee attack.',
    details: [
      'Uses your Reaction',
      'One melee attack only',
      'Triggered by leaving reach without Disengaging',
    ],
  },
  {
    name: 'Movement',
    type: 'movement',
    description: 'Move up to your speed on your turn. Can split movement before and after actions.',
    details: [
      'Difficult terrain costs double movement',
      'Climbing/Swimming costs double (without climb/swim speed)',
      'Crawling costs double',
      'Standing from Prone costs half your speed',
      'Jumping: Long = Str score ft (running), High = 3 + Str mod ft',
    ],
  },
];

// ============================================================
// Rest Rules
// ============================================================

export interface RestRule {
  type: 'short' | 'long';
  name: string;
  duration: string;
  benefits: string[];
  notes: string[];
}

export const REST_RULES: RestRule[] = [
  {
    type: 'short',
    name: 'Short Rest',
    duration: 'At least 1 hour',
    benefits: [
      'Spend Hit Dice to regain HP (roll + Con modifier per die)',
      'Some class features recharge on Short Rest',
      'Warlock spell slots recharge',
    ],
    notes: [
      'Can eat, drink, read, tend wounds during rest',
      'Cannot do strenuous activity',
      'Interrupted by combat, casting spells, or similar activity',
    ],
  },
  {
    type: 'long',
    name: 'Long Rest',
    duration: 'At least 8 hours (6 sleeping, 2 light activity)',
    benefits: [
      'Regain all lost Hit Points',
      'Regain spent Hit Dice (up to half your total)',
      'All spell slots regained',
      'Exhaustion reduced by 1 level (with food/drink)',
      'Most class features recharge',
    ],
    notes: [
      'Can\'t benefit from more than one Long Rest per 24 hours',
      'Must have at least 1 HP to start',
      'Interrupted by 1+ hour of walking, fighting, casting, or similar',
      'Light activity: standing watch, reading, talking',
    ],
  },
];

// ============================================================
// Cover Rules
// ============================================================

export interface CoverType {
  name: string;
  acBonus: string;
  dexSaveBonus: string;
  description: string;
}

export const COVER_RULES: CoverType[] = [
  {
    name: 'Half Cover',
    acBonus: '+2',
    dexSaveBonus: '+2',
    description: 'Low wall, furniture, creatures, narrow tree trunk — at least half the body is blocked.',
  },
  {
    name: 'Three-Quarters Cover',
    acBonus: '+5',
    dexSaveBonus: '+5',
    description: 'Portcullis, arrow slit, thick tree trunk — only a quarter of the body is exposed.',
  },
  {
    name: 'Total Cover',
    acBonus: 'Can\'t be targeted',
    dexSaveBonus: 'Can\'t be targeted',
    description: 'Completely concealed. Can\'t be targeted directly by attacks or spells.',
  },
];

// ============================================================
// Difficulty Class Reference
// ============================================================

export const DC_TABLE = [
  { difficulty: 'Very Easy', dc: 5 },
  { difficulty: 'Easy', dc: 10 },
  { difficulty: 'Medium', dc: 15 },
  { difficulty: 'Hard', dc: 20 },
  { difficulty: 'Very Hard', dc: 25 },
  { difficulty: 'Nearly Impossible', dc: 30 },
];

// ============================================================
// Experience Points by Level
// ============================================================

export const XP_TABLE = [
  { level: 1, xp: 0, proficiency: 2 },
  { level: 2, xp: 300, proficiency: 2 },
  { level: 3, xp: 900, proficiency: 2 },
  { level: 4, xp: 2700, proficiency: 2 },
  { level: 5, xp: 6500, proficiency: 3 },
  { level: 6, xp: 14000, proficiency: 3 },
  { level: 7, xp: 23000, proficiency: 3 },
  { level: 8, xp: 34000, proficiency: 3 },
  { level: 9, xp: 48000, proficiency: 4 },
  { level: 10, xp: 64000, proficiency: 4 },
  { level: 11, xp: 85000, proficiency: 4 },
  { level: 12, xp: 100000, proficiency: 4 },
  { level: 13, xp: 120000, proficiency: 5 },
  { level: 14, xp: 140000, proficiency: 5 },
  { level: 15, xp: 165000, proficiency: 5 },
  { level: 16, xp: 195000, proficiency: 5 },
  { level: 17, xp: 225000, proficiency: 6 },
  { level: 18, xp: 265000, proficiency: 6 },
  { level: 19, xp: 305000, proficiency: 6 },
  { level: 20, xp: 355000, proficiency: 6 },
];

// Encounter difficulty XP thresholds per character level
export const ENCOUNTER_DIFFICULTY = [
  { level: 1, easy: 25, medium: 50, hard: 75, deadly: 100 },
  { level: 2, easy: 50, medium: 100, hard: 150, deadly: 200 },
  { level: 3, easy: 75, medium: 150, hard: 225, deadly: 400 },
  { level: 4, easy: 125, medium: 250, hard: 375, deadly: 500 },
  { level: 5, easy: 250, medium: 500, hard: 750, deadly: 1100 },
  { level: 6, easy: 300, medium: 600, hard: 900, deadly: 1400 },
  { level: 7, easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  { level: 8, easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  { level: 9, easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  { level: 10, easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  { level: 11, easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  { level: 12, easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  { level: 13, easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  { level: 14, easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  { level: 15, easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  { level: 16, easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  { level: 17, easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  { level: 18, easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  { level: 19, easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  { level: 20, easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
];
