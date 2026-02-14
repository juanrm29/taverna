/**
 * ================================================================
 * TAVERNA D&D VTT — Full Gameplay E2E Simulation
 * ================================================================
 * Simulates the COMPLETE gameplay flow from a real user perspective:
 * 
 * PHASE 1: Authentication
 *   1.1 Register DM account
 *   1.2 Login as DM
 * 
 * PHASE 2: Campaign Setup (DM)
 *   2.1 Create campaign
 *   2.2 View campaign list
 *   2.3 View campaign detail
 * 
 * PHASE 3: Character Creation
 *   3.1 Create DM's NPC character
 *   3.2 List characters in campaign
 * 
 * PHASE 4: Campaign Content (DM prep)
 *   4.1 Create session notes
 *   4.2 Create NPC
 *   4.3 Create dice macro
 *   4.4 Create rollable table
 * 
 * PHASE 5: Live Session
 *   5.1 Create game session
 *   5.2 Go LIVE
 *   5.3 Add initiative entries
 *   5.4 Update initiative HP
 *   5.5 Add conditions
 *   5.6 Next turn cycling
 * 
 * PHASE 6: Chat System
 *   6.1 Send text message (IC)
 *   6.2 Send text message (OOC)
 *   6.3 Send dice roll message
 *   6.4 Send narration (DM)
 *   6.5 Send whisper
 *   6.6 Edit message
 *   6.7 Pin message
 *   6.8 React to message
 *   6.9 Delete message
 *   6.10 Load message history
 * 
 * PHASE 7: Dice & Tools
 *   7.1 Server-side dice roll
 *   7.2 Roll on table
 *   7.3 In-session roll
 * 
 * PHASE 8: Session End
 *   8.1 Pause session
 *   8.2 End session
 * 
 * PHASE 9: Post-Session
 *   9.1 Update character HP
 *   9.2 Update notes
 *   9.3 Delete NPC
 * 
 * PHASE 10: Cleanup
 *   10.1 Delete character
 *   10.2 Delete campaign
 * ================================================================
 */

const BASE = 'http://localhost:3099';
const TEST_EMAIL = `e2e_player_${Date.now()}@test.taverna.gg`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'E2E Tester';

let cookie = '';
let userId = '';
let campaignId = '';
let characterId = '';
let sessionId = '';
let noteId = '';
let npcId = '';
let macroId = '';
let tableId = '';
let messageIds: string[] = [];
let initiativeEntryId = '';
let initiativeEntryId2 = '';

// Counters
let passed = 0;
let failed = 0;
const failures: string[] = [];

// ============================================================
// Helpers — Cookie Jar
// ============================================================
const cookieJar: Record<string, string> = {};

function mergeCookies(setCookieHeaders: string[]) {
  for (const raw of setCookieHeaders) {
    const pair = raw.split(';')[0]; // "name=value"
    const eqIdx = pair.indexOf('=');
    if (eqIdx > 0) {
      const name = pair.substring(0, eqIdx);
      const value = pair.substring(eqIdx + 1);
      cookieJar[name] = value;
    }
  }
}

function getCookieHeader(): string {
  return Object.entries(cookieJar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function api(method: string, path: string, body?: any, _label?: string): Promise<any> {
  const url = `${BASE}${path}`;
  const cookieStr = getCookieHeader();
  const opts: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieStr ? { Cookie: cookieStr } : {}),
    },
    redirect: 'manual',
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);

    // Merge all Set-Cookie headers into jar
    const setCookie = res.headers.getSetCookie?.() || [];
    if (setCookie.length > 0) {
      mergeCookies(setCookie);
    }

    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { }

    return { status: res.status, json, text, ok: res.ok };
  } catch (err: any) {
    return { status: 0, json: null, text: err.message, ok: false, error: err };
  }
}

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    const msg = `  ❌ ${label}${detail ? ` — ${detail}` : ''}`;
    console.log(msg);
    failed++;
    failures.push(label);
  }
}

