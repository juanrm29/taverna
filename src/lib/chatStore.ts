import { create } from 'zustand';
import { ChatMessage, GameSession, VoiceParticipant, VoiceStatus, VoiceRoomType, VoiceSettings, DEFAULT_VOICE_SETTINGS, DiceResult, InitiativeEntry, CombatResult, MapScene, ChatChannel, ChatReaction } from './types';
import * as api from './api-client';

// ============================================================
// Chat & Session Zustand Store (v4 — API-backed)
// ============================================================

interface ChatState {
  messages: ChatMessage[];
  pinnedMessages: ChatMessage[];
  activeChannel: ChatChannel;
  searchQuery: string;
  searchResults: ChatMessage[];
  isSearchOpen: boolean;
  showPinnedPanel: boolean;
  replyingTo: ChatMessage | null;
  editingMessage: ChatMessage | null;
  session: GameSession | null;
  voiceParticipants: VoiceParticipant[];
  myVoiceStatus: VoiceStatus;
  activeVoiceRoom: VoiceRoomType;
  voiceSettings: VoiceSettings;
  voiceConnectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  speakingSimInterval: ReturnType<typeof setInterval> | null;
  voicePing: number;
  activeScene: MapScene | null;
  turnTimerEnabled: boolean;
  turnTimerSeconds: number;
  turnTimerRemaining: number;
  chatMode: 'ic' | 'ooc';
  whisperTarget: { id: string; name: string } | null;
  showDicePanel: boolean;
  isNarrationMode: boolean;

