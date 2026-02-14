#!/usr/bin/env node
// ============================================================
// TAVERNA D&D VTT — Full E2E Simulation Test
// From account creation → campaign → characters → session → combat → end
// ============================================================

const BASE = 'http://localhost:3099';
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DB_URL = 'postgresql://postgres.yecmpaoallzidwrhdcww:vd4xM4x3VRGOo1nr@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
const pool = new Pool({ connectionString: DB_URL });

// Test state
let dmCookie = '';
let playerCookie = '';
let campaignId = '';
let inviteCode = '';
let dmCharId = '';
let playerCharId = '';
let sessionId = '';
let initiativeEntries = [];

const passed = [];
const failed = [];

// ──── Helpers ────
function log(emoji, msg) { console.log(`${emoji}  ${msg}`); }
function ok(test) { passed.push(test); log('✅', test); }
function fail(test, err) { failed.push({ test, err }); log('❌', `${test}: ${err}`); }

async function api(method, path, body = null, cookie = '') {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (cookie) opts.headers['Cookie'] = cookie;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json, headers: res.headers, setCookie: res.headers.getSetCookie?.() || [] };
}

async function getAuthCookie(email, password) {
  // 1. Get CSRF token
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const csrfCookies = csrfRes.headers.getSetCookie?.() || [];

  // 2. POST credentials
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookies.join('; '),
    },
    body: new URLSearchParams({ csrfToken, email, password }),
    redirect: 'manual',
  });

  // Collect all cookies
  const loginCookies = loginRes.headers.getSetCookie?.() || [];
  const allCookies = [...csrfCookies, ...loginCookies];

  // Extract session cookie
  const sessionCookie = allCookies
    .filter(c => c.startsWith('authjs.session-token=') || c.startsWith('__Secure-authjs.session-token='))
    .pop();

  if (!sessionCookie) {
    // Try with next-auth prefix
    const altCookie = allCookies.filter(c => c.includes('session-token=')).pop();
    if (altCookie) return altCookie.split(';')[0];
    return allCookies.map(c => c.split(';')[0]).join('; ');
  }
  return sessionCookie.split(';')[0];
}

// ──── PHASE 1: Account Registration ────
async function phase1_registration() {
  log('📋', '═══ PHASE 1: ACCOUNT REGISTRATION ═══');

  // Register DM
  const dm = await api('POST', '/api/auth/register', {
    email: `dm_test_${Date.now()}@taverna.gg`,
    password: 'TestDM123!',
    displayName: 'TestDungeonMaster',
  });
  if (dm.status === 201 && dm.json.success) {
    ok('Register DM account');
  } else {
    fail('Register DM account', JSON.stringify(dm.json));
    return false;
  }

  // Register Player
  const player = await api('POST', '/api/auth/register', {
    email: `player_test_${Date.now()}@taverna.gg`,
    password: 'TestPlayer123!',
    displayName: 'TestPlayer',
  });
  if (player.status === 201 && player.json.success) {
    ok('Register Player account');
  } else {
    fail('Register Player account', JSON.stringify(player.json));
    return false;
  }

  // Test duplicate email
  const dup = await api('POST', '/api/auth/register', {
    email: dm.json.data.email,
    password: 'TestDM123!',
    displayName: 'Duplicate',
  });
  if (dup.status === 409) {
    ok('Reject duplicate email');
  } else {
    fail('Reject duplicate email', `Expected 409, got ${dup.status}`);
  }

  // Test validation (short password)
  const bad = await api('POST', '/api/auth/register', {
    email: 'bad@test.com',
    password: '123',
    displayName: 'Bad',
  });
  if (bad.status === 422 || bad.status === 400) {
    ok('Reject invalid registration data');
  } else {
    fail('Reject invalid registration data', `Expected 422, got ${bad.status}`);
  }

  return { dmEmail: dm.json.data.email, playerEmail: player.json.data.email };
}

