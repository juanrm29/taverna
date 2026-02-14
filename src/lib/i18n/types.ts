// ============================================================
// i18n Type Definitions — Strict typed translation keys
// ============================================================

export type Locale = 'id' | 'en';

export interface Translations {
  // ---- Common / Shared ----
  common: {
    loading: string;
    cancel: string;
    create: string;
    delete: string;
    edit: string;
    save: string;
    close: string;
    back: string;
    next: string;
    confirm: string;
    search: string;
    copied: string;
    export: string;
    import: string;
    roll: string;
    apply: string;
    add: string;
    remove: string;
    reset: string;
    name: string;
    description: string;
    title: string;
    yes: string;
    no: string;
    ok: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    optional: string;
    required: string;
    noResults: string;
    taverna: string;
    freeForever: string;
  };

  // ---- Auth / Landing ----
  auth: {
    signIn: string;
    createAccount: string;
    logout: string;
    email: string;
    password: string;
    displayName: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    namePlaceholder: string;
    passwordHint: string;
    backToLogin: string;
    fillAllFields: string;
    invalidCredentials: string;
    registrationFailed: string;
    invalidEmail: string;
    passwordTooShort: string;
    autoLoginFailed: string;
  };

  // ---- Landing Page ----
  landing: {
    heroTitle: string;
    heroTitleHighlight: string;
    heroDescription: string;
    signInSubtitle: string;
    beginStory: string;
    whyTaverna: string;
    builtForDnd: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    feature4Title: string;
    feature4Desc: string;
  };

  // ---- Navigation / Sidebar ----
  nav: {
    liveSession: string;
    campaigns: string;
    characters: string;
    compendium: string;
    dice: string;
    tutorial: string;
    battleMap: string;
    encounters: string;
    journal: string;
    generators: string;
    schedule: string;
    audioSfx: string;
    timeline: string;
    recap: string;
    playerView: string;
    tools: string;
    quick: string;
    newCampaign: string;
    joinCampaign: string;
    collapse: string;
    collapseSidebar: string;
    expandSidebar: string;
    toggleMenu: string;
    dmScreen: string;
    aiDm: string;
    loreWiki: string;
    questBoard: string;
    combatAutopilot: string;
    settings: string;
  };

  // ---- Dashboard ----
  dashboard: {
    goodMorning: string;
    goodAfternoon: string;
    goodEvening: string;
    noCampaigns: string;
    noCampaignsDesc: string;
    asDungeonMaster: string;
    asPlayer: string;
    createCampaign: string;
    joinCampaign: string;
    createNewCampaign: string;
    joinExisting: string;
    campaignName: string;
    campaignNamePlaceholder: string;
    descriptionOptional: string;
    descriptionPlaceholder: string;
    creating: string;
    inviteCode: string;
    inviteCodePlaceholder: string;
    enterInviteCode: string;
    joining: string;
    editCampaign: string;
    editCampaignSubtitle: string;
    saving: string;
    deleteCampaign: string;
    deleteConfirm: string;
    dm: string;
    player: string;
    code: string;
    copyInviteCode: string;
    campaignCreated: string;
    campaignJoined: string;
    campaignUpdated: string;
    campaignDeleted: string;
    inviteCodeCopied: string;
    failedCreate: string;
    failedJoin: string;
  };

  // ---- Characters ----
  characters: {
    yourCharacters: string;
    subtitle: string;
    noCharacters: string;
    noCharactersDesc: string;
    goToDashboard: string;
    level: string;
    ac: string;
    hp: string;
    speed: string;
    init: string;
    prof: string;
  };

  // ---- Session Live / VTT ----
  session: {
    liveSession: string;
    live: string;
    dmMode: string;
    playerMode: string;
    tools: string;
    draw: string;
    view: string;
    grid: string;
    fog: string;
    reveal: string;
    hide: string;
    color: string;
    token: string;
    scenes: string;
    toggleGrid: string;
    toggleFog: string;
    fogModeReveal: string;
    fogModeHide: string;
    zoomIn: string;
    zoomOut: string;
    resetView: string;
    addToken: string;
    noSceneLoaded: string;
    noSceneDesc: string;
    pc: string;
    npc: string;
    hidden: string;
    cmd: string;
    d20: string;
  };

  // ---- Chat ----
  chat: {
    today: string;
    yesterday: string;
    reply: string;
    pin: string;
    unpin: string;
    dmNarration: string;
    combat: string;
    ooc: string;
    edited: string;
    hit: string;
    miss: string;
    critical: string;
    fumble: string;
    whisperTo: string;
    whisperFrom: string;
    whisperMode: string;
    whisperPlayers: string;
    cancelWhisper: string;
    channels: string;
    ic: string;
    narrationMode: string;
    narrationModeDesc: string;
    emptyChannel: string;
    formattingHelp: string;
    replyingTo: string;
    editingMessage: string;
    escToCancel: string;
    writeNarration: string;
    whisperPlaceholder: string;
    icPlaceholder: string;
    defaultPlaceholder: string;
    mention: string;
    chatCleared: string;
    pinnedMessages: string;
    noPinnedMessages: string;
    searchMessages: string;
    resultsFound: string;
    diceFormula: string;
    label: string;
  };

