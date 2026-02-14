'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Swords, Heart, Shield, Skull, Zap, Sparkles,
  MessageSquare, Dice1, Users, BookOpen, Map,
  SkipForward, Timer, Send, Scroll,
} from 'lucide-react';
import { useChatStore } from '@/lib/chatStore';
import { useSession } from 'next-auth/react';
import * as api from '@/lib/api-client';
import { Character, InitiativeEntry, CONDITION_EFFECTS } from '@/lib/types';
import { Card, Button } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

// ============================================================
// Player View — Focused view for players during live sessions
// Shows: Initiative order, own character sheet, chat, shared map
// Hides: NPC HP, DM notes, monster stats, hidden tokens
// ============================================================

// ------------------------------------------------------------
// Initiative Row (player-safe — hides NPC HP)
// ------------------------------------------------------------
function PlayerInitiativeRow({ entry }: { entry: InitiativeEntry }) {
  const { t } = useTranslation();
  const isDown = entry.hp && entry.hp.current <= 0;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      entry.isActive
        ? 'bg-accent/10 border border-accent/30'
        : isDown ? 'bg-danger/5 border border-danger/15 opacity-50' : 'bg-surface-2/40'
    }`}>
      <div className={`w-1.5 h-7 rounded-full shrink-0 ${entry.isActive ? 'bg-accent' : 'bg-transparent'}`} />
      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold shrink-0 ${
        entry.isActive ? 'bg-accent/20 text-accent' : 'bg-surface-3 text-text-tertiary'
      }`}>
        {entry.initiative}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium truncate ${
            entry.isActive ? 'text-accent' : isDown ? 'text-danger line-through' : 'text-text-primary'
          }`}>{entry.name}</span>
          {entry.isNPC && <span className="text-[9px] bg-surface-3 text-text-tertiary px-1 py-0.5 rounded">NPC</span>}
          {isDown && <Skull className="w-3 h-3 text-danger" />}
          {entry.concentratingOn && (
            <span className="text-[9px] bg-info/15 text-info px-1 py-0.5 rounded flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />{entry.concentratingOn}
            </span>
          )}
        </div>
        {entry.conditions && entry.conditions.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {entry.conditions.map(c => (
              <span key={c} className="text-[9px] bg-warning/10 text-warning px-1 py-0.5 rounded" title={CONDITION_EFFECTS[c]}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Only show HP for non-NPC or own characters */}
      {entry.hp && !entry.isNPC && (
        <span className={`text-xs font-mono flex items-center gap-0.5 ${
          entry.hp.current <= entry.hp.max / 4 ? 'text-danger' :
          entry.hp.current <= entry.hp.max / 2 ? 'text-warning' : 'text-text-tertiary'
        }`}>
          <Heart className="w-3 h-3" />{entry.hp.current}/{entry.hp.max}
        </span>
      )}
      {entry.hp && entry.isNPC && (
        <span className="text-xs text-text-tertiary font-mono flex items-center gap-0.5">
          <Heart className="w-3 h-3" />
          {isDown ? t.playerView.down : entry.hp.current <= entry.hp.max / 2 ? t.playerView.bloodied : t.playerView.healthy}
        </span>
      )}
      {entry.armorClass && !entry.isNPC && (
        <span className="text-xs text-text-tertiary font-mono flex items-center gap-0.5">
          <Shield className="w-3 h-3" />{entry.armorClass}
        </span>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Quick Dice Roller (Player)
// ------------------------------------------------------------
function PlayerDiceRoller() {
  const { t } = useTranslation();
  const [formula, setFormula] = useState('');
  const [lastResult, setLastResult] = useState<{ formula: string; total: number; rolls: number[] } | null>(null);

  const quickRoll = (f: string) => {
    const result = api.rollDiceLocal(f);
    setLastResult({ formula: f, total: result.total, rolls: result.rolls });
    window.dispatchEvent(new CustomEvent('taverna:dice-roll', {
      detail: { formula: f, rolls: result.rolls, total: result.total, modifier: result.modifier, source: 'player-view' }
    }));
  };

  return (
    <Card>
      <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <Dice1 className="w-3.5 h-3.5" /> {t.playerView.quickDice}
      </h3>
      <div className="grid grid-cols-4 gap-1 mb-2">
        {['1d20', '1d12', '1d10', '1d8', '1d6', '1d4', '2d6', '1d100'].map(d => (
          <button key={d} onClick={() => quickRoll(d)}
            className="py-1.5 bg-surface-2 hover:bg-accent/10 hover:text-accent text-text-secondary text-xs font-mono rounded transition-colors cursor-pointer">
            {d}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="Custom (e.g. 2d8+3)"
          value={formula}
          onChange={e => setFormula(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && formula.trim()) quickRoll(formula.trim()); }}
          className="flex-1 text-xs"
        />
        <button
          onClick={() => formula.trim() && quickRoll(formula.trim())}
          className="px-3 py-1 bg-accent text-surface-0 rounded text-xs font-medium cursor-pointer hover:brightness-110"
        >Roll</button>
      </div>
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 bg-accent/10 border border-accent/20 rounded-lg p-2 text-center"
          >
            <span className="text-[10px] text-text-tertiary">{lastResult.formula}</span>
            <span className="text-lg font-bold text-accent mx-2">{lastResult.total}</span>
            <span className="text-[10px] text-text-tertiary font-mono">[{lastResult.rolls.join(', ')}]</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ------------------------------------------------------------
// My Character Summary
// ------------------------------------------------------------
function MyCharacterCard({ character }: { character: Character }) {
  const { t } = useTranslation();
  const mod = (score: number) => { const m = Math.floor((score - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };
  const s = character.abilityScores;
  const hpPct = character.hp.max > 0 ? (character.hp.current / character.hp.max) * 100 : 0;
  const hpColor = hpPct <= 25 ? 'bg-danger' : hpPct <= 50 ? 'bg-warning' : 'bg-success';

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary">{character.name}</h3>
          <p className="text-[10px] text-text-tertiary">Level {character.level} {character.race} {character.class}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-mono text-text-tertiary">
            <Shield className="w-3.5 h-3.5" /> {character.armorClass}
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-text-tertiary flex items-center gap-1"><Heart className="w-3 h-3" /> {t.playerView.hitPoints}</span>
          <span className={`text-xs font-bold font-mono ${hpPct <= 25 ? 'text-danger' : hpPct <= 50 ? 'text-warning' : 'text-text-primary'}`}>
            {character.hp.current}/{character.hp.max}
            {(character.hp.temp || 0) > 0 && <span className="text-info ml-1">(+{character.hp.temp})</span>}
          </span>
        </div>
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <motion.div className={`h-full ${hpColor} rounded-full`} style={{ width: `${hpPct}%` }}
            animate={{ width: `${hpPct}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-6 gap-1 mb-3">
        {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(ab => (
          <div key={ab} className="bg-surface-2 rounded-lg p-1.5 text-center">
            <span className="text-[9px] text-text-tertiary uppercase block">{ab.slice(0, 3)}</span>
            <span className="text-sm font-bold text-text-primary block">{s[ab]}</span>
            <span className="text-[10px] text-accent font-mono">{mod(s[ab])}</span>
          </div>
        ))}
      </div>

      {/* Conditions & Concentration */}
      {character.concentratingOn && (
        <div className="bg-info/10 border border-info/20 rounded-lg px-2 py-1.5 mb-2 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-info animate-pulse" />
          <span className="text-[10px] text-info">Concentrating: {character.concentratingOn}</span>
        </div>
      )}
      {character.temporaryEffects && character.temporaryEffects.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {character.temporaryEffects.map(c => (
            <span key={c} className="text-[9px] bg-warning/10 text-warning px-1.5 py-0.5 rounded" title={CONDITION_EFFECTS[c]}>{c}</span>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-surface-2 rounded-lg p-2 text-center">
          <span className="text-[9px] text-text-tertiary block">Speed</span>
          <span className="text-xs font-bold text-text-primary">{character.speed} ft</span>
        </div>
        <div className="bg-surface-2 rounded-lg p-2 text-center">
          <span className="text-[9px] text-text-tertiary block">Prof</span>
          <span className="text-xs font-bold text-text-primary">+{character.proficiencyBonus}</span>
        </div>
        <div className="bg-surface-2 rounded-lg p-2 text-center">
          <span className="text-[9px] text-text-tertiary block">Initiative</span>
          <span className="text-xs font-bold text-text-primary">{mod(s.dexterity)}</span>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// Player View Page
// ============================================================
export default function PlayerViewPage() {
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const { session, turnTimerEnabled, turnTimerRemaining, turnTimerSeconds } = useChatStore();
  const [tab, setTab] = useState<'combat' | 'character' | 'notes'>('combat');
  const { t } = useTranslation();

  // Determine campaign from active session or user's first campaign
  const [activeCampaign, setActiveCampaign] = useState('');
  useEffect(() => {
    if (session?.campaignId) { setActiveCampaign(session.campaignId); return; }
    if (user) {
      api.getCampaigns().then(camps => {
        if (camps.length > 0) setActiveCampaign(camps[0].id);
      }).catch(() => {});
    }
  }, [user, session]);

  // Persist notes to localStorage scoped by campaign
  const noteKey = `taverna_player_notes_${activeCampaign || 'global'}`;
  const [myNote, setMyNote] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(noteKey) || '';
  });

  useEffect(() => {
    // Reload note when campaign changes
    setMyNote(localStorage.getItem(`taverna_player_notes_${activeCampaign || 'global'}`) || '');
  }, [activeCampaign]);

  useEffect(() => {
    localStorage.setItem(noteKey, myNote);
  }, [myNote, noteKey]);

  // Get player's character(s) — filtered by active campaign
  const [myCharacters, setMyCharacters] = useState<Character[]>([]);
  useEffect(() => {
    if (activeCampaign && user) {
      api.getCharactersByCampaign(activeCampaign).then(chars => {
        setMyCharacters((chars || []).filter((c: any) => c.playerId === user.id));
      }).catch(() => setMyCharacters([]));
    }
  }, [activeCampaign, user]);

  const entries = session?.initiative || [];
  const roundNumber = session?.currentRound || 1;
  const activeEntry = entries.find(e => e.isActive);
  const isMyTurn = activeEntry && myCharacters.some(c => activeEntry.characterId === c.id || activeEntry.name === c.name);

  // Timer display
  const timerPct = turnTimerSeconds > 0 ? (turnTimerRemaining / turnTimerSeconds) * 100 : 0;

  const tabs = [
    { id: 'combat' as const, label: t.playerView.combatTab, icon: Swords },
    { id: 'character' as const, label: t.playerView.characterTab, icon: Users },
    { id: 'notes' as const, label: t.playerView.notesTab, icon: Scroll },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* My Turn Banner */}
      <AnimatePresence>
        {isMyTurn && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-accent text-surface-0 text-center py-3 px-4 font-bold text-lg tracking-wide"
          >
            <div className="flex items-center justify-center gap-2">
              <Swords className="w-5 h-5" />
              {t.playerView.yourTurn}
              <Swords className="w-5 h-5" />
            </div>
            {turnTimerEnabled && (
              <div className="mt-1">
                <span className="text-sm font-mono opacity-80">
                  {Math.floor(turnTimerRemaining / 60)}:{(turnTimerRemaining % 60).toString().padStart(2, '0')}
                </span>
                <div className="h-1 bg-surface-0/20 rounded-full mt-1 max-w-xs mx-auto overflow-hidden">
                  <div className="h-full bg-surface-0 rounded-full transition-all" style={{ width: `${timerPct}%` }} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-border bg-surface-1">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-text-primary">{t.playerView.title}</span>
            {session && (
              <span className="text-[10px] bg-success/15 text-success px-2 py-0.5 rounded-full">
                {t.playerView.liveRound} {roundNumber}
              </span>
            )}
          </div>
          <div className="flex gap-0.5 bg-surface-2 rounded-lg p-0.5">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  tab === t.id ? 'bg-accent text-surface-0' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <t.icon className="w-3 h-3" />{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* COMBAT TAB */}
        {tab === 'combat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Initiative */}
            <div className="lg:col-span-2">
              <Card>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Swords className="w-3.5 h-3.5" /> {t.playerView.initiativeOrder}
                  <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded ml-auto">Round {roundNumber}</span>
                </h3>

                {/* Turn Timer */}
                {turnTimerEnabled && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className={`w-3 h-3 ${turnTimerRemaining <= 10 ? 'text-danger animate-pulse' : 'text-accent'}`} />
                      <span className={`text-xs font-mono font-bold ${turnTimerRemaining <= 10 ? 'text-danger' : 'text-text-primary'}`}>
                        {Math.floor(turnTimerRemaining / 60)}:{(turnTimerRemaining % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${turnTimerRemaining <= 10 ? 'bg-danger' : 'bg-accent'}`}
                        style={{ width: `${timerPct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {entries.length === 0 ? (
                    <div className="text-center py-8">
                      <Swords className="w-8 h-8 text-text-tertiary/20 mx-auto mb-2" />
                      <p className="text-xs text-text-tertiary">{t.playerView.noCombat}</p>
                      <p className="text-[10px] text-text-tertiary/60 mt-1">Waiting for DM to start initiative...</p>
                    </div>
                  ) : entries.map(entry => (
                    <PlayerInitiativeRow key={entry.id} entry={entry} />
                  ))}
                </div>
              </Card>
            </div>

            {/* Dice Roller */}
            <PlayerDiceRoller />
          </div>
        )}

        {/* CHARACTER TAB */}
        {tab === 'character' && (
          <div className="space-y-4">
            {myCharacters.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-text-tertiary/20 mx-auto mb-2" />
                  <p className="text-xs text-text-tertiary">{t.playerView.noCharacters}</p>
                  <p className="text-[10px] text-text-tertiary/60 mt-1">Create a character first</p>
                </div>
              </Card>
            ) : myCharacters.map(ch => (
              <MyCharacterCard key={ch.id} character={ch} />
            ))}
          </div>
        )}

        {/* NOTES TAB */}
        {tab === 'notes' && (
          <Card>
            <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Scroll className="w-3.5 h-3.5" /> {t.playerView.sessionNotes}
            </h3>
            <textarea
              value={myNote}
              onChange={e => setMyNote(e.target.value)}
              placeholder={t.playerView.notesPlaceholder}
              className="w-full min-h-[300px] bg-surface-2 border border-border rounded-lg p-3 text-sm text-text-primary resize-y"
            />
            <p className="text-[10px] text-text-tertiary mt-1">✓ Notes auto-save to your browser per campaign.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