async function loginViaCsrf() {
  // Step 1: Get CSRF token + initial cookies
  const csrfCookieStr = getCookieHeader();
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, {
    headers: csrfCookieStr ? { Cookie: csrfCookieStr } : {},
  });

  // Merge csrf cookies
  const csrfSetCookies = csrfRes.headers.getSetCookie?.() || [];
  mergeCookies(csrfSetCookies);

  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;

  // Step 2: Post credentials login with ALL cookies
  const loginCookieStr = getCookieHeader();
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(loginCookieStr ? { Cookie: loginCookieStr } : {}),
    },
    body: new URLSearchParams({
      csrfToken,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      redirect: 'false',
    }).toString(),
    redirect: 'manual',
  });

  // Merge session cookies
  const loginSetCookies = loginRes.headers.getSetCookie?.() || [];
  mergeCookies(loginSetCookies);

  return loginRes;
}

// ============================================================
// PHASE 1: Authentication
// ============================================================
async function phase1() {
  console.log('\n🔐 PHASE 1: Authentication');
  console.log('─'.repeat(50));

  // 1.1 Register
  const reg = await api('POST', '/api/auth/register', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    displayName: TEST_NAME,
  }, 'Register');
  assert(reg.status === 201 || reg.status === 200, '1.1 Register new DM account', `status=${reg.status} ${reg.json?.error || ''}`);
  if (reg.json?.data?.id) userId = reg.json.data.id;

  // 1.2 Login via NextAuth credentials
  await loginViaCsrf();

  // Verify auth by calling /api/users/me
  const me = await api('GET', '/api/users/me');
  assert(me.status === 200 && me.json?.data?.email === TEST_EMAIL, '1.2 Login & verify session', `status=${me.status} email=${me.json?.data?.email}`);
  if (me.json?.data?.id) userId = me.json.data.id;
}

// ============================================================
// PHASE 2: Campaign Setup
// ============================================================
async function phase2() {
  console.log('\n🏰 PHASE 2: Campaign Setup');
  console.log('─'.repeat(50));

  // 2.1 Create campaign
  const create = await api('POST', '/api/campaigns', {
    name: 'E2E Test Quest: Curse of Strahd',
    description: 'A dark adventure in the mists of Barovia. E2E test campaign.',
    maxPlayers: 5,
    ruleSet: 'D&D 5e',
  });
  assert(create.status === 201 && create.json?.data?.id, '2.1 Create campaign', `status=${create.status} ${create.json?.error || ''}`);
  campaignId = create.json?.data?.id || '';

  // 2.2 List campaigns
  const list = await api('GET', '/api/campaigns');
  assert(list.status === 200 && Array.isArray(list.json?.data), '2.2 List my campaigns', `status=${list.status} count=${list.json?.data?.length}`);
  const found = (list.json?.data || []).some((c: any) => c.id === campaignId);
  assert(found, '2.2b Campaign appears in list');

  // 2.3 View campaign detail
  const detail = await api('GET', `/api/campaigns/${campaignId}`);
  assert(detail.status === 200 && detail.json?.data?.name?.includes('Curse of Strahd'), '2.3 View campaign detail', `name=${detail.json?.data?.name}`);
  assert(detail.json?.data?.dmId === userId, '2.3b DM is correct user');
}