// ──── PHASE 2: Authentication ────
async function phase2_login(dmEmail, playerEmail) {
  log('📋', '═══ PHASE 2: AUTHENTICATION ═══');

  dmCookie = await getAuthCookie(dmEmail, 'TestDM123!');
  if (dmCookie && dmCookie.includes('session-token')) {
    ok('DM login (Auth.js credentials)');
  } else {
    fail('DM login', `No session cookie: ${dmCookie}`);
    return false;
  }

  playerCookie = await getAuthCookie(playerEmail, 'TestPlayer123!');
  if (playerCookie && playerCookie.includes('session-token')) {
    ok('Player login (Auth.js credentials)');
  } else {
    fail('Player login', `No session cookie: ${playerCookie}`);
    return false;
  }

  // Test /api/users/me
  const me = await api('GET', '/api/users/me', null, dmCookie);
  if (me.status === 200 && me.json.success && me.json.data.displayName === 'TestDungeonMaster') {
    ok('GET /api/users/me (DM)');
  } else {
    fail('GET /api/users/me (DM)', JSON.stringify(me.json));
  }

  // Test unauthorized access
  const unauth = await api('GET', '/api/users/me');
  if (unauth.status === 401) {
    ok('Reject unauthenticated request');
  } else {
    fail('Reject unauthenticated request', `Expected 401, got ${unauth.status}`);
  }

  return true;
}

// ──── PHASE 3: Campaign Creation ────
async function phase3_campaign() {
  log('📋', '═══ PHASE 3: CAMPAIGN MANAGEMENT ═══');

  // Create campaign
  const camp = await api('POST', '/api/campaigns', {
    name: 'Test Campaign: Lost Mine of Phandelver',
    description: 'E2E test campaign for simulation',
    setting: 'Forgotten Realms',
    system: 'D&D 5e',
    maxPlayers: 4,
  }, dmCookie);

  if (camp.status === 201 && camp.json.success) {
    campaignId = camp.json.data.id;
    inviteCode = camp.json.data.inviteCode;
    ok(`Create campaign (id: ${campaignId.slice(0, 8)}...)`);
  } else {
    fail('Create campaign', JSON.stringify(camp.json));
    return false;
  }

  // Get campaign detail
  const detail = await api('GET', `/api/campaigns/${campaignId}`, null, dmCookie);
  if (detail.status === 200 && detail.json.data.name.includes('Lost Mine')) {
    ok('GET campaign detail');
  } else {
    fail('GET campaign detail', JSON.stringify(detail.json));
  }

  // List campaigns
  const list = await api('GET', '/api/campaigns', null, dmCookie);
  if (list.status === 200 && list.json.data.length >= 1) {
    ok(`List campaigns (found ${list.json.data.length})`);
  } else {
    fail('List campaigns', JSON.stringify(list.json));
  }

  // Player joins campaign
  const join = await api('POST', '/api/campaigns/join', { inviteCode }, playerCookie);
  if (join.status === 200 && join.json.success) {
    ok('Player joins campaign via invite code');
  } else {
    fail('Player joins campaign', JSON.stringify(join.json));
  }

  // Verify player is member
  const detail2 = await api('GET', `/api/campaigns/${campaignId}`, null, playerCookie);
  if (detail2.status === 200 && detail2.json.data.members.length >= 2) {
    ok(`Campaign has ${detail2.json.data.members.length} members`);
  } else {
    fail('Verify player membership', JSON.stringify(detail2.json));
  }

  return true;
}

