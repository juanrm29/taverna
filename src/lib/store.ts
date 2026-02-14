import { Campaign, Character, User, NPC, SessionNote, ChatMessage, GameSession, InitiativeEntry, MapScene, MapToken, Wall, LightSource, MapDrawing, JournalEntry, DiceMacro, RollableTable, AudioTrack, TimelineEvent, Achievement, CharacterRelationship, EncounterTemplate, CombatLogEntry, Item, KnownSpell, Currency } from './types';
import { v4 as uuid } from 'uuid';

// ============================================================
// Local Storage Mock Store  (v2 — Expanded)
// ============================================================

const STORAGE_KEYS = {
  user: 'taverna_user',
  users: 'taverna_users',
  campaigns: 'taverna_campaigns',
  characters: 'taverna_characters',
  npcs: 'taverna_npcs',
  notes: 'taverna_notes',
  messages: 'taverna_messages',
  sessions: 'taverna_sessions',
  scenes: 'taverna_scenes',
  journals: 'taverna_journals',
  macros: 'taverna_macros',
  rollableTables: 'taverna_rollable_tables',
  audioTracks: 'taverna_audio_tracks',
  timeline: 'taverna_timeline',
  achievements: 'taverna_achievements',
  relationships: 'taverna_relationships',
  encounters: 'taverna_encounters',
} as const;

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Internal user store (email/password mock) ----
interface StoredUser extends User {
  email: string;
  password: string;
}

function getAllUsers(): StoredUser[] {
  return getItem<StoredUser[]>(STORAGE_KEYS.users, []);
}

// ---- User ----
export function getUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.user, null);
}

export function setUser(data: { displayName: string; email: string; password: string }): User {
  const user: StoredUser = {
    id: uuid(),
    username: data.email.split('@')[0],
    displayName: data.displayName,
    email: data.email,
    password: data.password,
    createdAt: new Date().toISOString(),
  };
  // Store in users list
  const users = getAllUsers();
  users.push(user);
  setItem(STORAGE_KEYS.users, users);
  // Set as current
  const publicUser: User = { id: user.id, username: user.username, displayName: user.displayName, createdAt: user.createdAt };
  setItem(STORAGE_KEYS.user, publicUser);
  return publicUser;
}

export function login(email: string, password: string): User | null {
  const users = getAllUsers();
  const found = users.find(u => u.email === email && u.password === password);
  if (!found) return null;
  const publicUser: User = { id: found.id, username: found.username, displayName: found.displayName, createdAt: found.createdAt };
  setItem(STORAGE_KEYS.user, publicUser);
  return publicUser;
}

export function emailExists(email: string): boolean {
  return getAllUsers().some(u => u.email === email);
}

export function updateUser(updates: { displayName?: string; password?: string; email?: string }): User | null {
  const current = getUser();
  if (!current) return null;
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === current.id);
  if (idx === -1) return null;
  if (updates.displayName) { users[idx].displayName = updates.displayName; current.displayName = updates.displayName; }
  if (updates.password) { users[idx].password = updates.password; }
  if (updates.email) { users[idx].email = updates.email; }
  setItem(STORAGE_KEYS.users, users);
  setItem(STORAGE_KEYS.user, current);
  return current;
}

export function getUserEmail(): string | null {
  const current = getUser();
  if (!current) return null;
  const users = getAllUsers();
  const found = users.find(u => u.id === current.id);
  return found?.email || null;
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.user);
}

// ---- Campaigns ----
export function getCampaigns(): Campaign[] {
  return getItem<Campaign[]>(STORAGE_KEYS.campaigns, []);
}

export function getCampaign(id: string): Campaign | undefined {
  return getCampaigns().find(c => c.id === id);
}