// ============================================================
// PHASE 3: Character Creation
// ============================================================
async function phase3() {
  console.log('\n⚔️ PHASE 3: Character Creation');
  console.log('─'.repeat(50));

  // 3.1 Create character
  const create = await api('POST', `/api/campaigns/${campaignId}/characters`, {
    name: 'Gandalf the Test',
    race: 'Human',
    class: 'Wizard',
    level: 5,
    abilityScores: { strength: 8, dexterity: 14, constitution: 12, intelligence: 20, wisdom: 15, charisma: 10 },
    hp: { current: 28, max: 28, temp: 0 },
    armorClass: 12,
    speed: 30,
    proficiencyBonus: 3,
    background: 'Sage',
    alignment: 'Neutral Good',
  });
  assert(create.status === 201 && create.json?.data?.id, '3.1 Create character "Gandalf the Test"', `status=${create.status} ${create.json?.error || ''}`);
  characterId = create.json?.data?.id || '';

  // 3.2 List characters in campaign
  const list = await api('GET', `/api/campaigns/${campaignId}/characters`);
  assert(list.status === 200 && Array.isArray(list.json?.data), '3.2 List campaign characters', `count=${list.json?.data?.length}`);
  const found = (list.json?.data || []).some((c: any) => c.id === characterId);
  assert(found, '3.2b Character appears in list');

  // 3.3 Get character detail
  const detail = await api('GET', `/api/characters/${characterId}`);
  assert(detail.status === 200 && detail.json?.data?.name === 'Gandalf the Test', '3.3 Get character detail');
  assert(detail.json?.data?.class === 'Wizard', '3.3b Class is correct');
  assert(detail.json?.data?.level === 5, '3.3c Level is correct');

  // 3.4 Get my characters (cross-campaign)
  const mine = await api('GET', '/api/characters');
  assert(mine.status === 200 && Array.isArray(mine.json?.data), '3.4 Get all my characters');
}

// ============================================================
// PHASE 4: Campaign Content
// ============================================================
async function phase4() {
  console.log('\n📝 PHASE 4: Campaign Content (DM Prep)');
  console.log('─'.repeat(50));

  // 4.1 Create session notes
  const note = await api('POST', `/api/campaigns/${campaignId}/notes`, {
    title: 'Session 1: Arrival at Barovia',
    content: 'The adventurers arrive through the mists. They find a letter from the Burgomaster.',
    sessionNumber: 1,
    dmPrivate: false,
  });
  assert(note.status === 201 && note.json?.data?.id, '4.1 Create session notes', `status=${note.status}`);
  noteId = note.json?.data?.id || '';

  // 4.2 Create NPC
  const npc = await api('POST', `/api/campaigns/${campaignId}/npcs`, {
    name: 'Ismark Kolyanovich',
    description: 'The burgomaster\'s son, seeking help',
    race: 'Human',
    personality: 'Desperate but noble',
    motivation: 'Save his sister Ireena',
  });
  assert(npc.status === 201 && npc.json?.data?.id, '4.2 Create NPC "Ismark"', `status=${npc.status}`);
  npcId = npc.json?.data?.id || '';

  // 4.3 Create dice macro
  const macro = await api('POST', `/api/campaigns/${campaignId}/macros`, {
    name: 'Fireball Damage',
    formula: '8d6',
    label: 'Standard fireball damage',
  });
  assert(macro.status === 201 && macro.json?.data?.id, '4.3 Create dice macro "Fireball"', `status=${macro.status}`);
  macroId = macro.json?.data?.id || '';

  // 4.4 Create rollable table
  const table = await api('POST', `/api/campaigns/${campaignId}/tables`, {
    name: 'Random Encounter',
    diceFormula: '1d4',
    entries: [
      { id: 'e1', rangeMin: 1, rangeMax: 1, text: '1d4 Wolves', weight: 1 },
      { id: 'e2', rangeMin: 2, rangeMax: 2, text: '1 Dire Wolf', weight: 1 },
      { id: 'e3', rangeMin: 3, rangeMax: 3, text: '2d4 Zombies', weight: 1 },
      { id: 'e4', rangeMin: 4, rangeMax: 4, text: 'Friendly Merchant', weight: 1 },
    ],
  });
  assert(table.status === 201 && table.json?.data?.id, '4.4 Create rollable table', `status=${table.status}`);
  tableId = table.json?.data?.id || '';

  // 4.5 List all notes
  const notes = await api('GET', `/api/campaigns/${campaignId}/notes`);
  assert(notes.status === 200 && (notes.json?.data || []).length > 0, '4.5 List notes');

  // 4.6 List all NPCs
  const npcs = await api('GET', `/api/campaigns/${campaignId}/npcs`);
  assert(npcs.status === 200 && (npcs.json?.data || []).length > 0, '4.6 List NPCs');

  // 4.7 List macros
  const macros = await api('GET', `/api/campaigns/${campaignId}/macros`);
  assert(macros.status === 200 && Array.isArray(macros.json?.data), '4.7 List dice macros');

  // 4.8 List rollable tables
  const tables = await api('GET', `/api/campaigns/${campaignId}/tables`);
  assert(tables.status === 200 && Array.isArray(tables.json?.data), '4.8 List rollable tables');
}

