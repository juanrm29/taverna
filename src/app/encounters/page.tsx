'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Swords, Shield, Heart, AlertTriangle, Users, Zap } from 'lucide-react';
import { Button, Card, Badge, Input, Modal, EmptyState, Select, Textarea } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import {
  EncounterTemplate, Campaign,
  CR_XP_TABLE, XP_THRESHOLDS, getEncounterMultiplier,
} from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

interface MonsterEntry {
  name: string;
  cr: string;
  count: number;
  hp: number;
  ac: number;
}

export default function EncounterBuilderPage() {
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const toast = useToast();
  const { t } = useTranslation();

  const [encounters, setEncounters] = useState<EncounterTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // Builder state
  const [name, setName] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [partySize, setPartySize] = useState(4);
  const [partyLevel, setPartyLevel] = useState(5);
  const [monsters, setMonsters] = useState<MonsterEntry[]>([{ name: 'Goblin', cr: '1/4', count: 1, hp: 7, ac: 15 }]);
  const [environment, setEnvironment] = useState('');
  const [notes, setNotes] = useState('');

  const loadEncounters = useCallback(async (cId: string) => {
    if (!cId) return;
    try {
      const encs = await api.getEncounters(cId);
      setEncounters(encs);
    } catch (err) {
      console.error('Failed to load encounters:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const allCampaigns = await api.getCampaigns();
        const dmCampaigns = allCampaigns.filter((c: any) => c.dmId === user.id);
        if (cancelled) return;
        setCampaigns(dmCampaigns);
        if (dmCampaigns.length > 0 && !campaignId) {
          setCampaignId(dmCampaigns[0].id);
        }
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (user && campaignId) {
      loadEncounters(campaignId);
    }
  }, [user, campaignId, loadEncounters]);

  // CR to XP calculation
  const crToXP = (cr: string): number => {
    return CR_XP_TABLE[cr] || 0;
  };

  // Difficulty calculation
  const calcDifficulty = () => {
    const totalMonsters = monsters.reduce((sum, m) => sum + m.count, 0);
    const baseXP = monsters.reduce((sum, m) => sum + (crToXP(m.cr) * m.count), 0);
    const multiplier = getEncounterMultiplier(totalMonsters);
    const adjustedXP = Math.floor(baseXP * multiplier);

    const thresholds = XP_THRESHOLDS[partyLevel] || { easy: 25, medium: 50, hard: 75, deadly: 100 };
    const partyThresholds = {
      easy: thresholds.easy * partySize,
      medium: thresholds.medium * partySize,
      hard: thresholds.hard * partySize,
      deadly: thresholds.deadly * partySize,
    };

    let difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly' = 'trivial';
    if (adjustedXP >= partyThresholds.deadly) difficulty = 'deadly';
    else if (adjustedXP >= partyThresholds.hard) difficulty = 'hard';
    else if (adjustedXP >= partyThresholds.medium) difficulty = 'medium';
    else if (adjustedXP >= partyThresholds.easy) difficulty = 'easy';

    return { baseXP, adjustedXP, multiplier, difficulty, partyThresholds };
  };

  const addMonster = () => {
    setMonsters(prev => [...prev, { name: '', cr: '1', count: 1, hp: 10, ac: 12 }]);
  };

  const updateMonster = (idx: number, patch: Partial<MonsterEntry>) => {
    setMonsters(prev => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));
  };

  const removeMonster = (idx: number) => {
    setMonsters(prev => prev.filter((_, i) => i !== idx));
  };

  const saveEncounter = async () => {
    if (!name.trim()) return;
    const diff = calcDifficulty();
    const finalDifficulty = diff.difficulty === 'trivial' ? 'easy' : diff.difficulty;
    const parseCR = (cr: string): number => {
      if (cr.includes('/')) { const [n, d] = cr.split('/'); return parseInt(n) / parseInt(d); }
      return parseFloat(cr) || 0;
    };
    try {
      const enc = await api.createEncounter(campaignId, {
        name: name.trim(),
        monsters: monsters.map(m => ({
          name: m.name,
          cr: parseCR(m.cr),
          count: m.count,
          hp: m.hp,
          ac: m.ac,
        })),
        difficulty: finalDifficulty,
        xpTotal: diff.adjustedXP,
        notes,
        createdBy: user?.id || '',
      });
      setEncounters(prev => [enc, ...prev]);
      setShowCreate(false);
      setName('');
      setMonsters([{ name: 'Goblin', cr: '1/4', count: 1, hp: 7, ac: 15 }]);
      setNotes('');
      setEnvironment('');
      toast.success(t.encounters.saved);
    } catch (err) {
      console.error('Failed to save encounter:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save encounter');
    }
  };

  const deleteEncounter = async (id: string) => {
    try {
      await api.deleteEncounter(id);
      setEncounters(prev => prev.filter(e => e.id !== id));
      toast.success(t.encounters.deleted);
    } catch (err) {
      console.error('Failed to delete encounter:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete encounter');
    }
  };

  const router = useRouter();

  const loadToInitiative = async (enc: EncounterTemplate) => {
    try {
      // Find or create active session for the campaign
      const sessions = await api.getSessions(enc.campaignId);
      let session = sessions.find((s: any) =>
        s.status === 'LIVE' || s.status === 'LOBBY' || s.status === 'PAUSED'
      );
      if (!session) {
        session = await api.createSession(enc.campaignId, {
          dmId: user?.id || '',
          sessionNumber: sessions.length + 1,
        });
      }
      // Add each monster to initiative with rolled initiative (1d20)
      for (const m of enc.monsters) {
        for (let i = 0; i < m.count; i++) {
          const initRoll = Math.floor(Math.random() * 20) + 1;
          await api.addInitiative(session.id, {
            name: m.count > 1 ? `${m.name} ${i + 1}` : m.name,
            initiative: initRoll,
            isNPC: true,
            isActive: false,
            hp: { current: m.hp, max: m.hp },
            armorClass: m.ac,
            conditions: [],
          });
        }
      }
      toast.success(`${enc.name} ${t.encounters.loadedToInit}`);
      // Navigate to live session where initiative tracker is visible
      setTimeout(() => router.push('/session-live'), 600);
    } catch (err) {
      console.error('Failed to load encounter to initiative:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to load encounter');
    }
  };

  const difficultyInfo = calcDifficulty();

  const diffColor = (diff: string) => {
    switch (diff) {
      case 'trivial': return 'text-text-tertiary';
      case 'easy': return 'text-success';
      case 'medium': return 'text-warning';
      case 'hard': return 'text-accent';
      case 'deadly': return 'text-danger';
      default: return 'text-text-secondary';
    }
  };

  const CR_OPTIONS = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">{t.encounters.title}</h1>
          <p className="text-text-secondary text-sm">{t.encounters.subtitle}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> {t.encounters.newEncounter}
        </Button>
      </div>

      {/* Quick Builder */}
      <Card className="mb-6">
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Swords className="w-4 h-4" /> {t.encounters.quickBuilder}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">{t.encounters.partySize}</label>
            <input type="number" min={1} max={10} value={partySize} onChange={e => setPartySize(parseInt(e.target.value) || 4)} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">{t.encounters.partyLevel}</label>
            <input type="number" min={1} max={20} value={partyLevel} onChange={e => setPartyLevel(parseInt(e.target.value) || 1)} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-text-secondary block mb-1">{t.encounters.difficulty}</label>
            <div className={`text-lg font-bold ${diffColor(difficultyInfo.difficulty)} flex items-center gap-2`}>
              {difficultyInfo.difficulty === 'deadly' && <AlertTriangle className="w-5 h-5" />}
              {difficultyInfo.difficulty.toUpperCase()}
              <span className="text-xs font-normal text-text-tertiary">({difficultyInfo.adjustedXP} adj. XP · ×{difficultyInfo.multiplier})</span>
            </div>
          </div>
        </div>

        {/* XP Thresholds */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['easy', 'medium', 'hard', 'deadly'] as const).map(d => (
            <div key={d} className={`text-xs px-2 py-1 rounded ${difficultyInfo.difficulty === d ? 'bg-surface-3 font-bold' : ''}`}>
              <span className={diffColor(d)}>{d}</span>: {difficultyInfo.partyThresholds[d]} XP
            </div>
          ))}
        </div>

        {/* Monsters */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-tertiary uppercase">Monster</span>
            <button onClick={addMonster} className="text-xs text-accent hover:text-accent/80 cursor-pointer flex items-center gap-1">
              <Plus className="w-3 h-3" /> {t.encounters.addMonster}
            </button>
          </div>
          {monsters.map((m, i) => (
            <div key={i} className="flex items-center gap-2 bg-surface-2 rounded-md p-2">
              <input
                type="text"
                placeholder={t.common.name}
                value={m.name}
                onChange={e => updateMonster(i, { name: e.target.value })}
                className="flex-1 bg-transparent border-b border-border px-1 py-0.5 text-sm"
              />
              <select
                value={m.cr}
                onChange={e => updateMonster(i, { cr: e.target.value })}
                className="bg-surface-0 border border-border rounded px-1 py-0.5 text-xs w-16"
              >
                {CR_OPTIONS.map(cr => <option key={cr} value={cr}>CR {cr}</option>)}
              </select>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-text-tertiary">×</span>
                <input type="number" min={1} max={20} value={m.count} onChange={e => updateMonster(i, { count: parseInt(e.target.value) || 1 })} className="w-10 bg-surface-0 border border-border rounded px-1 py-0.5 text-xs text-center" />
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-danger" />
                <input type="number" min={1} value={m.hp} onChange={e => updateMonster(i, { hp: parseInt(e.target.value) || 1 })} className="w-12 bg-surface-0 border border-border rounded px-1 py-0.5 text-xs text-center" />
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-accent" />
                <input type="number" min={1} value={m.ac} onChange={e => updateMonster(i, { ac: parseInt(e.target.value) || 10 })} className="w-10 bg-surface-0 border border-border rounded px-1 py-0.5 text-xs text-center" />
              </div>
              <span className="text-[10px] text-text-tertiary w-12 text-right">{crToXP(m.cr) * m.count} XP</span>
              {monsters.length > 1 && (
                <button onClick={() => removeMonster(i)} className="text-text-tertiary hover:text-danger cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setShowCreate(true); }}>
            <Zap className="w-3.5 h-3.5" /> {t.common.save}
          </Button>
        </div>
      </Card>

      {/* Saved Encounters */}
      <h2 className="text-lg font-display font-semibold mb-4">{t.encounters.title}</h2>
      {encounters.length === 0 ? (
        <EmptyState
          icon={<Swords className="w-12 h-12" />}
          title={t.common.noResults}
          description={t.encounters.subtitle}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {encounters.map((enc, i) => (
            <motion.div key={enc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="group">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm">{enc.name}</h3>
                  <Badge variant={
                    enc.difficulty === 'deadly' ? 'danger' :
                    enc.difficulty === 'hard' ? 'accent' :
                    enc.difficulty === 'medium' ? 'warning' : 'success'
                  }>
                    {enc.difficulty}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-text-secondary">
                  {enc.monsters.map((m, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span>{m.name || 'Monster'}</span>
                      <span className="text-text-tertiary">CR {m.cr} ×{m.count}</span>
                    </div>
                  ))}
                </div>
                {enc.notes && <p className="text-[10px] text-text-tertiary mt-2">📝 {enc.notes}</p>}
                <div className="flex items-center justify-between mt-3 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => loadToInitiative(enc)}
                    className="!text-[10px] !px-2 !py-1"
                  >
                    <Swords className="w-3 h-3" /> {t.encounters.loadedToInit}
                  </Button>
                  <button onClick={() => deleteEncounter(enc.id)} className="text-text-tertiary hover:text-danger cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Save Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t.common.save}>
        <div className="space-y-4">
          <Input label="Encounter Name" value={name} onChange={e => setName(e.target.value)} placeholder="Goblin Ambush" />
          <select
            value={campaignId}
            onChange={e => setCampaignId(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm"
          >
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Input label="Environment" value={environment} onChange={e => setEnvironment(e.target.value)} placeholder="Forest clearing, Dungeon corridor..." />
          <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tactical notes..." />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>{t.common.cancel}</Button>
            <Button size="sm" onClick={saveEncounter} disabled={!name.trim()}>{t.common.save}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
