'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Clock, Trophy, Star, Swords, Eye, MapPin, Skull, Sparkles } from 'lucide-react';
import { Button, Card, Badge, Input, Textarea, Modal, EmptyState, Select } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import { TimelineEvent, Achievement, Campaign, ACHIEVEMENT_DEFS } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  story: <Star className="w-4 h-4 text-accent" />,
  combat: <Swords className="w-4 h-4 text-danger" />,
  discovery: <Eye className="w-4 h-4 text-success" />,
  milestone: <Trophy className="w-4 h-4 text-warning" />,
  death: <Skull className="w-4 h-4 text-danger" />,
};

export default function TimelinePage() {
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const toast = useToast();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'timeline' | 'achievements'>('timeline');

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showGrantAchievement, setShowGrantAchievement] = useState(false);

  // Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventType, setEventType] = useState<'story' | 'combat' | 'discovery' | 'milestone' | 'death'>('story');
  const [eventSession, setEventSession] = useState(1);
  const [eventCampaign, setEventCampaign] = useState('');

  const [achvName, setAchvName] = useState('');
  const [achvDesc, setAchvDesc] = useState('');
  const [achvIcon, setAchvIcon] = useState('🏆');
  const [achvCategory, setAchvCategory] = useState<'combat' | 'roleplay' | 'exploration' | 'milestone' | 'fun'>('milestone');
  const [achvCampaign, setAchvCampaign] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const allCamps = await api.getCampaigns();
      const camps = allCamps.filter((c: any) => c.dmId === user.id || (c.players && c.players.includes(user.id)));
      setCampaigns(camps);
      if (camps.length > 0) {
        if (!eventCampaign) setEventCampaign(camps[0].id);
        if (!achvCampaign) setAchvCampaign(camps[0].id);
      }
      if (eventCampaign) {
        const timeline = await api.getTimeline(eventCampaign);
        setEvents(timeline);
      }
      // Load achievements per campaign
      const allAchievements: Achievement[] = [];
      for (const camp of camps) {
        try {
          const campAchievements = await api.getAchievements(camp.id);
          allAchievements.push(...campAchievements);
        } catch {}
      }
      setAchievements(allAchievements);
    } catch (err) {
      console.error('Failed to load timeline data:', err);
    }
  }, [user, eventCampaign, achvCampaign]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredEvents = events.filter(e => selectedCampaign === 'all' || e.campaignId === selectedCampaign)
    .sort((a, b) => b.sessionNumber - a.sessionNumber || new Date(b.realDate).getTime() - new Date(a.realDate).getTime());

  const filteredAchievements = achievements.filter(a => selectedCampaign === 'all' || a.campaignId === selectedCampaign);

  const addEvent = async () => {
    if (!eventTitle.trim()) return;
    try {
      const ev = await api.createTimelineEvent(eventCampaign, {
        sessionNumber: eventSession,
        title: eventTitle.trim(),
        description: eventDesc || '',
        type: eventType,
        realDate: new Date().toISOString(),
      });
      setEvents(prev => [ev, ...prev]);
      setShowAddEvent(false);
      setEventTitle('');
      setEventDesc('');
      toast.success(t.timeline.eventAdded);
    } catch (err) {
      console.error('Failed to add event:', err);
      toast.error('Failed to add event');
    }
  };

  const grantAchievement = async () => {
    if (!achvName.trim() || !user) return;
    try {
      const achv = await api.grantAchievement(achvCampaign, {
        name: achvName.trim(),
        description: achvDesc || '',
        icon: achvIcon || '🏆',
        playerId: user.id,
        type: achvCategory as Achievement['type'],
      });
      if (achv) {
        setAchievements(prev => [achv, ...prev]);
        toast.success(t.timeline.grantAchievement + ' 🏆');
      } else {
        toast.info(t.timeline.alreadyUnlocked);
      }
    } catch (err) {
      console.error('Failed to grant achievement:', err);
      toast.info(t.timeline.alreadyUnlocked);
    }
    setShowGrantAchievement(false);
    setAchvName('');
    setAchvDesc('');
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.deleteTimelineEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success(t.timeline.eventRemoved);
    } catch (err) {
      console.error('Failed to delete event:', err);
      toast.error('Failed to delete event');
    }
  };

  // Group events by session
  const eventsBySession: Record<number, TimelineEvent[]> = {};
  filteredEvents.forEach(e => {
    if (!eventsBySession[e.sessionNumber]) eventsBySession[e.sessionNumber] = [];
    eventsBySession[e.sessionNumber].push(e);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">{t.timeline.title}</h1>
          <p className="text-text-secondary text-sm">{t.timeline.subtitle}</p>
        </div>
        <select
          value={selectedCampaign}
          onChange={e => setSelectedCampaign(e.target.value)}
          className="bg-surface-1 border border-border rounded-md px-3 py-2 text-sm"
        >
          <option value="all">{t.nav.campaigns}</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('timeline')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            tab === 'timeline' ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-surface-2'
          }`}
        >
          <Clock className="w-4 h-4" /> {t.timeline.title}
        </button>
        <button
          onClick={() => setTab('achievements')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            tab === 'achievements' ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-surface-2'
          }`}
        >
          <Trophy className="w-4 h-4" /> {t.timeline.achievements} ({filteredAchievements.length})
        </button>
      </div>

      {tab === 'timeline' && (
        <>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowAddEvent(true)}>
              <Plus className="w-3.5 h-3.5" /> {t.timeline.addEvent}
            </Button>
          </div>

          {Object.keys(eventsBySession).length === 0 ? (
            <EmptyState icon={<Clock className="w-12 h-12" />} title={t.timeline.noEvents} description={t.timeline.subtitle} />
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              {Object.entries(eventsBySession).sort(([a], [b]) => Number(b) - Number(a)).map(([session, evts]) => (
                <div key={session} className="mb-8">
                  <div className="relative flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-surface-0 text-sm font-bold z-10">
                      {session}
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary">Session {session}</h3>
                  </div>

                  <div className="ml-12 space-y-2">
                    {evts.map((evt, i) => (
                      <motion.div key={evt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="!p-3 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              {EVENT_ICONS[evt.type] || <Star className="w-4 h-4" />}
                              <div>
                                <h4 className="text-sm font-medium">{evt.title}</h4>
                                {evt.description && <p className="text-xs text-text-tertiary mt-0.5">{evt.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Badge variant={evt.type === 'combat' ? 'danger' : evt.type === 'milestone' ? 'warning' : 'default'}>{evt.type}</Badge>
                              <button onClick={() => deleteEvent(evt.id)} className="text-text-tertiary hover:text-danger cursor-pointer">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Modal open={showAddEvent} onClose={() => setShowAddEvent(false)} title={t.timeline.addEvent}>
            <div className="space-y-4">
              <Input label="Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Defeated the Dragon..." />
              <div className="grid grid-cols-2 gap-3">
                <select value={eventCampaign} onChange={e => setEventCampaign(e.target.value)} className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Input label="Session #" type="number" min={1} value={eventSession} onChange={e => setEventSession(parseInt(e.target.value) || 1)} />
              </div>
              <select value={eventType} onChange={e => setEventType(e.target.value as typeof eventType)} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
                <option value="story">{t.timeline.story}</option>
                <option value="combat">{t.timeline.combatEvent}</option>
                <option value="discovery">{t.timeline.discovery}</option>
                <option value="milestone">{t.timeline.milestone}</option>
                <option value="death">{t.timeline.death}</option>
              </select>
              <Textarea label="Description" value={eventDesc} onChange={e => setEventDesc(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddEvent(false)}>{t.common.cancel}</Button>
                <Button size="sm" onClick={addEvent} disabled={!eventTitle.trim()}>{t.timeline.addEvent}</Button>
              </div>
            </div>
          </Modal>
        </>
      )}

      {tab === 'achievements' && (
        <>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowGrantAchievement(true)}>
              <Plus className="w-3.5 h-3.5" /> {t.timeline.grantAchievement}
            </Button>
          </div>

          {filteredAchievements.length === 0 ? (
            <EmptyState icon={<Trophy className="w-12 h-12" />} title={t.timeline.noAchievements} description={t.timeline.subtitle} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAchievements.map((achv, i) => (
                <motion.div key={achv.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <Card className="text-center">
                    <div className="text-4xl mb-2">{achv.icon}</div>
                    <h3 className="font-medium text-sm">{achv.name}</h3>
                    <p className="text-xs text-text-tertiary mt-1">{achv.description}</p>
                    <Badge variant={
                      achv.type === 'combat' ? 'danger' :
                      achv.type === 'exploration' ? 'success' :
                      achv.type === 'roleplay' ? 'accent' : 'warning'
                    }>
                      {achv.type}
                    </Badge>
                    {achv.earnedAt && (
                      <p className="text-[10px] text-text-tertiary mt-2">
                        Unlocked {new Date(achv.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Preset achievements to grant */}
          <h3 className="text-sm font-semibold mt-8 mb-3 text-text-tertiary">{t.timeline.grantAchievement}</h3>
          <div className="flex flex-wrap gap-2">
            {ACHIEVEMENT_DEFS.slice(0, 10).map(a => (
              <button
                key={a.name}
                onClick={async () => {
                  const campId = selectedCampaign === 'all' ? campaigns[0]?.id || '' : selectedCampaign;
                  if (!campId || !user) return;
                  try {
                    const achv = await api.grantAchievement(campId, { ...a, playerId: user.id });
                    if (achv) {
                      setAchievements(prev => [achv, ...prev]);
                      toast.success(`🏆 ${a.name} unlocked!`);
                    } else {
                      toast.info(t.timeline.alreadyUnlocked);
                    }
                  } catch (err) {
                    console.error('Failed to grant achievement:', err);
                    toast.info(t.timeline.alreadyUnlocked);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 bg-surface-2 border border-border rounded-md text-xs hover:border-accent transition-colors cursor-pointer"
              >
                <span>{a.icon}</span> {a.name}
              </button>
            ))}
          </div>

          <Modal open={showGrantAchievement} onClose={() => setShowGrantAchievement(false)} title={t.timeline.grantAchievement}>
            <div className="space-y-4">
              <Input label="Name" value={achvName} onChange={e => setAchvName(e.target.value)} placeholder="Dragon Slayer" />
              <Input label="Icon (emoji)" value={achvIcon} onChange={e => setAchvIcon(e.target.value)} placeholder="🏆" />
              <select value={achvCategory} onChange={e => setAchvCategory(e.target.value as typeof achvCategory)} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
                <option value="combat">⚔️ Combat</option>
                <option value="roleplay">🎭 Roleplay</option>
                <option value="exploration">🗺️ Exploration</option>
                <option value="milestone">🏆 Milestone</option>
                <option value="fun">🎉 Fun</option>
              </select>
              <select value={achvCampaign} onChange={e => setAchvCampaign(e.target.value)} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Textarea label="Description" value={achvDesc} onChange={e => setAchvDesc(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowGrantAchievement(false)}>{t.common.cancel}</Button>
                <Button size="sm" onClick={grantAchievement} disabled={!achvName.trim()}>{t.timeline.grantAchievement}</Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