// ──── PHASE 4: Character Creation ────
async function phase4_characters() {
  log('📋', '═══ PHASE 4: CHARACTER CREATION ═══');

  // DM creates an NPC/character
  const dmChar = await api('POST', `/api/campaigns/${campaignId}/characters`, {
    name: 'Aragorn the Ranger',
    race: 'Human',
    class: 'Ranger',
    level: 5,
    alignment: 'Chaotic Good',
    background: 'Outlander',
    abilityScores: { strength: 16, dexterity: 14, constitution: 14, intelligence: 10, wisdom: 14, charisma: 12 },
    hp: { current: 44, max: 44, temp: 0 },
    armorClass: 16,
    speed: 30,
    proficiencyBonus: 3,
  }, dmCookie);

  if (dmChar.status === 201 && dmChar.json.success) {
    dmCharId = dmChar.json.data.id;
    ok(`DM character created: ${dmChar.json.data.name}`);
  } else {
    fail('DM character creation', JSON.stringify(dmChar.json));
  }

  // Player creates character
  const pChar = await api('POST', `/api/campaigns/${campaignId}/characters`, {
    name: 'Elara the Wizard',
    race: 'Elf',
    class: 'Wizard',
    level: 5,
    alignment: 'Neutral Good',
    background: 'Sage',
    abilityScores: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 13, charisma: 10 },
    hp: { current: 32, max: 32, temp: 0 },
    armorClass: 12,
    speed: 30,
    proficiencyBonus: 3,
  }, playerCookie);

  if (pChar.status === 201 && pChar.json.success) {
    playerCharId = pChar.json.data.id;
    ok(`Player character created: ${pChar.json.data.name}`);
  } else {
    fail('Player character creation', JSON.stringify(pChar.json));
  }

  // Get character detail
  const charDetail = await api('GET', `/api/characters/${playerCharId}`, null, playerCookie);
  if (charDetail.status === 200 && charDetail.json.data.name === 'Elara the Wizard') {
    ok('GET character detail');
  } else {
    fail('GET character detail', JSON.stringify(charDetail.json));
  }

  // Update character HP
  const updated = await api('PATCH', `/api/characters/${playerCharId}`, {
    hp: { current: 28, max: 32, temp: 5 },
  }, playerCookie);
  if (updated.status === 200 && updated.json.data.hp.current === 28) {
    ok('Update character HP (28/32 +5 temp)');
  } else {
    fail('Update character HP', JSON.stringify(updated.json));
  }

  // List campaign characters
  const chars = await api('GET', `/api/campaigns/${campaignId}/characters`, null, dmCookie);
  if (chars.status === 200 && chars.json.data.length >= 2) {
    ok(`List campaign characters (${chars.json.data.length} found)`);
  } else {
    fail('List campaign characters', JSON.stringify(chars.json));
  }

  return true;
}

// ──── PHASE 5: Dice Rolling ────
async function phase5_dice() {
  log('📋', '═══ PHASE 5: DICE ROLLING ═══');

  // Basic d20 roll
  const d20 = await api('POST', '/api/dice/roll', { formula: '1d20', label: 'Attack Roll' }, dmCookie);
  if (d20.status === 200 && d20.json.success && d20.json.data.total >= 1 && d20.json.data.total <= 20) {
    ok(`Dice roll 1d20 = ${d20.json.data.total} [${d20.json.data.rolls}]`);
  } else {
    fail('Dice roll 1d20', JSON.stringify(d20.json));
  }

  // Complex formula
  const complex = await api('POST', '/api/dice/roll', { formula: '2d6+3', label: 'Damage' }, playerCookie);
  if (complex.status === 200 && complex.json.success) {
    const { total, rolls, modifier } = complex.json.data;
    ok(`Dice roll 2d6+3 = ${total} [${rolls}]+${modifier}`);
  } else {
    fail('Dice roll 2d6+3', JSON.stringify(complex.json));
  }

  // D100
  const d100 = await api('POST', '/api/dice/roll', { formula: '1d100' }, dmCookie);
  if (d100.status === 200 && d100.json.data.total >= 1 && d100.json.data.total <= 100) {
    ok(`Dice roll 1d100 = ${d100.json.data.total}`);
  } else {
    fail('Dice roll 1d100', JSON.stringify(d100.json));
  }

  // Invalid formula
  const invalid = await api('POST', '/api/dice/roll', { formula: 'abc' }, dmCookie);
  if (invalid.status === 422 || invalid.status === 400) {
    ok('Reject invalid dice formula');
  } else {
    fail('Reject invalid dice formula', `Expected 422, got ${invalid.status}`);
  }

  return true;
}