export function createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'inviteCode' | 'sessionCount' | 'players'>): Campaign {
  const campaign: Campaign = {
    ...data,
    id: uuid(),
    players: [],
    sessionCount: 0,
    inviteCode: uuid().slice(0, 8).toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  const campaigns = getCampaigns();
  campaigns.push(campaign);
  setItem(STORAGE_KEYS.campaigns, campaigns);
  return campaign;
}

export function updateCampaign(id: string, updates: Partial<Campaign>): Campaign | null {
  const campaigns = getCampaigns();
  const idx = campaigns.findIndex(c => c.id === id);
  if (idx === -1) return null;
  campaigns[idx] = { ...campaigns[idx], ...updates };
  setItem(STORAGE_KEYS.campaigns, campaigns);
  return campaigns[idx];
}

export function deleteCampaign(id: string): void {
  setItem(STORAGE_KEYS.campaigns, getCampaigns().filter(c => c.id !== id));
  // Clean up ALL related data
  setItem(STORAGE_KEYS.characters, getCharacters().filter(ch => ch.campaignId !== id));
  setItem(STORAGE_KEYS.npcs, getItem<NPC[]>(STORAGE_KEYS.npcs, []).filter(n => n.campaignId !== id));
  setItem(STORAGE_KEYS.notes, getItem<SessionNote[]>(STORAGE_KEYS.notes, []).filter(n => n.campaignId !== id));
  setItem(STORAGE_KEYS.messages, getItem<ChatMessage[]>(STORAGE_KEYS.messages, []).filter(m => m.campaignId !== id));
  setItem(STORAGE_KEYS.sessions, getItem<GameSession[]>(STORAGE_KEYS.sessions, []).filter(s => s.campaignId !== id));
}

export function joinCampaign(inviteCode: string, userId: string): Campaign | 'already_member' | null {
  const campaigns = getCampaigns();
  const campaign = campaigns.find(c => c.inviteCode === inviteCode);
  if (!campaign) return null;
  if (campaign.dmId === userId || campaign.players.includes(userId)) return 'already_member';
  campaign.players.push(userId);
  setItem(STORAGE_KEYS.campaigns, campaigns);
  return campaign;
}

export function leaveCampaign(campaignId: string, userId: string): boolean {
  const campaigns = getCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return false;
  if (campaign.dmId === userId) return false; // DM cannot leave
  campaign.players = campaign.players.filter(p => p !== userId);
  setItem(STORAGE_KEYS.campaigns, campaigns);
  // Remove user's characters from campaign
  setItem(STORAGE_KEYS.characters, getCharacters().filter(c => !(c.campaignId === campaignId && c.playerId === userId)));
  return true;
}

// ---- Characters ----
export function getCharacters(): Character[] {
  return getItem<Character[]>(STORAGE_KEYS.characters, []);
}

export function getCharactersByCampaign(campaignId: string): Character[] {
  return getCharacters().filter(c => c.campaignId === campaignId);
}

export function getCharacter(id: string): Character | undefined {
  return getCharacters().find(c => c.id === id);
}

export function createCharacter(data: Omit<Character, 'id' | 'createdAt'>): Character {
  const character: Character = {
    ...data,
    id: uuid(),
    createdAt: new Date().toISOString(),
  };
  const characters = getCharacters();
  characters.push(character);
  setItem(STORAGE_KEYS.characters, characters);
  return character;
}

export function updateCharacter(id: string, updates: Partial<Character>): Character | null {
  const characters = getCharacters();
  const idx = characters.findIndex(c => c.id === id);
  if (idx === -1) return null;
  characters[idx] = { ...characters[idx], ...updates };
  setItem(STORAGE_KEYS.characters, characters);
  return characters[idx];
}

export function deleteCharacter(id: string): void {
  setItem(STORAGE_KEYS.characters, getCharacters().filter(c => c.id !== id));
}

// ---- NPCs ----
export function getNPCs(campaignId: string): NPC[] {
  return getItem<NPC[]>(STORAGE_KEYS.npcs, []).filter(n => n.campaignId === campaignId);
}

export function createNPC(data: Omit<NPC, 'id'>): NPC {
  const npc: NPC = { ...data, id: uuid() };
  const npcs = getItem<NPC[]>(STORAGE_KEYS.npcs, []);
  npcs.push(npc);
  setItem(STORAGE_KEYS.npcs, npcs);
  return npc;
}

export function updateNPC(id: string, updates: Partial<NPC>): void {
  const npcs = getItem<NPC[]>(STORAGE_KEYS.npcs, []);
  const idx = npcs.findIndex(n => n.id === id);
  if (idx !== -1) {
    npcs[idx] = { ...npcs[idx], ...updates };
    setItem(STORAGE_KEYS.npcs, npcs);
  }
}

export function deleteNPC(id: string): void {
  setItem(STORAGE_KEYS.npcs, getItem<NPC[]>(STORAGE_KEYS.npcs, []).filter(n => n.id !== id));
}

// ---- Session Notes ----
export function getSessionNotes(campaignId: string): SessionNote[] {
  return getItem<SessionNote[]>(STORAGE_KEYS.notes, []).filter(n => n.campaignId === campaignId);
}

export function createSessionNote(data: Omit<SessionNote, 'id' | 'createdAt'>): SessionNote {
  const note: SessionNote = { ...data, id: uuid(), createdAt: new Date().toISOString() };
  const notes = getItem<SessionNote[]>(STORAGE_KEYS.notes, []);
  notes.push(note);
  setItem(STORAGE_KEYS.notes, notes);
  return note;
}

export function updateSessionNote(id: string, updates: Partial<SessionNote>): SessionNote | null {
  const notes = getItem<SessionNote[]>(STORAGE_KEYS.notes, []);
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return null;
  notes[idx] = { ...notes[idx], ...updates };
  setItem(STORAGE_KEYS.notes, notes);
  return notes[idx];
}

export function deleteSessionNote(id: string): void {
  setItem(STORAGE_KEYS.notes, getItem<SessionNote[]>(STORAGE_KEYS.notes, []).filter(n => n.id !== id));
}

// ---- Messages ----
export function getMessages(campaignId: string): ChatMessage[] {
  return getItem<ChatMessage[]>(STORAGE_KEYS.messages, []).filter(m => m.campaignId === campaignId);
}

export function sendMessage(data: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
  const msg: ChatMessage = { ...data, id: uuid(), timestamp: new Date().toISOString() };
  const messages = getItem<ChatMessage[]>(STORAGE_KEYS.messages, []);
  messages.push(msg);
  setItem(STORAGE_KEYS.messages, messages);
  return msg;
}

// ---- Dice ----
export function rollDice(formula: string): { rolls: number[]; modifier: number; total: number; kept?: number[]; dropped?: number[] } {
  // Parse formulas like "2d6+3", "1d20", "4d6kh3", "2d20kl1", "4d6-1", "2d20kh1+5"
  const match = formula.match(/^(\d+)d(\d+)(?:k([hl])(\d+))?([+-]\d+)?$/i);
  if (!match) return { rolls: [0], modifier: 0, total: 0 };

  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const keepDir = match[3] ? match[3].toLowerCase() : null; // 'h' or 'l'
  const keepCount = match[4] ? parseInt(match[4]) : null;
  const modifier = match[5] ? parseInt(match[5]) : 0;

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  let kept: number[] = rolls;
  let dropped: number[] = [];

  if (keepDir && keepCount !== null && keepCount < count) {
    const sorted = [...rolls].sort((a, b) => b - a);
    if (keepDir === 'h') {
      kept = sorted.slice(0, keepCount);
      dropped = sorted.slice(keepCount);
    } else {
      kept = sorted.slice(count - keepCount);
      dropped = sorted.slice(0, count - keepCount);
    }
  }

  const sum = kept.reduce((a, b) => a + b, 0);
  return { rolls, modifier, total: sum + modifier, kept, dropped };
}

// Roll 4d6 drop lowest (for ability scores)
export function roll4d6DropLowest(): { rolls: number[]; kept: number[]; total: number } {
  const rolls: number[] = [];
  for (let i = 0; i < 4; i++) {
    rolls.push(Math.floor(Math.random() * 6) + 1);
  }
  const sorted = [...rolls].sort((a, b) => b - a);
  const kept = sorted.slice(0, 3);
  return { rolls, kept, total: kept.reduce((a, b) => a + b, 0) };
}

// ---- Sessions (Live Play) ----
export function getSessions(campaignId: string): GameSession[] {
  return getItem<GameSession[]>(STORAGE_KEYS.sessions, []).filter(s => s.campaignId === campaignId);
}

export function getSession(id: string): GameSession | undefined {
  return getItem<GameSession[]>(STORAGE_KEYS.sessions, []).find(s => s.id === id);
}

export function getActiveSession(campaignId: string): GameSession | undefined {
  return getSessions(campaignId).find(s => s.status === 'live' || s.status === 'lobby' || s.status === 'paused');
}

export function createSession(data: { campaignId: string; dmId: string; sessionNumber: number }): GameSession {
  const session: GameSession = {
    id: uuid(),
    campaignId: data.campaignId,
    sessionNumber: data.sessionNumber,
    status: 'lobby',
    dmId: data.dmId,
    connectedPlayers: [data.dmId],
    initiative: [],
    currentRound: 0,
    combatLog: [],
  };
  const sessions = getItem<GameSession[]>(STORAGE_KEYS.sessions, []);
  sessions.push(session);
  setItem(STORAGE_KEYS.sessions, sessions);
  // Increment campaign sessionCount and lastPlayedAt
  updateCampaign(data.campaignId, {
    sessionCount: data.sessionNumber,
    lastPlayedAt: new Date().toISOString(),
  });
  return session;
}

export function updateSession(id: string, updates: Partial<GameSession>): GameSession | null {
  const sessions = getItem<GameSession[]>(STORAGE_KEYS.sessions, []);
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return null;
  sessions[idx] = { ...sessions[idx], ...updates };
  setItem(STORAGE_KEYS.sessions, sessions);
  return sessions[idx];
}

export function addInitiativeEntry(sessionId: string, entry: Omit<InitiativeEntry, 'id'>): void {
  const sessions = getItem<GameSession[]>(STORAGE_KEYS.sessions, []);
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx === -1) return;
  const initiative = sessions[idx].initiative || [];
  initiative.push({ ...entry, id: uuid() });
  initiative.sort((a, b) => b.initiative - a.initiative);
  sessions[idx].initiative = initiative;
  setItem(STORAGE_KEYS.sessions, sessions);
}