  // ---- Initiative / Combat ----
  initiative: {
    combat: string;
    round: string;
    combatants: string;
    nextTurn: string;
    activeTurn: string;
    turn: string;
    conditions: string;
    partyMembers: string;
    addAllParty: string;
    alreadyInCombat: string;
    manualAdd: string;
    addCombatant: string;
    noCombat: string;
    noCombatDesc: string;
    noCampaign: string;
    party: string;
    manual: string;
    turnTimer: string;
    resume: string;
    pause: string;
    dmg: string;
    heal: string;
    noPartyMembers: string;
  };

  // ---- Dice ----
  dice: {
    advancedDice: string;
    subtitle: string;
    roller: string;
    macros: string;
    tables: string;
    rollSomeDice: string;
    normal: string;
    advantage: string;
    disadvantage: string;
    quickRoll: string;
    commonRolls: string;
    yourMacros: string;
    nat20: string;
    nat1: string;
    history: string;
    clear: string;
    noRolls: string;
    newMacro: string;
    noMacros: string;
    noMacrosDesc: string;
    formula: string;
    labelOptional: string;
    macroCreated: string;
    newTable: string;
    noTables: string;
    noTablesDesc: string;
    tableCreated: string;
    tableName: string;
    entries: string;
    entriesHelp: string;
  };

  // ---- Spell Slots ----
  spells: {
    spellSlotsTitle: string;
    shortRest: string;
    longRest: string;
    cantrips: string;
    spellLevel: string;
    drop: string;
    clickToRestore: string;
    clickToUse: string;
    concentratingOn: string;
    usedSlot: string;
    noSlotsAvailable: string;
    longRestSuccess: string;
    shortRestPact: string;
    shortRestHeal: string;
    noHitDice: string;
    castCantrip: string;
    castSpell: string;
    concentrationDropped: string;
    droppedConcentration: string;
    failedUpdate: string;
  };

  // ---- Dice Overlay ----
  diceOverlay: {
    nat20: string;
    nat1: string;
    applyDamage: string;
    applyHealing: string;
    damageApplied: string;
    healingApplied: string;
    kept: string;
  };

  // ---- Combat Roller ----
  combatRoller: {
    title: string;
    attack: string;
    savingThrow: string;
    healMode: string;
    quickPresets: string;
    spellPresets: string;
    attackBonus: string;
    targetAC: string;
    damageDice: string;
    critDice: string;
    damageType: string;
    saveAbility: string;
    dc: string;
    healingFormula: string;
    halfOnSave: string;
    rollAttack: string;
    rollSave: string;
    rollHealing: string;
    criticalHit: string;
    fumbleResult: string;
    vs: string;
    hitResult: string;
    missResult: string;
    damage: string;
    applyDamage: string;
    saved: string;
    failed: string;
    halved: string;
    healing: string;
    hpRestored: string;
  };

  // ---- Compendium ----
  compendium: {
    title: string;
    subtitle: string;
    quickRef: string;
    forDMs: string;
    forPlayers: string;
    searchPlaceholder: string;
    spells: string;
    spellsDesc: string;
    monsters: string;
    monstersDesc: string;
    equipment: string;
    equipmentDesc: string;
    classes: string;
    classesDesc: string;
    races: string;
    racesDesc: string;
    rules: string;
    rulesDesc: string;
  };

  // ---- Settings ----
  settings: {
    title: string;
    subtitle: string;
    profile: string;
    displayName: string;
    displayNamePlaceholder: string;
    emailLabel: string;
    emailCantChange: string;
    saveProfile: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    data: string;
    exportData: string;
    exportDataDesc: string;
    importData: string;
    importDataDesc: string;
    account: string;
    accountCreated: string;
    language: string;
    languageDesc: string;
    indonesian: string;
    english: string;
    profileSaved: string;
    passwordChanged: string;
    dataExported: string;
    dataImported: string;
    emptyName: string;
    passwordMismatch: string;
    passwordIncorrect: string;
    failedSave: string;
    failedImport: string;
  };

  // ---- Onboarding Tour ----
  tour: {
    welcome: string;
    welcomeDesc: string;
    campaignsTitle: string;
    campaignsDesc: string;
    charactersTitle: string;
    charactersDesc: string;
    battleMapTitle: string;
    battleMapDesc: string;
    diceTitle: string;
    diceDesc: string;
    chatTitle: string;
    chatDesc: string;
    readyTitle: string;
    readyDesc: string;
    startPlaying: string;
    skipTour: string;
  };