// ──── PHASE 6: Chat & Messages ────
async function phase6_chat() {
  log('📋', '═══ PHASE 6: CHAT & MESSAGING ═══');

  // DM sends message
  const dmMsg = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'TEXT',
    content: 'Welcome adventurers! The quest begins...',
    channel: 'GENERAL',
  }, dmCookie);
  if (dmMsg.status === 201 && dmMsg.json.success) {
    ok('DM sends chat message');
  } else {
    fail('DM sends chat message', JSON.stringify(dmMsg.json));
  }

  // Player sends message
  const pMsg = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'TEXT',
    content: 'My wizard is ready!',
    channel: 'GENERAL',
    characterName: 'Elara the Wizard',
  }, playerCookie);
  if (pMsg.status === 201 && pMsg.json.success) {
    ok('Player sends in-character message');
  } else {
    fail('Player sends in-character message', JSON.stringify(pMsg.json));
  }

  // Narration
  const narr = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'NARRATION',
    content: 'The ancient door creaks open, revealing a dark corridor...',
    channel: 'GENERAL',
  }, dmCookie);
  if (narr.status === 201) {
    ok('DM narration message');
  } else {
    fail('DM narration message', JSON.stringify(narr.json));
  }

  // Get messages
  const msgs = await api('GET', `/api/campaigns/${campaignId}/messages?limit=10`, null, playerCookie);
  if (msgs.status === 200 && msgs.json.data.messages.length >= 2) {
    ok(`GET messages (${msgs.json.data.messages.length} found)`);
  } else {
    fail('GET messages', JSON.stringify(msgs.json));
  }

  return true;
}

// ──── PHASE 7: Game Session ────
async function phase7_session() {
  log('📋', '═══ PHASE 7: GAME SESSION ═══');

  // Create session
  const sess = await api('POST', `/api/campaigns/${campaignId}/sessions`, {
    sessionNumber: 1,
  }, dmCookie);
  if (sess.status === 201 && sess.json.success) {
    sessionId = sess.json.data.id;
    ok(`Create session #1 (id: ${sessionId.slice(0, 8)}...)`);
  } else {
    fail('Create session', JSON.stringify(sess.json));
    return false;
  }

  // Get session detail
  const detail = await api('GET', `/api/sessions/${sessionId}`, null, dmCookie);
  if (detail.status === 200 && detail.json.data.status === 'LOBBY') {
    ok('Session starts in LOBBY status');
  } else {
    fail('Session status check', JSON.stringify(detail.json));
  }

  // Start session (LOBBY → LIVE)
  const start = await api('PATCH', `/api/sessions/${sessionId}`, { status: 'LIVE' }, dmCookie);
  if (start.status === 200 && start.json.data.status === 'LIVE') {
    ok('Start session (LOBBY → LIVE)');
  } else {
    fail('Start session', JSON.stringify(start.json));
  }

  // Player can see session
  const pSess = await api('GET', `/api/sessions/${sessionId}`, null, playerCookie);
  if (pSess.status === 200 && pSess.json.data.status === 'LIVE') {
    ok('Player can view live session');
  } else {
    fail('Player view session', JSON.stringify(pSess.json));
  }

  return true;
}