// ============================================================
// PHASE 5: Live Session
// ============================================================
async function phase5() {
  console.log('\n🎲 PHASE 5: Live Session');
  console.log('─'.repeat(50));

  // 5.1 Create game session
  const create = await api('POST', `/api/campaigns/${campaignId}/sessions`, {
    sessionNumber: 1,
  });
  assert(create.status === 201 && create.json?.data?.id, '5.1 Create game session', `status=${create.status} ${create.json?.error || ''}`);
  sessionId = create.json?.data?.id || '';

  // 5.2 Go LIVE
  const live = await api('PATCH', `/api/sessions/${sessionId}`, { status: 'LIVE' });
  assert(live.status === 200 && live.json?.data?.status === 'LIVE', '5.2 Go LIVE', `status=${live.json?.data?.status}`);

  // 5.3 Add initiative: Gandalf (PC)
  const init1 = await api('POST', `/api/sessions/${sessionId}/initiative`, {
    name: 'Gandalf the Test',
    initiative: 18,
    isNPC: false,
    hp: { current: 28, max: 28 },
    armorClass: 12,
    characterId: characterId,
  });
  assert(init1.status === 201 && init1.json?.data?.id, '5.3a Add initiative: Gandalf (18)', `status=${init1.status}`);
  initiativeEntryId = init1.json?.data?.id || '';

  // 5.3b Add initiative: Goblin (NPC)
  const init2 = await api('POST', `/api/sessions/${sessionId}/initiative`, {
    name: 'Goblin Archer',
    initiative: 12,
    isNPC: true,
    hp: { current: 7, max: 7 },
    armorClass: 15,
  });
  assert(init2.status === 201 && init2.json?.data?.id, '5.3b Add initiative: Goblin (12)', `status=${init2.status}`);
  initiativeEntryId2 = init2.json?.data?.id || '';

  // 5.4 Update HP (Goblin takes damage)
  const updateHP = await api('PATCH', `/api/sessions/${sessionId}/initiative/${initiativeEntryId2}`, {
    hp: { current: 3, max: 7 },
  });
  assert(updateHP.status === 200, '5.4 Update Goblin HP: 7→3', `status=${updateHP.status}`);

  // 5.5 Add condition to Goblin
  const addCond = await api('PATCH', `/api/sessions/${sessionId}/initiative/${initiativeEntryId2}`, {
    conditions: ['Poisoned', 'Frightened'],
  });
  assert(addCond.status === 200, '5.5 Add conditions: Poisoned, Frightened', `status=${addCond.status}`);

  // 5.6 Verify initiative order
  const sess = await api('GET', `/api/sessions/${sessionId}`);
  const initEntries = sess.json?.data?.initiativeEntries || [];
  assert(initEntries.length === 2, '5.6a Session has 2 initiative entries', `count=${initEntries.length}`);
  // Should be sorted: Gandalf(18) first, Goblin(12) second
  if (initEntries.length >= 2) {
    assert(initEntries[0].initiative >= initEntries[1].initiative, '5.6b Initiative sorted correctly (18 > 12)');
  }

  // 5.7 Next turn
  const turn1 = await api('POST', `/api/sessions/${sessionId}/next-turn`);
  assert(turn1.status === 200, '5.7a Next turn (advance from round start)', `status=${turn1.status}`);
  
  const turn2 = await api('POST', `/api/sessions/${sessionId}/next-turn`);
  assert(turn2.status === 200, '5.7b Next turn again (should cycle)', `status=${turn2.status}`);

  // 5.8 Remove initiative entry
  const removeInit = await api('DELETE', `/api/sessions/${sessionId}/initiative/${initiativeEntryId2}`);
  assert(removeInit.status === 200 || removeInit.status === 204, '5.8 Remove Goblin from initiative', `status=${removeInit.status}`);
}

