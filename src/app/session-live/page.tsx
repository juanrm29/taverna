'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3x3, Users, Dices, Music, MessageSquare, Swords, Shield,
  Plus, Trash2, Move, Square, Circle, MousePointer, Pencil, Eraser,
  Eye, EyeOff, ZoomIn, ZoomOut, Layers, Heart, X, Zap,
  Play, Pause, Volume2, VolumeX, BookOpen,
  Target, ChevronRight, Sparkles, Skull,
  UserPlus, Crown,
  ScrollText, Sun, Scroll, Timer,
  Ruler, RotateCcw, Crosshair,
  Type, ArrowUpRight, PanelRightClose, PanelRightOpen,
  Maximize2, Minimize2, Globe, Sword,
} from 'lucide-react';
import { Modal, Card } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useChatStore } from '@/lib/chatStore';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import DiceOverlay from '@/components/DiceOverlay';
import InitiativeTracker from '@/components/InitiativeTracker';
import ChatPanel from '@/components/ChatPanel';
import CombatRoller from '@/components/CombatRoller';
import VoicePanel from '@/components/VoicePanel';
import LoreWikiPanel from '@/components/panels/LoreWikiPanel';
import QuestBoardPanel from '@/components/panels/QuestBoardPanel';
import CombatAutopilotPanel from '@/components/panels/CombatAutopilotPanel';
import { usePolling } from '@/hooks/usePolling';
import { MapScene, Campaign, ALL_CONDITIONS, CONDITION_EFFECTS, AudioTrack, Character, getAbilityModifier, ALL_SKILLS } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

// ============================================================
// CONSTANTS
// ============================================================
type MapTool = 'select' | 'move' | 'draw-rect' | 'draw-circle' | 'draw-fill-rect' | 'draw-fill-circle' | 'draw-line' | 'draw-arrow' | 'text' | 'erase' | 'fog' | 'measure';
type RightTab = 'initiative' | 'chat' | 'dm-screen' | 'notes' | 'voice' | 'lore' | 'quests' | 'combat-auto';

const TOKEN_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];
const DRAW_COLORS = ['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#8b5cf6'];

const CLASS_COLORS_MAP: Record<string, string> = {
  Barbarian: '#e74c3c', Bard: '#9b59b6', Cleric: '#f1c40f', Druid: '#27ae60',
  Fighter: '#e67e22', Monk: '#3498db', Paladin: '#f39c12', Ranger: '#2ecc71',
  Rogue: '#34495e', Sorcerer: '#e91e63', Warlock: '#8e44ad', Wizard: '#2980b9',
  Artificer: '#95a5a6',
};
const CLASS_ICONS_MAP: Record<string, string> = {
  Barbarian: '\u2694\uFE0F', Bard: '\uD83C\uDFB5', Cleric: '\u271D\uFE0F', Druid: '\uD83C\uDF3F',
  Fighter: '\uD83D\uDDE1\uFE0F', Monk: '\uD83D\uDC4A', Paladin: '\uD83D\uDEE1\uFE0F', Ranger: '\uD83C\uDFF9',
  Rogue: '\uD83D\uDDDD\uFE0F', Sorcerer: '\uD83D\uDD2E', Warlock: '\uD83D\uDC41\uFE0F', Wizard: '\uD83D\uDCD6',
  Artificer: '\u2699\uFE0F',
};

// DM Screen reference data
const ACTIONS_IN_COMBAT = [
  { name: 'Attack', desc: 'Melee or ranged attack' },
  { name: 'Cast a Spell', desc: '1 action casting time' },
  { name: 'Dash', desc: 'Double movement' },
  { name: 'Disengage', desc: 'No opportunity attacks' },
  { name: 'Dodge', desc: 'Attacks have disadvantage' },
  { name: 'Help', desc: 'Ally gets advantage' },
  { name: 'Hide', desc: 'Stealth check' },
  { name: 'Ready', desc: 'Prepare triggered action' },
  { name: 'Grapple', desc: 'Athletics contest' },
  { name: 'Shove', desc: 'Prone or push 5ft' },
];
const COVER_RULES = [
  { type: 'Half', bonus: '+2 AC/DEX', icon: '\u{1F6E1}' },
  { type: '\u00BE', bonus: '+5 AC/DEX', icon: '\u{1F3F0}' },
  { type: 'Total', bonus: 'Untargetable', icon: '\u{1F6AB}' },
];
const DC_TABLE = [
  { diff: 'Very Easy', dc: 5 }, { diff: 'Easy', dc: 10 },
  { diff: 'Medium', dc: 15 }, { diff: 'Hard', dc: 20 },
  { diff: 'Very Hard', dc: 25 }, { diff: 'Near Impossible', dc: 30 },
];
const EXHAUSTION = [
  { lv: 1, fx: 'Disadv. ability checks' }, { lv: 2, fx: 'Speed halved' },
  { lv: 3, fx: 'Disadv. attacks & saves' }, { lv: 4, fx: 'HP max halved' },
  { lv: 5, fx: 'Speed 0' }, { lv: 6, fx: 'Death' },
];

// Narration templates
const NARRATION_TEMPLATES = {
  damage: [
    '{attacker} strikes {target} for {amount} damage!',
    'A devastating blow hits {target} for {amount} damage!',
    '{attacker} deals {amount} damage to {target}!',
  ],
  healing: [
    'Healing restores {amount} HP to {target}.',
    '{target} is mended for {amount} HP.',
  ],
  death: [
    '{target} falls unconscious!',
    '{target} crumples to the ground!',
  ],
  critical: [
    'CRITICAL HIT! {attacker} devastates {target} for {amount}!',
  ],
};
function pickNarration(type: keyof typeof NARRATION_TEMPLATES, vars: Record<string, string>) {
  const t = NARRATION_TEMPLATES[type];
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), t[Math.floor(Math.random() * t.length)]);
}