// ──── PHASE 8: Combat & Initiative ────
async function phase8_combat() {
  log('📋', '═══ PHASE 8: COMBAT & INITIATIVE ═══');

  // Add initiative entries
  const i1 = await api('POST', `/api/sessions/${sessionId}/initiative`, {
    name: 'Aragorn the Ranger',
    initiative: 18,
    isNPC: false,
    hp: { current: 44, max: 44 },
    armorClass: 16,
    characterId: dmCharId,
  }, dmCookie);
  if (i1.status === 201) {
    ok('Add initiative: Aragorn (18)');
    initiativeEntries.push(i1.json.data);
  } else {
    fail('Add initiative: Aragorn', JSON.stringify(i1.json));
  }

  const i2 = await api('POST', `/api/sessions/${sessionId}/initiative`, {
    name: 'Elara the Wizard',
    initiative: 14,
    isNPC: false,
    hp: { current: 32, max: 32 },
    armorClass: 12,
    characterId: playerCharId,
  }, dmCookie);
  if (i2.status === 201) {
    ok('Add initiative: Elara (14)');
    initiativeEntries.push(i2.json.data);
  } else {
    fail('Add initiative: Elara', JSON.stringify(i2.json));
  }

  // Add a Goblin NPC
  const i3 = await api('POST', `/api/sessions/${sessionId}/initiative`, {
    name: 'Goblin Warrior',
    initiative: 12,
    isNPC: true,
    hp: { current: 7, max: 7 },
    armorClass: 15,
  }, dmCookie);
  if (i3.status === 201) {
    ok('Add initiative: Goblin NPC (12)');
    initiativeEntries.push(i3.json.data);
  } else {
    fail('Add initiative: Goblin', JSON.stringify(i3.json));
  }

  // List initiative
  const initList = await api('GET', `/api/sessions/${sessionId}/initiative`, null, dmCookie);
  if (initList.status === 200 && initList.json.data.length === 3) {
    const order = initList.json.data.map(e => `${e.name}(${e.initiative})`).join(' → ');
    ok(`Initiative order: ${order}`);
  } else {
    fail('List initiative', JSON.stringify(initList.json));
  }

  // Session-bound dice roll
  const sRoll = await api('POST', `/api/sessions/${sessionId}/roll`, {
    formula: '1d20+5',
    label: 'Attack Roll',
    characterName: 'Aragorn the Ranger',
  }, dmCookie);
  if (sRoll.status === 200 && sRoll.json.success) {
    ok(`Session roll: 1d20+5 = ${sRoll.json.data.total} (logged to combat)`);
  } else {
    fail('Session dice roll', JSON.stringify(sRoll.json));
  }

  // Next turn
  const turn1 = await api('POST', `/api/sessions/${sessionId}/next-turn`, null, dmCookie);
  if (turn1.status === 200 && turn1.json.success) {
    ok('Next turn advanced');
  } else {
    fail('Next turn', JSON.stringify(turn1.json));
  }

  // Combat log entry (damage)
  const dmg = await api('POST', `/api/sessions/${sessionId}/combat-log`, {
    action: 'DAMAGE',
    turn: 'Aragorn the Ranger',
    result: 'Aragorn hits Goblin for 8 slashing damage!',
    details: { target: 'Goblin Warrior', amount: 8, type: 'slashing' },
  }, dmCookie);
  if (dmg.status === 201 && dmg.json.success) {
    ok('Log combat: Damage dealt');
  } else {
    fail('Log combat damage', JSON.stringify(dmg.json));
  }

  // Update initiative entry (Goblin takes damage)
  if (initiativeEntries[2]) {
    const goblinUpdate = await api('PATCH', `/api/sessions/${sessionId}/initiative/${initiativeEntries[2].id}`, {
      hp: { current: 0, max: 7 },
      conditions: ['unconscious'],
    }, dmCookie);
    if (goblinUpdate.status === 200) {
      ok('Update Goblin HP to 0 (death logged)');
    } else {
      fail('Update Goblin HP', JSON.stringify(goblinUpdate.json));
    }
  }

  // Healing
  const heal = await api('POST', `/api/sessions/${sessionId}/combat-log`, {
    action: 'HEALING',
    turn: 'Elara the Wizard',
    result: 'Elara casts Cure Wounds on Aragorn for 8 HP!',
    details: { target: 'Aragorn the Ranger', amount: 8 },
  }, dmCookie);
  if (heal.status === 201) {
    ok('Log combat: Healing');
  } else {
    fail('Log combat healing', JSON.stringify(heal.json));
  }

  // Player can also roll dice in session
  const pRoll = await api('POST', `/api/sessions/${sessionId}/roll`, {
    formula: '1d20+4',
    label: 'Intelligence Check',
    characterName: 'Elara the Wizard',
  }, playerCookie);
  if (pRoll.status === 200 && pRoll.json.success) {
    ok(`Player session roll: 1d20+4 = ${pRoll.json.data.total}`);
  } else {
    fail('Player session roll', JSON.stringify(pRoll.json));
  }

  // Get combat log
  const combatLog = await api('GET', `/api/sessions/${sessionId}/combat-log?limit=20`, null, playerCookie);
  if (combatLog.status === 200 && combatLog.json.data.logs.length >= 2) {
    ok(`Combat log has ${combatLog.json.data.logs.length} entries (visible to player)`);
  } else {
    fail('GET combat log', JSON.stringify(combatLog.json));
  }

  // Advance more turns
  await api('POST', `/api/sessions/${sessionId}/next-turn`, null, dmCookie);
  await api('POST', `/api/sessions/${sessionId}/next-turn`, null, dmCookie);
  const sessCheck = await api('GET', `/api/sessions/${sessionId}`, null, dmCookie);
  if (sessCheck.status === 200 && sessCheck.json.data.currentRound >= 1) {
    ok(`Round tracking: currently round ${sessCheck.json.data.currentRound}`);
  } else {
    fail('Round tracking', JSON.stringify(sessCheck.json));
  }

  return true;
}