// ============================================================
// PHASE 6: Chat System
// ============================================================
async function phase6() {
  console.log('\n💬 PHASE 6: Chat System');
  console.log('─'.repeat(50));

  // 6.1 Send IC text message
  const msg1 = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'TEXT',
    content: 'I cast Detect Magic to scan the area.',
    channel: 'GENERAL',
    characterName: 'Gandalf the Test',
  });
  assert(msg1.status === 201 && msg1.json?.data?.id, '6.1 Send IC message', `status=${msg1.status}`);
  if (msg1.json?.data?.id) messageIds.push(msg1.json.data.id);

  // 6.2 Send OOC message
  const msg2 = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'OOC',
    content: 'Hey guys, should I use my spell slot here?',
    channel: 'GENERAL',
  });
  assert(msg2.status === 201 && msg2.json?.data?.id, '6.2 Send OOC message', `status=${msg2.status}`);
  if (msg2.json?.data?.id) messageIds.push(msg2.json.data.id);

  // 6.3 Send dice roll message
  const msg3 = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'DICE',
    content: 'rolled 1d20+5 (Perception)',
    channel: 'GENERAL',
    characterName: 'Gandalf the Test',
    diceResult: { formula: '1d20+5', rolls: [14], modifier: 5, total: 19 },
  });
  assert(msg3.status === 201, '6.3 Send dice roll message', `status=${msg3.status}`);
  if (msg3.json?.data?.id) messageIds.push(msg3.json.data.id);

  // 6.4 Send DM narration
  const msg4 = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'NARRATION',
    content: 'The ancient tower looms before you, its stones crackling with arcane energy. A faint glow pulses from within.',
    channel: 'GENERAL',
  });
  assert(msg4.status === 201, '6.4 Send DM narration', `status=${msg4.status}`);
  if (msg4.json?.data?.id) messageIds.push(msg4.json.data.id);

  // 6.5 Send whisper
  const msg5 = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'WHISPER',
    content: 'You notice a hidden trap mechanism in the floor.',
    channel: 'WHISPERS',
    whisperTo: userId,
    whisperToName: TEST_NAME,
  });
  assert(msg5.status === 201, '6.5 Send whisper', `status=${msg5.status}`);
  if (msg5.json?.data?.id) messageIds.push(msg5.json.data.id);

  // 6.6 Send combat message
  const msg6 = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'COMBAT',
    content: 'Gandalf attacks with Magic Missile! 3 darts of force streak toward the goblin.',
    channel: 'COMBAT',
  });
  assert(msg6.status === 201, '6.6 Send combat message', `status=${msg6.status}`);
  if (msg6.json?.data?.id) messageIds.push(msg6.json.data.id);

  // 6.7 Send emote
  const msg7 = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'EMOTE',
    content: 'strokes his beard thoughtfully',
    channel: 'GENERAL',
    characterName: 'Gandalf the Test',
  });
  assert(msg7.status === 201, '6.7 Send emote', `status=${msg7.status}`);
  if (msg7.json?.data?.id) messageIds.push(msg7.json.data.id);

  // 6.8 Send system message
  const msg8 = await api('POST', `/api/campaigns/${campaignId}/messages`, {
    type: 'SYSTEM',
    content: 'Session has begun. Round 1, initiative order set.',
    channel: 'GENERAL',
  });
  assert(msg8.status === 201, '6.8 Send system message', `status=${msg8.status}`);
  if (msg8.json?.data?.id) messageIds.push(msg8.json.data.id);

  // 6.9 Load message history
  const history = await api('GET', `/api/campaigns/${campaignId}/messages`);
  assert(history.status === 200, '6.9 Load message history', `status=${history.status}`);
  const msgCount = history.json?.data?.messages?.length || history.json?.data?.length || 0;
  assert(msgCount >= 8, `6.9b Messages loaded (${msgCount} ≥ 8)`, `count=${msgCount}`);

  // 6.10 Edit message
  if (messageIds[0]) {
    const edit = await api('PATCH', `/api/messages/${messageIds[0]}`, {
      content: 'I cast Detect Magic and scan the entire room thoroughly.',
    });
    assert(edit.status === 200, '6.10 Edit message', `status=${edit.status}`);
  }

  // 6.11 Pin message (POST toggle)
  if (messageIds[0]) {
    const pin = await api('POST', `/api/messages/${messageIds[0]}/pin`);
    assert(pin.status === 200, '6.11 Pin message', `status=${pin.status}`);
  }

  // 6.12 React to message
  if (messageIds[0]) {
    const react = await api('POST', `/api/messages/${messageIds[0]}/reactions`, {
      emoji: '🎲',
    });
    assert(react.status === 200 || react.status === 201, '6.12 React to message with 🎲', `status=${react.status}`);
  }

  // 6.13 Delete a message
  if (messageIds.length > 1) {
    const del = await api('DELETE', `/api/messages/${messageIds[messageIds.length - 1]}`);
    assert(del.status === 200 || del.status === 204, '6.13 Delete message', `status=${del.status}`);
    messageIds.pop();
  }
}

