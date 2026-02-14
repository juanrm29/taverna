// Centralized API helper for all frontend → backend calls
// Enhanced with retry logic, request deduplication & better error handling

const BASE = '';
const MAX_RETRIES = 2;
const RETRY_DELAY = 800; // ms

// In-flight request deduplication for GET requests
const inflightRequests = new Map<string, Promise<any>>();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';
  const isGet = method === 'GET';
  const cacheKey = isGet ? `${method}:${url}` : '';

  // Deduplicate in-flight GET requests
  if (isGet && inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey) as Promise<T>;
  }

  const execute = async (): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(`${BASE}${url}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const error = new ApiError(
            body.error || body.message || `API Error ${res.status}`,
            res.status,
            body
          );
          // Don't retry 4xx client errors (except 408 timeout, 429 rate limit)
          if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
            throw error;
          }
          lastError = error;
        } else {
          const json = await res.json();
          return json.data !== undefined ? json.data : json;
        }
      } catch (err) {
        if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429) {
          throw err;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
      }

      // Wait before retry (exponential backoff)
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * Math.pow(2, attempt));
      }
    }

    throw lastError || new Error('Request failed');
  };

  const promise = execute().finally(() => {
    if (isGet) inflightRequests.delete(cacheKey);
  });

  if (isGet) inflightRequests.set(cacheKey, promise);
  return promise;
}

// Custom error class with status code
export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// ============================================================
// Campaigns
// ============================================================

export async function getCampaigns() {
  return apiFetch<any[]>('/api/campaigns');
}

export async function getCampaign(id: string) {
  return apiFetch<any>(`/api/campaigns/${id}`);
}

export async function createCampaign(data: { name: string; description?: string; maxPlayers?: number; ruleSet?: string }) {
  return apiFetch<any>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(id: string, data: { name?: string; description?: string; status?: string }) {
  return apiFetch<any>(`/api/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCampaign(id: string) {
  return apiFetch(`/api/campaigns/${id}`, { method: 'DELETE' });
}

export async function joinCampaign(inviteCode: string) {
  return apiFetch<any>('/api/campaigns/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  });
}

export async function leaveCampaign(id: string) {
  return apiFetch(`/api/campaigns/${id}/leave`, { method: 'POST' });
}

// ============================================================
// Characters
// ============================================================

export async function getMyCharacters() {
  return apiFetch<any[]>('/api/characters');
}

export async function getCharactersByCampaign(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/characters`);
}

export async function getCharacter(id: string) {
  return apiFetch<any>(`/api/characters/${id}`);
}

export async function createCharacter(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/characters`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCharacter(id: string, data: any) {
  return apiFetch<any>(`/api/characters/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCharacter(id: string) {
  return apiFetch(`/api/characters/${id}`, { method: 'DELETE' });
}

// ============================================================
// Messages (Chat)
// ============================================================

export async function getMessages(campaignId: string, opts?: { channel?: string; search?: string; cursor?: string }) {
  const params = new URLSearchParams();
  if (opts?.channel) params.set('channel', opts.channel);
  if (opts?.search) params.set('search', opts.search);
  if (opts?.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return apiFetch<{ messages: any[]; nextCursor: string | null; hasMore: boolean }>(
    `/api/campaigns/${campaignId}/messages${qs ? `?${qs}` : ''}`
  );
}

export async function sendMessage(campaignId: string, data: {
  type: string;
  content: string;
  channel?: string;
  characterName?: string;
  whisperTo?: string;
  whisperToName?: string;
  diceResult?: any;
  combatResult?: any;
  replyToId?: string;
  replyToPreview?: string;
  replyToSender?: string;
  mentions?: string[];
  mentionEveryone?: boolean;
}) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteMessage(id: string) {
  return apiFetch(`/api/messages/${id}`, { method: 'DELETE' });
}

export async function pinMessage(id: string) {
  return apiFetch(`/api/messages/${id}/pin`, { method: 'PATCH' });
}

export async function editMessage(id: string, content: string) {
  return apiFetch<any>(`/api/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}

export async function toggleReaction(messageId: string, emoji: string) {
  return apiFetch(`/api/messages/${messageId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
}

// ============================================================
// Notes
// ============================================================

export async function getNotes(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/notes`);
}

export async function createNote(campaignId: string, data: { title: string; content: string; sessionNumber: number; dmPrivate?: boolean }) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNote(id: string, data: { title?: string; content?: string }) {
  return apiFetch<any>(`/api/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteNote(id: string) {
  return apiFetch(`/api/notes/${id}`, { method: 'DELETE' });
}

// ============================================================
// NPCs
// ============================================================

export async function getNPCs(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/npcs`);
}

export async function createNPC(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/npcs`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNPC(id: string, data: any) {
  return apiFetch<any>(`/api/npcs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteNPC(id: string) {
  return apiFetch(`/api/npcs/${id}`, { method: 'DELETE' });
}

// ============================================================
// Sessions
// ============================================================

export async function getSessions(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/sessions`);
}

export async function createSession(campaignId: string, data?: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/sessions`, { method: 'POST', body: JSON.stringify(data || {}) });
}

export async function getSession(id: string) {
  return apiFetch<any>(`/api/sessions/${id}`);
}

export async function updateSession(id: string, data: any) {
  return apiFetch<any>(`/api/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function nextTurn(sessionId: string) {
  return apiFetch<any>(`/api/sessions/${sessionId}/next-turn`, { method: 'POST' });
}

export async function addInitiative(sessionId: string, data: any) {
  return apiFetch<any>(`/api/sessions/${sessionId}/initiative`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInitiative(sessionId: string) {
  return apiFetch<any[]>(`/api/sessions/${sessionId}/initiative`);
}

export async function updateInitiativeEntry(sessionId: string, entryId: string, data: any) {
  return apiFetch<any>(`/api/sessions/${sessionId}/initiative/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteInitiativeEntry(sessionId: string, entryId: string) {
  return apiFetch(`/api/sessions/${sessionId}/initiative/${entryId}`, { method: 'DELETE' });
}

export async function getCombatLog(sessionId: string) {
  return apiFetch<any[]>(`/api/sessions/${sessionId}/combat-log`);
}

export async function rollInSession(sessionId: string, data: any) {
  return apiFetch<any>(`/api/sessions/${sessionId}/roll`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================
// Dice (standalone)
// ============================================================

export async function rollDice(data: { formula: string; label?: string; characterName?: string }) {
  return apiFetch<any>('/api/dice/roll', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================
// Macros
// ============================================================

export async function getMacros(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/macros`);
}

export async function createMacro(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/macros`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteMacro(id: string) {
  return apiFetch(`/api/macros/${id}`, { method: 'DELETE' });
}

// ============================================================
// Rollable Tables
// ============================================================

export async function getRollableTables(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/tables`);
}

export async function createRollableTable(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/tables`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteRollableTable(id: string) {
  return apiFetch(`/api/tables/${id}`, { method: 'DELETE' });
}

export async function rollOnTable(id: string) {
  return apiFetch<any>(`/api/tables/${id}/roll`, { method: 'POST' });
}

// ============================================================
// Scenes (Map)
// ============================================================

export async function getScenes(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/scenes`);
}

export async function createScene(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/scenes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getScene(id: string) {
  return apiFetch<any>(`/api/scenes/${id}`);
}

export async function updateScene(id: string, data: any) {
  return apiFetch<any>(`/api/scenes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteScene(id: string) {
  return apiFetch(`/api/scenes/${id}`, { method: 'DELETE' });
}

// ============================================================
// Tokens
// ============================================================

export async function addToken(sceneId: string, data: any) {
  return apiFetch<any>(`/api/scenes/${sceneId}/tokens`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateToken(id: string, data: any) {
  return apiFetch<any>(`/api/tokens/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function removeToken(id: string) {
  return apiFetch(`/api/tokens/${id}`, { method: 'DELETE' });
}

// ============================================================
// Fog of War
// ============================================================

export async function revealFog(sceneId: string, cells: { row: number; col: number }[]) {
  return apiFetch<any>(`/api/scenes/${sceneId}/fog`, {
    method: 'POST',
    body: JSON.stringify({ cells }),
  });
}

export async function resetFog(sceneId: string) {
  return apiFetch(`/api/scenes/${sceneId}/fog`, { method: 'DELETE' });
}

// ============================================================
// Journals
// ============================================================

export async function getJournals(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/journals`);
}

export async function getJournal(id: string) {
  return apiFetch<any>(`/api/journals/${id}`);
}

export async function createJournal(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/journals`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateJournal(id: string, data: any) {
  return apiFetch<any>(`/api/journals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteJournal(id: string) {
  return apiFetch(`/api/journals/${id}`, { method: 'DELETE' });
}

// ============================================================
// Audio Tracks
// ============================================================

export async function getAudioTracks(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/audio`);
}

export async function createAudioTrack(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/audio`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAudioTrack(id: string, data: any) {
  return apiFetch<any>(`/api/audio/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAudioTrack(id: string) {
  return apiFetch(`/api/audio/${id}`, { method: 'DELETE' });
}

// ============================================================
// Timeline Events
// ============================================================

export async function getTimeline(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/timeline`);
}

export async function createTimelineEvent(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/timeline`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTimelineEvent(id: string, data: any) {
  return apiFetch<any>(`/api/timeline/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTimelineEvent(id: string) {
  return apiFetch(`/api/timeline/${id}`, { method: 'DELETE' });
}

// ============================================================
// Achievements
// ============================================================

export async function getAchievements(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/achievements`);
}

export async function grantAchievement(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/achievements`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================
// Encounters
// ============================================================

export async function getEncounters(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/encounters`);
}

export async function getEncounter(id: string) {
  return apiFetch<any>(`/api/encounters/${id}`);
}

export async function createEncounter(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/encounters`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEncounter(id: string, data: any) {
  return apiFetch<any>(`/api/encounters/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteEncounter(id: string) {
  return apiFetch(`/api/encounters/${id}`, { method: 'DELETE' });
}

// ============================================================
// User Profile
// ============================================================

export async function getProfile() {
  return apiFetch<any>('/api/users/me');
}

export async function updateProfile(data: { displayName?: string; image?: string }) {
  return apiFetch<any>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  return apiFetch<any>('/api/users/me/password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================
// Local dice rolling utility (no API needed)
// ============================================================

export function rollDiceLocal(formula: string): { rolls: number[]; modifier: number; total: number; kept?: number[]; dropped?: number[] } {
  const match = formula.match(/^(\d+)d(\d+)(?:k([hl])(\d+))?([+-]\d+)?$/i);
  if (!match) return { rolls: [0], modifier: 0, total: 0 };

  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const keepDir = match[3] ? match[3].toLowerCase() : null;
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

// ---- Dice utility functions (pure math, no API) ----
export function roll4d6DropLowest(): { rolls: number[]; kept: number[]; total: number } {
  const rolls: number[] = [];
  for (let i = 0; i < 4; i++) rolls.push(Math.floor(Math.random() * 6) + 1);
  const sorted = [...rolls].sort((a, b) => b - a);
  const kept = sorted.slice(0, 3);
  return { rolls, kept, total: kept.reduce((a, b) => a + b, 0) };
}

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

// ============================================================
// World Lore Wiki
// ============================================================

export async function getLoreEntries(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/lore`);
}

export async function getLoreEntry(id: string) {
  return apiFetch<any>(`/api/lore/${id}`);
}

export async function createLoreEntry(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/lore`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLoreEntry(id: string, data: any) {
  return apiFetch<any>(`/api/lore/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteLoreEntry(id: string) {
  return apiFetch(`/api/lore/${id}`, { method: 'DELETE' });
}

// ============================================================
// Quest Board & Story Tracker
// ============================================================

export async function getQuests(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/quests`);
}

export async function getQuest(id: string) {
  return apiFetch<any>(`/api/quests/${id}`);
}

export async function createQuest(campaignId: string, data: any) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/quests`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateQuest(id: string, data: any) {
  return apiFetch<any>(`/api/quests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteQuest(id: string) {
  return apiFetch(`/api/quests/${id}`, { method: 'DELETE' });
}

export async function voteQuest(questId: string, vote: number) {
  return apiFetch<any>(`/api/quests/${questId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ vote }),
  });
}

export async function updateObjective(questId: string, objectiveId: string, data: { isCompleted?: boolean; isFailed?: boolean }) {
  return apiFetch<any>(`/api/quests/${questId}/objectives`, {
    method: 'PATCH',
    body: JSON.stringify({ objectiveId, ...data }),
  });
}

export async function getRumors(campaignId: string) {
  return apiFetch<any[]>(`/api/campaigns/${campaignId}/rumors`);
}

export async function createRumor(campaignId: string, data: { content: string; source?: string; questId?: string }) {
  return apiFetch<any>(`/api/campaigns/${campaignId}/rumors`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================
// Combat Autopilot (Combat Actions / Replay)
// ============================================================

export async function getCombatActions(sessionId: string) {
  return apiFetch<any[]>(`/api/sessions/${sessionId}/combat-actions`);
}

export async function logCombatAction(sessionId: string, data: any) {
  return apiFetch<any>(`/api/sessions/${sessionId}/combat-actions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
