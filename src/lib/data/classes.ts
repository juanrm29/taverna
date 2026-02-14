// ============================================================
// D&D 5e (2024) — Class Features & Subclasses (SRD)
// ============================================================

export interface ClassFeature {
  level: number;
  name: string;
  description: string;
}

export interface Subclass {
  name: string;
  description: string;
  features: ClassFeature[];
}

export interface ClassDetail {
  name: string;
  hitDie: string;
  primaryAbility: string;
  savingThrows: string;
  armorProficiencies: string;
  weaponProficiencies: string;
  toolProficiencies: string;
  skillChoices: string;
  startingEquipment: string[];
  spellcasting?: {
    ability: string;
    type: 'Full' | 'Half' | 'Third' | 'Pact' | 'None';
    description: string;
  };
  features: ClassFeature[];
  subclasses: Subclass[];
  subclassLevel: number;
  subclassName: string;
  description: string;
}

// ── Spell Slot Progression ──────────────────────────────
export interface SpellSlotRow {
  level: number;
  cantrips: number;
  slots: number[]; // indices 0-8 for spell levels 1-9
}

export const FULL_CASTER_SLOTS: SpellSlotRow[] = [
  { level: 1,  cantrips: 3, slots: [2,0,0,0,0,0,0,0,0] },
  { level: 2,  cantrips: 3, slots: [3,0,0,0,0,0,0,0,0] },
  { level: 3,  cantrips: 3, slots: [4,2,0,0,0,0,0,0,0] },
  { level: 4,  cantrips: 4, slots: [4,3,0,0,0,0,0,0,0] },
  { level: 5,  cantrips: 4, slots: [4,3,2,0,0,0,0,0,0] },
  { level: 6,  cantrips: 4, slots: [4,3,3,0,0,0,0,0,0] },
  { level: 7,  cantrips: 4, slots: [4,3,3,1,0,0,0,0,0] },
  { level: 8,  cantrips: 4, slots: [4,3,3,2,0,0,0,0,0] },
  { level: 9,  cantrips: 4, slots: [4,3,3,3,1,0,0,0,0] },
  { level: 10, cantrips: 5, slots: [4,3,3,3,2,0,0,0,0] },
  { level: 11, cantrips: 5, slots: [4,3,3,3,2,1,0,0,0] },
  { level: 12, cantrips: 5, slots: [4,3,3,3,2,1,0,0,0] },
  { level: 13, cantrips: 5, slots: [4,3,3,3,2,1,1,0,0] },
  { level: 14, cantrips: 5, slots: [4,3,3,3,2,1,1,0,0] },
  { level: 15, cantrips: 5, slots: [4,3,3,3,2,1,1,1,0] },
  { level: 16, cantrips: 5, slots: [4,3,3,3,2,1,1,1,0] },
  { level: 17, cantrips: 5, slots: [4,3,3,3,2,1,1,1,1] },
  { level: 18, cantrips: 5, slots: [4,3,3,3,3,1,1,1,1] },
  { level: 19, cantrips: 5, slots: [4,3,3,3,3,2,1,1,1] },
  { level: 20, cantrips: 5, slots: [4,3,3,3,3,2,2,1,1] },
];

export const HALF_CASTER_SLOTS: SpellSlotRow[] = [
  { level: 1,  cantrips: 0, slots: [0,0,0,0,0,0,0,0,0] },
  { level: 2,  cantrips: 0, slots: [2,0,0,0,0,0,0,0,0] },
  { level: 3,  cantrips: 0, slots: [3,0,0,0,0,0,0,0,0] },
  { level: 4,  cantrips: 0, slots: [3,0,0,0,0,0,0,0,0] },
  { level: 5,  cantrips: 0, slots: [4,2,0,0,0,0,0,0,0] },
  { level: 6,  cantrips: 0, slots: [4,2,0,0,0,0,0,0,0] },
  { level: 7,  cantrips: 0, slots: [4,3,0,0,0,0,0,0,0] },
  { level: 8,  cantrips: 0, slots: [4,3,0,0,0,0,0,0,0] },
  { level: 9,  cantrips: 0, slots: [4,3,2,0,0,0,0,0,0] },
  { level: 10, cantrips: 0, slots: [4,3,2,0,0,0,0,0,0] },
  { level: 11, cantrips: 0, slots: [4,3,3,0,0,0,0,0,0] },
  { level: 12, cantrips: 0, slots: [4,3,3,0,0,0,0,0,0] },
  { level: 13, cantrips: 0, slots: [4,3,3,1,0,0,0,0,0] },
  { level: 14, cantrips: 0, slots: [4,3,3,1,0,0,0,0,0] },
  { level: 15, cantrips: 0, slots: [4,3,3,2,0,0,0,0,0] },
  { level: 16, cantrips: 0, slots: [4,3,3,2,0,0,0,0,0] },
  { level: 17, cantrips: 0, slots: [4,3,3,3,1,0,0,0,0] },
  { level: 18, cantrips: 0, slots: [4,3,3,3,1,0,0,0,0] },
  { level: 19, cantrips: 0, slots: [4,3,3,3,2,0,0,0,0] },
  { level: 20, cantrips: 0, slots: [4,3,3,3,2,0,0,0,0] },
];

export const WARLOCK_SLOTS: { level: number; cantrips: number; slotLevel: number; slots: number; invocations: number }[] = [
  { level: 1,  cantrips: 2, slotLevel: 1, slots: 1, invocations: 0 },
  { level: 2,  cantrips: 2, slotLevel: 1, slots: 2, invocations: 2 },
  { level: 3,  cantrips: 2, slotLevel: 2, slots: 2, invocations: 2 },
  { level: 4,  cantrips: 3, slotLevel: 2, slots: 2, invocations: 2 },
  { level: 5,  cantrips: 3, slotLevel: 3, slots: 2, invocations: 3 },
  { level: 6,  cantrips: 3, slotLevel: 3, slots: 2, invocations: 3 },
  { level: 7,  cantrips: 3, slotLevel: 4, slots: 2, invocations: 4 },
  { level: 8,  cantrips: 3, slotLevel: 4, slots: 2, invocations: 4 },
  { level: 9,  cantrips: 3, slotLevel: 5, slots: 2, invocations: 5 },
  { level: 10, cantrips: 4, slotLevel: 5, slots: 2, invocations: 5 },
  { level: 11, cantrips: 4, slotLevel: 5, slots: 3, invocations: 5 },
  { level: 12, cantrips: 4, slotLevel: 5, slots: 3, invocations: 6 },
  { level: 13, cantrips: 4, slotLevel: 5, slots: 3, invocations: 6 },
  { level: 14, cantrips: 4, slotLevel: 5, slots: 3, invocations: 6 },
  { level: 15, cantrips: 4, slotLevel: 5, slots: 3, invocations: 7 },
  { level: 16, cantrips: 4, slotLevel: 5, slots: 3, invocations: 7 },
  { level: 17, cantrips: 4, slotLevel: 5, slots: 4, invocations: 7 },
  { level: 18, cantrips: 4, slotLevel: 5, slots: 4, invocations: 8 },
  { level: 19, cantrips: 4, slotLevel: 5, slots: 4, invocations: 8 },
  { level: 20, cantrips: 4, slotLevel: 5, slots: 4, invocations: 8 },
];

