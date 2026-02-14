'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, Plus, Trash2, Music, Drum, Wind,
  Bird, Flame, Droplets, Swords, Skull, Sparkles, Hash
} from 'lucide-react';
import { Button, Card, Input, Modal, EmptyState, Badge } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import { AudioTrack, Campaign } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

type SFXCategory = 'combat' | 'environment' | 'magic' | 'ambient';

const PRESET_SFX: { name: string; category: SFXCategory; emoji: string }[] = [
  { name: 'Sword Slash', category: 'combat', emoji: '⚔️' },
  { name: 'Arrow Impact', category: 'combat', emoji: '🏹' },
  { name: 'Shield Block', category: 'combat', emoji: '🛡️' },
  { name: 'Critical Hit', category: 'combat', emoji: '💥' },
  { name: 'Death Cry', category: 'combat', emoji: '💀' },
  { name: 'Thunder', category: 'environment', emoji: '⛈️' },
  { name: 'Rain', category: 'environment', emoji: '🌧️' },
  { name: 'Wind', category: 'environment', emoji: '💨' },
  { name: 'Fire Crackling', category: 'environment', emoji: '🔥' },
  { name: 'Water Stream', category: 'environment', emoji: '💧' },
  { name: 'Forest Birds', category: 'environment', emoji: '🐦' },
  { name: 'Tavern Crowd', category: 'ambient', emoji: '🍺' },
  { name: 'Dungeon Drip', category: 'ambient', emoji: '🏚️' },
  { name: 'Eerie Whispers', category: 'ambient', emoji: '👻' },
  { name: 'Fireball', category: 'magic', emoji: '🔮' },
  { name: 'Healing Light', category: 'magic', emoji: '✨' },
  { name: 'Teleport', category: 'magic', emoji: '🌀' },
  { name: 'Counterspell', category: 'magic', emoji: '🚫' },
];

const MOOD_PRESETS = [
  { name: 'Dungeon Crawl', emoji: '🏚️', description: 'Dark, tense, dripping water' },
  { name: 'Tavern Night', emoji: '🍺', description: 'Jovial, warm, crowd murmur' },
  { name: 'Epic Battle', emoji: '⚔️', description: 'Intense, drums, clash of steel' },
  { name: 'Forest Journey', emoji: '🌲', description: 'Birds, breeze, rustling leaves' },
  { name: 'Dragon\'s Lair', emoji: '🐉', description: 'Ominous, rumbling, fire crackle' },
  { name: 'Ocean Voyage', emoji: '🚢', description: 'Waves, gulls, creaking wood' },
  { name: 'Mystic Ritual', emoji: '🔮', description: 'Ethereal, chanting, bell tones' },
  { name: 'Peaceful Rest', emoji: '🏕️', description: 'Campfire, crickets, soft wind' },
];

