'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ScrollText, Clock, Swords, Star, MapPin, Users, Sparkles,
  ChevronDown, ChevronUp, Plus, Save, BookOpen, Trophy, Skull
} from 'lucide-react';
import { Button, Card, Input, Badge, EmptyState } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import { Campaign, TimelineEvent, CombatLogEntry, ACHIEVEMENT_DEFS } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

export default function RecapPage() {
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const toast = useToast();
  const { t } = useTranslation();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [sessionNum, setSessionNum] = useState(1);
  const [recapTitle, setRecapTitle] = useState('');
  const [recapBody, setRecapBody] = useState('');
  const [showAddRecap, setShowAddRecap] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const camps = await api.getCampaigns();
        if (cancelled) return;
        const filtered = camps.filter((c: any) => c.dmId === user.id || (c.players || []).includes(user.id));
        setCampaigns(filtered);
        if (filtered.length > 0 && !selectedCampaign) setSelectedCampaign(filtered[0].id);
      } catch (err) {
        console.error('Failed to load campaigns', err);
      }
    })();
    return () => { cancelled = true; };
  }, [user, selectedCampaign]);

  useEffect(() => {
    if (!selectedCampaign) return;
    let cancelled = false;
    (async () => {
      try {
        const [tl, sessions] = await Promise.all([
          api.getTimeline(selectedCampaign),
          api.getSessions(selectedCampaign),
        ]);
        if (cancelled) return;
        setTimeline(tl);

        // Get combat log from each session
        const logResults = await Promise.all(
          sessions.map((s: any) => api.getCombatLog(s.id).catch(() => []))
        );
        if (cancelled) return;
        const logs: CombatLogEntry[] = logResults.flat();
        setCombatLog(logs);
      } catch (err) {
        console.error('Failed to load recap data', err);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCampaign]);

  const addRecap = async () => {
    if (!recapTitle.trim()) return;
    try {
      await api.createTimelineEvent(selectedCampaign, {
        sessionNumber: sessionNum,
        type: 'story',
        title: recapTitle.trim(),
        description: recapBody.trim() || '',
        realDate: new Date().toISOString(),
      });
      const updated = await api.getTimeline(selectedCampaign);
      setTimeline(updated);
      setRecapTitle('');
      setRecapBody('');
      setShowAddRecap(false);
      toast.success(t.recap.recapAdded);
    } catch (err) {
      console.error('Failed to add recap', err);
      toast.error?.('Failed to add recap') ?? toast.success('Failed to add recap');
    }
  };

  // Stats
  const totalSessions = new Set(timeline.map(e => e.sessionNumber)).size;
  const combatCount = timeline.filter(e => e.type === 'combat').length;
  const discoveryCount = timeline.filter(e => e.type === 'discovery').length;
  const deathCount = timeline.filter(e => e.type === 'death').length;

  // Group by session
  const grouped = timeline.reduce<Record<number, TimelineEvent[]>>((acc, ev) => {
    if (!acc[ev.sessionNumber]) acc[ev.sessionNumber] = [];
    acc[ev.sessionNumber].push(ev);
    return acc;
  }, {});
  const sessionNumbers = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'combat': return <Swords className="w-3.5 h-3.5 text-danger" />;
      case 'discovery': return <MapPin className="w-3.5 h-3.5 text-info" />;
      case 'milestone': return <Star className="w-3.5 h-3.5 text-warning" />;
      case 'death': return <Skull className="w-3.5 h-3.5 text-danger" />;
      default: return <ScrollText className="w-3.5 h-3.5 text-accent" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">{t.recap.title}</h1>
          <p className="text-sm text-text-tertiary">{t.recap.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCampaign}
            onChange={e => setSelectedCampaign(e.target.value)}
            className="bg-surface-2 border border-border rounded-md px-3 py-1.5 text-sm"
          >
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button size="sm" onClick={() => setShowAddRecap(!showAddRecap)}>
            <Plus className="w-3.5 h-3.5" /> {t.recap.addRecap}
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t.recap.sessions, value: totalSessions, icon: <Clock className="w-4 h-4 text-accent" /> },
          { label: t.recap.battles, value: combatCount, icon: <Swords className="w-4 h-4 text-danger" /> },
          { label: t.recap.discoveries, value: discoveryCount, icon: <MapPin className="w-4 h-4 text-info" /> },
          { label: t.recap.deaths, value: deathCount, icon: <Skull className="w-4 h-4 text-danger" /> },
        ].map(stat => (
          <Card key={stat.label} className="!p-3 text-center">
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="text-[10px] text-text-tertiary uppercase">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Add recap form */}
      {showAddRecap && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
          <Card className="!p-4 space-y-3">
            <h3 className="text-sm font-semibold">{t.recap.addRecap}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Title" value={recapTitle} onChange={e => setRecapTitle(e.target.value)} placeholder="What happened..." />
              <Input label="Session #" type="number" min={1} value={sessionNum} onChange={e => setSessionNum(parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase block mb-1.5">Details</label>
              <textarea
                value={recapBody}
                onChange={e => setRecapBody(e.target.value)}
                rows={3}
                className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm resize-none"
                placeholder="Describe the events..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddRecap(false)}>{t.common.cancel}</Button>
              <Button size="sm" onClick={addRecap} disabled={!recapTitle.trim()}>
                <Save className="w-3 h-3" /> {t.common.save}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Session recaps */}
      {sessionNumbers.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="w-12 h-12" />}
          title={t.recap.noRecaps}
          description={t.recap.subtitle}
          action={<Button size="sm" onClick={() => setShowAddRecap(true)}><Plus className="w-3.5 h-3.5" /> {t.recap.addRecap}</Button>}
        />
      ) : (
        <div className="space-y-4">
          {sessionNumbers.map(sNum => (
            <Card key={sNum} className="!p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-bold">
                  {sNum}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Session {sNum}</h3>
                  <p className="text-[10px] text-text-tertiary">{grouped[sNum].length} event{grouped[sNum].length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-2 ml-4 border-l-2 border-border pl-4">
                {grouped[sNum].map(ev => (
                  <div key={ev.id} className="flex items-start gap-2">
                    <div className="mt-0.5">{typeIcon(ev.type)}</div>
                    <div>
                      <p className="text-sm font-medium">{ev.title}</p>
                      {ev.description && <p className="text-xs text-text-tertiary mt-0.5">{ev.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Combat log summary */}
      {combatLog.length > 0 && (
        <Card className="!p-4">
          <h3 className="text-sm font-semibold text-text-tertiary uppercase mb-3 flex items-center gap-2">
            <Swords className="w-4 h-4 text-danger" /> {t.recap.battles}
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {combatLog.slice(-20).map(entry => (
              <div key={entry.id} className="flex items-center gap-2 text-xs text-text-secondary py-1 border-b border-border/50">
                <span className="text-text-tertiary text-[10px] w-12">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span className="font-medium">{entry.turn}</span>
                <span className="text-text-tertiary">—</span>
                <span>{entry.action}</span>
                {entry.result && <Badge variant="accent">{entry.result}</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