// ============================================================
// MINI AUDIO BAR
// ============================================================
function AudioBar({ campaignId }: { campaignId: string }) {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [playing, setPlaying] = useState<Set<string>>(new Set());
  const [masterVol, setMasterVol] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => { if (campaignId) api.getAudioTracks(campaignId).then(t => setTracks(t || [])).catch(() => setTracks([])); }, [campaignId]);
  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([, a]) => { a.volume = muted ? 0 : masterVol; });
  }, [masterVol, muted]);
  useEffect(() => {
    return () => { Object.values(audioRefs.current).forEach(a => { a.pause(); a.src = ''; }); audioRefs.current = {}; };
  }, []);

  const toggle = (t: AudioTrack) => {
    if (playing.has(t.id)) {
      audioRefs.current[t.id]?.pause();
      setPlaying(p => { const n = new Set(p); n.delete(t.id); return n; });
    } else {
      if (!t.url) return;
      let a = audioRefs.current[t.id];
      if (!a) { a = new Audio(t.url); audioRefs.current[t.id] = a; }
      a.loop = t.loop; a.volume = muted ? 0 : masterVol;
      a.play().catch(() => {});
      setPlaying(p => new Set(p).add(t.id));
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-surface-1/90 backdrop-blur-md border-t border-border/50 shrink-0">
      <Music className="w-3 h-3 text-accent/70 shrink-0" />
      <button onClick={() => setMuted(!muted)} className="text-text-tertiary hover:text-accent transition-colors cursor-pointer">
        {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
      </button>
      <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : masterVol}
        onChange={e => { setMasterVol(parseFloat(e.target.value)); setMuted(false); }}
        className="w-16 accent-accent h-0.5"
      />
      <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-thin">
        {tracks.length === 0 ? (
          <span className="text-[9px] text-text-tertiary/50">No audio tracks</span>
        ) : tracks.slice(0, 8).map(t => (
          <button key={t.id} onClick={() => toggle(t)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              playing.has(t.id) ? 'bg-accent/15 text-accent border border-accent/30' : 'bg-surface-2/50 text-text-tertiary border border-border/30 hover:border-accent/20'
            }`}>
            {playing.has(t.id) ? <Pause className="w-2 h-2" /> : <Play className="w-2 h-2" />}
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// DM QUICK REFERENCE — Integrated DM Screen Panel
// ============================================================
function DMQuickReference() {
  const [activeSection, setActiveSection] = useState<string>('actions');

  const sections = [
    { id: 'actions', label: 'Actions', icon: <Swords className="w-3 h-3" /> },
    { id: 'conditions', label: 'Conditions', icon: <Zap className="w-3 h-3" /> },
    { id: 'dc', label: 'DC Table', icon: <Target className="w-3 h-3" /> },
    { id: 'roller', label: 'Roller', icon: <Dices className="w-3 h-3" /> },
    { id: 'rules', label: 'Rules', icon: <BookOpen className="w-3 h-3" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Section tabs */}
      <div className="flex gap-0.5 px-2 py-1.5 border-b border-border/30 shrink-0 overflow-x-auto scrollbar-thin">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeSection === s.id
                ? 'bg-accent/15 text-accent border border-accent/20'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2/50 border border-transparent'
            }`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2.5">
        {activeSection === 'actions' && (
          <div className="space-y-1">
            <div className="text-[9px] text-text-tertiary/50 uppercase tracking-wider font-bold mb-1.5 px-0.5">Combat Actions</div>
            {ACTIONS_IN_COMBAT.map(a => (
              <div key={a.name} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-surface-2/30 border border-border/20 hover:border-border/40 transition-colors">
                <span className="text-[10px] font-bold text-accent shrink-0 w-16">{a.name}</span>
                <span className="text-[10px] text-text-tertiary leading-tight">{a.desc}</span>
              </div>
            ))}
            <div className="mt-3 text-[9px] text-text-tertiary/50 uppercase tracking-wider font-bold mb-1.5 px-0.5">Cover</div>
            <div className="grid grid-cols-3 gap-1">
              {COVER_RULES.map(c => (
                <div key={c.type} className="text-center px-2 py-2 rounded-lg bg-surface-2/30 border border-border/20">
                  <div className="text-sm mb-0.5">{c.icon}</div>
                  <div className="text-[9px] font-bold text-text-primary">{c.type}</div>
                  <div className="text-[8px] text-accent font-mono">{c.bonus}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'conditions' && (
          <div className="space-y-1">
            <div className="text-[9px] text-text-tertiary/50 uppercase tracking-wider font-bold mb-1.5 px-0.5">All Conditions</div>
            {ALL_CONDITIONS.map(c => (
              <div key={c} className="px-2 py-1.5 rounded-lg bg-surface-2/30 border border-border/20">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded">{c}</span>
                </div>
                <p className="text-[9px] text-text-tertiary leading-snug mt-0.5">{CONDITION_EFFECTS[c]}</p>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'dc' && (
          <div className="space-y-3">
            <div>
              <div className="text-[9px] text-text-tertiary/50 uppercase tracking-wider font-bold mb-1.5 px-0.5">Difficulty Classes</div>
              {DC_TABLE.map(d => (
                <div key={d.dc} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-2/30 border-b border-border/10">
                  <span className="text-[10px] text-text-secondary">{d.diff}</span>
                  <span className="text-sm font-mono font-black text-accent">{d.dc}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[9px] text-text-tertiary/50 uppercase tracking-wider font-bold mb-1.5 px-0.5">Exhaustion</div>
              {EXHAUSTION.map(e => (
                <div key={e.lv} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-2/30">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    e.lv >= 5 ? 'bg-danger/15 text-danger' : e.lv >= 3 ? 'bg-warning/15 text-warning' : 'bg-surface-3 text-text-tertiary'
                  }`}>Lv.{e.lv}</span>
                  <span className="text-[10px] text-text-secondary">{e.fx}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'roller' && (
          <div>
            <CombatRoller compact className="!p-0" />
          </div>
        )}

        {activeSection === 'rules' && (
          <div className="space-y-3">
            <div>
              <div className="text-[9px] text-text-tertiary/50 uppercase tracking-wider font-bold mb-1.5 px-0.5">Skills Reference</div>
              <div className="grid grid-cols-2 gap-0.5">
                {ALL_SKILLS.map(s => (
                  <div key={s.name} className="flex items-center justify-between px-2 py-1 rounded text-[9px]">
                    <span className="text-text-secondary truncate">{s.name}</span>
                    <span className="text-[8px] font-mono font-bold text-accent bg-accent/10 px-1 py-0.5 rounded">{s.ability.slice(0, 3).toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-text-tertiary/50 uppercase tracking-wider font-bold mb-1.5 px-0.5">Light & Vision</div>
              <div className="space-y-1">
                <div className="px-2 py-1.5 rounded-lg bg-surface-2/30 border border-border/20">
                  <div className="flex items-center gap-1.5"><Sun className="w-3 h-3 text-warning" /><span className="text-[10px] font-bold text-text-primary">Bright</span></div>
                  <p className="text-[9px] text-text-tertiary mt-0.5">Normal vision for all.</p>
                </div>
                <div className="px-2 py-1.5 rounded-lg bg-surface-2/30 border border-border/20">
                  <div className="flex items-center gap-1.5"><Eye className="w-3 h-3 text-info" /><span className="text-[10px] font-bold text-text-primary">Dim</span></div>
                  <p className="text-[9px] text-text-tertiary mt-0.5">Lightly obscured. Disadv. Perception (sight).</p>
                </div>
                <div className="px-2 py-1.5 rounded-lg bg-surface-2/30 border border-border/20">
                  <div className="flex items-center gap-1.5"><EyeOff className="w-3 h-3 text-danger" /><span className="text-[10px] font-bold text-text-primary">Darkness</span></div>
                  <p className="text-[9px] text-text-tertiary mt-0.5">Heavily obscured. Effectively blind.</p>
                </div>
              </div>
            </div>
            <div>
              <div className="text-[9px] text-text-tertiary/50 uppercase tracking-wider font-bold mb-1.5 px-0.5">Travel Pace</div>
              <div className="grid grid-cols-3 gap-1">
                <div className="px-2 py-1.5 rounded-lg bg-surface-2/30 border border-border/20 text-center">
                  <div className="text-[9px] font-bold text-text-primary">Fast</div>
                  <div className="text-[9px] text-accent font-mono">4 mph</div>
                  <div className="text-[8px] text-text-tertiary">-5 passive Per.</div>
                </div>
                <div className="px-2 py-1.5 rounded-lg bg-surface-2/30 border border-border/20 text-center">
                  <div className="text-[9px] font-bold text-text-primary">Normal</div>
                  <div className="text-[9px] text-accent font-mono">3 mph</div>
                  <div className="text-[8px] text-text-tertiary">\u2014</div>
                </div>
                <div className="px-2 py-1.5 rounded-lg bg-surface-2/30 border border-border/20 text-center">
                  <div className="text-[9px] font-bold text-text-primary">Slow</div>
                  <div className="text-[9px] text-accent font-mono">2 mph</div>
                  <div className="text-[8px] text-text-tertiary">Can stealth</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LIVE SESSION PAGE \u2014 ULTIMATE DM COCKPIT
// ============================================================
export default function LiveSessionPage() {
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const { session, loadSession, startSession, goLive, sendNarration, loadMessages } = useChatStore();
  const toast = useToast();
  const { t } = useTranslation();

  // Campaign
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState('');
  const [isDM, setIsDM] = useState(true);

  // Map
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [scenes, setScenes] = useState<MapScene[]>([]);
  const [activeScene, setActiveScene] = useState<MapScene | null>(null);
  const [tool, setTool] = useState<MapTool>('select');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showFog, setShowFog] = useState(true);
  const [fogMode, setFogMode] = useState<'reveal' | 'hide'>('reveal');
  const [isFogging, setIsFogging] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  // Refs for API sync on mouseUp
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const fogCellsRef = useRef<{ row: number; col: number }[]>([]);

  // Drawing
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<{ x: number; y: number }[]>([]);
  // Text tool
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState('');

  // Measurement
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Hover coordinate
  const [hoverGrid, setHoverGrid] = useState<{ x: number; y: number } | null>(null);

  // Token context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tokenId: string } | null>(null);

  // UI panels
  const [rightTab, setRightTab] = useState<RightTab>('initiative');
  const [rightPanelMode, setRightPanelMode] = useState<'full' | 'tabs' | 'hidden' | 'maximized'>('full');
  const dmNoteKey = `taverna_dm_notes_${activeCampaignId || 'global'}`;
  const [notes, setNotes] = useState('');
  // Persist DM notes to localStorage
  useEffect(() => { if (typeof window !== 'undefined') setNotes(localStorage.getItem(dmNoteKey) || ''); }, [dmNoteKey]);
  useEffect(() => { if (typeof window !== 'undefined' && dmNoteKey) localStorage.setItem(dmNoteKey, notes); }, [notes, dmNoteKey]);

  // Add token modal
  const [showAddToken, setShowAddToken] = useState(false);
  const [showScenePicker, setShowScenePicker] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [tokenSize, setTokenSize] = useState(1);
  const [tokenColor, setTokenColor] = useState('#ef4444');
  const [tokenIsPC, setTokenIsPC] = useState(true);
  const [tokenHP, setTokenHP] = useState('');
  const [tokenAC, setTokenAC] = useState('');
  const [tokenTab, setTokenTab] = useState<'party' | 'manual'>('party');

  // ============================================================
  // Init
  // ============================================================
  // Load campaigns once
  useEffect(() => {
    if (user) {
      api.getCampaigns().then(camps => {
        setCampaigns(camps || []);
        if (camps.length > 0 && !activeCampaignId) {
          setActiveCampaignId(camps[0].id);
          setIsDM(camps[0].dmId === user.id);
        }
      }).catch(err => console.error('Failed to load campaigns:', err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load session data when campaign changes
  useEffect(() => {
    if (activeCampaignId) {
      loadSession(activeCampaignId);
      loadMessages(activeCampaignId);
      api.getScenes(activeCampaignId).then(allScenes => {
        setScenes(allScenes || []);
        if (allScenes && allScenes.length > 0) setActiveScene(prev => prev || allScenes[0]);
      }).catch(err => console.error('Failed to load scenes:', err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCampaignId]);

  // ============================================================
  // Real-time polling — sync chat messages & initiative every 4s
  // ============================================================
  usePolling(
    useCallback(async () => {
      if (!activeCampaignId) return;
      loadMessages(activeCampaignId);
    }, [activeCampaignId, loadMessages]),
    { interval: 4000, enabled: !!activeCampaignId },
  );

  usePolling(
    useCallback(async () => {
      if (!session) return;
      try {
        const entries = await api.getInitiative(session.id);
        if (entries) useChatStore.setState({ session: { ...session, initiative: entries } });
      } catch { /* silent */ }
    }, [session]),
    { interval: 5000, enabled: !!session },
  );

  useEffect(() => {
    if (activeScene?.backgroundImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { bgImageRef.current = img; };
      img.onerror = () => { bgImageRef.current = null; };
      img.src = activeScene.backgroundImage;
    } else { bgImageRef.current = null; }
  }, [activeScene?.backgroundImage]);

  useEffect(() => {
    if (activeCampaignId && user && !session) {
      // loadSession already fetches from API and finds active session
      loadSession(activeCampaignId);
    }
  }, [activeCampaignId, user, session, loadSession]);

  // ============================================================
  // Keyboard shortcuts
  // ============================================================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.key) {
        case ' ': e.preventDefault(); useChatStore.getState().nextTurn(); break;
        case 'r': case 'R':
          window.dispatchEvent(new CustomEvent('taverna:dice-roll', { detail: { ...api.rollDiceLocal('1d20'), formula: '1d20', source: 'shortcut' } }));
          break;
        case 'g': setShowGrid(p => !p); break;
        case 'f': setShowFog(p => !p); break;
        case '1': setTool('select'); break;
        case '2': setTool('move'); break;
        case '3': setTool('draw-rect'); break;
        case '4': setTool('draw-circle'); break;
        case '5': setTool('draw-line'); break;
        case '6': setTool('fog'); break;
        case '7': setTool('erase'); break;
        case '8': setTool('measure'); break;
        case 't': case 'T': setTool('text'); break;
        case 'Escape': setContextMenu(null); setSelectedTokenId(null); setMeasureStart(null); setMeasureEnd(null); setIsMeasuring(false); setTextInputPos(null); setTextInputValue(''); break;
        case 'Delete': case 'Backspace':
          if (selectedTokenId && activeScene) {
            const tokenToRemove = activeScene.tokens?.find(t => t.id === selectedTokenId);
            if (tokenToRemove) {
              setActiveScene(prev => prev ? { ...prev, tokens: (prev.tokens || []).filter(t => t.id !== selectedTokenId) } : null);
              setSelectedTokenId(null);
              api.removeToken(tokenToRemove.id).catch(err => console.error('Failed to remove token:', err));
            }
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedTokenId, activeScene]);

  // ============================================================
  // Canvas rendering
  // ============================================================
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeScene) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const gs = (activeScene.gridSize || 40) * zoom;
    const ox = panOffset.x, oy = panOffset.y;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = activeScene.backgroundColor || '#0a0a14';
    ctx.fillRect(0, 0, w, h);

    if (bgImageRef.current) ctx.drawImage(bgImageRef.current, ox, oy, activeScene.width * gs, activeScene.height * gs);

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= activeScene.width; x++) { ctx.beginPath(); ctx.moveTo(x * gs + ox, oy); ctx.lineTo(x * gs + ox, activeScene.height * gs + oy); ctx.stroke(); }
      for (let y = 0; y <= activeScene.height; y++) { ctx.beginPath(); ctx.moveTo(ox, y * gs + oy); ctx.lineTo(activeScene.width * gs + ox, y * gs + oy); ctx.stroke(); }
    }

    (activeScene.drawings || []).forEach(d => {
      ctx.strokeStyle = d.color || '#ffffff';
      ctx.lineWidth = (d.lineWidth || 2) * zoom;
      if (d.type === 'freehand' && d.points.length > 0) {
        ctx.beginPath(); d.points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x * gs + ox, p.y * gs + oy); else ctx.lineTo(p.x * gs + ox, p.y * gs + oy); }); ctx.stroke();
      } else if (d.type === 'rectangle' && d.points.length >= 2) {
        const p0 = d.points[0], p1 = d.points[1];
        if (d.fillColor) {
          ctx.fillStyle = d.fillColor; ctx.globalAlpha = 0.35;
          ctx.fillRect(p0.x * gs + ox, p0.y * gs + oy, (p1.x - p0.x) * gs, (p1.y - p0.y) * gs);
          ctx.globalAlpha = 1;
        }
        ctx.strokeRect(p0.x * gs + ox, p0.y * gs + oy, (p1.x - p0.x) * gs, (p1.y - p0.y) * gs);
      } else if (d.type === 'circle' && d.points.length >= 2) {
        const c = d.points[0], e = d.points[1]; const r = Math.sqrt((e.x - c.x) ** 2 * gs ** 2 + (e.y - c.y) ** 2 * gs ** 2);
        ctx.beginPath(); ctx.arc(c.x * gs + ox, c.y * gs + oy, r, 0, Math.PI * 2);
        if (d.fillColor) { ctx.fillStyle = d.fillColor; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1; }
        ctx.stroke();
      } else if (d.type === 'arrow' && d.points.length >= 2) {
        const p0 = d.points[0], p1 = d.points[1];
        const sx = p0.x * gs + ox, sy = p0.y * gs + oy, ex = p1.x * gs + ox, ey = p1.y * gs + oy;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(ey - sy, ex - sx); const headLen = 12 * zoom;
        ctx.beginPath(); ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (d.type === 'text' && d.text && d.points.length >= 1) {
        const p = d.points[0];
        const fontSize = Math.max(12, (d.lineWidth || 16)) * zoom;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = d.color || '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(d.text, p.x * gs + ox, p.y * gs + oy);
      }
    });

    if (isDrawing && drawStart && drawCurrent) {
      ctx.strokeStyle = drawColor; ctx.lineWidth = 2 * zoom; ctx.setLineDash([6, 4]);
      if (tool === 'draw-rect') ctx.strokeRect(drawStart.x * gs + ox, drawStart.y * gs + oy, (drawCurrent.x - drawStart.x) * gs, (drawCurrent.y - drawStart.y) * gs);
      else if (tool === 'draw-fill-rect') {
        ctx.fillStyle = drawColor; ctx.globalAlpha = 0.35;
        ctx.fillRect(drawStart.x * gs + ox, drawStart.y * gs + oy, (drawCurrent.x - drawStart.x) * gs, (drawCurrent.y - drawStart.y) * gs);
        ctx.globalAlpha = 1;
        ctx.strokeRect(drawStart.x * gs + ox, drawStart.y * gs + oy, (drawCurrent.x - drawStart.x) * gs, (drawCurrent.y - drawStart.y) * gs);
      }
      else if (tool === 'draw-circle') { const r = Math.sqrt((drawCurrent.x - drawStart.x) ** 2 * gs ** 2 + (drawCurrent.y - drawStart.y) ** 2 * gs ** 2); ctx.beginPath(); ctx.arc(drawStart.x * gs + ox, drawStart.y * gs + oy, r, 0, Math.PI * 2); ctx.stroke(); }
      else if (tool === 'draw-fill-circle') {
        const r = Math.sqrt((drawCurrent.x - drawStart.x) ** 2 * gs ** 2 + (drawCurrent.y - drawStart.y) ** 2 * gs ** 2);
        ctx.beginPath(); ctx.arc(drawStart.x * gs + ox, drawStart.y * gs + oy, r, 0, Math.PI * 2);
        ctx.fillStyle = drawColor; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
      }
      else if (tool === 'draw-arrow') {
        const sx = drawStart.x * gs + ox, sy = drawStart.y * gs + oy, ex = drawCurrent.x * gs + ox, ey = drawCurrent.y * gs + oy;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        const angle = Math.atan2(ey - sy, ex - sx); const headLen = 12 * zoom;
        ctx.beginPath(); ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    if (isDrawing && tool === 'draw-line' && freehandPoints.length > 0) {
      ctx.strokeStyle = drawColor; ctx.lineWidth = 2 * zoom; ctx.beginPath();
      freehandPoints.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x * gs + ox, p.y * gs + oy); else ctx.lineTo(p.x * gs + ox, p.y * gs + oy); }); ctx.stroke();
    }

    // ---- Measurement line ----
    if (measureStart && measureEnd) {
      const mx1 = (measureStart.x + 0.5) * gs + ox, my1 = (measureStart.y + 0.5) * gs + oy;
      const mx2 = (measureEnd.x + 0.5) * gs + ox, my2 = (measureEnd.y + 0.5) * gs + oy;
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.setLineDash([8, 4]);
      ctx.beginPath(); ctx.moveTo(mx1, my1); ctx.lineTo(mx2, my2); ctx.stroke(); ctx.setLineDash([]);
      // Distance label
      const dx = measureEnd.x - measureStart.x, dy = measureEnd.y - measureStart.y;
      const distCells = Math.sqrt(dx * dx + dy * dy);
      const distFt = Math.round(distCells * 5); // 5ft per cell
      const midX = (mx1 + mx2) / 2, midY = (my1 + my2) / 2;
      ctx.font = `bold ${14 * zoom}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      // Background pill
      const label = `${distFt} ft (${distCells.toFixed(1)})`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.beginPath(); ctx.roundRect(midX - tw/2 - 8, midY - 22, tw + 16, 22, 6); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.fillText(label, midX, midY - 4);
      // Start/end markers
      [{ x: mx1, y: my1 }, { x: mx2, y: my2 }].forEach(pt => {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2); ctx.fillStyle = '#fbbf24'; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      });
    }

    // ---- Grid coordinate labels (top row + left col) ----
    ctx.font = `${Math.max(8, 9 * zoom)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let x = 0; x < Math.min(activeScene.width, 26); x++) {
      ctx.fillText(String.fromCharCode(65 + x), (x + 0.5) * gs + ox, 0.3 * gs + oy);
    }
    for (let y = 0; y < activeScene.height; y++) {
      ctx.fillText(String(y + 1), 0.3 * gs + ox, (y + 0.5) * gs + oy);
    }

    // ---- Token light/aura rendering ----
    (activeScene.tokens || []).forEach(token => {
      if (token.hidden || token.lightRadius <= 0) return;
      const tcx = token.x * gs + ox + token.size * gs / 2;
      const tcy = token.y * gs + oy + token.size * gs / 2;
      const brightR = token.lightRadius * gs;
      const dimR = (token.dimLightRadius || token.lightRadius * 1.5) * gs;
      const lightGrad = ctx.createRadialGradient(tcx, tcy, 0, tcx, tcy, dimR);
      lightGrad.addColorStop(0, 'rgba(255,200,80,0.06)');
      lightGrad.addColorStop(brightR / dimR, 'rgba(255,200,80,0.03)');
      lightGrad.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath(); ctx.arc(tcx, tcy, dimR, 0, Math.PI * 2); ctx.fill();
    });

    (activeScene.tokens || []).forEach(token => {
      if (token.hidden) return;
      const tx = token.x * gs + ox, ty = token.y * gs + oy, ts = token.size * gs;
      const initEntries = session?.initiative || [];
      const activeInit = initEntries.find(en => en.isActive);
      const isActiveToken = activeInit?.tokenId === token.id || activeInit?.name === token.name;

      // Shadow
      ctx.beginPath(); ctx.arc(tx + ts / 2, ty + ts / 2 + 2, ts / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();

      // Token
      ctx.beginPath(); ctx.arc(tx + ts / 2, ty + ts / 2, ts / 2 - 2, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(tx + ts / 2 - ts / 6, ty + ts / 2 - ts / 6, 0, tx + ts / 2, ty + ts / 2, ts / 2);
      const baseColor = token.color || '#3b82f6';
      grad.addColorStop(0, baseColor + 'dd');
      grad.addColorStop(1, baseColor);
      ctx.fillStyle = grad; ctx.fill();

      if (isActiveToken) {
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.setLineDash([6, 3]); ctx.stroke(); ctx.setLineDash([]);
        // Glow
        ctx.shadowColor = '#fbbf2480'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(tx + ts / 2, ty + ts / 2, ts / 2, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (selectedTokenId === token.id) {
        ctx.strokeStyle = '#c9a96e'; ctx.lineWidth = 2.5; ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
      }

      ctx.fillStyle = '#ffffff'; ctx.font = `bold ${Math.max(10, 12 * zoom)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(token.label || token.name.slice(0, 2).toUpperCase(), tx + ts / 2, ty + ts / 2);

      if (token.hp) {
        const barW = ts - 4, barH = 3, barX = tx + 2, barY = ty + ts - 5;
        const hpPct = Math.max(0, Math.min(1, token.hp.current / token.hp.max));
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 1.5); ctx.fill();
        ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#eab308' : '#ef4444';
        ctx.beginPath(); ctx.roundRect(barX, barY, barW * hpPct, barH, 1.5); ctx.fill();
      }
      if (token.conditions && token.conditions.length > 0) {
        ctx.fillStyle = '#fbbf24'; ctx.font = `${Math.max(8, 10 * zoom)}px sans-serif`; ctx.textBaseline = 'top';
        ctx.fillText(`\u26A1${token.conditions.length}`, tx + ts - 8, ty + 2);
      }
    });

    if (showFog && activeScene.fogRevealed) {
      for (let gx = 0; gx < activeScene.width; gx++) for (let gy = 0; gy < activeScene.height; gy++)
        if (!(activeScene.fogRevealed[gy]?.[gx] ?? false)) { ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(gx * gs + ox, gy * gs + oy, gs, gs); }
    }
  }, [activeScene, zoom, panOffset, showGrid, showFog, selectedTokenId, isDrawing, drawStart, drawCurrent, drawColor, tool, freehandPoints, session, measureStart, measureEnd]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { const p = canvas.parentElement; if (p) { canvas.width = p.clientWidth; canvas.height = p.clientHeight; render(); } };
    resize(); window.addEventListener('resize', resize);
    // Passive-false wheel handler for zoom
    const wheelHandler = (e: WheelEvent) => { e.preventDefault(); setZoom(z => Math.max(0.25, Math.min(3, z - e.deltaY * 0.001))); };
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    return () => { window.removeEventListener('resize', resize); canvas.removeEventListener('wheel', wheelHandler); };
  }, [render, activeScene]);

  // ============================================================
  // Mouse handlers
  // ============================================================
  const getGridPos = (e: React.MouseEvent) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect(); const gs = (activeScene?.gridSize || 40) * zoom;
    return { x: Math.floor((e.clientX - r.left - panOffset.x) / gs), y: Math.floor((e.clientY - r.top - panOffset.y) / gs) };
  };
  const getPrecise = (e: React.MouseEvent) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect(); const gs = (activeScene?.gridSize || 40) * zoom;
    return { x: (e.clientX - r.left - panOffset.x) / gs, y: (e.clientY - r.top - panOffset.y) / gs };
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeScene) return;
    const pos = getGridPos(e);
    const clicked = activeScene.tokens?.find(t => pos.x >= t.x && pos.x < t.x + t.size && pos.y >= t.y && pos.y < t.y + t.size);
    if (clicked) {
      setContextMenu({ x: e.clientX, y: e.clientY, tokenId: clicked.id });
      setSelectedTokenId(clicked.id);
    } else {
      setContextMenu(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setContextMenu(null);
    if (e.button === 1 || (e.button === 0 && tool === 'move')) { setIsPanning(true); setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }); return; }
    const pos = getGridPos(e); const precise = getPrecise(e);
    if (tool === 'select' && activeScene) {
      const clicked = activeScene.tokens?.find(t => pos.x >= t.x && pos.x < t.x + t.size && pos.y >= t.y && pos.y < t.y + t.size);
      if (clicked) { setSelectedTokenId(clicked.id); setIsDragging(true); window.dispatchEvent(new CustomEvent('taverna:token-select', { detail: { tokenId: clicked.id, name: clicked.name } })); }
      else setSelectedTokenId(null);
    }
    if (tool === 'measure' && activeScene) { setMeasureStart(pos); setMeasureEnd(pos); setIsMeasuring(true); }
    if (tool === 'fog' && activeScene) {
      setIsFogging(true);
      fogCellsRef.current = [{ row: pos.y, col: pos.x }];
      // Local optimistic update
      setActiveScene(prev => {
        if (!prev) return null;
        const fog = prev.fogRevealed ? prev.fogRevealed.map(r => [...r]) : Array.from({ length: prev.height }, () => Array(prev.width).fill(false));
        if (fogMode === 'reveal') fog[pos.y] = fog[pos.y] || []; fog[pos.y][pos.x] = fogMode === 'reveal';
        return { ...prev, fogRevealed: fog };
      });
    }
    if ((tool === 'draw-rect' || tool === 'draw-circle' || tool === 'draw-fill-rect' || tool === 'draw-fill-circle' || tool === 'draw-arrow') && activeScene) { setIsDrawing(true); setDrawStart(precise); setDrawCurrent(precise); }
    if (tool === 'draw-line' && activeScene) { setIsDrawing(true); setFreehandPoints([precise]); }
    if (tool === 'text' && activeScene) {
      setTextInputPos({ x: precise.x, y: precise.y, screenX: e.clientX, screenY: e.clientY });
      setTextInputValue('');
    }
    if (tool === 'erase' && activeScene) {
      const drawings = activeScene.drawings || []; let closestId: string | null = null; let closestDist = Infinity;
      drawings.forEach(d => { d.points.forEach(p => { const dist = Math.sqrt((p.x - precise.x) ** 2 + (p.y - precise.y) ** 2); if (dist < closestDist) { closestDist = dist; closestId = d.id; } }); });
      if (closestId && closestDist < 3) {
        const newDrawings = drawings.filter(d => d.id !== closestId);
        setActiveScene(prev => prev ? { ...prev, drawings: newDrawings } : null);
        api.updateScene(activeScene.id, { drawings: newDrawings }).catch(err => console.error('Failed to erase drawing:', err));
      }
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    // Track hover grid position
    setHoverGrid(getGridPos(e));
    if (isPanning) { setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }
    if (isDragging && selectedTokenId && activeScene) { const pos = getGridPos(e); setActiveScene(prev => prev ? { ...prev, tokens: (prev.tokens || []).map(t => t.id === selectedTokenId ? { ...t, x: pos.x, y: pos.y } : t) } : null); dragPosRef.current = pos; }
    if (isFogging && tool === 'fog' && activeScene) { const pos = getGridPos(e); if (pos.x >= 0 && pos.y >= 0 && pos.x < activeScene.width && pos.y < activeScene.height) { fogCellsRef.current.push({ row: pos.y, col: pos.x }); setActiveScene(prev => { if (!prev) return null; const fog = prev.fogRevealed ? prev.fogRevealed.map(r => [...r]) : Array.from({ length: prev.height }, () => Array(prev.width).fill(false)); fog[pos.y] = fog[pos.y] || []; fog[pos.y][pos.x] = fogMode === 'reveal'; return { ...prev, fogRevealed: fog }; }); } }
    if (isMeasuring && tool === 'measure') setMeasureEnd(getGridPos(e));
    if (isDrawing && (tool === 'draw-rect' || tool === 'draw-circle' || tool === 'draw-fill-rect' || tool === 'draw-fill-circle' || tool === 'draw-arrow')) setDrawCurrent(getPrecise(e));
    if (isDrawing && tool === 'draw-line') setFreehandPoints(p => [...p, getPrecise(e)]);
  };
  const handleMouseUp = () => {
    // Sync token drag to API
    if (isDragging && selectedTokenId && activeScene && dragPosRef.current) {
      const token = activeScene.tokens?.find(t => t.id === selectedTokenId);
      if (token) api.updateToken(token.id, { x: dragPosRef.current.x, y: dragPosRef.current.y }).catch(err => console.error('Failed to sync token position:', err));
      dragPosRef.current = null;
    }
    // Sync fog to API
    if (isFogging && activeScene && fogCellsRef.current.length > 0) {
      if (fogMode === 'reveal') {
        api.revealFog(activeScene.id, fogCellsRef.current).catch(err => console.error('Failed to sync fog:', err));
      } else {
        // For hiding, update the scene's fogRevealed data
        api.updateScene(activeScene.id, { fogRevealed: activeScene.fogRevealed }).catch(err => console.error('Failed to sync fog hide:', err));
      }
      fogCellsRef.current = [];
    }
    setIsDragging(false); setIsPanning(false); setIsFogging(false);
    if (isMeasuring) setIsMeasuring(false);
    if (isDrawing && activeScene) {
      let newDrawing: any = null;
      if (tool === 'draw-rect' && drawStart && drawCurrent) newDrawing = { id: crypto.randomUUID(), type: 'rectangle', points: [drawStart, drawCurrent], color: drawColor, lineWidth: 2, visible: true };
      else if (tool === 'draw-fill-rect' && drawStart && drawCurrent) newDrawing = { id: crypto.randomUUID(), type: 'rectangle', points: [drawStart, drawCurrent], color: drawColor, fillColor: drawColor, lineWidth: 2, visible: true };
      else if (tool === 'draw-circle' && drawStart && drawCurrent) newDrawing = { id: crypto.randomUUID(), type: 'circle', points: [drawStart, drawCurrent], color: drawColor, lineWidth: 2, radius: Math.sqrt((drawCurrent.x - drawStart.x) ** 2 + (drawCurrent.y - drawStart.y) ** 2), visible: true };
      else if (tool === 'draw-fill-circle' && drawStart && drawCurrent) newDrawing = { id: crypto.randomUUID(), type: 'circle', points: [drawStart, drawCurrent], color: drawColor, fillColor: drawColor, lineWidth: 2, radius: Math.sqrt((drawCurrent.x - drawStart.x) ** 2 + (drawCurrent.y - drawStart.y) ** 2), visible: true };
      else if (tool === 'draw-arrow' && drawStart && drawCurrent) newDrawing = { id: crypto.randomUUID(), type: 'arrow', points: [drawStart, drawCurrent], color: drawColor, lineWidth: 2, visible: true };
      else if (tool === 'draw-line' && freehandPoints.length > 1) newDrawing = { id: crypto.randomUUID(), type: 'freehand', points: freehandPoints, color: drawColor, lineWidth: 2, visible: true };
      if (newDrawing) {
        const updatedDrawings = [...(activeScene.drawings || []), newDrawing];
        setActiveScene(prev => prev ? { ...prev, drawings: updatedDrawings } : null);
        api.updateScene(activeScene.id, { drawings: updatedDrawings }).catch(err => console.error('Failed to save drawing:', err));
      }
    }
    setIsDrawing(false); setDrawStart(null); setDrawCurrent(null); setFreehandPoints([]);
  };
  // Wheel zoom handled via passive:false useEffect above

  // ============================================================
  // Damage / Healing
  // ============================================================
  const applyDamageToSelected = useCallback((amount: number) => {
    if (!activeScene || !selectedTokenId) { toast.warning('Select a token first'); return; }
    const token = activeScene.tokens?.find(t => t.id === selectedTokenId);
    if (!token?.hp) { toast.warning('Token has no HP'); return; }
    const tokenHp = token.hp;
    const newHP = Math.max(0, tokenHp.current - amount);
    setActiveScene(prev => prev ? { ...prev, tokens: (prev.tokens || []).map(t => t.id === selectedTokenId ? { ...t, hp: { current: newHP, max: tokenHp.max } } : t) } : null);
    api.updateToken(token.id, { hp: { current: newHP, max: tokenHp.max } }).catch(err => console.error('Failed to update token HP:', err));
    if (isDM && activeCampaignId && user) {
      const narr = newHP === 0 ? pickNarration('death', { target: token.name }) : pickNarration('damage', { attacker: 'An attack', target: token.name, amount: String(amount) });
      sendNarration(activeCampaignId, user.id, user.displayName, narr);
    }
    toast.info(`${amount} dmg \u2192 ${token.name} (${newHP}/${tokenHp.max})`);
  }, [activeScene, selectedTokenId, isDM, activeCampaignId, user, sendNarration, toast]);

  const applyHealingToSelected = useCallback((amount: number) => {
    if (!activeScene || !selectedTokenId) { toast.warning('Select a token first'); return; }
    const token = activeScene.tokens?.find(t => t.id === selectedTokenId);
    if (!token?.hp) { toast.warning('Token has no HP'); return; }
    const tokenHp2 = token.hp;
    const newHP = Math.min(tokenHp2.max, tokenHp2.current + amount);
    setActiveScene(prev => prev ? { ...prev, tokens: (prev.tokens || []).map(t => t.id === selectedTokenId ? { ...t, hp: { current: newHP, max: tokenHp2.max } } : t) } : null);
    api.updateToken(token.id, { hp: { current: newHP, max: tokenHp2.max } }).catch(err => console.error('Failed to update token HP:', err));
    if (isDM && activeCampaignId && user) sendNarration(activeCampaignId, user.id, user.displayName, pickNarration('healing', { target: token.name, amount: String(amount) }));
    toast.info(`+${amount} HP \u2192 ${token.name} (${newHP}/${tokenHp2.max})`);
  }, [activeScene, selectedTokenId, isDM, activeCampaignId, user, sendNarration, toast]);

  // ============================================================
  // Add token
  // ============================================================
  const addToken = () => {
    if (!activeScene || !tokenName.trim()) return;
    const hpVal = Number.parseInt(tokenHP) || 0, acVal = Number.parseInt(tokenAC) || 0;
    const tokenData = { name: tokenName.trim(), x: Math.floor(activeScene.width / 2), y: Math.floor(activeScene.height / 2), size: tokenSize, color: tokenColor, label: tokenName.trim().slice(0, 2).toUpperCase(), isPC: tokenIsPC, conditions: [], hp: hpVal > 0 ? { current: hpVal, max: hpVal } : undefined, vision: 12, darkvision: 0, lightRadius: 0, dimLightRadius: 0, hidden: false };
    api.addToken(activeScene.id, tokenData).then(newToken => {
      setActiveScene(prev => prev ? { ...prev, tokens: [...(prev.tokens || []), newToken || { ...tokenData, id: crypto.randomUUID() }] } : null);
    }).catch(err => console.error('Failed to add token:', err));
    if (session) { const initRoll = Math.floor(Math.random() * 20) + 1; useChatStore.getState().addInitiative(tokenName.trim(), initRoll, !tokenIsPC, hpVal > 0 ? { current: hpVal, max: hpVal } : undefined, acVal > 0 ? acVal : undefined); }
    setShowAddToken(false); setTokenName(''); setTokenHP(''); setTokenAC('');
    toast.success('Token added to map & initiative!');
  };

  const [partyCharacters, setPartyCharacters] = useState<Character[]>([]);
  useEffect(() => {
    if (activeCampaignId) {
      api.getCharactersByCampaign(activeCampaignId).then(chars => setPartyCharacters(chars || [])).catch(() => setPartyCharacters([]));
    }
  }, [activeCampaignId]);
  const existingTokenNames = useMemo(() => (activeScene?.tokens || []).map(t => t.name), [activeScene]);

  const addTokenFromCharacter = (ch: Character) => {
    if (!activeScene) return;
    const charTokenData = { name: ch.name, x: Math.floor(activeScene.width / 2), y: Math.floor(activeScene.height / 2), size: 1, color: CLASS_COLORS_MAP[ch.class] || '#c9a96e', label: ch.name.slice(0, 2).toUpperCase(), isPC: true, characterId: ch.id, conditions: [], hp: { current: ch.hp.current, max: ch.hp.max }, vision: 12, darkvision: 0, lightRadius: 0, dimLightRadius: 0, hidden: false };
    api.addToken(activeScene.id, charTokenData).then(newToken => {
      setActiveScene(prev => prev ? { ...prev, tokens: [...(prev.tokens || []), newToken || { ...charTokenData, id: crypto.randomUUID() }] } : null);
    }).catch(err => console.error('Failed to add token:', err));
    if (session) { const dexMod = getAbilityModifier(ch.abilityScores.dexterity); const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod + (ch.initiative || 0); useChatStore.getState().addInitiative(ch.name, initRoll, false, { current: ch.hp.current, max: ch.hp.max }, ch.armorClass, ch.id); }
    toast.success(`${ch.name} added!`);
  };
  const addAllPartyTokens = () => { const avail = partyCharacters.filter(ch => !existingTokenNames.includes(ch.name)); avail.forEach(ch => addTokenFromCharacter(ch)); if (avail.length > 0) toast.success(`${avail.length} party members added!`); };

  const selectedToken = activeScene?.tokens?.find(t => t.id === selectedTokenId);
  const mapTools: { key: MapTool; icon: React.ReactNode; label: string; shortcut: string; group: 'tools' | 'draw' }[] = [
    { key: 'select', icon: <MousePointer className="w-3.5 h-3.5" />, label: 'Select', shortcut: '1', group: 'tools' },
    { key: 'move', icon: <Move className="w-3.5 h-3.5" />, label: 'Pan', shortcut: '2', group: 'tools' },
    { key: 'measure', icon: <Ruler className="w-3.5 h-3.5" />, label: 'Measure', shortcut: '8', group: 'tools' },
    { key: 'draw-rect', icon: <Square className="w-3.5 h-3.5" />, label: 'Rect', shortcut: '3', group: 'draw' },
    { key: 'draw-fill-rect', icon: <span className="relative w-3.5 h-3.5"><Square className="w-3.5 h-3.5 fill-current" /></span>, label: 'Fill Rect', shortcut: '', group: 'draw' },
    { key: 'draw-circle', icon: <Circle className="w-3.5 h-3.5" />, label: 'Circle', shortcut: '4', group: 'draw' },
    { key: 'draw-fill-circle', icon: <span className="relative w-3.5 h-3.5"><Circle className="w-3.5 h-3.5 fill-current" /></span>, label: 'Fill Circle', shortcut: '', group: 'draw' },
    { key: 'draw-line', icon: <Pencil className="w-3.5 h-3.5" />, label: 'Pen', shortcut: '5', group: 'draw' },
    { key: 'draw-arrow', icon: <ArrowUpRight className="w-3.5 h-3.5" />, label: 'Arrow', shortcut: '', group: 'draw' },
    { key: 'text', icon: <Type className="w-3.5 h-3.5" />, label: 'Text', shortcut: 'T', group: 'draw' },
    { key: 'fog', icon: fogMode === 'reveal' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />, label: fogMode === 'reveal' ? 'Reveal' : 'Hide', shortcut: '6', group: 'draw' },
    { key: 'erase', icon: <Eraser className="w-3.5 h-3.5" />, label: 'Erase', shortcut: '7', group: 'draw' },
  ];

  // Quick HP change from context menu
  const applyQuickHP = (tokenId: string, delta: number) => {
    if (!activeScene) return;
    const token = activeScene.tokens?.find(t => t.id === tokenId);
    if (!token?.hp) return;
    const hp = token.hp;
    const newHP = Math.max(0, Math.min(hp.max, hp.current + delta));
    setActiveScene(prev => prev ? { ...prev, tokens: (prev.tokens || []).map(t => t.id === tokenId ? { ...t, hp: { current: newHP, max: hp.max } } : t) } : null);
    api.updateToken(token.id, { hp: { current: newHP, max: hp.max } }).catch(err => console.error('Failed to update HP:', err));
    toast.info(`${token.name}: ${newHP}/${hp.max} HP`);
  };

  const toggleTokenCondition = (tokenId: string, condition: string) => {
    if (!activeScene) return;
    const token = activeScene.tokens?.find(t => t.id === tokenId);
    if (!token) return;
    const newConditions = token.conditions.includes(condition)
      ? token.conditions.filter(c => c !== condition)
      : [...token.conditions, condition];
    setActiveScene(prev => prev ? { ...prev, tokens: (prev.tokens || []).map(t => t.id === tokenId ? { ...t, conditions: newConditions } : t) } : null);
    api.updateToken(token.id, { conditions: newConditions }).catch(err => console.error('Failed to update conditions:', err));
  };

  const toggleTokenVisibility = (tokenId: string) => {
    if (!activeScene) return;
    const token = activeScene.tokens?.find(t => t.id === tokenId);
    if (!token) return;
    setActiveScene(prev => prev ? { ...prev, tokens: (prev.tokens || []).map(t => t.id === tokenId ? { ...t, hidden: !token.hidden } : t) } : null);
    api.updateToken(token.id, { hidden: !token.hidden }).catch(err => console.error('Failed to update visibility:', err));
  };

  const entries = session?.initiative || [];
  const activeEntry = entries.find(e => e.isActive);

  // ============================================================
  // PLAYER VIEW — Renders when not DM
  // ============================================================
  if (!isDM) {
    return (
      <PlayerSessionView
        user={user}
        session={session}
        campaigns={campaigns}
        activeCampaignId={activeCampaignId}
        setActiveCampaignId={(cid) => { setActiveCampaignId(cid); setActiveScene(null); const camp = campaigns.find(c => c.id === cid); if (camp && user) setIsDM(camp.dmId === user.id); }}
        entries={entries}
        activeEntry={activeEntry || null}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ====== TOP BAR ====== */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-1/95 backdrop-blur-md border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              <h1 className="text-xs font-display font-bold text-text-primary">{t.session.liveSession}</h1>
              {session && (
                <span className="flex items-center gap-1 text-[9px] text-success">
                  <span className="w-1 h-1 rounded-full bg-success animate-pulse" /> {t.session.live}
                </span>
              )}
            </div>
          </div>
          {activeCampaignId && (
            <select value={activeCampaignId}
              onChange={e => { const cid = e.target.value; setActiveCampaignId(cid); setActiveScene(null); const camp = campaigns.find(c => c.id === cid); if (camp && user) setIsDM(camp.dmId === user.id); }}
              className="bg-surface-2/60 border border-border/40 rounded-lg px-2.5 py-1 text-[10px] text-text-secondary focus:border-accent/40 outline-none cursor-pointer">
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {/* Role indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
            isDM
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
              : 'bg-blue-500/10 border-blue-500/25 text-blue-400'
          }`}>
            {isDM ? <Crown className="w-3 h-3" /> : <Swords className="w-3 h-3" />}
            {isDM ? t.session.dmMode : t.session.playerMode}
          </div>
          {activeEntry && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center gap-2 bg-accent/8 border border-accent/15 rounded-lg px-2.5 py-1">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-accent">
                <Swords className="w-3 h-3" />
              </motion.div>
              <span className="text-[10px] text-accent font-bold truncate max-w-[120px]">{activeEntry.name}</span>
              {activeEntry.hp && <span className="text-[9px] text-accent/50 font-mono">{activeEntry.hp.current}/{activeEntry.hp.max}</span>}
            </motion.div>
          )}
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[9px] text-text-tertiary/60">
          <kbd className="px-1.5 py-0.5 bg-surface-2/60 border border-border/30 rounded font-mono">\u2318K</kbd><span>{t.session.cmd}</span>
          <kbd className="px-1.5 py-0.5 bg-surface-2/60 border border-border/30 rounded font-mono">Space</kbd><span>Next</span>
          <kbd className="px-1.5 py-0.5 bg-surface-2/60 border border-border/30 rounded font-mono">R</kbd><span>{t.session.d20}</span>
        </div>
      </div>

      {/* ====== MAIN CONTENT ====== */}
      <div className="flex flex-1 min-h-0">
        {/* Left toolbar — Enhanced */}
        <div className="flex flex-col gap-0.5 bg-surface-1/90 backdrop-blur-sm border-r border-border/30 p-1.5 shrink-0 w-11 overflow-y-auto scrollbar-none">
          {/* Selection tools */}
          <span className="text-[6px] text-text-tertiary/30 uppercase tracking-widest text-center font-bold mb-0.5">{t.session.tools}</span>
          {mapTools.filter(t => t.group === 'tools').map(t => (
            <button key={t.key} onClick={() => setTool(t.key)} title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                tool === t.key ? 'bg-accent/15 text-accent shadow-sm shadow-accent/10' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2/50'
              }`}>
              {t.icon}
              <span className="text-[6px] font-bold leading-none">{t.label}</span>
            </button>
          ))}
          <div className="border-t border-border/20 my-1" />
          <span className="text-[6px] text-text-tertiary/30 uppercase tracking-widest text-center font-bold mb-0.5">{t.session.draw}</span>
          {mapTools.filter(t => t.group === 'draw').map(t => (
            <button key={t.key} onClick={() => setTool(t.key)} title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                tool === t.key ? 'bg-accent/15 text-accent shadow-sm shadow-accent/10' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2/50'
              }`}>
              {t.icon}
              <span className="text-[6px] font-bold leading-none">{t.label}</span>
            </button>
          ))}
          <div className="border-t border-border/20 my-1" />
          <span className="text-[6px] text-text-tertiary/30 uppercase tracking-widest text-center font-bold mb-0.5">{t.session.view}</span>
          <button onClick={() => setShowGrid(g => !g)} title={t.session.toggleGrid}
            className={`p-1.5 rounded-lg cursor-pointer flex flex-col items-center gap-0.5 transition-all ${showGrid ? 'text-accent bg-accent/10' : 'text-text-tertiary hover:text-text-secondary'}`}>
            <Grid3x3 className="w-3.5 h-3.5" />
            <span className="text-[6px] font-bold leading-none">{t.session.grid}</span>
          </button>
          <button onClick={() => setShowFog(f => !f)} title={t.session.toggleFog}
            className={`p-1.5 rounded-lg cursor-pointer flex flex-col items-center gap-0.5 transition-all ${showFog ? 'text-accent bg-accent/10' : 'text-text-tertiary hover:text-text-secondary'}`}>
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[6px] font-bold leading-none">{t.session.fog}</span>
          </button>
          <button onClick={() => setFogMode(m => m === 'reveal' ? 'hide' : 'reveal')} title={fogMode === 'reveal' ? t.session.fogModeReveal : t.session.fogModeHide}
            className={`p-1.5 rounded-lg cursor-pointer flex flex-col items-center gap-0.5 transition-all ${fogMode === 'hide' ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'}`}>
            {fogMode === 'reveal' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="text-[6px] font-bold leading-none">{fogMode === 'reveal' ? t.session.reveal : t.session.hide}</span>
          </button>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 text-text-tertiary hover:text-text-secondary cursor-pointer rounded-lg hover:bg-surface-2/50" title={t.session.zoomIn}>
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1.5 text-text-tertiary hover:text-text-secondary cursor-pointer rounded-lg hover:bg-surface-2/50" title={t.session.zoomOut}>
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }} className="p-1.5 text-text-tertiary hover:text-text-secondary cursor-pointer rounded-lg hover:bg-surface-2/50" title={t.session.resetView}>
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="border-t border-border/20 my-0.5" />
          {(tool.startsWith('draw-') || tool === 'text') && (
            <div className="flex flex-col gap-0.5 items-center">
              <span className="text-[5px] text-text-tertiary/30 uppercase tracking-widest font-bold mb-0.5">{t.session.color}</span>
              {DRAW_COLORS.map(c => (
                <button key={c} onClick={() => setDrawColor(c)}
                  className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all ${drawColor === c ? 'border-accent scale-125' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          )}
          <div className="flex-1" />
          <button onClick={() => setShowAddToken(true)} className="p-1.5 text-text-tertiary hover:text-accent cursor-pointer rounded-lg hover:bg-accent/10 transition-colors flex flex-col items-center gap-0.5" title={t.session.addToken}>
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[6px] font-bold leading-none">{t.session.token}</span>
          </button>
          <button onClick={() => setShowScenePicker(true)} className="p-1.5 text-text-tertiary hover:text-accent cursor-pointer rounded-lg hover:bg-accent/10 transition-colors flex flex-col items-center gap-0.5" title={t.session.scenes}>
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[6px] font-bold leading-none">{t.session.scenes}</span>
          </button>
        </div>

        {/* ====== CENTER \u2014 BATTLE MAP ====== */}
        <div className="flex-1 relative bg-surface-0 overflow-hidden">
          {activeScene ? (
            <canvas ref={canvasRef} className="w-full h-full touch-none"
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { handleMouseUp(); setHoverGrid(null); }}
              onTouchStart={e => { e.preventDefault(); const t = e.touches[0]; if (!t) return; const se = { clientX: t.clientX, clientY: t.clientY, button: 0, preventDefault: () => {} } as unknown as React.MouseEvent; handleMouseDown(se); }}
              onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; if (!t) return; const se = { clientX: t.clientX, clientY: t.clientY } as unknown as React.MouseEvent; handleMouseMove(se); }}
              onTouchEnd={e => { e.preventDefault(); handleMouseUp(); }}
              onContextMenu={handleContextMenu}
              style={{ cursor: tool === 'move' || isPanning ? 'grab' : tool === 'select' ? 'default' : tool === 'text' ? 'text' : 'crosshair' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-2/30 border border-border/20 flex items-center justify-center">
                  <Grid3x3 className="w-8 h-8 text-text-tertiary/15" />
                </div>
                <p className="text-sm font-semibold text-text-tertiary/40">{t.session.noSceneLoaded}</p>
                <p className="text-[10px] text-text-tertiary/25 mt-1">{t.session.noSceneDesc}</p>
              </div>
            </div>
          )}

          {/* Selected token HUD — Enhanced */}
          {selectedToken && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 left-3 bg-surface-1/95 backdrop-blur-xl border border-border/50 rounded-xl px-4 py-3 shadow-2xl shadow-black/40 min-w-[200px]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full text-[8px] font-bold text-white flex items-center justify-center shadow-md" style={{ backgroundColor: selectedToken.color }}>
                    {selectedToken.label}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-primary">{selectedToken.name}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {selectedToken.isPC && <span className="text-[7px] bg-accent/10 text-accent px-1 py-0.5 rounded font-bold">{t.session.pc}</span>}
                      {selectedToken.hidden && <span className="text-[7px] bg-surface-3 text-text-tertiary px-1 py-0.5 rounded font-bold flex items-center gap-0.5"><EyeOff className="w-2 h-2" /> {t.session.hidden}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedTokenId(null)} className="text-text-tertiary hover:text-text-secondary cursor-pointer p-1 rounded-lg hover:bg-surface-2/50">
                  <X className="w-3 h-3" />
                </button>
              </div>
              {selectedToken.hp && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-3 h-3 text-danger" />
                    <div className="flex-1 bg-surface-3/50 rounded-full h-2 overflow-hidden">
                      <motion.div initial={false} animate={{ width: `${(selectedToken.hp.current / selectedToken.hp.max) * 100}%` }}
                        className={`h-full rounded-full transition-colors ${
                          selectedToken.hp.current / selectedToken.hp.max > 0.5 ? 'bg-success' : selectedToken.hp.current / selectedToken.hp.max > 0.25 ? 'bg-warning' : 'bg-danger'
                        }`} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-text-secondary">{selectedToken.hp.current}/{selectedToken.hp.max}</span>
                  </div>
                  {/* Quick HP buttons */}
                  <div className="flex items-center gap-0.5">
                    {[-10, -5, -1].map(d => (
                      <button key={d} onClick={() => applyQuickHP(selectedToken.id, d)}
                        className="flex-1 text-[8px] py-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 cursor-pointer font-bold">{d}</button>
                    ))}
                    {[1, 5, 10].map(d => (
                      <button key={d} onClick={() => applyQuickHP(selectedToken.id, d)}
                        className="flex-1 text-[8px] py-0.5 rounded bg-success/10 text-success hover:bg-success/20 cursor-pointer font-bold">+{d}</button>
                    ))}
                  </div>
                </div>
              )}
              {selectedToken.conditions.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mb-1.5">
                  {selectedToken.conditions.map(c => (
                    <span key={c} className="text-[8px] px-1.5 py-0.5 bg-warning/10 text-warning rounded-md font-medium">{c}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 text-[8px] text-text-tertiary/40 border-t border-border/15 pt-1.5 mt-1">
                <span className="font-mono flex items-center gap-0.5"><Crosshair className="w-2.5 h-2.5" /> {String.fromCharCode(65 + selectedToken.x)}{selectedToken.y + 1}</span>
                <span className="font-mono">Size {selectedToken.size}</span>
                <span className="flex-1" />
                <span>Right-click for more</span>
              </div>
            </motion.div>
          )}

          {/* Enhanced Status bar */}
          <div className="absolute bottom-2 left-2 bg-surface-1/80 backdrop-blur-md text-[9px] text-text-tertiary/60 px-3 py-1.5 rounded-xl flex items-center gap-3 border border-border/20 shadow-lg shadow-black/20">
            <span className="font-mono font-bold text-text-secondary">{Math.round(zoom * 100)}%</span>
            <span className="w-px h-3 bg-border/30" />
            {activeScene && <span className="font-medium">{activeScene.name}</span>}
            <span className="w-px h-3 bg-border/30" />
            <span className="flex items-center gap-0.5"><Grid3x3 className="w-2.5 h-2.5" /> {showGrid ? t.session.grid : 'Off'}</span>
            {hoverGrid && activeScene && hoverGrid.x >= 0 && hoverGrid.y >= 0 && hoverGrid.x < activeScene.width && hoverGrid.y < activeScene.height && (
              <>
                <span className="w-px h-3 bg-border/30" />
                <span className="font-mono text-accent/70 font-bold flex items-center gap-0.5">
                  <Crosshair className="w-2.5 h-2.5" />
                  {String.fromCharCode(65 + hoverGrid.x)}{hoverGrid.y + 1}
                </span>
              </>
            )}
            {activeScene && (
              <>
                <span className="w-px h-3 bg-border/30" />
                <span className="flex items-center gap-0.5">
                  <Users className="w-2.5 h-2.5" /> {(activeScene.tokens || []).filter(t => !t.hidden).length} tokens
                </span>
              </>
            )}
          </div>

          {/* Measure tool hint */}
          {tool === 'measure' && !measureStart && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-warning/15 backdrop-blur-md border border-warning/20 text-warning text-[10px] font-bold px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
              <Ruler className="w-3.5 h-3.5" /> Click & drag to measure distance
            </div>
          )}

          {/* Text tool hint */}
          {tool === 'text' && !textInputPos && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-500/15 backdrop-blur-md border border-blue-500/20 text-blue-400 text-[10px] font-bold px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
              <Type className="w-3.5 h-3.5" /> Click on the map to place text
            </div>
          )}

          {/* Floating text input */}
          {textInputPos && (
            <div className="fixed z-[110]" style={{ left: textInputPos.screenX, top: textInputPos.screenY - 40 }}>
              <div className="bg-surface-1/95 backdrop-blur-xl border border-accent/30 rounded-xl px-3 py-2 shadow-2xl shadow-black/40 flex items-center gap-2">
                <Type className="w-3.5 h-3.5 text-accent shrink-0" />
                <input
                  type="text" value={textInputValue} onChange={e => setTextInputValue(e.target.value)}
                  placeholder="Type text label..."
                  autoFocus
                  className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-tertiary/40 w-48"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && textInputValue.trim() && activeScene) {
                      const newTextDrawing = { id: crypto.randomUUID(), type: 'text' as const, points: [{ x: textInputPos.x, y: textInputPos.y }], color: drawColor, lineWidth: 16, text: textInputValue.trim(), visible: true };
                      const updatedDrawings = [...(activeScene.drawings || []), newTextDrawing];
                      setActiveScene(prev => prev ? { ...prev, drawings: updatedDrawings } : null);
                      api.updateScene(activeScene.id, { drawings: updatedDrawings }).catch(err => console.error('Failed to save text drawing:', err));
                      setTextInputPos(null); setTextInputValue('');
                    }
                    if (e.key === 'Escape') { setTextInputPos(null); setTextInputValue(''); }
                  }}
                />
                <button onClick={() => {
                  if (textInputValue.trim() && activeScene) {
                    const newTextDrawing = { id: crypto.randomUUID(), type: 'text' as const, points: [{ x: textInputPos.x, y: textInputPos.y }], color: drawColor, lineWidth: 16, text: textInputValue.trim(), visible: true };
                    const updatedDrawings = [...(activeScene.drawings || []), newTextDrawing];
                    setActiveScene(prev => prev ? { ...prev, drawings: updatedDrawings } : null);
                    api.updateScene(activeScene.id, { drawings: updatedDrawings }).catch(err => console.error('Failed to save text drawing:', err));
                  }
                  setTextInputPos(null); setTextInputValue('');
                }} className="text-[9px] bg-accent/15 text-accent px-2 py-1 rounded-lg font-bold cursor-pointer hover:bg-accent/25 transition-colors">
                  Place
                </button>
                <button onClick={() => { setTextInputPos(null); setTextInputValue(''); }}
                  className="text-text-tertiary hover:text-text-secondary cursor-pointer p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Token Context Menu */}
          <AnimatePresence>
            {contextMenu && isDM && (() => {
              const ctxToken = activeScene?.tokens?.find(t => t.id === contextMenu.tokenId);
              if (!ctxToken) return null;
              return (
                <motion.div key="ctx-menu" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed z-[100] bg-surface-1/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/40 py-1.5 w-52 overflow-hidden"
                  style={{ left: contextMenu.x, top: contextMenu.y }}>
                  {/* Header */}
                  <div className="px-3 py-1.5 border-b border-border/20">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full text-[8px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: ctxToken.color }}>
                        {ctxToken.label}
                      </div>
                      <span className="text-[11px] font-bold text-text-primary truncate">{ctxToken.name}</span>
                    </div>
                    {ctxToken.hp && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Heart className="w-2.5 h-2.5 text-danger/60" />
                        <span className="text-[9px] font-mono text-text-tertiary">{ctxToken.hp.current}/{ctxToken.hp.max}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick HP */}
                  {ctxToken.hp && (
                    <div className="px-2 py-1 border-b border-border/10">
                      <div className="flex items-center gap-1">
                        <button onClick={() => applyQuickHP(ctxToken.id, -5)} className="flex-1 text-[9px] py-1 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 cursor-pointer font-bold">-5</button>
                        <button onClick={() => applyQuickHP(ctxToken.id, -1)} className="flex-1 text-[9px] py-1 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 cursor-pointer font-bold">-1</button>
                        <button onClick={() => applyQuickHP(ctxToken.id, 1)} className="flex-1 text-[9px] py-1 rounded-lg bg-success/10 text-success hover:bg-success/20 cursor-pointer font-bold">+1</button>
                        <button onClick={() => applyQuickHP(ctxToken.id, 5)} className="flex-1 text-[9px] py-1 rounded-lg bg-success/10 text-success hover:bg-success/20 cursor-pointer font-bold">+5</button>
                        <button onClick={() => applyQuickHP(ctxToken.id, 10)} className="flex-1 text-[9px] py-1 rounded-lg bg-success/10 text-success hover:bg-success/20 cursor-pointer font-bold">+10</button>
                      </div>
                    </div>
                  )}

                  {/* Quick Conditions */}
                  <div className="px-2 py-1.5 border-b border-border/10">
                    <span className="text-[8px] text-text-tertiary/40 uppercase tracking-wider font-bold px-1">Conditions</span>
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {['Prone', 'Stunned', 'Poisoned', 'Frightened', 'Restrained', 'Invisible', 'Concentrating'].map(c => (
                        <button key={c} onClick={() => toggleTokenCondition(ctxToken.id, c)}
                          className={`text-[8px] px-1.5 py-0.5 rounded-md cursor-pointer transition-colors font-medium ${
                            ctxToken.conditions.includes(c) ? 'bg-warning/20 text-warning border border-warning/30' : 'bg-surface-2/50 text-text-tertiary hover:bg-surface-2 border border-transparent'
                          }`}>{c}</button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="py-0.5">
                    <button onClick={() => { toggleTokenVisibility(ctxToken.id); setContextMenu(null); }}
                      className="w-full text-left px-3 py-1.5 text-[10px] text-text-secondary hover:bg-surface-2/50 cursor-pointer flex items-center gap-2">
                      {ctxToken.hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {ctxToken.hidden ? 'Show to Players' : 'Hide from Players'}
                    </button>
                    <button onClick={() => {
                      if (activeScene) {
                        setActiveScene(prev => prev ? { ...prev, tokens: (prev.tokens || []).filter(t => t.id !== ctxToken.id) } : null);
                        setSelectedTokenId(null);
                        api.removeToken(ctxToken.id).catch(err => console.error('Failed to remove token:', err));
                      }
                      setContextMenu(null);
                    }} className="w-full text-left px-3 py-1.5 text-[10px] text-danger hover:bg-danger/10 cursor-pointer flex items-center gap-2">
                      <Trash2 className="w-3 h-3" /> Remove Token
                    </button>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* ====== RIGHT PANEL — Collapsible (maximized → full → tabs-only → hidden) ====== */}
        {rightPanelMode !== 'hidden' && rightPanelMode !== 'maximized' && (
          <div className="shrink-0 flex bg-surface-0 border-l border-border/30 overflow-hidden">
            {/* Tab icon strip — always visible when not hidden */}
            <div className="flex flex-col border-r border-border/20 bg-surface-1/60 shrink-0 w-12">
              {([
                { key: 'initiative' as RightTab, icon: <Swords className="w-4 h-4" />, label: 'Combat' },
                { key: 'chat' as RightTab, icon: <MessageSquare className="w-4 h-4" />, label: 'Chat' },
                ...(isDM ? [{ key: 'dm-screen' as RightTab, icon: <ScrollText className="w-4 h-4" />, label: 'DM' }] : []),
                { key: 'notes' as RightTab, icon: <BookOpen className="w-4 h-4" />, label: 'Notes' },
                { key: 'voice' as RightTab, icon: <Volume2 className="w-4 h-4" />, label: 'Voice' },
                { key: 'lore' as RightTab, icon: <Globe className="w-4 h-4" />, label: 'Lore' },
                { key: 'quests' as RightTab, icon: <ScrollText className="w-4 h-4" />, label: 'Quests' },
                { key: 'combat-auto' as RightTab, icon: <Sword className="w-4 h-4" />, label: 'Auto' },
              ] as { key: RightTab; icon: React.ReactNode; label: string }[]).map(tab => (
                <button key={tab.key} onClick={() => {
                  setRightTab(tab.key);
                  if (rightPanelMode === 'tabs') setRightPanelMode('full');
                }}
                  title={tab.label}
                  className={`flex flex-col items-center justify-center gap-0.5 px-1 py-2.5 text-[8px] font-bold tracking-wide transition-all cursor-pointer ${
                    rightTab === tab.key && rightPanelMode === 'full'
                      ? 'text-accent bg-accent/10 border-r-2 border-accent'
                      : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2/30'
                  }`}>
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
              <div className="flex-1" />
              {/* Maximize button */}
              <button
                onClick={() => setRightPanelMode('maximized')}
                title="Maximize panel"
                className="flex items-center justify-center py-2 text-text-tertiary/40 hover:text-accent cursor-pointer transition-colors border-t border-border/20">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              {/* Collapse/Expand button */}
              <button
                onClick={() => setRightPanelMode(m => m === 'full' ? 'tabs' : m === 'tabs' ? 'hidden' : 'full')}
                title={rightPanelMode === 'full' ? 'Collapse panel' : 'Hide panel'}
                className="flex items-center justify-center py-2 text-text-tertiary/40 hover:text-accent cursor-pointer transition-colors border-t border-border/20">
                {rightPanelMode === 'full' ? <PanelRightClose className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Panel content — only when fully open */}
            <AnimatePresence>
              {rightPanelMode === 'full' && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 360, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="flex flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-hidden">
                    {rightTab === 'initiative' && (
                      <div className="h-full overflow-y-auto">
                        <InitiativeTracker isDM={isDM} campaignId={activeCampaignId} />
                      </div>
                    )}
                    {rightTab === 'chat' && activeCampaignId && (
                      <ChatPanel campaignId={activeCampaignId} isDM={isDM} height="h-full" className="border-0 rounded-none h-full" />
                    )}
                    {rightTab === 'dm-screen' && isDM && (
                      <DMQuickReference />
                    )}
                    {rightTab === 'notes' && (
                      <div className="p-3 h-full flex flex-col">
                        <div className="flex items-center gap-1.5 mb-2">
                          <BookOpen className="w-3 h-3 text-accent/60" />
                          <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Session Notes</label>
                        </div>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)}
                          placeholder="Jot down notes, plot hooks, NPC names..."
                          className="flex-1 w-full bg-surface-2/30 border border-border/30 rounded-xl px-3 py-2.5 text-xs text-text-secondary resize-none focus:border-accent/30 outline-none transition-colors placeholder:text-text-tertiary/30" />
                      </div>
                    )}
                    {rightTab === 'voice' && activeCampaignId && (
                      <VoicePanel campaignId={activeCampaignId} isDM={isDM} className="border-0 rounded-none h-full" />
                    )}
                    {rightTab === 'lore' && activeCampaignId && (
                      <LoreWikiPanel campaignId={activeCampaignId} isDM={isDM} />
                    )}
                    {rightTab === 'quests' && activeCampaignId && (
                      <QuestBoardPanel campaignId={activeCampaignId} isDM={isDM} />
                    )}
                    {rightTab === 'combat-auto' && (
                      <CombatAutopilotPanel isDM={isDM} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {/* Reopen button when fully hidden */}
        {rightPanelMode === 'hidden' && (
          <button onClick={() => setRightPanelMode('tabs')}
            className="flex items-center justify-center w-5 bg-surface-1/50 border-l border-border/20 text-text-tertiary/40 hover:text-accent cursor-pointer shrink-0 transition-colors">
            <PanelRightOpen className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ====== MAXIMIZED PANEL OVERLAY ====== */}
      <AnimatePresence>
        {rightPanelMode === 'maximized' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] flex flex-col bg-surface-0/98 backdrop-blur-xl"
          >
            {/* Maximized header with tabs */}
            <div className="flex items-center border-b border-border/40 bg-surface-1/80 backdrop-blur-md shrink-0 px-2">
              <div className="flex items-center flex-1">
                {([
                  { key: 'initiative' as RightTab, icon: <Swords className="w-4 h-4" />, label: 'Combat' },
                  { key: 'chat' as RightTab, icon: <MessageSquare className="w-4 h-4" />, label: 'Chat' },
                  ...(isDM ? [{ key: 'dm-screen' as RightTab, icon: <ScrollText className="w-4 h-4" />, label: 'DM' }] : []),
                  { key: 'notes' as RightTab, icon: <BookOpen className="w-4 h-4" />, label: 'Notes' },
                  { key: 'voice' as RightTab, icon: <Volume2 className="w-4 h-4" />, label: 'Voice' },
                  { key: 'lore' as RightTab, icon: <Globe className="w-4 h-4" />, label: 'Lore' },
                  { key: 'quests' as RightTab, icon: <ScrollText className="w-4 h-4" />, label: 'Quests' },
                  { key: 'combat-auto' as RightTab, icon: <Sword className="w-4 h-4" />, label: 'Auto' },
                ] as { key: RightTab; icon: React.ReactNode; label: string }[]).map(tab => (
                  <button key={tab.key} onClick={() => setRightTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wide transition-all cursor-pointer ${
                      rightTab === tab.key
                        ? 'text-accent border-b-2 border-accent bg-accent/5'
                        : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2/30'
                    }`}>
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setRightPanelMode('full')}
                  title="Restore panel"
                  className="p-2 text-text-tertiary hover:text-accent cursor-pointer rounded-lg hover:bg-surface-2/50 transition-colors">
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button onClick={() => setRightPanelMode('tabs')}
                  title="Close"
                  className="p-2 text-text-tertiary hover:text-text-primary cursor-pointer rounded-lg hover:bg-surface-2/50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Maximized content */}
            <div className="flex-1 overflow-hidden">
              {rightTab === 'initiative' && (
                <div className="h-full overflow-y-auto">
                  <InitiativeTracker isDM={isDM} campaignId={activeCampaignId} />
                </div>
              )}
              {rightTab === 'chat' && activeCampaignId && (
                <ChatPanel campaignId={activeCampaignId} isDM={isDM} height="h-full" className="border-0 rounded-none h-full" />
              )}
              {rightTab === 'dm-screen' && isDM && (
                <DMQuickReference />
              )}
              {rightTab === 'notes' && (
                <div className="p-6 h-full flex flex-col max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-accent/60" />
                    <label className="text-sm font-bold text-text-secondary">Session Notes</label>
                  </div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Jot down notes, plot hooks, NPC names..."
                    className="flex-1 w-full bg-surface-2/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-text-secondary resize-none focus:border-accent/30 outline-none transition-colors placeholder:text-text-tertiary/30" />
                </div>
              )}
              {rightTab === 'voice' && activeCampaignId && (
                <VoicePanel campaignId={activeCampaignId} isDM={isDM} className="border-0 rounded-none h-full" />
              )}
              {rightTab === 'lore' && activeCampaignId && (
                <LoreWikiPanel campaignId={activeCampaignId} isDM={isDM} />
              )}
              {rightTab === 'quests' && activeCampaignId && (
                <QuestBoardPanel campaignId={activeCampaignId} isDM={isDM} />
              )}
              {rightTab === 'combat-auto' && (
                <CombatAutopilotPanel isDM={isDM} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== BOTTOM AUDIO BAR ====== */}
      {activeCampaignId && <AudioBar campaignId={activeCampaignId} />}

      {/* Dice Overlay */}
      <DiceOverlay onApplyDamage={applyDamageToSelected} onApplyHealing={applyHealingToSelected} />

      {/* ====== ADD TOKEN MODAL ====== */}
      <AnimatePresence>
        {showAddToken && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddToken(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="relative w-[440px] max-h-[85vh] bg-surface-1 border border-border/50 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col">
              <div className="relative px-5 pt-5 pb-3">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-sm font-display font-bold text-text-primary">{t.session.addToken}</h2>
                      <p className="text-[9px] text-text-tertiary mt-0.5">Map + Initiative auto-sync</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddToken(false)} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex mt-3 bg-surface-2/50 rounded-xl p-0.5 border border-border/20">
                  <button onClick={() => setTokenTab('party')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${tokenTab === 'party' ? 'bg-accent/15 text-accent shadow-sm border border-accent/20' : 'text-text-tertiary hover:text-text-secondary'}`}>
                    <Users className="w-3 h-3" /> Party ({partyCharacters.length})
                  </button>
                  <button onClick={() => setTokenTab('manual')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${tokenTab === 'manual' ? 'bg-accent/15 text-accent shadow-sm border border-accent/20' : 'text-text-tertiary hover:text-text-secondary'}`}>
                    <Skull className="w-3 h-3" /> {t.session.npc}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin px-5 pb-5">
                <AnimatePresence mode="wait">
                  {tokenTab === 'party' ? (
                    <motion.div key="party" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-1.5">
                      {partyCharacters.length === 0 ? (
                        <div className="text-center py-10">
                          <Users className="w-8 h-8 text-text-tertiary/15 mx-auto mb-2" />
                          <p className="text-xs text-text-tertiary/40">No party members</p>
                        </div>
                      ) : (
                        <>
                          {partyCharacters.filter(ch => !existingTokenNames.includes(ch.name)).length > 1 && (
                            <button onClick={addAllPartyTokens} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent/12 to-accent/5 border border-accent/15 text-accent text-[10px] font-bold hover:from-accent/18 hover:to-accent/8 transition-all cursor-pointer">
                              <Crown className="w-3 h-3" /> Add Entire Party ({partyCharacters.filter(ch => !existingTokenNames.includes(ch.name)).length})
                            </button>
                          )}
                          {partyCharacters.filter(ch => !existingTokenNames.includes(ch.name)).map(ch => {
                            const cc = CLASS_COLORS_MAP[ch.class] || '#6b7280'; const ci = CLASS_ICONS_MAP[ch.class] || '\u2694\uFE0F';
                            return (
                              <motion.button key={ch.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} onClick={() => addTokenFromCharacter(ch)}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-2/30 border border-border/20 hover:border-accent/25 hover:bg-accent/5 transition-all cursor-pointer group/pc">
                                <div className="relative">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-md" style={{ backgroundColor: cc, boxShadow: `0 3px 10px ${cc}25` }}>
                                    {ch.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded bg-surface-1 border border-border/30 flex items-center justify-center text-[7px]">{ci}</div>
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="text-[11px] font-semibold text-text-primary truncate group-hover/pc:text-accent transition-colors">{ch.name}</div>
                                  <div className="text-[9px] text-text-tertiary">Lv.{ch.level} {ch.race} {ch.class}</div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-tertiary shrink-0">
                                  <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-danger/50" />{ch.hp.max}</span>
                                  <span className="flex items-center gap-0.5"><Shield className="w-2.5 h-2.5 text-blue-400/50" />{ch.armorClass}</span>
                                </div>
                                <UserPlus className="w-3.5 h-3.5 text-accent/0 group-hover/pc:text-accent transition-all shrink-0" />
                              </motion.button>
                            );
                          })}
                          {partyCharacters.filter(ch => existingTokenNames.includes(ch.name)).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/20">
                              <span className="text-[8px] text-text-tertiary/40 uppercase tracking-wider font-bold px-0.5">On Map</span>
                              {partyCharacters.filter(ch => existingTokenNames.includes(ch.name)).map(ch => (
                                <div key={ch.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg opacity-35 mt-0.5">
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: CLASS_COLORS_MAP[ch.class] || '#6b7280' }}>{ch.name.slice(0, 2).toUpperCase()}</div>
                                  <span className="text-[10px] text-text-tertiary truncate flex-1">{ch.name}</span>
                                  <span className="text-[8px] text-success/50">\u2713</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="manual" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Name</label>
                        <input type="text" value={tokenName} onChange={e => setTokenName(e.target.value)} placeholder="Goblin, Dragon, etc."
                          className="w-full bg-surface-2/40 border border-border/30 rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary/30 focus:border-accent/40 outline-none transition-colors" autoFocus />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-1 flex items-center gap-0.5"><Target className="w-2.5 h-2.5" /> Size</label>
                          <input type="number" min={1} max={4} value={tokenSize} onChange={e => setTokenSize(parseInt(e.target.value) || 1)} className="w-full bg-surface-2/40 border border-border/30 rounded-xl px-2.5 py-2 text-sm text-center font-mono focus:border-accent/40 outline-none" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-1 flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-danger/50" /> HP</label>
                          <input type="number" value={tokenHP} onChange={e => setTokenHP(e.target.value)} placeholder="0" className="w-full bg-surface-2/40 border border-border/30 rounded-xl px-2.5 py-2 text-sm text-center font-mono placeholder:text-text-tertiary/30 focus:border-accent/40 outline-none" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-1 flex items-center gap-0.5"><Shield className="w-2.5 h-2.5 text-blue-400/50" /> AC</label>
                          <input type="number" value={tokenAC} onChange={e => setTokenAC(e.target.value)} placeholder="0" className="w-full bg-surface-2/40 border border-border/30 rounded-xl px-2.5 py-2 text-sm text-center font-mono placeholder:text-text-tertiary/30 focus:border-accent/40 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5 block">Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {TOKEN_COLORS.map(c => (
                            <button key={c} onClick={() => setTokenColor(c)} className={`w-7 h-7 rounded-xl transition-all cursor-pointer border-2 ${tokenColor === c ? 'border-accent scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                              style={{ backgroundColor: c, boxShadow: tokenColor === c ? `0 3px 10px ${c}35` : 'none' }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setTokenIsPC(true)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold cursor-pointer border transition-all ${tokenIsPC ? 'bg-accent/10 text-accent border-accent/20' : 'bg-surface-2/30 text-text-tertiary border-border/20'}`}>
                          <Crown className="w-3 h-3" /> {t.session.pc}
                        </button>
                        <button onClick={() => setTokenIsPC(false)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold cursor-pointer border transition-all ${!tokenIsPC ? 'bg-danger/10 text-danger border-danger/20' : 'bg-surface-2/30 text-text-tertiary border-border/20'}`}>
                          <Skull className="w-3 h-3" /> {t.session.npc}
                        </button>
                      </div>
                      {/* Preview */}
                      <div className="bg-surface-2/20 border border-border/15 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg" style={{ backgroundColor: tokenColor, boxShadow: `0 3px 12px ${tokenColor}30` }}>
                          {tokenName ? tokenName.slice(0, 2).toUpperCase() : '??'}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-text-primary">{tokenName || 'Token Name'}</p>
                          <div className="flex items-center gap-2 text-[9px] text-text-tertiary font-mono mt-0.5">
                            {parseInt(tokenHP) > 0 && <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-danger/50" />{tokenHP}</span>}
                            {parseInt(tokenAC) > 0 && <span className="flex items-center gap-0.5"><Shield className="w-2.5 h-2.5 text-blue-400/50" />{tokenAC}</span>}
                            <span>{tokenIsPC ? t.session.pc : t.session.npc}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 bg-accent/5 border border-accent/10 rounded-xl px-3 py-2">
                        <Sparkles className="w-3.5 h-3.5 text-accent/50 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-accent/50 leading-relaxed">Auto-placed on map center + added to <strong className="text-accent/70">initiative</strong> with rolled init.</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAddToken(false)} className="px-3 py-1.5 text-[10px] text-text-tertiary hover:text-text-secondary cursor-pointer transition-colors rounded-lg">Cancel</button>
                        <button onClick={addToken} disabled={!tokenName.trim()} className="px-4 py-1.5 bg-gradient-to-r from-accent to-accent-dim text-surface-0 rounded-xl text-[10px] font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-accent/20">{t.session.addToken}</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scene Picker */}
      <Modal open={showScenePicker} onClose={() => setShowScenePicker(false)} title="Select Scene">
        <div className="space-y-1.5">
          {scenes.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-6">No scenes. Create one in Battle Map.</p>
          ) : scenes.map(s => (
            <button key={s.id} onClick={() => { setActiveScene(s); setShowScenePicker(false); setSelectedTokenId(null); }}
              className={`w-full text-left px-3 py-2 rounded-xl transition-colors cursor-pointer ${activeScene?.id === s.id ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-surface-2/30 text-text-secondary border border-border/20 hover:bg-surface-2/50'}`}>
              <span className="text-xs font-medium">{s.name}</span>
              <span className="text-[10px] text-text-tertiary ml-2">({s.width}\u00d7{s.height})</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// PLAYER SESSION VIEW — Full-featured player cockpit
// Integrated into session with live dice logging, combat feed
// ============================================================
interface PlayerSessionViewProps {
  user: { id: string; displayName: string } | null;
  session: ReturnType<typeof useChatStore.getState>['session'];
  campaigns: Campaign[];
  activeCampaignId: string;
  setActiveCampaignId: (id: string) => void;
  entries: { id: string; name: string; initiative: number; isActive: boolean; isNPC: boolean; hp?: { current: number; max: number } | null; armorClass?: number | null; conditions: string[]; concentratingOn?: string | null; characterId?: string | null; tokenId?: string | null }[];
  activeEntry: { id: string; name: string; characterId?: string | null } | null;
}

function PlayerInitiativeRow({ entry }: { entry: PlayerSessionViewProps['entries'][0] }) {
  const { t } = useTranslation();
  const isDown = entry.hp && entry.hp.current <= 0;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
      entry.isActive ? 'bg-accent/10 border border-accent/30' : isDown ? 'bg-danger/5 border border-danger/15 opacity-50' : 'bg-surface-2/40 border border-transparent'
    }`}>
      <div className={`w-1.5 h-7 rounded-full shrink-0 ${entry.isActive ? 'bg-accent' : 'bg-transparent'}`} />
      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold shrink-0 ${
        entry.isActive ? 'bg-accent/20 text-accent' : 'bg-surface-3 text-text-tertiary'
      }`}>{entry.initiative}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium truncate ${entry.isActive ? 'text-accent' : isDown ? 'text-danger line-through' : 'text-text-primary'}`}>{entry.name}</span>
          {entry.isNPC && <span className="text-[9px] bg-surface-3 text-text-tertiary px-1 py-0.5 rounded">{t.session.npc}</span>}
          {isDown && <Skull className="w-3 h-3 text-danger" />}
          {entry.concentratingOn && <span className="text-[9px] bg-info/15 text-info px-1 py-0.5 rounded flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />{entry.concentratingOn}</span>}
        </div>
        {entry.conditions.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {entry.conditions.map(c => <span key={c} className="text-[9px] bg-warning/10 text-warning px-1 py-0.5 rounded">{c}</span>)}
          </div>
        )}
      </div>
      {entry.hp && !entry.isNPC && (
        <span className={`text-xs font-mono flex items-center gap-0.5 ${
          entry.hp.current <= entry.hp.max / 4 ? 'text-danger' : entry.hp.current <= entry.hp.max / 2 ? 'text-warning' : 'text-text-tertiary'
        }`}><Heart className="w-3 h-3" />{entry.hp.current}/{entry.hp.max}</span>
      )}
      {entry.hp && entry.isNPC && (
        <span className="text-xs text-text-tertiary font-mono flex items-center gap-0.5">
          <Heart className="w-3 h-3" />{isDown ? 'Down' : entry.hp.current <= entry.hp.max / 2 ? 'Bloodied' : 'Healthy'}
        </span>
      )}
      {entry.armorClass && !entry.isNPC && (
        <span className="text-xs text-text-tertiary font-mono flex items-center gap-0.5"><Shield className="w-3 h-3" />{entry.armorClass}</span>
      )}
    </div>
  );
}

function PlayerSessionView({ user, session, campaigns, activeCampaignId, setActiveCampaignId, entries, activeEntry }: PlayerSessionViewProps) {
  const toast = useToast();
  const { t } = useTranslation();
  const { turnTimerEnabled, turnTimerRemaining, turnTimerSeconds } = useChatStore();
  const [tab, setTab] = useState<'combat' | 'character' | 'chat' | 'notes'>('combat');
  const [diceFormula, setDiceFormula] = useState('');
  const [lastRoll, setLastRoll] = useState<{ formula: string; total: number; rolls: number[]; modifier: number } | null>(null);
  const [rolling, setRolling] = useState(false);
  const [combatFeed, setCombatFeed] = useState<{ id: string; action: string; result: string; turn: string; round: number; createdAt: string }[]>([]);
  const [myNote, setMyNote] = useState('');

  // Player characters
  const [myCharacters, setMyCharacters] = useState<Character[]>([]);
  useEffect(() => {
    if (activeCampaignId) {
      api.getCharactersByCampaign(activeCampaignId).then(chars => {
        setMyCharacters((chars || []).filter((c: any) => c.playerId === user?.id));
      }).catch(() => setMyCharacters([]));
    }
  }, [activeCampaignId, user?.id]);
  const isMyTurn = activeEntry && myCharacters.some(c => activeEntry.characterId === c.id || activeEntry.name === c.name);

  const timerPct = turnTimerSeconds > 0 ? (turnTimerRemaining / turnTimerSeconds) * 100 : 0;

  // Notes persistence
  const noteKey = `taverna_player_notes_${activeCampaignId || 'global'}`;
  useEffect(() => { setMyNote(localStorage.getItem(noteKey) || ''); }, [noteKey]);
  useEffect(() => { localStorage.setItem(noteKey, myNote); }, [myNote, noteKey]);

  // Fetch combat feed periodically
  const fetchCombatFeed = useCallback(async () => {
    if (!session?.id) return;
    try {
      const res = await fetch(`/api/sessions/${session.id}/combat-log?limit=30`);
      const json = await res.json();
      if (json.success) {
        setCombatFeed(json.data.logs.map((l: { id: string; action: string; result: string; turn: string; round: number; createdAt: string }) => {
          let parsedResult = l.result;
          try { const parsed = JSON.parse(l.result); parsedResult = parsed.text || l.result; } catch { /* plain text */ }
          return { ...l, result: parsedResult };
        }));
      }
    } catch { /* silent */ }
  }, [session?.id]);

  useEffect(() => { fetchCombatFeed(); const iv = setInterval(fetchCombatFeed, 3000); return () => clearInterval(iv); }, [fetchCombatFeed]);

  // Session-integrated dice roll
  const rollDice = async (formula: string, label?: string) => {
    if (!session?.id || rolling) return;
    setRolling(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formula,
          label,
          characterName: myCharacters[0]?.name || user?.displayName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLastRoll({ formula, total: json.data.total, rolls: json.data.rolls, modifier: json.data.modifier });
        window.dispatchEvent(new CustomEvent('taverna:dice-roll', {
          detail: { formula, rolls: json.data.rolls, total: json.data.total, modifier: json.data.modifier, source: 'session-player' },
        }));
        toast.info(`🎲 ${formula} = ${json.data.total}`);
        fetchCombatFeed();
      } else {
        toast.error('Roll failed');
      }
    } catch { toast.error('Connection error'); }
    finally { setRolling(false); }
  };

  const mod = (score: number) => { const m = Math.floor((score - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };

  const tabs = [
    { id: 'combat' as const, label: 'Combat', icon: Swords },
    { id: 'character' as const, label: 'Character', icon: Users },
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { id: 'notes' as const, label: 'Notes', icon: Scroll },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* My Turn Banner */}
      <AnimatePresence>
        {isMyTurn && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-accent text-surface-0 text-center py-3 px-4 font-bold text-lg tracking-wide shrink-0 z-10">
            <div className="flex items-center justify-center gap-2">
              <Swords className="w-5 h-5" /> IT&apos;S YOUR TURN! <Swords className="w-5 h-5" />
            </div>
            {turnTimerEnabled && (
              <div className="mt-1">
                <span className="text-sm font-mono opacity-80">{Math.floor(turnTimerRemaining / 60)}:{(turnTimerRemaining % 60).toString().padStart(2, '0')}</span>
                <div className="h-1 bg-surface-0/20 rounded-full mt-1 max-w-xs mx-auto overflow-hidden">
                  <div className="h-full bg-surface-0 rounded-full transition-all" style={{ width: `${timerPct}%` }} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-1/95 backdrop-blur-md border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xs font-display font-bold text-text-primary">{t.session.liveSession}</h1>
              {session && <span className="flex items-center gap-1 text-[9px] text-success"><span className="w-1 h-1 rounded-full bg-success animate-pulse" /> {t.session.live} — Round {session.currentRound || 1}</span>}
            </div>
          </div>
          {activeCampaignId && (
            <select value={activeCampaignId}
              onChange={e => setActiveCampaignId(e.target.value)}
              className="bg-surface-2/60 border border-border/40 rounded-lg px-2.5 py-1 text-[10px] text-text-secondary focus:border-accent/40 outline-none cursor-pointer">
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold bg-blue-500/10 border-blue-500/25 text-blue-400">
            <Swords className="w-3 h-3" /> {t.session.playerMode}
          </div>
          {activeEntry && (
            <div className="hidden md:flex items-center gap-2 bg-accent/8 border border-accent/15 rounded-lg px-2.5 py-1">
              <Swords className="w-3 h-3 text-accent" />
              <span className="text-[10px] text-accent font-bold truncate max-w-[120px]">{activeEntry.name}&apos;s turn</span>
            </div>
          )}
        </div>
        <div className="flex gap-0.5 bg-surface-2 rounded-lg p-0.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                tab === t.id ? 'bg-accent text-surface-0' : 'text-text-secondary hover:text-text-primary'
              }`}><t.icon className="w-3 h-3" />{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4">
          {/* COMBAT TAB */}
          {tab === 'combat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Initiative + Timer */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Swords className="w-3.5 h-3.5" /> Initiative Order
                    <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded ml-auto">Round {session?.currentRound || 1}</span>
                  </h3>
                  {turnTimerEnabled && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Timer className={`w-3 h-3 ${turnTimerRemaining <= 10 ? 'text-danger animate-pulse' : 'text-accent'}`} />
                        <span className={`text-xs font-mono font-bold ${turnTimerRemaining <= 10 ? 'text-danger' : 'text-text-primary'}`}>
                          {Math.floor(turnTimerRemaining / 60)}:{(turnTimerRemaining % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${turnTimerRemaining <= 10 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${timerPct}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    {entries.length === 0 ? (
                      <div className="text-center py-8">
                        <Swords className="w-8 h-8 text-text-tertiary/20 mx-auto mb-2" />
                        <p className="text-xs text-text-tertiary">No combat active</p>
                        <p className="text-[10px] text-text-tertiary/60 mt-1">Waiting for DM to start initiative...</p>
                      </div>
                    ) : entries.map(e => <PlayerInitiativeRow key={e.id} entry={e} />)}
                  </div>
                </Card>

                {/* Combat Feed */}
                <Card>
                  <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <ScrollText className="w-3.5 h-3.5" /> Combat Feed
                  </h3>
                  <div className="space-y-1 max-h-52 overflow-y-auto scrollbar-thin">
                    {combatFeed.length === 0 ? (
                      <p className="text-xs text-text-tertiary/40 text-center py-4">No combat actions yet</p>
                    ) : combatFeed.slice(0, 20).map(log => {
                      const actionColors: Record<string, string> = { DAMAGE: 'text-danger', HEALING: 'text-success', DEATH: 'text-danger', DICE_ROLL: 'text-accent', CONDITION_ADD: 'text-warning', CONDITION_REMOVE: 'text-info', STABILIZE: 'text-success' };
                      const actionIcons: Record<string, string> = { DAMAGE: '⚔️', HEALING: '💚', DEATH: '💀', DICE_ROLL: '🎲', CONDITION_ADD: '⚡', CONDITION_REMOVE: '✨', STABILIZE: '✨' };
                      return (
                        <div key={log.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2/30 transition-colors">
                          <span className="text-xs shrink-0">{actionIcons[log.action] || '📋'}</span>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[10px] ${actionColors[log.action] || 'text-text-secondary'}`}>{log.result}</span>
                          </div>
                          <span className="text-[8px] text-text-muted shrink-0">R{log.round}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Dice Roller */}
              <div className="space-y-4">
                <Card>
                  <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Dices className="w-3.5 h-3.5" /> Dice Roller
                    <span className="text-[8px] bg-success/10 text-success px-1.5 py-0.5 rounded ml-auto">Session-Linked</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {['1d20', '1d12', '1d10', '1d8', '1d6', '1d4', '2d6', '1d100'].map(d => (
                      <button key={d} onClick={() => rollDice(d)} disabled={rolling || !session?.id}
                        className="py-1.5 bg-surface-2 hover:bg-accent/10 hover:text-accent text-text-secondary text-xs font-mono rounded transition-colors cursor-pointer disabled:opacity-30">{d}</button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input type="text" placeholder="Custom (e.g. 2d8+3)" value={diceFormula} onChange={e => setDiceFormula(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && diceFormula.trim()) rollDice(diceFormula.trim()); }}
                      className="flex-1 text-xs bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-text-primary placeholder:text-text-tertiary/30 focus:border-accent/40 outline-none" />
                    <button onClick={() => diceFormula.trim() && rollDice(diceFormula.trim())} disabled={rolling || !session?.id}
                      className="px-3 py-1 bg-accent text-surface-0 rounded-lg text-xs font-medium cursor-pointer hover:brightness-110 disabled:opacity-30">
                      {rolling ? '...' : 'Roll'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {lastRoll && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mt-2 bg-accent/10 border border-accent/20 rounded-lg p-2 text-center">
                        <span className="text-[10px] text-text-tertiary">{lastRoll.formula}</span>
                        <span className="text-lg font-bold text-accent mx-2">{lastRoll.total}</span>
                        <span className="text-[10px] text-text-tertiary font-mono">[{lastRoll.rolls.join(', ')}]</span>
                        <p className="text-[8px] text-success/60 mt-1">✓ Logged to session</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                {/* Quick Skill Checks */}
                {myCharacters.length > 0 && (
                  <Card>
                    <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Target className="w-3.5 h-3.5" /> Quick Checks
                    </h3>
                    <div className="grid grid-cols-2 gap-1">
                      {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(ab => {
                        const score = myCharacters[0].abilityScores[ab];
                        const m = Math.floor((score - 10) / 2);
                        const label = ab.slice(0, 3).toUpperCase();
                        return (
                          <button key={ab} onClick={() => rollDice(`1d20${m >= 0 ? '+' + m : m}`, `${label} Check`)}
                            className="flex items-center justify-between px-2 py-1.5 bg-surface-2 rounded-lg text-[10px] hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer">
                            <span className="font-medium">{label}</span>
                            <span className="font-mono text-text-tertiary">{m >= 0 ? '+' : ''}{m}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* CHARACTER TAB */}
          {tab === 'character' && (
            <div className="space-y-4">
              {myCharacters.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-text-tertiary/20 mx-auto mb-2" />
                    <p className="text-xs text-text-tertiary">No characters found in this campaign</p>
                    <p className="text-[10px] text-text-tertiary/60 mt-1">Create a character first</p>
                  </div>
                </Card>
              ) : myCharacters.map(ch => {
                const hpPct = ch.hp.max > 0 ? (ch.hp.current / ch.hp.max) * 100 : 0;
                const hpColor = hpPct <= 25 ? 'bg-danger' : hpPct <= 50 ? 'bg-warning' : 'bg-success';
                return (
                  <Card key={ch.id}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">{ch.name}</h3>
                        <p className="text-[10px] text-text-tertiary">Level {ch.level} {ch.race} {ch.class}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs font-mono text-text-tertiary"><Shield className="w-3.5 h-3.5" /> {ch.armorClass}</div>
                      </div>
                    </div>
                    {/* HP Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-text-tertiary flex items-center gap-1"><Heart className="w-3 h-3" /> Hit Points</span>
                        <span className={`text-xs font-bold font-mono ${hpPct <= 25 ? 'text-danger' : hpPct <= 50 ? 'text-warning' : 'text-text-primary'}`}>
                          {ch.hp.current}/{ch.hp.max}
                          {(ch.hp.temp || 0) > 0 && <span className="text-info ml-1">(+{ch.hp.temp})</span>}
                        </span>
                      </div>
                      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                        <motion.div className={`h-full ${hpColor} rounded-full`} style={{ width: `${hpPct}%` }} animate={{ width: `${hpPct}%` }} transition={{ duration: 0.3 }} />
                      </div>
                    </div>
                    {/* Ability Scores */}
                    <div className="grid grid-cols-6 gap-1 mb-3">
                      {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(ab => (
                        <button key={ab} onClick={() => rollDice(`1d20${Math.floor((ch.abilityScores[ab] - 10) / 2) >= 0 ? '+' + Math.floor((ch.abilityScores[ab] - 10) / 2) : Math.floor((ch.abilityScores[ab] - 10) / 2)}`, `${ab.slice(0, 3).toUpperCase()} Check`)}
                          className="bg-surface-2 rounded-lg p-1.5 text-center cursor-pointer hover:bg-accent/10 hover:ring-1 hover:ring-accent/20 transition-all">
                          <span className="text-[9px] text-text-tertiary uppercase block">{ab.slice(0, 3)}</span>
                          <span className="text-sm font-bold text-text-primary block">{ch.abilityScores[ab]}</span>
                          <span className="text-[10px] text-accent font-mono">{mod(ch.abilityScores[ab])}</span>
                        </button>
                      ))}
                    </div>
                    {/* Conditions */}
                    {ch.concentratingOn && (
                      <div className="bg-info/10 border border-info/20 rounded-lg px-2 py-1.5 mb-2 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-info animate-pulse" /><span className="text-[10px] text-info">Concentrating: {ch.concentratingOn}</span>
                      </div>
                    )}
                    {ch.temporaryEffects && ch.temporaryEffects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {ch.temporaryEffects.map(c => <span key={c} className="text-[9px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">{c}</span>)}
                      </div>
                    )}
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="bg-surface-2 rounded-lg p-2 text-center"><span className="text-[9px] text-text-tertiary block">Speed</span><span className="text-xs font-bold">{ch.speed} ft</span></div>
                      <div className="bg-surface-2 rounded-lg p-2 text-center"><span className="text-[9px] text-text-tertiary block">Prof</span><span className="text-xs font-bold">+{ch.proficiencyBonus}</span></div>
                      <div className="bg-surface-2 rounded-lg p-2 text-center"><span className="text-[9px] text-text-tertiary block">Initiative</span><span className="text-xs font-bold">{mod(ch.abilityScores.dexterity)}</span></div>
                    </div>
                    {/* Roll Initiative button */}
                    <button onClick={() => rollDice(`1d20${Math.floor((ch.abilityScores.dexterity - 10) / 2) >= 0 ? '+' + Math.floor((ch.abilityScores.dexterity - 10) / 2) : Math.floor((ch.abilityScores.dexterity - 10) / 2)}`, 'Initiative')}
                      className="w-full mt-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                      <Dices className="w-3.5 h-3.5" /> Roll Initiative
                    </button>
                  </Card>
                );
              })}
            </div>
          )}

          {/* CHAT TAB */}
          {tab === 'chat' && activeCampaignId && (
            <ChatPanel campaignId={activeCampaignId} isDM={false} height="h-[calc(100vh-120px)]" />
          )}

          {/* NOTES TAB */}
          {tab === 'notes' && (
            <Card>
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Scroll className="w-3.5 h-3.5" /> Session Notes
              </h3>
              <textarea value={myNote} onChange={e => setMyNote(e.target.value)}
                placeholder="Take notes during the session... Auto-saved to your browser."
                className="w-full min-h-[400px] bg-surface-2 border border-border rounded-lg p-3 text-sm text-text-primary resize-y focus:border-accent/40 outline-none" />
              <p className="text-[10px] text-text-tertiary mt-1">✓ Notes auto-save per campaign.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Audio Bar */}
      {activeCampaignId && <AudioBar campaignId={activeCampaignId} />}

      {/* Dice Overlay */}
      <DiceOverlay />
    </div>
  );
}