  // Actions — Messages
  loadMessages: (campaignId: string) => void;
  sendText: (campaignId: string, senderId: string, senderName: string, content: string, characterName?: string) => void;
  sendDiceRoll: (campaignId: string, senderId: string, senderName: string, result: DiceResult, characterName?: string) => void;
  sendWhisper: (campaignId: string, senderId: string, senderName: string, content: string, targetId: string, targetName: string) => void;
  sendNarration: (campaignId: string, senderId: string, senderName: string, content: string) => void;
  sendEmote: (campaignId: string, senderId: string, senderName: string, content: string, characterName?: string) => void;
  sendSystem: (campaignId: string, content: string) => void;
  sendCombatMessage: (campaignId: string, senderId: string, senderName: string, content: string, combatResult: CombatResult) => void;
  pinMessage: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  clearChat: (campaignId: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  toggleReaction: (messageId: string, emoji: string, userId: string) => void;
  setActiveChannel: (channel: ChatChannel) => void;
  setReplyingTo: (msg: ChatMessage | null) => void;
  setEditingMessage: (msg: ChatMessage | null) => void;
  setSearchQuery: (query: string) => void;
  performSearch: (campaignId: string) => void;
  toggleSearch: () => void;
  togglePinnedPanel: () => void;

  // Session management
  loadSession: (campaignId: string) => void;
  startSession: (campaignId: string, dmId: string, sessionNumber: number) => void;
  goLive: () => void;
  pauseSession: () => void;
  endSession: () => void;
  addInitiative: (name: string, initiative: number, isNPC: boolean, hp?: { current: number; max: number }, ac?: number, characterId?: string) => void;
  removeInitiative: (entryId: string) => void;
  nextTurn: () => void;
  updateInitiativeHP: (entryId: string, hp: { current: number; max: number }) => void;
  addConditionToEntry: (entryId: string, condition: string) => void;
  removeConditionFromEntry: (entryId: string, condition: string) => void;
  setConcentration: (entryId: string, spellName: string | undefined) => void;

  // Scene management
  loadScene: (sceneId: string) => void;
  clearScene: () => void;

  // Turn timer
  setTurnTimer: (enabled: boolean, seconds: number) => void;
  tickTimer: () => void;
  resetTimer: () => void;

  // Voice (Discord-level — simulated, no real WebRTC)
  joinVoice: (userId: string, displayName: string, characterName?: string, role?: 'dm' | 'player' | 'spectator') => void;
  leaveVoice: (userId: string) => void;
  toggleMute: (userId: string) => void;
  toggleDeafen: (userId: string) => void;
  toggleHandRaise: (userId: string) => void;
  serverMute: (targetUserId: string, muted: boolean) => void;
  serverDeafen: (targetUserId: string, deafened: boolean) => void;
  setUserVolume: (targetUserId: string, volume: number) => void;
  moveToRoom: (userId: string, room: VoiceRoomType) => void;
  switchVoiceRoom: (room: VoiceRoomType) => void;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  startSpeakingSim: () => void;
  stopSpeakingSim: () => void;
  disconnectAll: () => void;

  // UI
  setChatMode: (mode: 'ic' | 'ooc') => void;
  setWhisperTarget: (target: { id: string; name: string } | null) => void;
  setShowDicePanel: (show: boolean) => void;
  setNarrationMode: (on: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  pinnedMessages: [],
  activeChannel: 'general',
  searchQuery: '',
  searchResults: [],
  isSearchOpen: false,
  showPinnedPanel: false,
  replyingTo: null,
  editingMessage: null,
  session: null,
  voiceParticipants: [],
  myVoiceStatus: 'disconnected',
  activeVoiceRoom: 'table' as VoiceRoomType,
  voiceSettings: { ...DEFAULT_VOICE_SETTINGS },
  voiceConnectionQuality: 'disconnected' as const,
  speakingSimInterval: null,
  voicePing: 0,
  activeScene: null,
  turnTimerEnabled: false,
  turnTimerSeconds: 120,
  turnTimerRemaining: 120,
  chatMode: 'ooc',
  whisperTarget: null,
  showDicePanel: false,
  isNarrationMode: false,

  // ============================================================
  // Messages — now API-backed
  // ============================================================
  loadMessages: (campaignId) => {
    api.getMessages(campaignId).then(data => {
      const msgs: ChatMessage[] = (data.messages || data || []).map((m: any) => ({
        id: m.id,
        campaignId: m.campaignId,
        senderId: m.senderId,
        senderName: m.senderName || m.characterName || 'Unknown',
        type: (m.type || 'text').toLowerCase(),
        content: m.content,
        timestamp: m.createdAt || m.timestamp,
        channel: m.channel?.toLowerCase() || 'general',
        characterName: m.characterName,
        diceResult: m.diceResult,
        pinned: m.pinned || false,
        reactions: m.reactions || [],
        whisperTo: m.whisperTo,
        whisperToName: m.whisperToName,
        replyToId: m.replyToId,
        replyToPreview: m.replyToPreview,
        replyToSender: m.replyToSender,
        mentions: m.mentions,
        mentionEveryone: m.mentionEveryone,
        editedAt: m.editedAt,
      }));
      set({
        messages: msgs,
        pinnedMessages: msgs.filter(m => m.pinned),
      });
    }).catch(err => console.error('Failed to load messages:', err));
  },

  sendText: (campaignId, senderId, senderName, content, characterName) => {
    const state = get();
    const mode = state.chatMode;
    const channel = state.activeChannel;
    const mentionMatches = content.match(/@(\w+)/g);
    const mentions = mentionMatches ? mentionMatches.map(m => m.slice(1)) : undefined;
    const mentionEveryone = content.includes('@everyone');

    const msgPayload: any = {
      type: mode === 'ic' ? 'TEXT' : 'OOC',
      content,
      channel: channel.toUpperCase(),
      characterName: mode === 'ic' ? characterName : undefined,
      mentions,
      mentionEveryone,
    };

    if (state.replyingTo) {
      msgPayload.replyToId = state.replyingTo.id;
      msgPayload.replyToPreview = state.replyingTo.content.slice(0, 100);
      msgPayload.replyToSender = state.replyingTo.characterName || state.replyingTo.senderName;
    }

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      campaignId, senderId, senderName,
      type: mode === 'ic' ? 'text' : 'ooc',
      content, timestamp: new Date().toISOString(),
      channel, characterName: mode === 'ic' ? characterName : undefined,
      pinned: false, reactions: [],
    };
    set(s => ({ messages: [...s.messages, optimisticMsg], replyingTo: null }));

    api.sendMessage(campaignId, msgPayload).catch(err => console.error('Failed to send:', err));
  },

  sendDiceRoll: (campaignId, senderId, senderName, result, characterName) => {
    const channel = get().activeChannel;
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`, campaignId, senderId, senderName,
      type: 'dice', content: `rolled ${result.formula}${result.label ? ` (${result.label})` : ''}`,
      diceResult: result, timestamp: new Date().toISOString(),
      channel: channel === 'whispers' ? 'general' : channel,
      characterName, pinned: false, reactions: [],
    };
    set(s => ({ messages: [...s.messages, optimisticMsg] }));
    api.sendMessage(campaignId, {
      type: 'DICE', content: optimisticMsg.content,
      channel: (channel === 'whispers' ? 'GENERAL' : channel.toUpperCase()),
      characterName, diceResult: result,
    }).catch(err => console.error('Failed to send dice:', err));
  },

  sendWhisper: (campaignId, senderId, senderName, content, targetId, targetName) => {
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`, campaignId, senderId, senderName,
      type: 'whisper', content, timestamp: new Date().toISOString(),
      channel: 'whispers', whisperTo: targetId, whisperToName: targetName,
      pinned: false, reactions: [],
    };
    set(s => ({ messages: [...s.messages, optimisticMsg] }));
    api.sendMessage(campaignId, {
      type: 'WHISPER', content, channel: 'WHISPERS',
      whisperTo: targetId, whisperToName: targetName,
    }).catch(err => console.error('Failed to send whisper:', err));
  },