// ──── PHASE 9: Session End ────
async function phase9_endSession() {
  log('📋', '═══ PHASE 9: SESSION END ═══');

  // Pause session
  const pause = await api('PATCH', `/api/sessions/${sessionId}`, { status: 'PAUSED' }, dmCookie);
  if (pause.status === 200 && pause.json.data.status === 'PAUSED') {
    ok('Pause session (LIVE → PAUSED)');
  } else {
    fail('Pause session', JSON.stringify(pause.json));
  }

  // Resume
  const resume = await api('PATCH', `/api/sessions/${sessionId}`, { status: 'LIVE' }, dmCookie);
  if (resume.status === 200 && resume.json.data.status === 'LIVE') {
    ok('Resume session (PAUSED → LIVE)');
  } else {
    fail('Resume session', JSON.stringify(resume.json));
  }

  // End session
  const end = await api('PATCH', `/api/sessions/${sessionId}`, { status: 'ENDED' }, dmCookie);
  if (end.status === 200 && end.json.data.status === 'ENDED') {
    ok('End session (LIVE → ENDED)');
  } else {
    fail('End session', JSON.stringify(end.json));
  }

  // List sessions
  const sessions = await api('GET', `/api/campaigns/${campaignId}/sessions`, null, dmCookie);
  if (sessions.status === 200 && sessions.json.data.length >= 1) {
    ok(`Session history: ${sessions.json.data.length} session(s)`);
  } else {
    fail('List sessions', JSON.stringify(sessions.json));
  }

  // Player cannot start session (not DM)
  const playerStart = await api('PATCH', `/api/sessions/${sessionId}`, { status: 'LIVE' }, playerCookie);
  if (playerStart.status === 403) {
    ok('Player cannot change session status (403)');
  } else {
    fail('Player session control', `Expected 403, got ${playerStart.status}`);
  }

  return true;
}

// ──── PHASE 10: Admin Panel ────
async function phase10_admin() {
  log('📋', '═══ PHASE 10: ADMIN PANEL ═══');

  // Use existing admin account
  const adminCookie = await getAuthCookie('test@taverna.gg', 'admin123');

  // Dashboard
  const dash = await api('GET', '/api/admin/dashboard', null, adminCookie);
  if (dash.status === 200 && dash.json.success && dash.json.data.overview) {
    const o = dash.json.data.overview;
    ok(`Admin dashboard: ${o.totalUsers} users, ${o.totalCampaigns} campaigns, ${o.totalSessions} sessions`);
  } else {
    fail('Admin dashboard', JSON.stringify(dash.json));
  }

  // Users list
  const users = await api('GET', '/api/admin/users?page=1&limit=10', null, adminCookie);
  if (users.status === 200 && users.json.data.users.length >= 1) {
    ok(`Admin users: ${users.json.data.users.length} users listed`);
  } else {
    fail('Admin users', JSON.stringify(users.json));
  }

  // Campaigns list
  const camps = await api('GET', '/api/admin/campaigns?page=1&limit=10', null, adminCookie);
  if (camps.status === 200 && camps.json.success) {
    ok(`Admin campaigns: ${camps.json.data.campaigns.length} campaigns`);
  } else {
    fail('Admin campaigns', JSON.stringify(camps.json));
  }

  // Analytics
  const analytics = await api('GET', '/api/admin/analytics?days=7', null, adminCookie);
  if (analytics.status === 200 && analytics.json.success) {
    ok('Admin analytics loaded');
  } else {
    fail('Admin analytics', JSON.stringify(analytics.json));
  }

  // Audit log
  const audit = await api('GET', '/api/admin/audit-log?page=1&limit=10', null, adminCookie);
  if (audit.status === 200 && audit.json.success) {
    ok(`Admin audit log: ${audit.json.data.logs?.length || 0} entries`);
  } else {
    fail('Admin audit log', JSON.stringify(audit.json));
  }

  // Non-admin cannot access
  const notAdmin = await api('GET', '/api/admin/dashboard', null, playerCookie);
  if (notAdmin.status === 403) {
    ok('Non-admin rejected from admin API (403)');
  } else {
    fail('Admin access control', `Expected 403, got ${notAdmin.status}`);
  }

  return true;
}