// ============================================================
// PHASE 7: Dice & Tools
// ============================================================
async function phase7() {
  console.log('\n🎯 PHASE 7: Dice & Tools');
  console.log('─'.repeat(50));

  // 7.1 Server-side dice roll
  const roll = await api('POST', '/api/dice/roll', {
    formula: '4d6kh3',
    label: 'Ability Score Generation',
    characterName: 'Gandalf the Test',
  });
  assert(roll.status === 200 && roll.json?.data?.total > 0, '7.1 Server dice roll (4d6kh3)', `total=${roll.json?.data?.total}`);

  // 7.2 Roll on table
  if (tableId) {
    const tableRoll = await api('POST', `/api/tables/${tableId}/roll`);
    assert(tableRoll.status === 200 && tableRoll.json?.data?.result, '7.2 Roll on encounter table', `result="${tableRoll.json?.data?.result}"`);
  }

  // 7.3 In-session roll
  if (sessionId) {
    const sessRoll = await api('POST', `/api/sessions/${sessionId}/roll`, {
      formula: '1d20+5',
      label: 'Attack roll',
      characterName: 'Gandalf the Test',
    });
    assert(sessRoll.status === 200 || sessRoll.status === 201, '7.3 In-session dice roll', `status=${sessRoll.status}`);
  }

  // 7.4 Combat log
  if (sessionId) {
    const log = await api('GET', `/api/sessions/${sessionId}/combat-log`);
    assert(log.status === 200, '7.4 Get combat log', `status=${log.status}`);
  }
}