export function removeInitiativeEntry(sessionId: string, entryId: string): void {
  const sessions = getItem<GameSession[]>(STORAGE_KEYS.sessions, []);
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx === -1) return;
  sessions[idx].initiative = (sessions[idx].initiative || []).filter(e => e.id !== entryId);
  setItem(STORAGE_KEYS.sessions, sessions);
}

export function nextTurn(sessionId: string): void {
  const sessions = getItem<GameSession[]>(STORAGE_KEYS.sessions, []);
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx === -1) return;
  const init = sessions[idx].initiative || [];
  if (init.length === 0) return;
  const activeIdx = init.findIndex(e => e.isActive);
  init.forEach(e => e.isActive = false);
  const nextIdx = (activeIdx + 1) % init.length;
  init[nextIdx].isActive = true;
  sessions[idx].initiative = init;
  setItem(STORAGE_KEYS.sessions, sessions);
}

// ---- Enhanced Messages ----
export function clearMessages(campaignId: string): void {
  const messages = getItem<ChatMessage[]>(STORAGE_KEYS.messages, []);
  setItem(STORAGE_KEYS.messages, messages.filter(m => m.campaignId !== campaignId));
}

export function pinMessage(messageId: string): void {
  const messages = getItem<ChatMessage[]>(STORAGE_KEYS.messages, []);
  const idx = messages.findIndex(m => m.id === messageId);
  if (idx !== -1) {
    messages[idx].pinned = !messages[idx].pinned;
    setItem(STORAGE_KEYS.messages, messages);
  }
}