  sendNarration: (campaignId, senderId, senderName, content) => {
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`, campaignId, senderId, senderName,
      type: 'narration', content, timestamp: new Date().toISOString(),
      channel: get().activeChannel, pinned: false, reactions: [],
    };
    set(s => ({ messages: [...s.messages, optimisticMsg] }));
    api.sendMessage(campaignId, {
      type: 'NARRATION', content, channel: get().activeChannel.toUpperCase(),
    }).catch(err => console.error('Failed to send narration:', err));
  },

  sendEmote: (campaignId, senderId, senderName, content, characterName) => {
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`, campaignId, senderId, senderName,
      type: 'emote', content, characterName,
      timestamp: new Date().toISOString(), channel: get().activeChannel,
      pinned: false, reactions: [],
    };
    set(s => ({ messages: [...s.messages, optimisticMsg] }));
    api.sendMessage(campaignId, {
      type: 'EMOTE', content, channel: get().activeChannel.toUpperCase(), characterName,
    }).catch(err => console.error('Failed to send emote:', err));
  },

  sendSystem: (campaignId, content) => {
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`, campaignId, senderId: 'system', senderName: 'System',
      type: 'system', content, timestamp: new Date().toISOString(),
      channel: get().activeChannel, pinned: false, reactions: [],
    };
    set(s => ({ messages: [...s.messages, optimisticMsg] }));
    api.sendMessage(campaignId, {
      type: 'SYSTEM', content, channel: get().activeChannel.toUpperCase(),
    }).catch(err => console.error('Failed to send system:', err));
  },

  sendCombatMessage: (campaignId, senderId, senderName, content, combatResult) => {
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`, campaignId, senderId, senderName,
      type: 'combat', content, timestamp: new Date().toISOString(),
      channel: 'combat', pinned: false, reactions: [],
    };
    set(s => ({ messages: [...s.messages, optimisticMsg] }));
    api.sendMessage(campaignId, {
      type: 'COMBAT', content, channel: 'COMBAT',
    }).catch(err => console.error('Failed to send combat:', err));

    // Log to combat log if we have a session
    const session = get().session;
    if (session) {
      api.getCombatLog(session.id).catch(() => {}); // just ensure it exists
    }
  },

  pinMessage: (messageId) => {
    api.pinMessage(messageId).catch(err => console.error('Failed to pin:', err));
    set(s => {
      const messages = s.messages.map(m => m.id === messageId ? { ...m, pinned: !m.pinned } : m);
      return { messages, pinnedMessages: messages.filter(m => m.pinned) };
    });
  },

  deleteMessage: (messageId) => {
    api.deleteMessage(messageId).catch(err => console.error('Failed to delete:', err));
    set(s => ({
      messages: s.messages.filter(m => m.id !== messageId),
      pinnedMessages: s.pinnedMessages.filter(m => m.id !== messageId),
    }));
  },

  clearChat: (_campaignId) => {
    set({ messages: [], pinnedMessages: [] });
  },

  editMessage: (messageId, newContent) => {
    api.editMessage(messageId, newContent).catch(err => console.error('Failed to edit:', err));
    set(s => ({
      messages: s.messages.map(m => m.id === messageId ? { ...m, content: newContent, editedAt: new Date().toISOString() } : m),
      editingMessage: null,
    }));
  },

  toggleReaction: (messageId, emoji, userId) => {
    api.toggleReaction(messageId, emoji).catch(err => console.error('Failed to toggle reaction:', err));
    set(s => ({
      messages: s.messages.map(m => {
        if (m.id !== messageId) return m;
        const reactions = [...(m.reactions || [])];
        const idx = reactions.findIndex(r => r.emoji === emoji);
        if (idx >= 0) {
          const r = reactions[idx];
          if (r.userIds.includes(userId)) {
            r.userIds = r.userIds.filter(id => id !== userId);
            if (r.userIds.length === 0) reactions.splice(idx, 1);
          } else {
            r.userIds = [...r.userIds, userId];
          }
        } else {
          reactions.push({ emoji, userIds: [userId] });
        }
        return { ...m, reactions };
      }),
    }));
  },

  // Channel management
  setActiveChannel: (channel) => set({ activeChannel: channel }),
  setReplyingTo: (msg) => set({ replyingTo: msg, editingMessage: null }),
  setEditingMessage: (msg) => set({ editingMessage: msg, replyingTo: null }),

  // Search (client-side for now)
  setSearchQuery: (query) => set({ searchQuery: query }),
  performSearch: (_campaignId) => {
    const q = get().searchQuery.toLowerCase();
    if (!q.trim()) { set({ searchResults: [] }); return; }
    const results = get().messages.filter(m =>
      m.content.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q) ||
      (m.characterName || '').toLowerCase().includes(q)
    );
    set({ searchResults: results });
  },
  toggleSearch: () => set(s => ({ isSearchOpen: !s.isSearchOpen, searchResults: [], searchQuery: '' })),
  togglePinnedPanel: () => set(s => ({ showPinnedPanel: !s.showPinnedPanel })),

  // ============================================================
  // Session management — API-backed
  // ============================================================
  loadSession: (campaignId) => {
    api.getSessions(campaignId).then(sessions => {
      const active = (sessions || []).find((s: any) => s.status === 'LIVE' || s.status === 'PAUSED');
      set({ session: active || null });
    }).catch(err => console.error('Failed to load session:', err));
  },

  startSession: (campaignId, _dmId, sessionNumber) => {
    api.createSession(campaignId, { sessionNumber }).then(session => {
      set({ session });
    }).catch(err => console.error('Failed to start session:', err));
  },

  goLive: () => {
    const s = get().session;
    if (!s) return;
    api.updateSession(s.id, { status: 'LIVE' }).then(updated => {
      set({ session: updated });
    }).catch(err => console.error('Failed to go live:', err));
  },

  pauseSession: () => {
    const s = get().session;
    if (!s) return;
    api.updateSession(s.id, { status: 'PAUSED' }).then(updated => {
      set({ session: updated });
    }).catch(err => console.error('Failed to pause:', err));
  },

  endSession: () => {
    const s = get().session;
    if (!s) return;
    api.updateSession(s.id, { status: 'ENDED' }).then(updated => {
      set({ session: updated });
    }).catch(err => console.error('Failed to end session:', err));
  },

  addInitiative: (name, initiative, isNPC, hp, ac, characterId) => {
    const s = get().session;
    if (!s) return;
    api.addInitiative(s.id, { name, initiative, isNPC, hp, armorClass: ac, characterId }).then(() => {
      // Reload session to get updated initiative
      api.getSession(s.id).then(updated => {
        if (updated) set({ session: updated });
      });
    }).catch(err => console.error('Failed to add initiative:', err));
  },

  removeInitiative: (entryId) => {
    const s = get().session;
    if (!s) return;
    api.deleteInitiativeEntry(s.id, entryId).then(() => {
      api.getSession(s.id).then(updated => {
        if (updated) set({ session: updated });
      });
    }).catch(err => console.error('Failed to remove initiative:', err));
  },

  nextTurn: () => {
    const s = get().session;
    if (!s) return;
    api.nextTurn(s.id).then(updated => {
      set({ session: updated });
    }).catch(err => console.error('Failed to advance turn:', err));
  },

  updateInitiativeHP: (entryId, hp) => {
    const s = get().session;
    if (!s) return;
    api.updateInitiativeEntry(s.id, entryId, { hp }).then(() => {
      api.getSession(s.id).then(updated => {
        if (updated) set({ session: updated });
      });
    }).catch(err => console.error('Failed to update HP:', err));
  },

  addConditionToEntry: (entryId, condition) => {
    const s = get().session;
    if (!s) return;
    // Get current conditions then add
    const entry = (s.initiative || []).find((e: any) => e.id === entryId);
    if (!entry) return;
    const conditions = [...(entry.conditions || [])];
    if (!conditions.includes(condition)) {
      conditions.push(condition);
      api.updateInitiativeEntry(s.id, entryId, { conditions }).then(() => {
        api.getSession(s.id).then(updated => {
          if (updated) set({ session: updated });
        });
      }).catch(err => console.error('Failed to add condition:', err));
    }
  },

  removeConditionFromEntry: (entryId, condition) => {
    const s = get().session;
    if (!s) return;
    const entry = (s.initiative || []).find((e: any) => e.id === entryId);
    if (!entry) return;
    const conditions = (entry.conditions || []).filter((c: string) => c !== condition);
    api.updateInitiativeEntry(s.id, entryId, { conditions }).then(() => {
      api.getSession(s.id).then(updated => {
        if (updated) set({ session: updated });
      });
    }).catch(err => console.error('Failed to remove condition:', err));
  },

  setConcentration: (entryId, spellName) => {
    const s = get().session;
    if (!s) return;
    const entry = (s.initiative || []).find((e: any) => e.id === entryId);
    if (!entry) return;
    let conditions = [...(entry.conditions || [])];
    if (spellName) {
      if (!conditions.includes('Concentrating')) conditions.push('Concentrating');
    } else {
      conditions = conditions.filter(c => c !== 'Concentrating');
    }
    api.updateInitiativeEntry(s.id, entryId, { conditions, concentratingOn: spellName }).then(() => {
      api.getSession(s.id).then(updated => {
        if (updated) set({ session: updated });
      });
    }).catch(err => console.error('Failed to set concentration:', err));
  },

  // Scene management (in-memory for now)
  loadScene: (_sceneId) => {
    // Scenes are optional — keep in-memory for now
    set({ activeScene: null });
  },
  clearScene: () => set({ activeScene: null }),

  // Turn timer (in-memory)
  setTurnTimer: (enabled, seconds) => set({ turnTimerEnabled: enabled, turnTimerSeconds: seconds, turnTimerRemaining: seconds }),
  tickTimer: () => set(s => (!s.turnTimerEnabled || s.turnTimerRemaining <= 0) ? s : { turnTimerRemaining: s.turnTimerRemaining - 1 }),
  resetTimer: () => set(s => ({ turnTimerRemaining: s.turnTimerSeconds })),

  // ============================================================
  // Voice (simulated — no real WebRTC)
  // ============================================================
  joinVoice: (userId, displayName, characterName, role = 'player') => {
    const { activeVoiceRoom } = get();
    set(s => {
      if (s.voiceParticipants.some(p => p.userId === userId)) return s;
      const participant: VoiceParticipant = {
        userId, displayName, characterName,
        status: 'connected', isSpeaking: false,
        isMuted: activeVoiceRoom === 'afk', isDeafened: false,
        volume: 100, isSelfMuted: activeVoiceRoom === 'afk',
        isServerMuted: false, isServerDeafened: false,
        handRaised: false, speakingDuration: 0,
        joinedAt: new Date().toISOString(), role,
      };
      return {
        voiceParticipants: [...s.voiceParticipants, participant],
        myVoiceStatus: activeVoiceRoom === 'afk' ? 'muted' : 'connected',
        voiceConnectionQuality: 'excellent',
        voicePing: Math.floor(Math.random() * 30) + 10,
      };
    });
    get().startSpeakingSim();
  },

  leaveVoice: (userId) => {
    get().stopSpeakingSim();
    set(s => ({
      voiceParticipants: s.voiceParticipants.filter(p => p.userId !== userId),
      myVoiceStatus: 'disconnected',
      voiceConnectionQuality: 'disconnected',
      voicePing: 0,
    }));
  },

  toggleMute: (userId) => {
    set(s => {
      const p = s.voiceParticipants.find(p => p.userId === userId);
      if (!p) return s;
      const newMuted = !p.isSelfMuted;
      return {
        voiceParticipants: s.voiceParticipants.map(pp =>
          pp.userId === userId ? { ...pp, isSelfMuted: newMuted, isMuted: newMuted || pp.isServerMuted, status: newMuted ? 'muted' : (pp.isDeafened ? 'deafened' : 'connected'), isSpeaking: newMuted ? false : pp.isSpeaking } : pp
        ),
        myVoiceStatus: newMuted ? 'muted' : (p.isDeafened ? 'deafened' : 'connected'),
      };
    });
  },

  toggleDeafen: (userId) => {
    set(s => {
      const p = s.voiceParticipants.find(p => p.userId === userId);
      if (!p) return s;
      const newDeaf = !p.isDeafened;
      return {
        voiceParticipants: s.voiceParticipants.map(pp =>
          pp.userId === userId ? { ...pp, isDeafened: newDeaf, isMuted: newDeaf ? true : pp.isSelfMuted, isSelfMuted: newDeaf ? true : pp.isSelfMuted, status: newDeaf ? 'deafened' : (pp.isSelfMuted ? 'muted' : 'connected'), isSpeaking: false } : pp
        ),
        myVoiceStatus: newDeaf ? 'deafened' : (p.isSelfMuted ? 'muted' : 'connected'),
      };
    });
  },

  toggleHandRaise: (userId) => {
    set(s => ({
      voiceParticipants: s.voiceParticipants.map(p =>
        p.userId === userId ? { ...p, handRaised: !p.handRaised } : p
      ),
    }));
  },

  serverMute: (targetUserId, muted) => {
    set(s => ({
      voiceParticipants: s.voiceParticipants.map(p =>
        p.userId === targetUserId ? { ...p, isServerMuted: muted, isMuted: muted || p.isSelfMuted, isSpeaking: muted ? false : p.isSpeaking, status: muted ? 'muted' : (p.isSelfMuted ? 'muted' : 'connected') } : p
      ),
    }));
  },

  serverDeafen: (targetUserId, deafened) => {
    set(s => ({
      voiceParticipants: s.voiceParticipants.map(p =>
        p.userId === targetUserId ? { ...p, isServerDeafened: deafened, isDeafened: deafened, isMuted: deafened ? true : p.isSelfMuted, isSpeaking: false, status: deafened ? 'deafened' : (p.isSelfMuted ? 'muted' : 'connected') } : p
      ),
    }));
  },

  setUserVolume: (targetUserId, volume) => {
    set(s => ({
      voiceParticipants: s.voiceParticipants.map(p =>
        p.userId === targetUserId ? { ...p, volume: Math.max(0, Math.min(200, volume)) } : p
      ),
    }));
  },

  moveToRoom: (userId, room) => {
    set(s => ({
      voiceParticipants: s.voiceParticipants.map(p =>
        p.userId === userId ? { ...p, isMuted: room === 'afk' ? true : p.isSelfMuted, isSelfMuted: room === 'afk' ? true : p.isSelfMuted, status: room === 'afk' ? 'muted' : p.status } : p
      ),
    }));
  },

  switchVoiceRoom: (room) => set({ activeVoiceRoom: room }),
  updateVoiceSettings: (settings) => set(s => ({ voiceSettings: { ...s.voiceSettings, ...settings } })),

  startSpeakingSim: () => {
    const existing = get().speakingSimInterval;
    if (existing) clearInterval(existing);
    const interval = setInterval(() => {
      set(s => {
        if (s.voiceParticipants.length === 0) return s;
        return {
          voiceParticipants: s.voiceParticipants.map(p => {
            if (p.isMuted || p.isDeafened) return { ...p, isSpeaking: false };
            const wasSpeaking = p.isSpeaking;
            const nowSpeaking = Math.random() > (wasSpeaking ? 0.6 : 0.85);
            return { ...p, isSpeaking: nowSpeaking, speakingDuration: nowSpeaking ? p.speakingDuration + 1 : p.speakingDuration };
          }),
          voicePing: Math.floor(Math.random() * 20) + 15,
        };
      });
    }, 1500);
    set({ speakingSimInterval: interval });
  },

  stopSpeakingSim: () => {
    const interval = get().speakingSimInterval;
    if (interval) clearInterval(interval);
    set({ speakingSimInterval: null });
  },

  disconnectAll: () => {
    get().stopSpeakingSim();
    set({ voiceParticipants: [], myVoiceStatus: 'disconnected', voiceConnectionQuality: 'disconnected', voicePing: 0 });
  },

  // UI state
  setChatMode: (mode) => set({ chatMode: mode }),
  setWhisperTarget: (target) => set({ whisperTarget: target }),
  setShowDicePanel: (show) => set({ showDicePanel: show }),
  setNarrationMode: (on) => set({ isNarrationMode: on }),
}));