// ============================================================
// PHASE 8: Session End
// ============================================================
async function phase8() {
  console.log('\n⏸️ PHASE 8: Session End');
  console.log('─'.repeat(50));

  // 8.1 Pause session
  const pause = await api('PATCH', `/api/sessions/${sessionId}`, { status: 'PAUSED' });
  assert(pause.status === 200 && pause.json?.data?.status === 'PAUSED', '8.1 Pause session', `status=${pause.json?.data?.status}`);

  // 8.2 Resume session
  const resume = await api('PATCH', `/api/sessions/${sessionId}`, { status: 'LIVE' });
  assert(resume.status === 200 && resume.json?.data?.status === 'LIVE', '8.2 Resume session', `status=${resume.json?.data?.status}`);

  // 8.3 End session
  const end = await api('PATCH', `/api/sessions/${sessionId}`, { status: 'ENDED' });
  assert(end.status === 200 && end.json?.data?.status === 'ENDED', '8.3 End session', `status=${end.json?.data?.status}`);

  // 8.4 List sessions (should have 1 ended session)
  const sessions = await api('GET', `/api/campaigns/${campaignId}/sessions`);
  assert(sessions.status === 200, '8.4 List sessions', `count=${(sessions.json?.data || []).length}`);
}

// ============================================================
// PHASE 9: Post-Session Management
// ============================================================
async function phase9() {
  console.log('\n📋 PHASE 9: Post-Session Management');
  console.log('─'.repeat(50));

  // 9.1 Update character HP (took damage during session)
  const updateChar = await api('PATCH', `/api/characters/${characterId}`, {
    hp: { current: 20, max: 28, temp: 0 },
  });
  assert(updateChar.status === 200 && updateChar.json?.data?.hp?.current === 20, '9.1 Update character HP: 28→20', `hp=${updateChar.json?.data?.hp?.current}`);

  // 9.2 Update character level (leveled up!)
  const levelUp = await api('PATCH', `/api/characters/${characterId}`, {
    level: 6,
    hp: { current: 34, max: 34, temp: 0 },
  });
  assert(levelUp.status === 200 && levelUp.json?.data?.level === 6, '9.2 Level up: 5→6', `level=${levelUp.json?.data?.level}`);

  // 9.3 Update notes
  const updateNote = await api('PATCH', `/api/notes/${noteId}`, {
    content: 'The adventurers arrive through the mists. They defeated goblin scouts and found a letter from the Burgomaster. The party leveled up!',
  });
  assert(updateNote.status === 200, '9.3 Update session notes', `status=${updateNote.status}`);

  // 9.4 Update NPC
  const updateNPC = await api('PATCH', `/api/npcs/${npcId}`, {
    notes: 'Met the party. Grateful for their help with the goblins.',
  });
  assert(updateNPC.status === 200, '9.4 Update NPC notes', `status=${updateNPC.status}`);

  // 9.5 Update campaign description
  const updateCamp = await api('PATCH', `/api/campaigns/${campaignId}`, {
    description: 'A dark adventure in Barovia. Session 1 completed!',
  });
  assert(updateCamp.status === 200, '9.5 Update campaign description', `status=${updateCamp.status}`);
}

// ============================================================
// PHASE 10: Cleanup
// ============================================================
async function phase10() {
  console.log('\n🧹 PHASE 10: Cleanup');
  console.log('─'.repeat(50));

  // 10.1 Delete macro
  if (macroId) {
    const del = await api('DELETE', `/api/macros/${macroId}`);
    assert(del.status === 200 || del.status === 204, '10.1 Delete macro', `status=${del.status}`);
  }

  // 10.2 Delete rollable table
  if (tableId) {
    const del = await api('DELETE', `/api/tables/${tableId}`);
    assert(del.status === 200 || del.status === 204, '10.2 Delete table', `status=${del.status}`);
  }

  // 10.3 Delete NPC
  if (npcId) {
    const del = await api('DELETE', `/api/npcs/${npcId}`);
    assert(del.status === 200 || del.status === 204, '10.3 Delete NPC', `status=${del.status}`);
  }

  // 10.4 Delete note
  if (noteId) {
    const del = await api('DELETE', `/api/notes/${noteId}`);
    assert(del.status === 200 || del.status === 204, '10.4 Delete note', `status=${del.status}`);
  }

  // 10.5 Delete character
  if (characterId) {
    const del = await api('DELETE', `/api/characters/${characterId}`);
    assert(del.status === 200 || del.status === 204, '10.5 Delete character', `status=${del.status}`);
  }

  // 10.6 Delete campaign
  if (campaignId) {
    const del = await api('DELETE', `/api/campaigns/${campaignId}`);
    assert(del.status === 200 || del.status === 204, '10.6 Delete campaign', `status=${del.status}`);
  }

  // 10.7 Verify campaign gone
  const verify = await api('GET', `/api/campaigns/${campaignId}`);
  assert(verify.status === 404 || verify.status === 403, '10.7 Campaign deleted (404)', `status=${verify.status}`);
}