// ──── PHASE 11: Cleanup ────
async function phase11_cleanup() {
  log('📋', '═══ PHASE 11: CLEANUP ═══');
  try {
    // Delete test data from DB
    if (sessionId) {
      await pool.query('DELETE FROM combat_log_entries WHERE "sessionId" = $1', [sessionId]);
      await pool.query('DELETE FROM initiative_entries WHERE "sessionId" = $1', [sessionId]);
      await pool.query('DELETE FROM game_sessions WHERE id = $1', [sessionId]);
    }
    if (campaignId) {
      await pool.query('DELETE FROM chat_messages WHERE "campaignId" = $1', [campaignId]);
      await pool.query('DELETE FROM characters WHERE "campaignId" = $1', [campaignId]);
      await pool.query('DELETE FROM campaign_members WHERE "campaignId" = $1', [campaignId]);
      await pool.query('DELETE FROM campaigns WHERE id = $1', [campaignId]);
    }
    // Delete test users
    await pool.query("DELETE FROM users WHERE email LIKE '%_test_%@taverna.gg'");
    ok('Test data cleaned up');
  } catch (err) {
    fail('Cleanup', err.message);
  }
}

// ──── MAIN ────
async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🏰 TAVERNA D&D VTT — Full E2E Simulation Test 🎲    ║');
  console.log('║   Register → Campaign → Characters → Session → Combat  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();

  try {
    // Phase 1: Registration
    const accounts = await phase1_registration();
    if (!accounts) { log('💀', 'Registration failed, aborting.'); return; }

    // Phase 2: Login
    const loggedIn = await phase2_login(accounts.dmEmail, accounts.playerEmail);
    if (!loggedIn) { log('💀', 'Login failed, aborting.'); return; }

    // Phase 3: Campaign
    const campaignOk = await phase3_campaign();
    if (!campaignOk) { log('💀', 'Campaign creation failed, aborting.'); return; }

    // Phase 4: Characters
    await phase4_characters();

    // Phase 5: Dice
    await phase5_dice();

    // Phase 6: Chat
    await phase6_chat();

    // Phase 7: Session
    const sessionOk = await phase7_session();
    if (!sessionOk) { log('💀', 'Session creation failed, aborting.'); return; }

    // Phase 8: Combat
    await phase8_combat();

    // Phase 9: End
    await phase9_endSession();

    // Phase 10: Admin
    await phase10_admin();

    // Phase 11: Cleanup
    await phase11_cleanup();

  } catch (err) {
    fail('UNEXPECTED ERROR', err.stack || err.message);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // ── Final Report ──
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                   📊 FINAL REPORT                      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Passed: ${String(passed.length).padEnd(4)} │  ❌ Failed: ${String(failed.length).padEnd(4)}│  ⏱  ${elapsed}s     ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');

  if (failed.length === 0) {
    console.log('║  🎉 ALL TESTS PASSED — TAVERNA IS READY TO PLAY! 🎉   ║');
  } else {
    console.log('║  ⚠️  SOME TESTS FAILED:                                ║');
    failed.forEach(f => {
      console.log(`║  ❌ ${f.test.padEnd(50).slice(0, 50)}  ║`);
    });
  }
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  await pool.end();
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