export function deleteMessage(messageId: string): void {
  const messages = getItem<ChatMessage[]>(STORAGE_KEYS.messages, []);
  setItem(STORAGE_KEYS.messages, messages.filter(m => m.id !== messageId));
}

export function editMessage(messageId: string, newContent: string): ChatMessage | null {
  const messages = getItem<ChatMessage[]>(STORAGE_KEYS.messages, []);
  const idx = messages.findIndex(m => m.id === messageId);
  if (idx === -1) return null;
  messages[idx].content = newContent;
  messages[idx].editedAt = new Date().toISOString();
  setItem(STORAGE_KEYS.messages, messages);
  return messages[idx];
}

export function addReaction(messageId: string, emoji: string, userId: string): ChatMessage | null {
  const messages = getItem<ChatMessage[]>(STORAGE_KEYS.messages, []);
  const idx = messages.findIndex(m => m.id === messageId);
  if (idx === -1) return null;
  const reactions = messages[idx].reactions || [];
  const existing = reactions.find(r => r.emoji === emoji);
  if (existing) {
    if (existing.userIds.includes(userId)) {
      existing.userIds = existing.userIds.filter(id => id !== userId);
      if (existing.userIds.length === 0) {
        messages[idx].reactions = reactions.filter(r => r.emoji !== emoji);
      }
    } else {
      existing.userIds.push(userId);
    }
  } else {
    reactions.push({ emoji, userIds: [userId] });
    messages[idx].reactions = reactions;
  }
  setItem(STORAGE_KEYS.messages, messages);
  return messages[idx];
}

export function searchMessages(campaignId: string, query: string, channel?: string): ChatMessage[] {
  const msgs = getItem<ChatMessage[]>(STORAGE_KEYS.messages, []).filter(m => m.campaignId === campaignId);
  const q = query.toLowerCase();
  return msgs.filter(m => {
    if (channel && m.channel !== channel) return false;
    return m.content.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q) || (m.characterName && m.characterName.toLowerCase().includes(q));
  });
}

// ============================================================
// MAP SCENES
// ============================================================

export function getScenes(campaignId: string): MapScene[] {
  return getItem<MapScene[]>(STORAGE_KEYS.scenes, []).filter(s => s.campaignId === campaignId);
}

export function getScene(id: string): MapScene | undefined {
  return getItem<MapScene[]>(STORAGE_KEYS.scenes, []).find(s => s.id === id);
}

export function createScene(data: Omit<MapScene, 'id'>): MapScene {
  const scene: MapScene = { ...data, id: uuid() };
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  scenes.push(scene);
  setItem(STORAGE_KEYS.scenes, scenes);
  return scene;
}

export function updateScene(id: string, updates: Partial<MapScene>): MapScene | null {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === id);
  if (idx === -1) return null;
  scenes[idx] = { ...scenes[idx], ...updates };
  setItem(STORAGE_KEYS.scenes, scenes);
  return scenes[idx];
}

export function deleteScene(id: string): void {
  setItem(STORAGE_KEYS.scenes, getItem<MapScene[]>(STORAGE_KEYS.scenes, []).filter(s => s.id !== id));
}

// Token operations within scenes
export function addToken(sceneId: string, token: Omit<MapToken, 'id'>): MapToken | null {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return null;
  const newToken: MapToken = { ...token, id: uuid() };
  scenes[idx].tokens.push(newToken);
  setItem(STORAGE_KEYS.scenes, scenes);
  return newToken;
}