// ============================================================
// MAIN RUNNER
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   TAVERNA D&D VTT — Full Gameplay E2E Test      ║');
  console.log('║   Simulating: Complete DM + Session Flow         ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const start = Date.now();

  try { await phase1(); } catch (e: any) { console.error('Phase 1 crashed:', e.message); }
  try { await phase2(); } catch (e: any) { console.error('Phase 2 crashed:', e.message); }
  try { await phase3(); } catch (e: any) { console.error('Phase 3 crashed:', e.message); }
  try { await phase4(); } catch (e: any) { console.error('Phase 4 crashed:', e.message); }
  try { await phase5(); } catch (e: any) { console.error('Phase 5 crashed:', e.message); }
  try { await phase6(); } catch (e: any) { console.error('Phase 6 crashed:', e.message); }
  try { await phase7(); } catch (e: any) { console.error('Phase 7 crashed:', e.message); }
  try { await phase8(); } catch (e: any) { console.error('Phase 8 crashed:', e.message); }
  try { await phase9(); } catch (e: any) { console.error('Phase 9 crashed:', e.message); }
  try { await phase10(); } catch (e: any) { console.error('Phase 10 crashed:', e.message); }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log('\n');
  console.log('══════════════════════════════════════════════════');
  console.log('  GAMEPLAY SIMULATION RESULTS');
  console.log('══════════════════════════════════════════════════');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📊 Total:  ${passed + failed}`);
  console.log(`  ⏱️  Time:   ${elapsed}s`);
  console.log(`  📈 Score:  ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('──────────────────────────────────────────────────');

  if (failures.length > 0) {
    console.log('\n  FAILURES:');
    failures.forEach(f => console.log(`    ⛔ ${f}`));
  }

  console.log('\n  GAMEPLAY FLOW COVERAGE:');
  console.log('  ┌─ 🔐 Auth (Register → Login → Verify)');
  console.log('  ├─ 🏰 Campaign (Create → List → Detail)');
  console.log('  ├─ ⚔️ Character (Create → List → Detail → Update)');
  console.log('  ├─ 📝 Content (Notes → NPCs → Macros → Tables)');
  console.log('  ├─ 🎲 Session (Create → Live → Initiative → Turns)');
  console.log('  ├─ 💬 Chat (IC/OOC/Dice/Narration/Whisper/Combat)');
  console.log('  ├─ 🎯 Dice (Server roll → Table roll → Session roll)');
  console.log('  ├─ ⏸️ Session (Pause → Resume → End)');
  console.log('  ├─ 📋 Post-Session (HP update → Level up → Notes)');
  console.log('  └─ 🧹 Cleanup (Delete all test data)');

  const rating = passed / (passed + failed);
  console.log('\n  VERDICT:');
  if (rating >= 0.95) {
    console.log('  🏆 EXCELLENT — Gameplay flow is smooth and production-ready!');
  } else if (rating >= 0.85) {
    console.log('  ✅ GOOD — Core flow works, minor issues to fix.');
  } else if (rating >= 0.70) {
    console.log('  ⚠️ FAIR — Most things work but some important flows are broken.');
  } else {
    console.log('  ❌ NEEDS WORK — Significant gameplay flows are broken.');
  }

  console.log('══════════════════════════════════════════════════\n');
}

main().catch(console.error);
