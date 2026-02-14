'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Phone,
  Volume2, Users, Settings, Hand, Shield,
  Crown, X, Lock,
  Activity, VolumeX, Volume1,
} from 'lucide-react';
import { useChatStore } from '@/lib/chatStore';
import { useSession } from 'next-auth/react';
import { VoiceParticipant, VoiceRoomType, VOICE_ROOMS, VoiceSettings, DEFAULT_VOICE_SETTINGS } from '@/lib/types';

// ============================================================
// Connection Quality Indicator
// ============================================================
function ConnectionBadge({ quality, ping }: { quality: string; ping: number }) {
  const config = {
    excellent: { color: 'text-success', bars: 4, label: 'Excellent' },
    good: { color: 'text-success', bars: 3, label: 'Good' },
    poor: { color: 'text-warning', bars: 2, label: 'Poor' },
    disconnected: { color: 'text-danger', bars: 0, label: 'Disconnected' },
  }[quality] || { color: 'text-text-tertiary', bars: 0, label: 'Unknown' };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-end gap-px h-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`w-[3px] rounded-sm transition-colors ${
            i <= config.bars ? config.color.replace('text-', 'bg-') : 'bg-surface-3/50'
          }`} style={{ height: `${i * 3 + 2}px` }} />
        ))}
      </div>
      {ping > 0 && <span className="text-[9px] font-mono text-text-tertiary">{ping}ms</span>}
    </div>
  );
}