export function updateToken(sceneId: string, tokenId: string, updates: Partial<MapToken>): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  const tIdx = scenes[idx].tokens.findIndex(t => t.id === tokenId);
  if (tIdx === -1) return;
  scenes[idx].tokens[tIdx] = { ...scenes[idx].tokens[tIdx], ...updates };
  setItem(STORAGE_KEYS.scenes, scenes);
}

export function removeToken(sceneId: string, tokenId: string): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  scenes[idx].tokens = scenes[idx].tokens.filter(t => t.id !== tokenId);
  setItem(STORAGE_KEYS.scenes, scenes);
}

// Wall operations
export function addWall(sceneId: string, wall: Omit<Wall, 'id'>): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  scenes[idx].walls.push({ ...wall, id: uuid() });
  setItem(STORAGE_KEYS.scenes, scenes);
}

export function removeWall(sceneId: string, wallId: string): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  scenes[idx].walls = scenes[idx].walls.filter(w => w.id !== wallId);
  setItem(STORAGE_KEYS.scenes, scenes);
}

// Light operations
export function addLight(sceneId: string, light: Omit<LightSource, 'id'>): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  scenes[idx].lights.push({ ...light, id: uuid() });
  setItem(STORAGE_KEYS.scenes, scenes);
}

export function removeLight(sceneId: string, lightId: string): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  scenes[idx].lights = scenes[idx].lights.filter(l => l.id !== lightId);
  setItem(STORAGE_KEYS.scenes, scenes);
}

// Drawing operations
export function addDrawing(sceneId: string, drawing: Omit<MapDrawing, 'id'>): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  scenes[idx].drawings.push({ ...drawing, id: uuid() });
  setItem(STORAGE_KEYS.scenes, scenes);
}

export function removeDrawing(sceneId: string, drawingId: string): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  scenes[idx].drawings = scenes[idx].drawings.filter(d => d.id !== drawingId);
  setItem(STORAGE_KEYS.scenes, scenes);
}

// Fog of War
export function revealFog(sceneId: string, cells: { row: number; col: number }[]): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  const fog = scenes[idx].fogRevealed;
  for (const { row, col } of cells) {
    if (fog[row] && col < fog[row].length) {
      fog[row][col] = true;
    }
  }
  scenes[idx].fogRevealed = fog;
  setItem(STORAGE_KEYS.scenes, scenes);
}

export function hideFog(sceneId: string, cells: { row: number; col: number }[]): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  const fog = scenes[idx].fogRevealed;
  for (const { row, col } of cells) {
    if (fog[row] && col < fog[row].length) {
      fog[row][col] = false;
    }
  }
  scenes[idx].fogRevealed = fog;
  setItem(STORAGE_KEYS.scenes, scenes);
}

export function resetFog(sceneId: string): void {
  const scenes = getItem<MapScene[]>(STORAGE_KEYS.scenes, []);
  const idx = scenes.findIndex(s => s.id === sceneId);
  if (idx === -1) return;
  const s = scenes[idx];
  s.fogRevealed = Array.from({ length: s.height }, () => Array(s.width).fill(false));
  setItem(STORAGE_KEYS.scenes, scenes);
}

// ============================================================
// JOURNALS & HANDOUTS
// ============================================================

export function getJournals(campaignId: string): JournalEntry[] {
  return getItem<JournalEntry[]>(STORAGE_KEYS.journals, []).filter(j => j.campaignId === campaignId);
}

export function getJournal(id: string): JournalEntry | undefined {
  return getItem<JournalEntry[]>(STORAGE_KEYS.journals, []).find(j => j.id === id);
}