  // ---- Command Palette ----
  commandPalette: {
    searchPlaceholder: string;
    navigate: string;
    actions: string;
    quickRoll: string;
    searchCat: string;
    noResults: string;
    tryDiceFormula: string;
    navSelect: string;
    selectAction: string;
    closeAction: string;
    brandName: string;
  };

  // ---- Generators ----
  generators: {
    title: string;
    subtitle: string;
    npc: string;
    tavern: string;
    encounter: string;
    loot: string;
    wildMagic: string;
    plotHooks: string;
    generateNPC: string;
    generateTavern: string;
    generateEncounter: string;
    generateLoot: string;
    wildMagicSurge: string;
    generatePlotHooks: string;
    personality: string;
    motivation: string;
    quirk: string;
    barkeep: string;
    houseSpecialty: string;
    atmosphere: string;
    overheardRumor: string;
    enemies: string;
    terrain: string;
    twist: string;
    lootFound: string;
    copiedToClipboard: string;
  };

  // ---- Audio ----
  audio: {
    title: string;
    subtitle: string;
    addTrack: string;
    masterVolume: string;
    moodPresets: string;
    noTracks: string;
    noTracksDesc: string;
    trackAdded: string;
    trackDeleted: string;
    audioError: string;
    loop: string;
    trackName: string;
    trackUrl: string;
    visualOnly: string;
  };

  // ---- Schedule ----
  schedule: {
    title: string;
    subtitle: string;
    scheduleSession: string;
    upcoming: string;
    sessionHistory: string;
    nextSession: string;
    sessionSaved: string;
    sessionDeleted: string;
    sessionComplete: string;
    noUpcoming: string;
    date: string;
    time: string;
    duration: string;
    location: string;
    notes: string;
  };

  // ---- Recap ----
  recap: {
    title: string;
    subtitle: string;
    addRecap: string;
    sessions: string;
    battles: string;
    discoveries: string;
    deaths: string;
    noRecaps: string;
    recapAdded: string;
  };

  // ---- Timeline ----
  timeline: {
    title: string;
    subtitle: string;
    addEvent: string;
    achievements: string;
    noEvents: string;
    noAchievements: string;
    eventAdded: string;
    eventRemoved: string;
    grantAchievement: string;
    alreadyUnlocked: string;
    story: string;
    combatEvent: string;
    discovery: string;
    milestone: string;
    death: string;
  };

  // ---- Player View ----
  playerView: {
    title: string;
    combatTab: string;
    characterTab: string;
    notesTab: string;
    quickDice: string;
    initiativeOrder: string;
    sessionNotes: string;
    liveRound: string;
    yourTurn: string;
    noCombat: string;
    noCharacters: string;
    hitPoints: string;
    down: string;
    bloodied: string;
    healthy: string;
    notesPlaceholder: string;
  };

  // ---- DM Screen ----
  dmScreen: {
    title: string;
    subtitle: string;
    combatRoller: string;
    conditions: string;
    actionsInCombat: string;
    difficultyCls: string;
    coverRules: string;
    exhaustion: string;
    travelPace: string;
    lightVision: string;
    skillsRef: string;
  };

  // ---- Voice Panel ----
  voice: {
    title: string;
    connected: string;
    excellent: string;
    good: string;
    poor: string;
    disconnected: string;
    mute: string;
    unmute: string;
    deafen: string;
    undeafen: string;
    joinChannel: string;
    you: string;
    noOneConnected: string;
    inputVolume: string;
    outputVolume: string;
    noiseSuppression: string;
    echoCancellation: string;
    autoGain: string;
    pushToTalk: string;
    resetDefaults: string;
  };

  // ---- Journal ----
  journal: {
    title: string;
    subtitle: string;
    newEntry: string;
    searchPlaceholder: string;
    entryCreated: string;
    entrySaved: string;
    entryDeleted: string;
  };

  // ---- Encounters ----
  encounters: {
    title: string;
    subtitle: string;
    newEncounter: string;
    addMonster: string;
    quickBuilder: string;
    partySize: string;
    partyLevel: string;
    difficulty: string;
    saved: string;
    deleted: string;
    loadedToInit: string;
  };

  // ---- AI DM Assistant ----
  ai: {
    title: string;
    subtitle: string;
    placeholder: string;
    send: string;
    thinking: string;
    generateNPC: string;
    describeRoom: string;
    narrateCombat: string;
    suggestEncounter: string;
    plotIdea: string;
    rulesHelp: string;
    noApiKey: string;
    noApiKeyDesc: string;
    clearChat: string;
    context: string;
    welcomeMessage: string;
  };

  // ---- Cinematic Combat ----
  cinematic: {
    attackNarration: string;
    critNarration: string;
    missNarration: string;
    killNarration: string;
    healNarration: string;
    spellNarration: string;
    deathSave: string;
    initiativeStart: string;
  };
}
