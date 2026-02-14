'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Pause, Square, Users, Swords, Volume2,
  MessageSquare, Crown, Shield, Heart, Sparkles, Radio,
  ChevronRight, Clock, Eye, Zap, BookOpen
} from 'lucide-react';
import { Button, Badge, Card } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useChatStore } from '@/lib/chatStore';
import ChatPanel from '@/components/ChatPanel';
import VoicePanel from '@/components/VoicePanel';
import InitiativeTracker from '@/components/InitiativeTracker';
import * as api from '@/lib/api-client';
import { Campaign, Character, getAbilityModifier, formatModifier } from '@/lib/types';

type SidePanel = 'initiative' | 'voice' | 'party';

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const {
    session, loadSession, startSession, goLive, pauseSession, endSession,
    loadMessages, sendSystem,
  } = useChatStore();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [sidePanel, setSidePanel] = useState<SidePanel>('initiative');
  const [showSidePanel, setShowSidePanel] = useState(false);

  const isDM = campaign?.dmId === user?.id;

  // My character in this campaign
  const myCharacter = useMemo(() => {
    return characters.find(c => c.playerId === user?.id);
  }, [characters, user]);

  // Players list for whisper targets
  const playersList = useMemo(() => {
    if (!campaign || !user) return [];
    const list: { id: string; name: string }[] = [];
    // DM
    if (campaign.dmId !== user.id) {
      list.push({ id: campaign.dmId, name: campaign.dmName });
    }
    // Players with characters
    characters.forEach(c => {
      if (c.playerId !== user.id) {
        list.push({ id: c.playerId, name: c.name });
      }
    });
    return list;
  }, [campaign, characters, user]);

  // Load campaign data
  useEffect(() => {
    api.getCampaign(id).then(c => {
      if (!c) { router.replace('/dashboard'); return; }
      setCampaign(c);
    }).catch(() => router.replace('/dashboard'));
    api.getCharactersByCampaign(id).then(chars => setCharacters(chars || [])).catch(() => {});
    loadSession(id);
    loadMessages(id);
  }, [id, router, loadSession, loadMessages]);

  // Start a new session if none exists
  const handleStartSession = () => {
    if (!campaign || !user) return;
    const sessionNumber = campaign.sessionCount + 1;
    startSession(id, user.id, sessionNumber);
    sendSystem(id, `Session #${sessionNumber} lobby created by ${user.displayName}`);
  };

  const handleGoLive = () => {
    goLive();
    sendSystem(id, '⚔️ The session is now LIVE! Adventure awaits...');
  };

  const handlePause = () => {
    pauseSession();
    sendSystem(id, '⏸ Session paused.');
  };

  const handleEnd = () => {
    endSession();
    sendSystem(id, '🏁 Session has ended. Great adventure!');
  };

  if (!campaign || !user) return null;

  const status = session?.status || null;

  return (
    <div className="h-screen flex flex-col">
      {/* Session Header Bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-surface-1 border-b border-border shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={() => router.push(`/campaign/${id}`)}
            className="text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <h1 className="text-xs md:text-sm font-display font-bold truncate">{campaign.name}</h1>
              {session && (
                <Badge variant={
                  status === 'live' ? 'success' :
                  status === 'paused' ? 'warning' :
                  status === 'lobby' ? 'accent' : 'default'
                }>
                  {status === 'live' && <><Radio className="w-2.5 h-2.5 animate-pulse" /> Live</>}
                  {status === 'lobby' && 'Lobby'}
                  {status === 'paused' && 'Paused'}
                  {status === 'ended' && 'Ended'}
                </Badge>
              )}
              <Badge variant={isDM ? 'accent' : 'default'}>
                {isDM ? <><Crown className="w-2.5 h-2.5" /> DM</> : 'Player'}
              </Badge>
            </div>
            <p className="text-[10px] text-text-tertiary truncate">
              {session ? `Session #${session.sessionNumber}` : 'No active session'}
              {myCharacter && ` · Playing as ${myCharacter.name}`}
            </p>
          </div>
        </div>

        {/* Session controls (DM) */}
        <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
          {isDM && !session && (
            <Button size="sm" onClick={handleStartSession}>
              <Sparkles className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New Session</span>
            </Button>
          )}
          {isDM && status === 'lobby' && (
            <Button size="sm" onClick={handleGoLive}>
              <Play className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Go Live</span>
            </Button>
          )}
          {isDM && status === 'live' && (
            <>
              <Button size="sm" variant="secondary" onClick={handlePause}>
                <Pause className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Pause</span>
              </Button>
              <Button size="sm" variant="danger" onClick={handleEnd}>
                <Square className="w-3.5 h-3.5" /> <span className="hidden sm:inline">End</span>
              </Button>
            </>
          )}
          {isDM && status === 'paused' && (
            <>
              <Button size="sm" onClick={handleGoLive}>
                <Play className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Resume</span>
              </Button>
              <Button size="sm" variant="danger" onClick={handleEnd}>
                <Square className="w-3.5 h-3.5" /> <span className="hidden sm:inline">End</span>
              </Button>
            </>
          )}
          {isDM && status === 'ended' && (
            <Button size="sm" onClick={handleStartSession}>
              <Sparkles className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New Session</span>
            </Button>
          )}
          {/* Mobile side panel toggle */}
          <button
            onClick={() => setShowSidePanel(!showSidePanel)}
            className="md:hidden p-2 text-text-tertiary hover:text-text-secondary rounded-md hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Swords className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main session layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat (main area) */}
        <div className="flex-1 flex flex-col p-2 md:p-3 min-w-0">
          <ChatPanel
            campaignId={id}
            isDM={isDM}
            players={playersList}
            characterName={myCharacter?.name}
            className="flex-1"
            height="flex-1"
          />
        </div>

        {/* Mobile backdrop */}
        {showSidePanel && (
          <div
            className="absolute inset-0 bg-black/40 z-10 md:hidden"
            onClick={() => setShowSidePanel(false)}
          />
        )}

        {/* Right sidebar — desktop: always visible, mobile: overlay */}
        <div className={`
          absolute md:relative right-0 top-0 h-full
          w-72 border-l border-border bg-surface-0 flex flex-col shrink-0 z-20
          transition-transform duration-200
          ${showSidePanel ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          {/* Side panel tabs */}
          <div className="flex border-b border-border">
            {([
              { key: 'initiative', icon: <Swords className="w-3.5 h-3.5" />, label: 'Initiative' },
              { key: 'voice', icon: <Volume2 className="w-3.5 h-3.5" />, label: 'Voice' },
              { key: 'party', icon: <Users className="w-3.5 h-3.5" />, label: 'Party' },
            ] as { key: SidePanel; icon: React.ReactNode; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setSidePanel(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium transition-colors cursor-pointer border-b-2 ${
                  sidePanel === t.key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Side panel content */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            <AnimatePresence mode="wait">
              {sidePanel === 'initiative' && (
                <motion.div key="init" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <InitiativeTracker isDM={isDM} campaignId={id} />
                </motion.div>
              )}
              {sidePanel === 'voice' && (
                <motion.div key="voice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <VoicePanel campaignId={id} isDM={isDM} characterName={myCharacter?.name} />
                </motion.div>
              )}
              {sidePanel === 'party' && (
                <motion.div key="party" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <PartyPanel characters={characters} isDM={isDM} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Party Quick View
// ============================================================
function PartyPanel({ characters, isDM }: { characters: Character[]; isDM: boolean }) {
  if (characters.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-6 h-6 text-text-tertiary/20 mx-auto mb-1.5" />
        <p className="text-[10px] text-text-tertiary">No characters in party</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {characters.map(char => {
        const hpPercent = (char.hp.current / char.hp.max) * 100;
        return (
          <div key={char.id} className="bg-surface-1 border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-text-primary">{char.name}</p>
                <p className="text-[10px] text-text-tertiary">{char.race} {char.class} · Lv {char.level}</p>
              </div>
              <Badge variant={hpPercent > 50 ? 'success' : hpPercent > 25 ? 'warning' : 'danger'}>
                AC {char.armorClass}
              </Badge>
            </div>
            {/* HP bar */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-text-tertiary flex items-center gap-0.5">
                  <Heart className="w-2.5 h-2.5" /> HP
                </span>
                <span className="font-mono text-text-secondary">{char.hp.current}/{char.hp.max}</span>
              </div>
              <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    hpPercent > 50 ? 'bg-success' : hpPercent > 25 ? 'bg-warning' : 'bg-danger'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
                />
              </div>
            </div>
            {/* Quick stats */}
            <div className="grid grid-cols-6 gap-0.5">
              {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(ab => (
                <div key={ab} className="flex flex-col items-center">
                  <span className="text-[8px] text-text-tertiary uppercase">{ab.slice(0, 3)}</span>
                  <span className="text-[10px] font-bold text-text-secondary">
                    {formatModifier(getAbilityModifier(char.abilityScores[ab]))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