export function createJournal(data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): JournalEntry {
  const journal: JournalEntry = { ...data, id: uuid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const journals = getItem<JournalEntry[]>(STORAGE_KEYS.journals, []);
  journals.push(journal);
  setItem(STORAGE_KEYS.journals, journals);
  return journal;
}

export function updateJournal(id: string, updates: Partial<JournalEntry>): JournalEntry | null {
  const journals = getItem<JournalEntry[]>(STORAGE_KEYS.journals, []);
  const idx = journals.findIndex(j => j.id === id);
  if (idx === -1) return null;
  journals[idx] = { ...journals[idx], ...updates, updatedAt: new Date().toISOString() };
  setItem(STORAGE_KEYS.journals, journals);
  return journals[idx];
}

export function deleteJournal(id: string): void {
  setItem(STORAGE_KEYS.journals, getItem<JournalEntry[]>(STORAGE_KEYS.journals, []).filter(j => j.id !== id));
}

// ============================================================
// DICE MACROS
// ============================================================

export function getMacros(campaignId: string): DiceMacro[] {
  return getItem<DiceMacro[]>(STORAGE_KEYS.macros, []).filter(m => m.campaignId === campaignId);
}

export function createMacro(data: Omit<DiceMacro, 'id'>): DiceMacro {
  const macro: DiceMacro = { ...data, id: uuid() };
  const macros = getItem<DiceMacro[]>(STORAGE_KEYS.macros, []);
  macros.push(macro);
  setItem(STORAGE_KEYS.macros, macros);
  return macro;
}

export function updateMacro(id: string, updates: Partial<DiceMacro>): void {
  const macros = getItem<DiceMacro[]>(STORAGE_KEYS.macros, []);
  const idx = macros.findIndex(m => m.id === id);
  if (idx !== -1) {
    macros[idx] = { ...macros[idx], ...updates };
    setItem(STORAGE_KEYS.macros, macros);
  }
}

export function deleteMacro(id: string): void {
  setItem(STORAGE_KEYS.macros, getItem<DiceMacro[]>(STORAGE_KEYS.macros, []).filter(m => m.id !== id));
}

// ============================================================
// ROLLABLE TABLES
// ============================================================

export function getRollableTables(campaignId: string): RollableTable[] {
  return getItem<RollableTable[]>(STORAGE_KEYS.rollableTables, []).filter(t => t.campaignId === campaignId);
}

export function createRollableTable(data: Omit<RollableTable, 'id'>): RollableTable {
  const table: RollableTable = { ...data, id: uuid() };
  const tables = getItem<RollableTable[]>(STORAGE_KEYS.rollableTables, []);
  tables.push(table);
  setItem(STORAGE_KEYS.rollableTables, tables);
  return table;
}

export function updateRollableTable(id: string, updates: Partial<RollableTable>): void {
  const tables = getItem<RollableTable[]>(STORAGE_KEYS.rollableTables, []);
  const idx = tables.findIndex(t => t.id === id);
  if (idx !== -1) {
    tables[idx] = { ...tables[idx], ...updates };
    setItem(STORAGE_KEYS.rollableTables, tables);
  }
}

export function deleteRollableTable(id: string): void {
  setItem(STORAGE_KEYS.rollableTables, getItem<RollableTable[]>(STORAGE_KEYS.rollableTables, []).filter(t => t.id !== id));
}

// Roll from a rollable table
export function rollOnTable(tableId: string): string | null {
  const table = getItem<RollableTable[]>(STORAGE_KEYS.rollableTables, []).find(t => t.id === tableId);
  if (!table || table.entries.length === 0) return null;
  const result = rollDice(table.diceFormula);
  const entry = table.entries.find(e => result.total >= e.rangeMin && result.total <= e.rangeMax);
  return entry ? `[${result.total}] ${entry.text}` : `[${result.total}] No matching entry`;
}

// ============================================================
// AUDIO TRACKS
// ============================================================

export function getAudioTracks(campaignId: string): AudioTrack[] {
  return getItem<AudioTrack[]>(STORAGE_KEYS.audioTracks, []).filter(t => t.campaignId === campaignId);
}

export function createAudioTrack(data: Omit<AudioTrack, 'id'>): AudioTrack {
  const track: AudioTrack = { ...data, id: uuid() };
  const tracks = getItem<AudioTrack[]>(STORAGE_KEYS.audioTracks, []);
  tracks.push(track);
  setItem(STORAGE_KEYS.audioTracks, tracks);
  return track;
}

export function deleteAudioTrack(id: string): void {
  setItem(STORAGE_KEYS.audioTracks, getItem<AudioTrack[]>(STORAGE_KEYS.audioTracks, []).filter(t => t.id !== id));
}

// ============================================================
// TIMELINE
// ============================================================

export function getTimeline(campaignId: string): TimelineEvent[] {
  return getItem<TimelineEvent[]>(STORAGE_KEYS.timeline, []).filter(t => t.campaignId === campaignId);
}

export function createTimelineEvent(data: Omit<TimelineEvent, 'id'>): TimelineEvent {
  const event: TimelineEvent = { ...data, id: uuid() };
  const timeline = getItem<TimelineEvent[]>(STORAGE_KEYS.timeline, []);
  timeline.push(event);
  setItem(STORAGE_KEYS.timeline, timeline);
  return event;
}

export function updateTimelineEvent(id: string, updates: Partial<TimelineEvent>): void {
  const timeline = getItem<TimelineEvent[]>(STORAGE_KEYS.timeline, []);
  const idx = timeline.findIndex(t => t.id === id);
  if (idx !== -1) {
    timeline[idx] = { ...timeline[idx], ...updates };
    setItem(STORAGE_KEYS.timeline, timeline);
  }
}

export function deleteTimelineEvent(id: string): void {
  setItem(STORAGE_KEYS.timeline, getItem<TimelineEvent[]>(STORAGE_KEYS.timeline, []).filter(t => t.id !== id));
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

export function getAchievements(playerId?: string): Achievement[] {
  const all = getItem<Achievement[]>(STORAGE_KEYS.achievements, []);
  return playerId ? all.filter(a => a.playerId === playerId) : all;
}

export function grantAchievement(data: Omit<Achievement, 'id' | 'earnedAt'>): Achievement {
  const achievement: Achievement = { ...data, id: uuid(), earnedAt: new Date().toISOString() };
  const achievements = getItem<Achievement[]>(STORAGE_KEYS.achievements, []);
  // Check for duplicates
  const exists = achievements.some(a => a.name === data.name && a.playerId === data.playerId);
  if (exists) return achievements.find(a => a.name === data.name && a.playerId === data.playerId)!;
  achievements.push(achievement);
  setItem(STORAGE_KEYS.achievements, achievements);
  return achievement;
}

// ============================================================
// CHARACTER RELATIONSHIPS
// ============================================================

export function getRelationships(campaignId: string): CharacterRelationship[] {
  return getItem<CharacterRelationship[]>(STORAGE_KEYS.relationships, []).filter(r => r.campaignId === campaignId);
}

export function createRelationship(data: Omit<CharacterRelationship, 'id'>): CharacterRelationship {
  const rel: CharacterRelationship = { ...data, id: uuid() };
  const rels = getItem<CharacterRelationship[]>(STORAGE_KEYS.relationships, []);
  rels.push(rel);
  setItem(STORAGE_KEYS.relationships, rels);
  return rel;
}

export function updateRelationship(id: string, updates: Partial<CharacterRelationship>): void {
  const rels = getItem<CharacterRelationship[]>(STORAGE_KEYS.relationships, []);
  const idx = rels.findIndex(r => r.id === id);
  if (idx !== -1) {
    rels[idx] = { ...rels[idx], ...updates };
    setItem(STORAGE_KEYS.relationships, rels);
  }
}

export function deleteRelationship(id: string): void {
  setItem(STORAGE_KEYS.relationships, getItem<CharacterRelationship[]>(STORAGE_KEYS.relationships, []).filter(r => r.id !== id));
}

// ============================================================
// ENCOUNTER TEMPLATES
// ============================================================

export function getEncounters(campaignId: string): EncounterTemplate[] {
  return getItem<EncounterTemplate[]>(STORAGE_KEYS.encounters, []).filter(e => e.campaignId === campaignId);
}

export function createEncounter(data: Omit<EncounterTemplate, 'id'>): EncounterTemplate {
  const encounter: EncounterTemplate = { ...data, id: uuid() };
  const encounters = getItem<EncounterTemplate[]>(STORAGE_KEYS.encounters, []);
  encounters.push(encounter);
  setItem(STORAGE_KEYS.encounters, encounters);
  return encounter;
}

export function updateEncounter(id: string, updates: Partial<EncounterTemplate>): void {
  const encounters = getItem<EncounterTemplate[]>(STORAGE_KEYS.encounters, []);
  const idx = encounters.findIndex(e => e.id === id);
  if (idx !== -1) {
    encounters[idx] = { ...encounters[idx], ...updates };
    setItem(STORAGE_KEYS.encounters, encounters);
  }
}

export function deleteEncounter(id: string): void {
  setItem(STORAGE_KEYS.encounters, getItem<EncounterTemplate[]>(STORAGE_KEYS.encounters, []).filter(e => e.id !== id));
}

// ============================================================
// COMBAT LOG
// ============================================================

export function addCombatLog(sessionId: string, entry: Omit<CombatLogEntry, 'id' | 'timestamp'>): void {
  const sessions = getItem<GameSession[]>(STORAGE_KEYS.sessions, []);
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx === -1) return;
  if (!sessions[idx].combatLog) sessions[idx].combatLog = [];
  sessions[idx].combatLog.push({ ...entry, id: uuid(), timestamp: new Date().toISOString() });
  setItem(STORAGE_KEYS.sessions, sessions);
}

// ============================================================
// ADVANCED DICE (advantage/disadvantage, exploding, target)
// ============================================================

export function rollAdvantage(modifier: number = 0): { roll1: number; roll2: number; kept: number; total: number; isCritical: boolean; isFumble: boolean } {
  const roll1 = Math.floor(Math.random() * 20) + 1;
  const roll2 = Math.floor(Math.random() * 20) + 1;
  const kept = Math.max(roll1, roll2);
  return { roll1, roll2, kept, total: kept + modifier, isCritical: kept === 20, isFumble: kept === 1 };
}

export function rollDisadvantage(modifier: number = 0): { roll1: number; roll2: number; kept: number; total: number; isCritical: boolean; isFumble: boolean } {
  const roll1 = Math.floor(Math.random() * 20) + 1;
  const roll2 = Math.floor(Math.random() * 20) + 1;
  const kept = Math.min(roll1, roll2);
  return { roll1, roll2, kept, total: kept + modifier, isCritical: kept === 20, isFumble: kept === 1 };
}

export function rollExploding(sides: number, count: number = 1): { rolls: number[]; total: number } {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    let roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    while (roll === sides) {
      roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
    }
  }
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) };
}