// ── Classes ─────────────────────────────────────────────
export const CLASSES: ClassDetail[] = [
  {
    name: 'Barbarian',
    hitDie: 'd12',
    primaryAbility: 'Strength',
    savingThrows: 'Strength, Constitution',
    armorProficiencies: 'Light armor, medium armor, shields',
    weaponProficiencies: 'Simple weapons, martial weapons',
    toolProficiencies: 'None',
    skillChoices: 'Choose 2: Animal Handling, Athletics, Intimidation, Nature, Perception, Survival',
    startingEquipment: ['Greataxe or any martial weapon', 'Two handaxes or any simple weapon', 'Explorer\'s pack', '4 javelins'],
    features: [
      { level: 1, name: 'Rage', description: 'Enter rage as a bonus action. Advantage on Str checks/saves, bonus rage damage on melee, resistance to bludgeoning/piercing/slashing. 2 rages at 1st level, scaling to 6 at 17th. Lasts 1 minute.' },
      { level: 1, name: 'Unarmored Defense', description: 'While not wearing armor, your AC = 10 + Dex modifier + Con modifier. You can use a shield and still gain this benefit.' },
      { level: 2, name: 'Reckless Attack', description: 'When you make your first attack on your turn, you can choose to gain advantage on melee Str attack rolls that turn, but attack rolls against you have advantage until your next turn.' },
      { level: 2, name: 'Danger Sense', description: 'Advantage on Dexterity saving throws against effects you can see (e.g., traps, spells). Not while blinded, deafened, or incapacitated.' },
      { level: 5, name: 'Extra Attack', description: 'You can attack twice, instead of once, when you take the Attack action on your turn.' },
      { level: 5, name: 'Fast Movement', description: 'Your speed increases by 10 feet while you aren\'t wearing heavy armor.' },
      { level: 7, name: 'Feral Instinct', description: 'Advantage on initiative rolls. If surprised, you can still act normally if you enter your rage first.' },
      { level: 11, name: 'Relentless Rage', description: 'If you drop to 0 HP while raging, make a DC 10 Constitution saving throw. On success, drop to 1 HP instead. Each time, DC increases by 5. Resets on short/long rest.' },
      { level: 15, name: 'Persistent Rage', description: 'Your rage only ends early if you fall unconscious or choose to end it.' },
      { level: 18, name: 'Indomitable Might', description: 'If your total for a Strength check is less than your Strength score, you can use your Strength score in place of the total.' },
      { level: 20, name: 'Primal Champion', description: 'Your Strength and Constitution scores each increase by 4. Maximum for those scores is now 24.' },
    ],
    subclasses: [
      { name: 'Path of the Berserker', description: 'Rage burns beyond control.', features: [
        { level: 3, name: 'Frenzy', description: 'While raging, you can make a single melee weapon attack as a bonus action on each turn. When rage ends, you gain one level of exhaustion.' },
        { level: 6, name: 'Mindless Rage', description: 'Can\'t be charmed or frightened while raging.' },
        { level: 10, name: 'Intimidating Presence', description: 'Use action to frighten a creature within 30 ft. Wis save (DC 8 + prof + Cha mod).' },
        { level: 14, name: 'Retaliation', description: 'When you take damage from a creature within 5 ft., you can use your reaction to make a melee weapon attack against it.' },
      ]},
      { name: 'Path of the Totem Warrior', description: 'Spiritual journey accepting a spirit animal as guide.', features: [
        { level: 3, name: 'Totem Spirit', description: 'Choose Bear (resistance to all damage except psychic while raging), Eagle (opportunity attacks against you have disadvantage, Dash as bonus action), or Wolf (allies have advantage on melee attacks against enemies within 5 ft. of you while raging).' },
        { level: 6, name: 'Aspect of the Beast', description: 'Bear: carrying capacity doubled. Eagle: see up to 1 mile with no difficulty. Wolf: track at fast pace, move stealthily at normal pace.' },
        { level: 14, name: 'Totemic Attunement', description: 'Bear: while raging, hostile creatures within 5 ft. have disadvantage on attacks against allies. Eagle: fly speed while raging (fall if you end turn in air). Wolf: while raging, bonus action to knock Large or smaller creature prone on melee hit.' },
      ]},
      { name: 'Path of Wild Heart (2024)', description: 'Draws power from the natural world.', features: [
        { level: 3, name: 'Animal Speaker', description: 'You can cast Beast Sense and Speak with Animals as rituals.' },
        { level: 3, name: 'Rage of the Wilds', description: 'When you enter rage, choose Bear (resistance to all except psychic/force), Eagle (Disengage/Dash as bonus action), or Wolf (allies have advantage on melee attacks vs enemies within 5 ft. of you).' },
      ]},
    ],
    subclassLevel: 3,
    subclassName: 'Primal Path',
    description: 'A fierce warrior of primitive background who can enter a battle rage.',
  },

  {
    name: 'Bard',
    hitDie: 'd8',
    primaryAbility: 'Charisma',
    savingThrows: 'Dexterity, Charisma',
    armorProficiencies: 'Light armor',
    weaponProficiencies: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords',
    toolProficiencies: 'Three musical instruments of your choice',
    skillChoices: 'Choose any 3',
    startingEquipment: ['Rapier, longsword, or any simple weapon', 'Diplomat\'s pack or entertainer\'s pack', 'Lute or any musical instrument', 'Leather armor', 'Dagger'],
    spellcasting: { ability: 'Charisma', type: 'Full', description: 'Full caster. Learns spells from the bard spell list. Uses Charisma for spellcasting.' },
    features: [
      { level: 1, name: 'Bardic Inspiration', description: 'Bonus action to give an ally within 60 ft. an inspiration die (d6, scaling to d12). They can add it to one ability check, attack roll, or saving throw within 10 minutes. Uses equal to Charisma modifier, regain on long rest (short rest at 5th).' },
      { level: 2, name: 'Jack of All Trades', description: 'Add half your proficiency bonus (rounded down) to any ability check you make that doesn\'t already include your proficiency bonus.' },
      { level: 2, name: 'Song of Rest', description: 'During a short rest, you or allies who hear your performance regain an extra 1d6 HP (scales with level) when spending Hit Dice.' },
      { level: 3, name: 'Expertise', description: 'Choose two skill proficiencies. Your proficiency bonus is doubled for any check you make with them.' },
      { level: 5, name: 'Font of Inspiration', description: 'You regain all expended uses of Bardic Inspiration on a short or long rest.' },
      { level: 6, name: 'Countercharm', description: 'As an action, start a performance that lasts until the end of your next turn. You and friendly creatures within 30 ft. have advantage on saves against being frightened or charmed.' },
      { level: 10, name: 'Magical Secrets', description: 'Choose two spells from any class\'s spell list. They count as bard spells for you.' },
      { level: 20, name: 'Superior Inspiration', description: 'When you roll initiative and have no uses of Bardic Inspiration left, you regain one use.' },
    ],
    subclasses: [
      { name: 'College of Lore', description: 'Knowledge is power.', features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'Gain proficiency in three skills of your choice.' },
        { level: 3, name: 'Cutting Words', description: 'Use reaction to subtract Bardic Inspiration die from a creature\'s attack roll, ability check, or damage roll.' },
        { level: 6, name: 'Additional Magical Secrets', description: 'Learn two spells from any class (early access to Magical Secrets).' },
        { level: 14, name: 'Peerless Skill', description: 'Add Bardic Inspiration to your own ability checks.' },
      ]},
      { name: 'College of Valor', description: 'Bards who inspire others in battle.', features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'Medium armor, shields, and martial weapons.' },
        { level: 3, name: 'Combat Inspiration', description: 'Allies can add Bardic Inspiration to damage rolls or AC (as reaction) in addition to normal uses.' },
        { level: 6, name: 'Extra Attack', description: 'Attack twice when taking the Attack action.' },
        { level: 14, name: 'Battle Magic', description: 'When you use your action to cast a bard spell, you can make one weapon attack as a bonus action.' },
      ]},
    ],
    subclassLevel: 3,
    subclassName: 'Bard College',
    description: 'An inspiring magician whose power echoes the music of creation.',
  },

  {
    name: 'Cleric',
    hitDie: 'd8',
    primaryAbility: 'Wisdom',
    savingThrows: 'Wisdom, Charisma',
    armorProficiencies: 'Light armor, medium armor, shields',
    weaponProficiencies: 'Simple weapons',
    toolProficiencies: 'None',
    skillChoices: 'Choose 2: History, Insight, Medicine, Persuasion, Religion',
    startingEquipment: ['Mace or warhammer (if proficient)', 'Scale mail, leather armor, or chain mail (if proficient)', 'Light crossbow and 20 bolts or any simple weapon', 'Priest\'s pack or explorer\'s pack', 'Shield', 'Holy symbol'],
    spellcasting: { ability: 'Wisdom', type: 'Full', description: 'Full caster with access to entire cleric spell list. Prepares spells daily. Uses Wisdom for spellcasting.' },
    features: [
      { level: 1, name: 'Divine Domain', description: 'Choose a domain. Each domain grants bonus spells, channel divinity options, and unique features.' },
      { level: 2, name: 'Channel Divinity', description: 'Gain the ability to channel divine energy. Turn Undead: present holy symbol, each undead within 30 ft. must make a Wis save or be turned for 1 minute. 1 use per short/long rest (2 at 6th, 3 at 18th).' },
      { level: 5, name: 'Destroy Undead', description: 'When an undead fails its saving throw against Turn Undead, it is instantly destroyed if its CR is at or below a threshold (CR 1/2 at 5th, scaling to CR 4 at 17th).' },
      { level: 10, name: 'Divine Intervention', description: 'Call upon your deity. Roll d100; if you roll ≤ your cleric level, the DM chooses the nature of the intervention. If it fails, you can try again after a long rest. At 20th level, it automatically succeeds.' },
    ],
    subclasses: [
      { name: 'Life Domain', description: 'The Life domain focuses on healing.', features: [
        { level: 1, name: 'Bonus Proficiency', description: 'Heavy armor proficiency.' },
        { level: 1, name: 'Disciple of Life', description: 'Healing spells restore an additional 2 + spell level HP.' },
        { level: 2, name: 'Channel Divinity: Preserve Life', description: 'Restore HP equal to 5× cleric level, divided among creatures within 30 ft.' },
        { level: 6, name: 'Blessed Healer', description: 'When you cast a healing spell on another, you regain 2 + spell level HP.' },
        { level: 8, name: 'Divine Strike', description: 'Weapon attacks deal an extra 1d8 radiant damage (2d8 at 14th).' },
        { level: 17, name: 'Supreme Healing', description: 'Healing spells always restore maximum HP instead of rolling.' },
      ]},
      { name: 'Light Domain', description: 'The Light domain emphasizes fire and radiance.', features: [
        { level: 1, name: 'Bonus Cantrip', description: 'You gain the Light cantrip if you don\'t already know it.' },
        { level: 1, name: 'Warding Flare', description: 'Reaction: impose disadvantage on an attacker\'s attack roll. Uses equal to Wis modifier.' },
        { level: 2, name: 'Channel Divinity: Radiance of the Dawn', description: 'Dispel magical darkness within 30 ft. Each hostile creature makes Con save or takes 2d10 + cleric level radiant damage (half on save).' },
        { level: 6, name: 'Improved Flare', description: 'Warding Flare can protect allies within 30 ft.' },
      ]},
      { name: 'War Domain', description: 'The War domain channels divine martial power.', features: [
        { level: 1, name: 'Bonus Proficiency', description: 'Heavy armor and martial weapons.' },
        { level: 1, name: 'War Priest', description: 'Bonus action: make one weapon attack. Uses equal to Wis modifier per long rest.' },
        { level: 2, name: 'Channel Divinity: Guided Strike', description: '+10 to an attack roll after you see the roll.' },
        { level: 6, name: 'Channel Divinity: War God\'s Blessing', description: '+10 to an ally\'s attack roll within 30 ft.' },
      ]},
    ],
    subclassLevel: 1,
    subclassName: 'Divine Domain',
    description: 'A priestly champion who wields divine magic in service of a higher power.',
  },

  {
    name: 'Druid',
    hitDie: 'd8',
    primaryAbility: 'Wisdom',
    savingThrows: 'Intelligence, Wisdom',
    armorProficiencies: 'Light armor, medium armor, shields (no metal)',
    weaponProficiencies: 'Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears',
    toolProficiencies: 'Herbalism kit',
    skillChoices: 'Choose 2: Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, Survival',
    startingEquipment: ['Wooden shield or any simple weapon', 'Scimitar or any simple melee weapon', 'Leather armor', 'Explorer\'s pack', 'Druidic focus'],
    spellcasting: { ability: 'Wisdom', type: 'Full', description: 'Full caster with access to entire druid spell list. Prepares spells daily. Uses Wisdom for spellcasting.' },
    features: [
      { level: 1, name: 'Druidic', description: 'You know Druidic, the secret language of druids.' },
      { level: 2, name: 'Wild Shape', description: 'Magically transform into a beast you have seen. 2 uses per short/long rest. Max CR: 1/4 at 2nd (no flying/swimming), 1/2 at 4th (no flying), 1 at 8th. Duration: level/2 hours.' },
      { level: 18, name: 'Timeless Body', description: 'Age 1 year for every 10 years that pass.' },
      { level: 18, name: 'Beast Spells', description: 'You can cast spells while in Wild Shape if they don\'t require material components.' },
      { level: 20, name: 'Archdruid', description: 'You can use Wild Shape an unlimited number of times.' },
    ],
    subclasses: [
      { name: 'Circle of the Land', description: 'Mystical connection to land.', features: [
        { level: 2, name: 'Bonus Cantrip', description: 'Learn one additional druid cantrip.' },
        { level: 2, name: 'Natural Recovery', description: 'During short rest, recover spell slots with combined level ≤ half your druid level (rounded up). No 6th level or higher.' },
        { level: 3, name: 'Circle Spells', description: 'Choose a land type (Arctic, Coast, Desert, Forest, Grassland, Mountain, Swamp, Underdark). You gain bonus spells at various levels.' },
      ]},
      { name: 'Circle of the Moon', description: 'Masters of Wild Shape.', features: [
        { level: 2, name: 'Combat Wild Shape', description: 'Wild Shape as bonus action instead of action. While in beast form, can spend a spell slot to regain 1d8 HP per slot level.' },
        { level: 2, name: 'Circle Forms', description: 'Wild Shape into beasts with CR up to 1 (CR = druid level/3 at 6th level, rounded down).' },
        { level: 6, name: 'Primal Strike', description: 'Your beast form attacks count as magical for the purpose of overcoming resistance and immunity.' },
        { level: 10, name: 'Elemental Wild Shape', description: 'Expend two uses of Wild Shape to transform into an air, earth, fire, or water elemental.' },
        { level: 14, name: 'Thousand Forms', description: 'Cast Alter Self at will.' },
      ]},
    ],
    subclassLevel: 2,
    subclassName: 'Druid Circle',
    description: 'A priest of the Old Faith, wielding the powers of nature and adopting animal forms.',
  },

  {
    name: 'Fighter',
    hitDie: 'd10',
    primaryAbility: 'Strength or Dexterity',
    savingThrows: 'Strength, Constitution',
    armorProficiencies: 'All armor, shields',
    weaponProficiencies: 'Simple weapons, martial weapons',
    toolProficiencies: 'None',
    skillChoices: 'Choose 2: Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Perception, Survival',
    startingEquipment: ['Chain mail or leather armor + longbow + 20 arrows', 'Martial weapon and shield or two martial weapons', 'Light crossbow and 20 bolts or two handaxes', 'Dungeoneer\'s pack or explorer\'s pack'],
    features: [
      { level: 1, name: 'Fighting Style', description: 'Choose one: Archery (+2 ranged attack), Defense (+1 AC in armor), Dueling (+2 damage with one-handed), Great Weapon Fighting (reroll 1-2 on damage with two-handed), Protection (impose disadvantage on attack against adjacent ally with shield), Two-Weapon Fighting (add ability modifier to off-hand damage).' },
      { level: 1, name: 'Second Wind', description: 'Bonus action to regain 1d10 + fighter level HP. Once per short/long rest.' },
      { level: 2, name: 'Action Surge', description: 'Take one additional action on your turn. Once per short/long rest (twice at 17th level).' },
      { level: 5, name: 'Extra Attack', description: 'Attack twice when taking the Attack action (three times at 11th, four times at 20th).' },
      { level: 9, name: 'Indomitable', description: 'Reroll a failed saving throw. Once per long rest (twice at 13th, thrice at 17th).' },
    ],
    subclasses: [
      { name: 'Champion', description: 'Archetypal master of martial combat.', features: [
        { level: 3, name: 'Improved Critical', description: 'Your weapon attacks score a critical hit on a roll of 19 or 20.' },
        { level: 7, name: 'Remarkable Athlete', description: 'Add half proficiency bonus (round up) to any Str, Dex, or Con check that doesn\'t already use your proficiency bonus. Running long jump distance increases by Str modifier feet.' },
        { level: 10, name: 'Additional Fighting Style', description: 'Choose a second Fighting Style option.' },
        { level: 15, name: 'Superior Critical', description: 'Weapon attacks score a critical hit on a roll of 18–20.' },
        { level: 18, name: 'Survivor', description: 'At the start of each of your turns, you regain 5 + Con modifier HP if you have no more than half your HP left. Not while at 0 HP.' },
      ]},
      { name: 'Battle Master', description: 'Tactical superiority in combat.', features: [
        { level: 3, name: 'Combat Superiority', description: 'You learn 3 maneuvers and gain 4 superiority dice (d8). Expend a die to use a maneuver. Regain all dice on short/long rest.' },
        { level: 3, name: 'Student of War', description: 'Gain proficiency with one type of artisan\'s tools.' },
        { level: 7, name: 'Know Your Enemy', description: 'Spend 1 minute observing a creature to learn if it is superior, equal, or inferior to you in two characteristics.' },
        { level: 15, name: 'Relentless', description: 'When you roll initiative with no superiority dice remaining, you regain one.' },
      ]},
      { name: 'Eldritch Knight', description: 'Combines martial prowess with magic.', features: [
        { level: 3, name: 'Spellcasting', description: 'Learn wizard spells (abjuration and evocation focus). Intelligence is your spellcasting ability. Third-caster progression.' },
        { level: 3, name: 'Weapon Bond', description: 'Bond with up to two weapons. Can\'t be disarmed, and you can summon a bonded weapon as a bonus action.' },
        { level: 7, name: 'War Magic', description: 'When you use your action to cast a cantrip, you can make one weapon attack as a bonus action.' },
        { level: 15, name: 'Arcane Charge', description: 'When you use Action Surge, you can teleport up to 30 feet to an unoccupied space.' },
      ]},
    ],
    subclassLevel: 3,
    subclassName: 'Martial Archetype',
    description: 'A master of martial combat, skilled with a variety of weapons and armor.',
  },

  {
    name: 'Monk',
    hitDie: 'd8',
    primaryAbility: 'Dexterity & Wisdom',
    savingThrows: 'Strength, Dexterity',
    armorProficiencies: 'None',
    weaponProficiencies: 'Simple weapons, shortswords',
    toolProficiencies: 'One type of artisan\'s tools or one musical instrument',
    skillChoices: 'Choose 2: Acrobatics, Athletics, History, Insight, Religion, Stealth',
    startingEquipment: ['Shortsword or any simple weapon', '10 darts', 'Dungeoneer\'s pack or explorer\'s pack'],
    features: [
      { level: 1, name: 'Unarmored Defense', description: 'While unarmored, AC = 10 + Dex modifier + Wis modifier.' },
      { level: 1, name: 'Martial Arts', description: 'While unarmored and using monk weapons: use Dex instead of Str, roll martial arts die (d4, scaling to d10 at 17th) instead of normal weapon damage, bonus action unarmed strike.' },
      { level: 2, name: 'Ki', description: 'Ki points = monk level. Spend ki for Flurry of Blows (2 unarmed strikes as bonus action), Patient Defense (Dodge as bonus action), Step of the Wind (Disengage or Dash as bonus action, jump distance doubled).' },
      { level: 2, name: 'Unarmored Movement', description: 'Speed increases by 10 ft. while unarmored (scaling to +30 ft. at 18th level). At 9th level, you can move along vertical surfaces and across liquids.' },
      { level: 3, name: 'Deflect Missiles', description: 'Reaction: reduce ranged weapon damage by 1d10 + Dex modifier + monk level. If reduced to 0, you can spend 1 ki point to throw the missile (20/60 ft. range, monk weapon damage).' },
      { level: 4, name: 'Slow Fall', description: 'Reaction: reduce falling damage by 5× monk level.' },
      { level: 5, name: 'Extra Attack', description: 'Attack twice when taking the Attack action.' },
      { level: 5, name: 'Stunning Strike', description: 'When you hit a creature with a melee weapon attack, spend 1 ki point to attempt a stunning strike. Target must succeed on a Con save or be stunned until the end of your next turn.' },
      { level: 7, name: 'Evasion', description: 'When you make a Dex save for half damage, take no damage on success and half damage on failure.' },
      { level: 7, name: 'Stillness of Mind', description: 'Use your action to end one charmed or frightened effect on yourself.' },
      { level: 10, name: 'Purity of Body', description: 'Immune to disease and poison.' },
      { level: 13, name: 'Tongue of the Sun and Moon', description: 'You can understand and be understood by any creature that speaks a language.' },
      { level: 14, name: 'Diamond Soul', description: 'Proficiency in all saving throws. Spend 1 ki point to reroll a failed save.' },
      { level: 15, name: 'Timeless Body', description: 'You no longer need food or water, and you don\'t age.' },
      { level: 18, name: 'Empty Body', description: 'Spend 4 ki points to become invisible for 1 minute (resistance to all damage except force). Spend 8 ki points to cast Astral Projection.' },
      { level: 20, name: 'Perfect Self', description: 'When you roll initiative with no ki points, you regain 4 ki points.' },
    ],
    subclasses: [
      { name: 'Way of the Open Hand', description: 'Ultimate mastery of martial arts combat.', features: [
        { level: 3, name: 'Open Hand Technique', description: 'When you hit with Flurry of Blows, you can impose a Dex save (prone), Str save (push 15 ft.), or deny reactions until end of your next turn.' },
        { level: 6, name: 'Wholeness of Body', description: 'As an action, regain HP equal to 3× monk level. Once per long rest.' },
        { level: 11, name: 'Tranquility', description: 'At the end of a long rest, gain the effect of a Sanctuary spell until next long rest (Wis save DC = 8 + Wis modifier + proficiency).' },
        { level: 17, name: 'Quivering Palm', description: 'Spend 3 ki points when you hit with unarmed strike. Choose to end it within number of days = monk level: creature makes Con save or is reduced to 0 HP. On success, takes 10d10 necrotic damage.' },
      ]},
      { name: 'Way of Shadow', description: 'Stealth and darkness.', features: [
        { level: 3, name: 'Shadow Arts', description: 'Spend 2 ki points to cast Darkness, Darkvision, Pass without Trace, or Silence. You also learn Minor Illusion cantrip.' },
        { level: 6, name: 'Shadow Step', description: 'Teleport up to 60 ft. from one area of dim light/darkness to another as a bonus action. Advantage on next melee attack before end of turn.' },
      ]},
    ],
    subclassLevel: 3,
    subclassName: 'Monastic Tradition',
    description: 'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.',
  },

  {
    name: 'Paladin',
    hitDie: 'd10',
    primaryAbility: 'Strength & Charisma',
    savingThrows: 'Wisdom, Charisma',
    armorProficiencies: 'All armor, shields',
    weaponProficiencies: 'Simple weapons, martial weapons',
    toolProficiencies: 'None',
    skillChoices: 'Choose 2: Athletics, Insight, Intimidation, Medicine, Persuasion, Religion',
    startingEquipment: ['Martial weapon and shield or two martial weapons', 'Five javelins or any simple melee weapon', 'Priest\'s pack or explorer\'s pack', 'Chain mail', 'Holy symbol'],
    spellcasting: { ability: 'Charisma', type: 'Half', description: 'Half caster starting at 2nd level. Prepares spells from paladin list. Uses Charisma for spellcasting.' },
    features: [
      { level: 1, name: 'Divine Sense', description: 'As an action, detect any celestial, fiend, or undead within 60 ft., and any consecrated/desecrated place within the same range. Uses = 1 + Cha modifier per long rest.' },
      { level: 1, name: 'Lay on Hands', description: 'Pool of healing power = 5× paladin level HP. As an action, touch a creature and restore HP from the pool, or spend 5 HP from the pool to cure a disease or neutralize a poison.' },
      { level: 2, name: 'Fighting Style', description: 'Choose one: Defense, Dueling, Great Weapon Fighting, Protection.' },
      { level: 2, name: 'Divine Smite', description: 'When you hit with a melee weapon attack, expend a spell slot to deal extra radiant damage: 2d8 for 1st-level slot, +1d8 per higher level (max 5d8). +1d8 against undead and fiends.' },
      { level: 3, name: 'Channel Divinity', description: 'Gain Channel Divinity options from your Sacred Oath. 1 use per short/long rest.' },
      { level: 5, name: 'Extra Attack', description: 'Attack twice when taking the Attack action.' },
      { level: 6, name: 'Aura of Protection', description: 'You and friendly creatures within 10 ft. gain a bonus to saving throws equal to your Charisma modifier (minimum +1). 30 ft. at 18th level.' },
      { level: 10, name: 'Aura of Courage', description: 'You and friendly creatures within 10 ft. can\'t be frightened while you are conscious. 30 ft. at 18th level.' },
      { level: 14, name: 'Cleansing Touch', description: 'As an action, end one spell on yourself or on a willing creature you touch. Uses = Cha modifier per long rest.' },
    ],
    subclasses: [
      { name: 'Oath of Devotion', description: 'The highest ideals of justice, virtue, and order.', features: [
        { level: 3, name: 'Channel Divinity: Sacred Weapon', description: 'As an action, add Cha modifier to attack rolls with one weapon for 1 minute. Weapon emits bright light 20 ft.' },
        { level: 3, name: 'Channel Divinity: Turn the Unholy', description: 'Each fiend or undead within 30 ft. must make a Wis save or be turned for 1 minute.' },
        { level: 7, name: 'Aura of Devotion', description: 'You and friendly creatures within 10 ft. can\'t be charmed while you are conscious.' },
        { level: 15, name: 'Purity of Spirit', description: 'You are always under the effects of Protection from Evil and Good.' },
        { level: 20, name: 'Holy Nimbus', description: 'As an action, emanate bright light 30 ft./dim 30 ft. for 1 minute. Enemies starting turn in bright light take 10 radiant damage. Advantage on saves vs. fiend/undead spells.' },
      ]},
    ],
    subclassLevel: 3,
    subclassName: 'Sacred Oath',
    description: 'A holy warrior bound to a sacred oath.',
  },

  {
    name: 'Ranger',
    hitDie: 'd10',
    primaryAbility: 'Dexterity & Wisdom',
    savingThrows: 'Strength, Dexterity',
    armorProficiencies: 'Light armor, medium armor, shields',
    weaponProficiencies: 'Simple weapons, martial weapons',
    toolProficiencies: 'None',
    skillChoices: 'Choose 3: Animal Handling, Athletics, Insight, Investigation, Nature, Perception, Stealth, Survival',
    startingEquipment: ['Scale mail or leather armor', 'Two shortswords or two simple melee weapons', 'Dungeoneer\'s pack or explorer\'s pack', 'Longbow and 20 arrows'],
    spellcasting: { ability: 'Wisdom', type: 'Half', description: 'Half caster starting at 2nd level. Learns spells from the ranger spell list. Uses Wisdom for spellcasting.' },
    features: [
      { level: 1, name: 'Favored Enemy', description: 'Choose a type of favored enemy. Advantage on Survival checks to track them, and Intelligence checks to recall information about them. Learn one language spoken by them.' },
      { level: 1, name: 'Natural Explorer', description: 'Choose a type of favored terrain. While traveling in your favored terrain: difficult terrain doesn\'t slow your group, can\'t become lost except by magic, always alert to danger, move stealthily at normal pace, find twice as much food, learn exact number/size of tracked creatures.' },
      { level: 2, name: 'Fighting Style', description: 'Choose one: Archery, Defense, Dueling, Two-Weapon Fighting.' },
      { level: 3, name: 'Primeval Awareness', description: 'Spend a spell slot to sense aberrations, celestials, dragons, elementals, fey, fiends, and undead within 1 mile (6 miles in favored terrain). You learn their types but not location.' },
      { level: 5, name: 'Extra Attack', description: 'Attack twice when taking the Attack action.' },
      { level: 8, name: 'Land\'s Stride', description: 'Moving through nonmagical difficult terrain costs no extra movement. Advantage on saves vs. magically created/manipulated plants (like Entangle).' },
      { level: 10, name: 'Hide in Plain Sight', description: 'Spend 1 minute to camouflage yourself. +10 bonus to Dexterity (Stealth) checks while camouflaged and remaining still.' },
      { level: 14, name: 'Vanish', description: 'You can use Hide as a bonus action. You also can\'t be tracked by nonmagical means unless you choose to leave a trail.' },
      { level: 18, name: 'Feral Senses', description: 'No disadvantage on attacks against creatures you can\'t see. You\'re aware of invisible creatures within 30 ft.' },
      { level: 20, name: 'Foe Slayer', description: 'Add your Wisdom modifier to the attack roll or damage roll of an attack against a favored enemy. Once per turn.' },
    ],
    subclasses: [
      { name: 'Hunter', description: 'Accepting the challenge of predators.', features: [
        { level: 3, name: 'Hunter\'s Prey', description: 'Choose one: Colossus Slayer (1d8 extra damage once per turn if target is below max HP), Giant Killer (reaction attack if Large+ creature attacks you), Horde Breaker (free attack against a different creature within 5 ft. of original target).' },
        { level: 7, name: 'Defensive Tactics', description: 'Choose one: Escape the Horde (opportunity attacks against you have disadvantage), Multiattack Defense (+4 AC after being hit by a creature with multiattack), Steel Will (advantage on saves against being frightened).' },
      ]},
      { name: 'Beast Master', description: 'Bond with a primal companion.', features: [
        { level: 3, name: 'Ranger\'s Companion', description: 'You gain a beast companion of CR 1/4 or lower. It obeys your commands and acts on your initiative.' },
        { level: 7, name: 'Exceptional Training', description: 'On any turn your companion doesn\'t attack, you can command it to Dash, Disengage, Dodge, or Help as a bonus action. Its attacks count as magical.' },
      ]},
    ],
    subclassLevel: 3,
    subclassName: 'Ranger Archetype',
    description: 'A warrior who combats threats on the edges of civilization.',
  },

  {
    name: 'Rogue',
    hitDie: 'd8',
    primaryAbility: 'Dexterity',
    savingThrows: 'Dexterity, Intelligence',
    armorProficiencies: 'Light armor',
    weaponProficiencies: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords',
    toolProficiencies: 'Thieves\' tools',
    skillChoices: 'Choose 4: Acrobatics, Athletics, Deception, Insight, Intimidation, Investigation, Perception, Performance, Persuasion, Sleight of Hand, Stealth',
    startingEquipment: ['Rapier or shortsword', 'Shortbow and 20 arrows or shortsword', 'Burglar\'s pack, dungeoneer\'s pack, or explorer\'s pack', 'Leather armor', 'Two daggers', 'Thieves\' tools'],
    features: [
      { level: 1, name: 'Expertise', description: 'Choose two proficiencies (or one and thieves\' tools). Double your proficiency bonus for those. Two more at 6th level.' },
      { level: 1, name: 'Sneak Attack', description: 'Once per turn, deal extra 1d6 damage (scaling to 10d6 at 19th) to a creature you hit with a finesse or ranged weapon if you have advantage on the attack, or if an ally is within 5 ft. of the target.' },
      { level: 1, name: 'Thieves\' Cant', description: 'Secret language of thieves. Can convey hidden messages in normal conversation.' },
      { level: 2, name: 'Cunning Action', description: 'Bonus action to Dash, Disengage, or Hide.' },
      { level: 5, name: 'Uncanny Dodge', description: 'Reaction: when an attacker you can see hits you with an attack, halve the attack\'s damage.' },
      { level: 7, name: 'Evasion', description: 'When you make a Dex save for half damage: no damage on success, half on failure.' },
      { level: 11, name: 'Reliable Talent', description: 'Any ability check using a proficient skill treats a d20 roll of 9 or lower as a 10.' },
      { level: 14, name: 'Blindsense', description: 'If you can hear, you\'re aware of hidden or invisible creatures within 10 ft.' },
      { level: 15, name: 'Slippery Mind', description: 'You gain proficiency in Wisdom saving throws.' },
      { level: 18, name: 'Elusive', description: 'No attack roll has advantage against you while you aren\'t incapacitated.' },
      { level: 20, name: 'Stroke of Luck', description: 'If your attack misses, treat it as a hit instead. Or turn a failed ability check into a 20. Once per short/long rest.' },
    ],
    subclasses: [
      { name: 'Thief', description: 'Master of stealth and stealing.', features: [
        { level: 3, name: 'Fast Hands', description: 'Cunning Action can also: make a Dex (Sleight of Hand) check, use thieves\' tools to disarm a trap or open a lock, or Use an Object action.' },
        { level: 3, name: 'Second-Story Work', description: 'Climbing costs no extra movement. Running jump distance increases by Dex modifier feet.' },
        { level: 9, name: 'Supreme Sneak', description: 'Advantage on Dexterity (Stealth) checks if you move no more than half your speed in a turn.' },
        { level: 13, name: 'Use Magic Device', description: 'Ignore all class, race, and level requirements on the use of magic items.' },
        { level: 17, name: 'Thief\'s Reflexes', description: 'Take two turns during the first round of combat. Second turn at initiative minus 10.' },
      ]},
      { name: 'Assassin', description: 'Master of poison and death.', features: [
        { level: 3, name: 'Bonus Proficiencies', description: 'Proficiency with disguise kit and poisoner\'s kit.' },
        { level: 3, name: 'Assassinate', description: 'Advantage on attack rolls against creatures that haven\'t taken a turn yet. Any hit against a surprised creature is a critical hit.' },
        { level: 9, name: 'Infiltration Expertise', description: 'Spend 7 days and 25 gp to create a false identity.' },
        { level: 13, name: 'Impostor', description: 'Unerringly mimic another person\'s speech, writing, and behavior after observing them for 3 hours.' },
        { level: 17, name: 'Death Strike', description: 'If you hit a surprised creature, it must make a Con save (DC 8 + Dex modifier + proficiency). On failure, double the damage.' },
      ]},
    ],
    subclassLevel: 3,
    subclassName: 'Roguish Archetype',
    description: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies.',
  },

  {
    name: 'Sorcerer',
    hitDie: 'd6',
    primaryAbility: 'Charisma',
    savingThrows: 'Constitution, Charisma',
    armorProficiencies: 'None',
    weaponProficiencies: 'Daggers, darts, slings, quarterstaffs, light crossbows',
    toolProficiencies: 'None',
    skillChoices: 'Choose 2: Arcana, Deception, Insight, Intimidation, Persuasion, Religion',
    startingEquipment: ['Light crossbow and 20 bolts or any simple weapon', 'Component pouch or arcane focus', 'Dungeoneer\'s pack or explorer\'s pack', 'Two daggers'],
    spellcasting: { ability: 'Charisma', type: 'Full', description: 'Full caster. Learns spells from the sorcerer spell list. Uses Charisma for spellcasting. Known spells, not prepared.' },
    features: [
      { level: 1, name: 'Sorcerous Origin', description: 'Choose a sorcerous origin, which grants features at 1st, 6th, 14th, and 18th levels.' },
      { level: 2, name: 'Font of Magic', description: 'Sorcery points = sorcerer level. Can convert spell slots to sorcery points or vice versa. Also used for Metamagic options.' },
      { level: 3, name: 'Metamagic', description: 'Choose 2 Metamagic options (3rd at 10th, 4th at 17th): Careful Spell, Distant Spell, Empowered Spell, Extended Spell, Heightened Spell, Quickened Spell, Subtle Spell, Twinned Spell.' },
      { level: 20, name: 'Sorcerous Restoration', description: 'On a short rest, you regain 4 sorcery points.' },
    ],
    subclasses: [
      { name: 'Draconic Bloodline', description: 'Magic from draconic ancestry.', features: [
        { level: 1, name: 'Dragon Ancestor', description: 'Choose one type of dragon. You can speak, read, and write Draconic. Double proficiency bonus on Charisma checks when interacting with dragons.' },
        { level: 1, name: 'Draconic Resilience', description: 'HP maximum increases by 1 per sorcerer level. When not wearing armor, AC = 13 + Dex modifier.' },
        { level: 6, name: 'Elemental Affinity', description: 'Add Cha modifier to damage of spells matching your dragon ancestry\'s damage type. Spend 1 sorcery point for resistance to that type for 1 hour.' },
        { level: 14, name: 'Dragon Wings', description: 'As a bonus action, sprout dragon wings. Flying speed equal to your current speed. Can\'t be wearing armor.' },
        { level: 18, name: 'Draconic Presence', description: 'Spend 5 sorcery points to create an aura of awe or fear (30 ft.). Each hostile creature makes Wis save or is charmed/frightened for 1 minute.' },
      ]},
      { name: 'Wild Magic', description: 'Innate magic influenced by forces of chaos.', features: [
        { level: 1, name: 'Wild Magic Surge', description: 'After casting a 1st level or higher sorcerer spell, DM can have you roll a d20. On a 1, roll on the Wild Magic Surge table.' },
        { level: 1, name: 'Tides of Chaos', description: 'Gain advantage on one attack roll, ability check, or saving throw. Once per long rest (or recharged by a Wild Magic Surge).' },
        { level: 6, name: 'Bend Luck', description: 'When another creature makes an attack roll, ability check, or saving throw, spend 2 sorcery points to roll 1d4 and add or subtract it from the roll.' },
        { level: 14, name: 'Controlled Chaos', description: 'When you roll on the Wild Magic Surge table, roll twice and choose which result to use.' },
        { level: 18, name: 'Spell Bombardment', description: 'When you roll damage for a spell with maximum on any die, reroll that die and add it to the damage.' },
      ]},
    ],
    subclassLevel: 1,
    subclassName: 'Sorcerous Origin',
    description: 'A spellcaster who draws on inherent magic from a gift or bloodline.',
  },

  {
    name: 'Warlock',
    hitDie: 'd8',
    primaryAbility: 'Charisma',
    savingThrows: 'Wisdom, Charisma',
    armorProficiencies: 'Light armor',
    weaponProficiencies: 'Simple weapons',
    toolProficiencies: 'None',
    skillChoices: 'Choose 2: Arcana, Deception, History, Intimidation, Investigation, Nature, Religion',
    startingEquipment: ['Light crossbow and 20 bolts or any simple weapon', 'Component pouch or arcane focus', 'Scholar\'s pack or dungeoneer\'s pack', 'Leather armor', 'Any simple weapon', 'Two daggers'],
    spellcasting: { ability: 'Charisma', type: 'Pact', description: 'Pact Magic: limited spell slots (1-4) that are all the same level (up to 5th). All slots recharge on a short rest. Learns spells from the warlock spell list.' },
    features: [
      { level: 1, name: 'Otherworldly Patron', description: 'Choose a patron who grants you powers. Your patron gives you features at 1st, 6th, 10th, and 14th levels, and an expanded spell list.' },
      { level: 2, name: 'Eldritch Invocations', description: 'Learn 2 invocations (see warlock invocation list). These grant special abilities, spells at will, or enhanced Eldritch Blast. You learn more at higher levels. Can swap one on level up.' },
      { level: 3, name: 'Pact Boon', description: 'Choose one: Pact of the Chain (improved familiar), Pact of the Blade (create magic weapon), or Pact of the Tome (Book of Shadows with 3 cantrips from any class).' },
      { level: 11, name: 'Mystic Arcanum (6th)', description: 'Choose one 6th-level spell from the warlock spell list. You can cast it once per long rest without using a spell slot. Gain 7th at 13th, 8th at 15th, 9th at 17th.' },
      { level: 20, name: 'Eldritch Master', description: 'Spend 1 minute entreating your patron to regain all Pact Magic spell slots. Once per long rest.' },
    ],
    subclasses: [
      { name: 'The Fiend', description: 'A pact with a being from the lower planes of existence.', features: [
        { level: 1, name: 'Dark One\'s Blessing', description: 'When you reduce a hostile creature to 0 HP, gain temporary HP equal to your Cha modifier + warlock level.' },
        { level: 6, name: 'Dark One\'s Own Luck', description: 'When you make an ability check or saving throw, add a d10 to the roll. Once per short/long rest.' },
        { level: 10, name: 'Fiendish Resilience', description: 'At the end of a short/long rest, choose one damage type (except force). You have resistance to that type until you choose a different one.' },
        { level: 14, name: 'Hurl Through Hell', description: 'When you hit a creature with an attack, it travels through the lower planes. It takes 10d10 psychic damage and is frightened of you. Once per long rest.' },
      ]},
      { name: 'The Archfey', description: 'A pact with a lord or lady of the fey.', features: [
        { level: 1, name: 'Fey Presence', description: 'As an action, each creature within 10 ft. makes Wis save or is charmed or frightened by you until the end of your next turn. Once per short/long rest.' },
        { level: 6, name: 'Misty Escape', description: 'When you take damage, you can use your reaction to turn invisible and teleport up to 60 ft. Invisible until start of your next turn. Once per short/long rest.' },
        { level: 10, name: 'Beguiling Defenses', description: 'Immune to being charmed. When a creature tries to charm you, you can use your reaction to turn the charm back on it.' },
        { level: 14, name: 'Dark Delirium', description: 'As an action, charm or frighten a creature for 1 minute. It thinks it\'s lost in a misty realm. Concentration. Once per short/long rest.' },
      ]},
      { name: 'The Great Old One', description: 'A pact with a mysterious entity from the Far Realm.', features: [
        { level: 1, name: 'Awakened Mind', description: 'Telepathic communication with any creature within 30 ft. You don\'t need to share a language, but the creature must understand at least one language.' },
        { level: 6, name: 'Entropic Ward', description: 'When a creature makes an attack roll against you, impose disadvantage. If the attack misses, your next attack against it has advantage. Once per short/long rest.' },
        { level: 10, name: 'Thought Shield', description: 'Your thoughts can\'t be read telepathically unless you allow it. Resistance to psychic damage. When you take psychic damage, the attacker takes the same amount.' },
        { level: 14, name: 'Create Thrall', description: 'Touch an incapacitated humanoid. It is charmed by you until Remove Curse is cast. You can communicate telepathically with it.' },
      ]},
    ],
    subclassLevel: 1,
    subclassName: 'Otherworldly Patron',
    description: 'A wielder of magic derived from a bargain with an extraplanar entity.',
  },

  {
    name: 'Wizard',
    hitDie: 'd6',
    primaryAbility: 'Intelligence',
    savingThrows: 'Intelligence, Wisdom',
    armorProficiencies: 'None',
    weaponProficiencies: 'Daggers, darts, slings, quarterstaffs, light crossbows',
    toolProficiencies: 'None',
    skillChoices: 'Choose 2: Arcana, History, Insight, Investigation, Medicine, Religion',
    startingEquipment: ['Quarterstaff or dagger', 'Component pouch or arcane focus', 'Scholar\'s pack or explorer\'s pack', 'Spellbook'],
    spellcasting: { ability: 'Intelligence', type: 'Full', description: 'Full caster. Prepares spells from spellbook. You start with 6 1st-level wizard spells in your spellbook and add 2 wizard spells per level. Can also copy spells you find. Uses Intelligence for spellcasting.' },
    features: [
      { level: 1, name: 'Arcane Recovery', description: 'Once per day during a short rest, recover spell slots with a combined level equal to half your wizard level (rounded up). No 6th-level or higher slots.' },
      { level: 18, name: 'Spell Mastery', description: 'Choose a 1st-level and a 2nd-level wizard spell in your spellbook. You can cast them at their lowest level without expending a spell slot.' },
      { level: 20, name: 'Signature Spells', description: 'Choose two 3rd-level wizard spells in your spellbook. You always have them prepared, and you can cast each once at 3rd level without expending a spell slot. Regain this ability on a short/long rest.' },
    ],
    subclasses: [
      { name: 'School of Evocation', description: 'Focus on powerful offensive spells.', features: [
        { level: 2, name: 'Evocation Savant', description: 'Halved gold and time to copy evocation spells into your spellbook.' },
        { level: 2, name: 'Sculpt Spells', description: 'When you cast an evocation spell that affects other creatures you can see, choose a number of them equal to 1 + spell level. They automatically succeed on their saves and take no damage.' },
        { level: 6, name: 'Potent Cantrip', description: 'When a creature succeeds on a save against your cantrip, it still takes half the cantrip\'s damage but suffers no additional effect.' },
        { level: 10, name: 'Empowered Evocation', description: 'Add your Intelligence modifier to one damage roll of any wizard evocation spell.' },
        { level: 14, name: 'Overchannel', description: 'When you cast a wizard spell of 5th level or lower that deals damage, you can deal maximum damage with that spell. First use is free; subsequent uses before long rest deal 2d12 necrotic damage per spell level to you (ignores resistance/immunity).' },
      ]},
      { name: 'School of Abjuration', description: 'Master of protective magic.', features: [
        { level: 2, name: 'Abjuration Savant', description: 'Halved gold and time to copy abjuration spells.' },
        { level: 2, name: 'Arcane Ward', description: 'When you cast an abjuration spell of 1st level or higher, you create a magical ward with HP = 2× wizard level + Int modifier. The ward absorbs damage dealt to you.' },
        { level: 6, name: 'Projected Ward', description: 'When a creature within 30 ft. takes damage, you can use your reaction to have your Arcane Ward absorb the damage instead.' },
        { level: 10, name: 'Improved Abjuration', description: 'Add your proficiency bonus to ability checks you make as part of an abjuration spell (like Counterspell or Dispel Magic).' },
        { level: 14, name: 'Spell Resistance', description: 'Advantage on saving throws against spells. Resistance against the damage of spells.' },
      ]},
    ],
    subclassLevel: 2,
    subclassName: 'Arcane Tradition',
    description: 'A scholarly magic-user capable of manipulating the structures of reality.',
  },
];