// ============================================================
// Voice Participant Card — Discord-level
// ============================================================
function ParticipantCard({ p, isMe, isDM, onServerMute, onServerDeafen, onSetVolume }: {
  p: VoiceParticipant; isMe: boolean; isDM: boolean;
  onServerMute?: (id: string, muted: boolean) => void;
  onServerDeafen?: (id: string, deafened: boolean) => void;
  onSetVolume?: (id: string, vol: number) => void;
}) {
  const [showControls, setShowControls] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
      className="relative group"
      onMouseEnter={() => setShowControls(true)} onMouseLeave={() => { setShowControls(false); setShowVolumeSlider(false); }}>
      <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${
        p.isSpeaking ? 'bg-success/5 ring-1 ring-success/30' : 'hover:bg-surface-2/40'
      }`}>
        {/* Avatar with speaking ring */}
        <div className="relative shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
            p.isSpeaking ? 'bg-success/20 text-success ring-2 ring-success/50 shadow-md shadow-success/10' :
            p.isMuted ? 'bg-surface-3/60 text-text-tertiary' :
            'bg-accent/15 text-accent'
          }`}>
            {(p.characterName || p.displayName).charAt(0).toUpperCase()}
          </div>
          {/* Speaking pulse */}
          {p.isSpeaking && (
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute inset-0 rounded-full ring-2 ring-success/30" />
          )}
          {/* Hand raised indicator */}
          {p.handRaised && (
            <span className="absolute -top-1 -right-1 text-[10px]">✋</span>
          )}
          {/* Role badge */}
          {p.role === 'dm' && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center">
              <Crown className="w-2 h-2 text-surface-0" />
            </span>
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`text-[11px] font-semibold truncate ${
              p.isMuted ? 'text-text-tertiary' : 'text-text-primary'
            }`}>
              {p.characterName || p.displayName}
              {isMe && <span className="text-accent ml-1 text-[9px]">(you)</span>}
            </p>
          </div>
          {p.characterName && (
            <p className="text-[9px] text-text-tertiary/60 truncate">{p.displayName}</p>
          )}
        </div>

        {/* Status icons */}
        <div className="flex items-center gap-0.5">
          {p.isServerMuted && <Shield className="w-2.5 h-2.5 text-danger/50" />}
          {p.isMuted && <MicOff className="w-2.5 h-2.5 text-danger/50" />}
          {p.isDeafened && <HeadphoneOff className="w-2.5 h-2.5 text-danger/50" />}
          {/* Volume indicator when not 100 */}
          {p.volume !== 100 && !isMe && (
            <span className="text-[8px] font-mono text-text-tertiary/40">{p.volume}%</span>
          )}
        </div>
      </div>

      {/* DM context controls (on hover, for other users) */}
      <AnimatePresence>
        {showControls && !isMe && (isDM || !isMe) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="flex items-center gap-1 px-2.5 pb-1.5">
              {/* Volume slider */}
              <div className="flex items-center gap-1.5 flex-1">
                <button onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className="p-0.5 rounded text-text-tertiary hover:text-text-secondary cursor-pointer">
                  {p.volume === 0 ? <VolumeX className="w-2.5 h-2.5" /> :
                   p.volume < 50 ? <Volume1 className="w-2.5 h-2.5" /> :
                   <Volume2 className="w-2.5 h-2.5" />}
                </button>
                {showVolumeSlider && (
                  <input type="range" min="0" max="200" value={p.volume}
                    onChange={e => onSetVolume?.(p.userId, parseInt(e.target.value))}
                    className="flex-1 h-1 accent-accent cursor-pointer" />
                )}
                {showVolumeSlider && (
                  <span className="text-[8px] font-mono text-text-tertiary w-6 text-right">{p.volume}%</span>
                )}
              </div>
              {/* DM-only controls */}
              {isDM && (
                <>
                  <button onClick={() => onServerMute?.(p.userId, !p.isServerMuted)}
                    className={`p-1 rounded cursor-pointer transition-colors ${p.isServerMuted ? 'bg-danger/15 text-danger' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2/50'}`}
                    title={p.isServerMuted ? 'Server Unmute' : 'Server Mute'}>
                    {p.isServerMuted ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
                  </button>
                  <button onClick={() => onServerDeafen?.(p.userId, !p.isServerDeafened)}
                    className={`p-1 rounded cursor-pointer transition-colors ${p.isServerDeafened ? 'bg-danger/15 text-danger' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2/50'}`}
                    title={p.isServerDeafened ? 'Server Undeafen' : 'Server Deafen'}>
                    {p.isServerDeafened ? <HeadphoneOff className="w-2.5 h-2.5" /> : <Headphones className="w-2.5 h-2.5" />}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Voice Settings Panel
// ============================================================
function VoiceSettingsPanel({ settings, onUpdate, onClose }: {
  settings: VoiceSettings;
  onUpdate: (s: Partial<VoiceSettings>) => void;
  onClose: () => void;
}) {
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="border-t border-border/30 bg-surface-2/20 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Voice Settings</span>
          <button onClick={onClose} className="p-0.5 hover:bg-surface-3 rounded text-text-tertiary cursor-pointer"><X className="w-3 h-3" /></button>
        </div>

        {/* Input Volume */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-text-secondary">Input Volume</label>
            <span className="text-[9px] font-mono text-text-tertiary">{settings.inputVolume}%</span>
          </div>
          <input type="range" min="0" max="200" value={settings.inputVolume}
            onChange={e => onUpdate({ inputVolume: parseInt(e.target.value) })}
            className="w-full h-1 accent-accent cursor-pointer" />
        </div>

        {/* Output Volume */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-text-secondary">Output Volume</label>
            <span className="text-[9px] font-mono text-text-tertiary">{settings.outputVolume}%</span>
          </div>
          <input type="range" min="0" max="200" value={settings.outputVolume}
            onChange={e => onUpdate({ outputVolume: parseInt(e.target.value) })}
            className="w-full h-1 accent-accent cursor-pointer" />
        </div>

        {/* Voice Activity Threshold */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-text-secondary">Voice Activity Threshold</label>
            <span className="text-[9px] font-mono text-text-tertiary">{settings.voiceActivityThreshold}%</span>
          </div>
          <input type="range" min="0" max="100" value={settings.voiceActivityThreshold}
            onChange={e => onUpdate({ voiceActivityThreshold: parseInt(e.target.value) })}
            className="w-full h-1 accent-accent cursor-pointer" />
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          {([
            { key: 'noiseSuppression' as const, label: 'Noise Suppression' },
            { key: 'echoCancellation' as const, label: 'Echo Cancellation' },
            { key: 'autoGainControl' as const, label: 'Auto Gain Control' },
            { key: 'pushToTalk' as const, label: 'Push to Talk' },
          ] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <label className="text-[10px] text-text-secondary">{item.label}</label>
              <button
                onClick={() => onUpdate({ [item.key]: !settings[item.key] })}
                className={`w-8 h-4 rounded-full transition-colors cursor-pointer flex items-center ${
                  settings[item.key] ? 'bg-accent justify-end' : 'bg-surface-3 justify-start'
                }`}>
                <motion.div layout className="w-3 h-3 rounded-full bg-white mx-0.5 shadow-sm" />
              </button>
            </div>
          ))}
        </div>

        {/* Push to Talk Key */}
        {settings.pushToTalk && (
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-text-secondary">PTT Key</label>
            <span className="text-[9px] font-mono bg-surface-3 px-2 py-0.5 rounded text-text-tertiary">{settings.pushToTalkKey}</span>
          </div>
        )}

        {/* Reset */}
        <button onClick={() => onUpdate(DEFAULT_VOICE_SETTINGS)}
          className="w-full text-center text-[9px] text-text-tertiary hover:text-danger py-1 cursor-pointer transition-colors">
          Reset to Defaults
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Voice Room Sidebar
// ============================================================
function VoiceRoomList({ activeRoom, onSelect, participantCounts }: {
  activeRoom: VoiceRoomType;
  onSelect: (room: VoiceRoomType) => void;
  participantCounts: Record<string, number>;
}) {
  return (
    <div className="space-y-0.5 p-1.5">
      {VOICE_ROOMS.map(room => {
        const count = participantCounts[room.id] || 0;
        return (
          <button key={room.id} onClick={() => onSelect(room.id)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
              activeRoom === room.id ? 'bg-accent/10 text-accent' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2/40'
            }`}>
            <span className="text-sm">{room.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold truncate">{room.name}</span>
                {room.locked && <Lock className="w-2 h-2 text-text-tertiary/40" />}
              </div>
              <p className="text-[8px] text-text-tertiary/50 truncate">{room.description}</p>
            </div>
            {count > 0 && (
              <div className="flex items-center gap-0.5">
                <Users className="w-2.5 h-2.5 text-text-tertiary/40" />
                <span className="text-[8px] font-mono text-text-tertiary/50">{count}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Voice Panel (Main) — Discord-level
// ============================================================
interface VoicePanelProps {
  campaignId: string;
  isDM?: boolean;
  characterName?: string;
  className?: string;
}

export default function VoicePanel({ isDM = false, characterName, className = '' }: VoicePanelProps) {
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const {
    voiceParticipants, myVoiceStatus, activeVoiceRoom, voiceSettings,
    voiceConnectionQuality, voicePing,
    joinVoice, leaveVoice, toggleMute, toggleDeafen, toggleHandRaise,
    serverMute, serverDeafen, setUserVolume, switchVoiceRoom,
    updateVoiceSettings,
  } = useChatStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showRooms, setShowRooms] = useState(true);

  // Cleanup speaking sim on unmount
  useEffect(() => {
    return () => {
      const { stopSpeakingSim } = useChatStore.getState();
      stopSpeakingSim();
    };
  }, []);

  // Participant counts per room (simulated: all in activeVoiceRoom)
  const participantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts[activeVoiceRoom] = voiceParticipants.length;
    return counts;
  }, [voiceParticipants, activeVoiceRoom]);

  // Speaking stats
  const meParticipant = voiceParticipants.find(p => p.userId === user?.id);
  const totalSpeakingTime = useMemo(() =>
    meParticipant?.speakingDuration || 0
  , [meParticipant]);

  if (!user) return null;

  const isConnected = myVoiceStatus !== 'disconnected';
  const isMuted = myVoiceStatus === 'muted' || myVoiceStatus === 'deafened';
  const isDeafened = myVoiceStatus === 'deafened';
  const activeRoomInfo = VOICE_ROOMS.find(r => r.id === activeVoiceRoom);

  const formatDuration = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className={`flex flex-col bg-surface-1 border border-border/50 rounded-xl overflow-hidden h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-surface-2/30 shrink-0">
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-bold text-text-primary">Voice</span>
          {isConnected && (
            <div className="flex items-center gap-1.5">
              <ConnectionBadge quality={voiceConnectionQuality} ping={voicePing} />
              <span className="text-[9px] text-success font-medium">Connected</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setShowRooms(!showRooms)}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${showRooms ? 'bg-accent/15 text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
            title="Voice Rooms">
            <Users className="w-3 h-3" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${showSettings ? 'bg-accent/15 text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
            title="Voice Settings">
            <Settings className="w-3 h-3" />
          </button>
          <span className="text-[9px] text-text-tertiary/50 ml-1 flex items-center gap-0.5">
            <Users className="w-2.5 h-2.5" /> {voiceParticipants.length}
          </span>
        </div>
      </div>

      {/* Room Selection */}
      <AnimatePresence>
        {showRooms && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border/20">
            <VoiceRoomList activeRoom={activeVoiceRoom} onSelect={switchVoiceRoom} participantCounts={participantCounts} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Room Header */}
      <div className="px-3 py-2 border-b border-border/20 bg-surface-2/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{activeRoomInfo?.icon}</span>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-text-primary">{activeRoomInfo?.name}</span>
            {activeRoomInfo?.maxParticipants && (
              <span className="text-[8px] text-text-tertiary/40 ml-1.5">
                {voiceParticipants.length}/{activeRoomInfo.maxParticipants}
              </span>
            )}
          </div>
          {activeRoomInfo?.locked && <Lock className="w-3 h-3 text-text-tertiary/30" />}
        </div>
      </div>

      {/* Participants list */}
      <div className="flex-1 overflow-y-auto p-1 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {voiceParticipants.length === 0 && !isConnected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-surface-2/30 border border-border/20 flex items-center justify-center mb-3 mx-auto">
                <Volume2 className="w-6 h-6 text-text-tertiary/15" />
              </div>
              <p className="text-[10px] text-text-tertiary/40 font-semibold">No one is connected</p>
              <p className="text-[9px] text-text-tertiary/25 mt-1">Join to start the voice session</p>
            </motion.div>
          )}
          {voiceParticipants.map(p => (
            <ParticipantCard
              key={p.userId} p={p} isMe={p.userId === user.id} isDM={isDM}
              onServerMute={serverMute} onServerDeafen={serverDeafen}
              onSetVolume={setUserVolume}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && isConnected && (
          <VoiceSettingsPanel settings={voiceSettings} onUpdate={updateVoiceSettings} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* Stats bar (when connected) */}
      {isConnected && (
        <div className="px-3 py-1 border-t border-border/20 bg-surface-2/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[8px] text-text-tertiary/40">
              <Activity className="w-2.5 h-2.5 inline mr-0.5" />Speaking: {formatDuration(totalSpeakingTime)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {meParticipant?.handRaised && <span className="text-[9px] text-warning">✋ Hand raised</span>}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="border-t border-border/30 p-2 shrink-0">
        {isConnected ? (
          <div className="space-y-1.5">
            {/* User info bar */}
            <div className="flex items-center gap-2 px-2 py-1 bg-surface-2/30 rounded-lg">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                isMuted ? 'bg-surface-3/60 text-text-tertiary' : 'bg-accent/20 text-accent'
              }`}>
                {(characterName || user.displayName).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-text-primary truncate">{characterName || user.displayName}</p>
                <p className="text-[8px] text-text-tertiary/50">
                  {isDeafened ? 'Deafened' : isMuted ? 'Muted' : 'Voice Connected'}
                </p>
              </div>
              <ConnectionBadge quality={voiceConnectionQuality} ping={voicePing} />
            </div>

            {/* Control buttons */}
            <div className="flex items-center gap-1">
              <button onClick={() => toggleMute(user.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  isMuted ? 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/15' : 'bg-surface-2/60 text-text-secondary border border-border/30 hover:border-accent/30'
                }`}>
                {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={() => toggleDeafen(user.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  isDeafened ? 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/15' : 'bg-surface-2/60 text-text-secondary border border-border/30 hover:border-accent/30'
                }`}>
                {isDeafened ? <HeadphoneOff className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
                {isDeafened ? 'Undeafen' : 'Deafen'}
              </button>
              <button onClick={() => toggleHandRaise(user.id)}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${
                  meParticipant?.handRaised ? 'bg-warning/10 text-warning border-warning/20' : 'bg-surface-2/60 text-text-tertiary border-border/30 hover:text-text-secondary'
                }`} title={meParticipant?.handRaised ? 'Lower Hand' : 'Raise Hand'}>
                <Hand className="w-3 h-3" />
              </button>
              <button onClick={() => leaveVoice(user.id)}
                className="p-2 rounded-xl bg-danger/10 text-danger border border-danger/20 hover:bg-danger/15 transition-all cursor-pointer" title="Disconnect">
                <PhoneOff className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => joinVoice(user.id, user.displayName, characterName, isDM ? 'dm' : 'player')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold bg-success/10 text-success border border-success/20 hover:bg-success/15 transition-all cursor-pointer shadow-sm">
            <Phone className="w-3.5 h-3.5" />
            Join {activeRoomInfo?.name || 'Voice Channel'}
          </button>
        )}
      </div>
    </div>
  );
}