// ============================================================
// CHARACTER SPELL & INVENTORY HELPERS
// ============================================================

export function addSpellToCharacter(characterId: string, spell: Omit<KnownSpell, 'id'>): void {
  const characters = getCharacters();
  const idx = characters.findIndex(c => c.id === characterId);
  if (idx === -1) return;
  if (!characters[idx].knownSpells) characters[idx].knownSpells = [];
  characters[idx].knownSpells.push({ ...spell, id: uuid() });
  setItem(STORAGE_KEYS.characters, characters);
}

export function removeSpellFromCharacter(characterId: string, spellId: string): void {
  const characters = getCharacters();
  const idx = characters.findIndex(c => c.id === characterId);
  if (idx === -1) return;
  characters[idx].knownSpells = (characters[idx].knownSpells || []).filter(s => s.id !== spellId);
  setItem(STORAGE_KEYS.characters, characters);
}

export function toggleSpellPrepared(characterId: string, spellId: string): void {
  const characters = getCharacters();
  const idx = characters.findIndex(c => c.id === characterId);
  if (idx === -1) return;
  const spells = characters[idx].knownSpells || [];
  const sIdx = spells.findIndex(s => s.id === spellId);
  if (sIdx !== -1) {
    spells[sIdx].prepared = !spells[sIdx].prepared;
    characters[idx].knownSpells = spells;
    setItem(STORAGE_KEYS.characters, characters);
  }
}