export default function AudioPage() {
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const toast = useToast();
  const { t } = useTranslation();

  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [sfxCategory, setSfxCategory] = useState<SFXCategory>('combat');
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [newTrackCategory, setNewTrackCategory] = useState('music');
  const [newTrackLoop, setNewTrackLoop] = useState(true);
  const [playingTracks, setPlayingTracks] = useState<Set<string>>(new Set());
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isMasterMuted, setIsMasterMuted] = useState(false);

  // Audio element refs for real playback
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Last SFX played flash
  const [lastSfx, setLastSfx] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadCampaigns = async () => {
      try {
        const allCamps = await api.getCampaigns();
        const camps = allCamps.filter((c: any) => c.dmId === user.id || c.players?.includes(user.id));
        setCampaigns(camps);
        if (camps.length > 0 && !selectedCampaign) setSelectedCampaign(camps[0].id);
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      }
    };
    loadCampaigns();
  }, [user, selectedCampaign]);

  useEffect(() => {
    if (!selectedCampaign) return;
    const loadTracks = async () => {
      try {
        const data = await api.getAudioTracks(selectedCampaign);
        setTracks(data);
      } catch (err) {
        console.error('Failed to load audio tracks:', err);
      }
    };
    loadTracks();
  }, [selectedCampaign]);

  // Sync master volume & mute to all playing audio elements
  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      const trackVol = volumes[id] ?? 0.7;
      audio.volume = isMasterMuted ? 0 : trackVol * masterVolume;
    });
  }, [masterVolume, isMasterMuted, volumes]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current = {};
    };
  }, []);

  const toggleTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    if (playingTracks.has(trackId)) {
      // Stop
      const audio = audioRefs.current[trackId];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingTracks(prev => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
    } else {
      // Play
      if (!track.url) {
        toast.warning(t.audio.audioError);
        return;
      }
      let audio = audioRefs.current[trackId];
      if (!audio) {
        audio = new Audio(track.url);
        audioRefs.current[trackId] = audio;
      }
      audio.loop = track.loop;
      const trackVol = volumes[trackId] ?? track.volume;
      audio.volume = isMasterMuted ? 0 : trackVol * masterVolume;
      audio.play().catch(() => {
        toast.error(t.audio.audioError);
      });
      setPlayingTracks(prev => {
        const next = new Set(prev);
        next.add(trackId);
        return next;
      });
    }
  };

  const setTrackVolume = (trackId: string, vol: number) => {
    setVolumes(prev => ({ ...prev, [trackId]: vol }));
    const audio = audioRefs.current[trackId];
    if (audio) {
      audio.volume = isMasterMuted ? 0 : vol * masterVolume;
    }
  };

  const playSfx = (name: string) => {
    setLastSfx(name);
    setTimeout(() => setLastSfx(null), 800);
    toast.info(`🔊 ${name}`);
  };

  const addTrack = async () => {
    if (!newTrackName.trim()) return;
    try {
      const track = await api.createAudioTrack(selectedCampaign, {
        name: newTrackName.trim(),
        url: newTrackUrl.trim() || '',
        type: newTrackCategory === 'sfx' ? 'sfx' : 'ambient',
        category: newTrackCategory,
        loop: newTrackLoop,
        volume: 0.7,
      });
      setTracks(prev => [track, ...prev]);
      setShowAddTrack(false);
      setNewTrackName('');
      setNewTrackUrl('');
      toast.success(t.audio.trackAdded);
    } catch (err) {
      console.error('Failed to create audio track:', err);
      toast.error('Failed to add track');
    }
  };

  const deleteTrack = async (id: string) => {
    // Stop and cleanup audio element
    const audio = audioRefs.current[id];
    if (audio) {
      audio.pause();
      audio.src = '';
      delete audioRefs.current[id];
    }
    try {
      await api.deleteAudioTrack(id);
      setTracks(prev => prev.filter(t => t.id !== id));
      setPlayingTracks(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err) {
      console.error('Failed to delete audio track:', err);
      toast.error('Failed to delete track');
    }
  };

  const filteredSfx = PRESET_SFX.filter(s => s.category === sfxCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">{t.audio.title}</h1>
          <p className="text-sm text-text-tertiary">{t.audio.subtitle}</p>
        </div>
        <Button size="sm" onClick={() => setShowAddTrack(true)}>
          <Plus className="w-3.5 h-3.5" /> {t.audio.addTrack}
        </Button>
      </div>

      {/* Master Volume */}
      <Card className="!p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMasterMuted(!isMasterMuted)}
            className="text-text-secondary hover:text-accent transition-colors cursor-pointer"
          >
            {isMasterMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex-1">
            <label className="text-xs text-text-tertiary uppercase font-semibold">{t.audio.masterVolume}</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMasterMuted ? 0 : masterVolume}
              onChange={e => { setMasterVolume(parseFloat(e.target.value)); setIsMasterMuted(false); }}
              className="w-full accent-accent h-1.5"
            />
          </div>
          <span className="text-xs text-text-tertiary w-10 text-right">
            {isMasterMuted ? '0' : Math.round(masterVolume * 100)}%
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Presets */}
        <Card className="!p-4">
          <h3 className="text-sm font-semibold text-text-tertiary uppercase mb-3">{t.audio.moodPresets}</h3>
          <div className="grid grid-cols-2 gap-2">
            {MOOD_PRESETS.map(mood => (
              <motion.button
                key={mood.name}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setActiveMood(activeMood === mood.name ? null : mood.name); toast.info(`${mood.emoji} ${mood.name}`); }}
                className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  activeMood === mood.name
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-surface-2 border-border text-text-secondary hover:border-accent/50'
                }`}
              >
                <div className="text-lg mb-0.5">{mood.emoji}</div>
                <div className="text-xs font-medium">{mood.name}</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">{mood.description}</div>
              </motion.button>
            ))}
          </div>
        </Card>

        {/* SFX Board */}
        <Card className="!p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-tertiary uppercase">🔊 SFX Board</h3>
            <span className="text-[9px] bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">{t.audio.visualOnly}</span>
          </div>
          <div className="flex gap-2 mb-3">
            {(['combat', 'environment', 'magic', 'ambient'] as SFXCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSfxCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  sfxCategory === cat ? 'bg-accent text-white' : 'bg-surface-2 text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <AnimatePresence mode="popLayout">
              {filteredSfx.map(sfx => (
                <motion.button
                  key={sfx.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => playSfx(sfx.name)}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    lastSfx === sfx.name
                      ? 'bg-accent/20 border-accent animate-pulse'
                      : 'bg-surface-2 border-border hover:border-accent/50'
                  }`}
                >
                  <div className="text-lg">{sfx.emoji}</div>
                  <div className="text-[10px] text-text-tertiary mt-0.5">{sfx.name}</div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* Audio Tracks */}
      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-text-tertiary uppercase mb-3 flex items-center gap-2">
          <Music className="w-4 h-4" /> {t.audio.title}
        </h3>
        {tracks.length === 0 ? (
          <EmptyState
            icon={<Music className="w-12 h-12" />}
            title={t.audio.noTracks}
            description={t.audio.noTracksDesc}
            action={<Button size="sm" onClick={() => setShowAddTrack(true)}><Plus className="w-3.5 h-3.5" /> {t.audio.addTrack}</Button>}
          />
        ) : (
          <div className="space-y-2">
            {tracks.map(track => (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  playingTracks.has(track.id) ? 'bg-accent/5 border-accent/30' : 'bg-surface-2 border-border'
                }`}
              >
                <button
                  onClick={() => toggleTrack(track.id)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    playingTracks.has(track.id) ? 'bg-accent text-white' : 'bg-surface-1 text-text-tertiary hover:text-accent'
                  }`}
                >
                  {playingTracks.has(track.id) ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{track.category}</Badge>
                    {track.loop && <span className="text-[10px] text-text-tertiary">🔁 Loop</span>}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volumes[track.id] ?? track.volume}
                  onChange={e => setTrackVolume(track.id, parseFloat(e.target.value))}
                  className="w-20 accent-accent h-1"
                />
                <button
                  onClick={() => deleteTrack(track.id)}
                  className="text-text-tertiary hover:text-danger transition-colors cursor-pointer p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Track Modal */}
      <Modal open={showAddTrack} onClose={() => setShowAddTrack(false)} title={t.audio.addTrack}>
        <div className="space-y-4">
          <Input label={t.audio.trackName} value={newTrackName} onChange={e => setNewTrackName(e.target.value)} placeholder="Dungeon Ambiance" />
          <Input label={t.audio.trackUrl} value={newTrackUrl} onChange={e => setNewTrackUrl(e.target.value)} placeholder="https://..." />
          <select
            value={newTrackCategory}
            onChange={e => setNewTrackCategory(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="music">Music</option>
            <option value="ambience">Ambience</option>
            <option value="sfx">SFX</option>
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={newTrackLoop} onChange={e => setNewTrackLoop(e.target.checked)} className="accent-accent" />
            {t.audio.loop}
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddTrack(false)}>{t.common.cancel}</Button>
            <Button size="sm" onClick={addTrack} disabled={!newTrackName.trim()}>{t.common.add}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