export function useSpellSlot(characterId: string, level: number): boolean {
  const characters = getCharacters();
  const idx = characters.findIndex(c => c.id === characterId);
  if (idx === -1) return false;
  const slot = characters[idx].spellSlots.find(s => s.level === level);
  if (!slot || slot.used >= slot.total) return false;
  slot.used += 1;
  setItem(STORAGE_KEYS.characters, characters);
  return true;
}

export function resetSpellSlots(characterId: string): void {
  const characters = getCharacters();
  const idx = characters.findIndex(c => c.id === characterId);
  if (idx === -1) return;
  characters[idx].spellSlots.forEach(s => s.used = 0);
  setItem(STORAGE_KEYS.characters, characters);
}

export function addItemToCharacter(characterId: string, item: Omit<Item, 'id'>): void {
  const characters = getCharacters();
  const idx = characters.findIndex(c => c.id === characterId);
  if (idx === -1) return;
  characters[idx].inventory.push({ ...item, id: uuid() });
  setItem(STORAGE_KEYS.characters, characters);
}

export function removeItemFromCharacter(characterId: string, itemId: string): void {
  const characters = getCharacters();
  const idx = characters.findIndex(c => c.id === characterId);
  if (idx === -1) return;
  characters[idx].inventory = characters[idx].inventory.filter(i => i.id !== itemId);
  setItem(STORAGE_KEYS.characters, characters);
}

export function updateCharacterCurrency(characterId: string, currency: Currency): void {
  const characters = getCharacters();
  const idx = characters.findIndex(c => c.id === characterId);
  if (idx === -1) return;
  characters[idx].currency = currency;
  setItem(STORAGE_KEYS.characters, characters);
}

// ============================================================
// CONDITION HELPERS (on initiative entries)
// ============================================================

export function addCondition(sessionId: string, entryId: string, condition: string): void {
  const sessions = getItem<GameSession[]>(STORAGE_KEYS.sessions, []);
  const sIdx = sessions.findIndex(s => s.id === sessionId);
  if (sIdx === -1) return;
  const init = sessions[sIdx].initiative || [];
  const eIdx = init.findIndex(e => e.id === entryId);
  if (eIdx === -1) return;
  if (!init[eIdx].conditions) init[eIdx].conditions = [];
  if (!init[eIdx].conditions.includes(condition)) {
    init[eIdx].conditions.push(condition);
    setItem(STORAGE_KEYS.sessions, sessions);
  }
}

export function removeCondition(sessionId: string, entryId: string, condition: string): void {
  const sessions = getItem<GameSession[]>(STORAGE_KEYS.sessions, []);
  const sIdx = sessions.findIndex(s => s.id === sessionId);
  if (sIdx === -1) return;
  const init = sessions[sIdx].initiative || [];
  const eIdx = init.findIndex(e => e.id === entryId);
  if (eIdx === -1) return;
  init[eIdx].conditions = (init[eIdx].conditions || []).filter(c => c !== condition);
  setItem(STORAGE_KEYS.sessions, sessions);
}

export function setConcentration(sessionId: string, entryId: string, spellName: string | undefined): void {
  const sessions = getItem<GameSession[]>(STORAGE_KEYS.sessions, []);
  const sIdx = sessions.findIndex(s => s.id === sessionId);
  if (sIdx === -1) return;
  const init = sessions[sIdx].initiative || [];
  const eIdx = init.findIndex(e => e.id === entryId);
  if (eIdx === -1) return;
  init[eIdx].concentratingOn = spellName;
  setItem(STORAGE_KEYS.sessions, sessions);
}
