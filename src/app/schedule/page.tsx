'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, Clock, Users, MapPin, Trash2,
  ChevronLeft, ChevronRight, CalendarDays, Bell,
  Check, X, Edit2, Save,
} from 'lucide-react';
import * as api from '@/lib/api-client';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/Feedback';
import { v4 as uuid } from 'uuid';
import { useTranslation } from '@/lib/i18n';

// ============================================================
// Session Scheduler — Plan, schedule, and track game sessions
// ============================================================

interface ScheduledSession {
  id: string;
  campaignId: string;
  campaignName: string;
  date: string;      // ISO date
  time: string;      // HH:MM
  duration: number;   // minutes
  location: string;
  notes: string;
  rsvp: Record<string, 'yes' | 'no' | 'maybe'>;
  isCompleted: boolean;
}

const STORAGE_KEY = 'taverna_scheduled_sessions';

function loadSessions(): ScheduledSession[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveSessions(sessions: ScheduledSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// ============================================================
// Calendar Mini-View
// ============================================================
function MiniCalendar({ selectedDate, onSelect, sessionDates }: {
  selectedDate: string;
  onSelect: (date: string) => void;
  sessionDates: Set<string>;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => {
    if (viewDate.month === 0) setViewDate({ year: viewDate.year - 1, month: 11 });
    else setViewDate({ ...viewDate, month: viewDate.month - 1 });
  };
  const nextMonth = () => {
    if (viewDate.month === 11) setViewDate({ year: viewDate.year + 1, month: 0 });
    else setViewDate({ ...viewDate, month: viewDate.month + 1 });
  };

  const monthName = new Date(viewDate.year, viewDate.month).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 text-text-tertiary hover:text-text-secondary cursor-pointer rounded hover:bg-surface-2">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-text-primary">{monthName}</span>
        <button onClick={nextMonth} className="p-1 text-text-tertiary hover:text-text-secondary cursor-pointer rounded hover:bg-surface-2">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <span key={d} className="text-[9px] text-text-tertiary font-semibold py-1">{d}</span>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const hasSession = sessionDates.has(dateStr);

          return (
            <button
              key={day}
              onClick={() => onSelect(dateStr)}
              className={`relative w-7 h-7 rounded-md text-xs font-medium transition-all cursor-pointer mx-auto flex items-center justify-center ${
                isSelected
                  ? 'bg-accent text-surface-0'
                  : isToday
                    ? 'bg-accent/15 text-accent ring-1 ring-accent/30'
                    : 'text-text-secondary hover:bg-surface-2'
              }`}
            >
              {day}
              {hasSession && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================================
// Session Form
// ============================================================
function SessionForm({ session, campaigns, onSave, onCancel }: {
  session?: ScheduledSession;
  campaigns: { id: string; name: string }[];
  onSave: (s: ScheduledSession) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ScheduledSession>(session || {
    id: uuid(),
    campaignId: campaigns[0]?.id || '',
    campaignName: campaigns[0]?.name || '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    duration: 180,
    location: 'Online (Discord)',
    notes: '',
    rsvp: {},
    isCompleted: false,
  });

  const handleCampaignChange = (campaignId: string) => {
    const camp = campaigns.find(c => c.id === campaignId);
    setForm({ ...form, campaignId, campaignName: camp?.name || '' });
  };

  return (
    <Card>
      <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
        {session ? t.common.edit : t.schedule.scheduleSession}
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-text-tertiary block mb-1">{t.nav.campaigns}</label>
          <select
            value={form.campaignId}
            onChange={e => handleCampaignChange(e.target.value)}
            className="w-full text-xs bg-surface-2 border border-border rounded-lg px-3 py-2"
          >
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            {campaigns.length === 0 && <option value="">{t.common.noResults}</option>}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-text-tertiary block mb-1">{t.schedule.date}</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary block mb-1">{t.schedule.time}</label>
            <input
              type="time"
              value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })}
              className="w-full text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-text-tertiary block mb-1">{t.schedule.duration}</label>
            <select
              value={form.duration}
              onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })}
              className="w-full text-xs bg-surface-2 border border-border rounded-lg px-3 py-2"
            >
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={150}>2.5 hours</option>
              <option value={180}>3 hours</option>
              <option value={240}>4 hours</option>
              <option value={300}>5 hours</option>
              <option value={360}>6 hours</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-text-tertiary block mb-1">{t.schedule.location}</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Discord, Roll20, IRL"
              className="w-full text-xs"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-text-tertiary block mb-1">{t.schedule.notes}</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="What's planned for this session?"
            className="w-full min-h-[60px] text-xs resize-y"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary cursor-pointer">{t.common.cancel}</button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-1.5 bg-accent text-surface-0 rounded-lg text-xs font-medium cursor-pointer hover:brightness-110 flex items-center gap-1"
          >
            <Save className="w-3 h-3" /> {t.common.save}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// Countdown
// ============================================================
function Countdown({ dateStr, time }: { dateStr: string; time: string }) {
  const target = new Date(`${dateStr}T${time}`);
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return <span className="text-[10px] text-success font-medium">Now / Past</span>;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  if (days > 0) return <span className="text-[10px] text-accent font-mono font-medium">{days}d {hours}h</span>;
  if (hours > 0) return <span className="text-[10px] text-warning font-mono font-medium">{hours}h {mins}m</span>;
  return <span className="text-[10px] text-danger font-mono font-medium animate-pulse">{mins}m</span>;
}

// ============================================================
// Main Page
// ============================================================
export default function SchedulePage() {
  const toast = useToast();
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ScheduledSession[]>(loadSessions);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduledSession | undefined>();

  const [campaignsList, setCampaignsList] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    api.getCampaigns().then(camps => setCampaignsList(camps.map((c: any) => ({ id: c.id, name: c.name })))).catch(() => {});
  }, []);

  const sessionDates = useMemo(() => new Set(sessions.map(s => s.date)), [sessions]);

  const upcomingSessions = sessions
    .filter(s => !s.isCompleted)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  const pastSessions = sessions
    .filter(s => s.isCompleted)
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

  const sessionsOnDate = sessions.filter(s => s.date === selectedDate);

  const saveSession = (s: ScheduledSession) => {
    let newSessions: ScheduledSession[];
    if (sessions.find(x => x.id === s.id)) {
      newSessions = sessions.map(x => x.id === s.id ? s : x);
    } else {
      newSessions = [...sessions, s];
    }
    setSessions(newSessions);
    saveSessions(newSessions);
    setShowForm(false);
    setEditingSession(undefined);
    toast.success(t.schedule.sessionSaved);
  };

  const deleteSession = (id: string) => {
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    saveSessions(newSessions);
    toast.info(t.schedule.sessionDeleted);
  };

  const markComplete = (id: string) => {
    const newSessions = sessions.map(s => s.id === id ? { ...s, isCompleted: true } : s);
    setSessions(newSessions);
    saveSessions(newSessions);
    toast.success(t.schedule.sessionComplete);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface-1">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            <div>
              <h1 className="text-lg font-bold text-text-primary">{t.schedule.title}</h1>
              <p className="text-xs text-text-tertiary">{t.schedule.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingSession(undefined); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-surface-0 rounded-lg text-xs font-medium cursor-pointer hover:brightness-110 transition"
          >
            <Plus className="w-3.5 h-3.5" /> {t.schedule.scheduleSession}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left — Calendar + form */}
          <div className="space-y-4">
            <MiniCalendar
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              sessionDates={sessionDates}
            />

            {/* Sessions on selected date */}
            {sessionsOnDate.length > 0 && (
              <Card>
                <h4 className="text-[10px] text-text-tertiary font-semibold uppercase mb-2">
                  {new Date(selectedDate + 'T00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h4>
                <div className="space-y-2">
                  {sessionsOnDate.map(s => (
                    <div key={s.id} className="bg-surface-2 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-primary">{s.campaignName}</span>
                        <span className="text-[10px] text-text-tertiary">{s.time}</span>
                      </div>
                      {s.notes && <p className="text-[10px] text-text-tertiary mt-0.5 line-clamp-2">{s.notes}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <SessionForm
                    session={editingSession}
                    campaigns={campaignsList}
                    onSave={saveSession}
                    onCancel={() => { setShowForm(false); setEditingSession(undefined); }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — Upcoming & Past */}
          <div className="lg:col-span-2 space-y-4">
            {/* Next session countdown */}
            {upcomingSessions.length > 0 && (
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs text-text-tertiary">{t.schedule.nextSession}</h4>
                    <p className="text-sm font-bold text-text-primary">{upcomingSessions[0].campaignName}</p>
                    <p className="text-[10px] text-text-tertiary">
                      {new Date(upcomingSessions[0].date + 'T00:00').toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' '} at {upcomingSessions[0].time}
                    </p>
                  </div>
                  <div className="text-right">
                    <Countdown dateStr={upcomingSessions[0].date} time={upcomingSessions[0].time} />
                  </div>
                </div>
              </Card>
            )}

            {/* Upcoming Sessions */}
            <Card>
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Calendar className="w-3.5 h-3.5" /> {t.schedule.upcoming}
              </h3>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-6">
                  <CalendarDays className="w-8 h-8 text-text-tertiary/20 mx-auto mb-2" />
                  <p className="text-xs text-text-tertiary">{t.schedule.noUpcoming}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingSessions.map(s => (
                    <motion.div
                      key={s.id}
                      layout
                      className="bg-surface-2 rounded-lg px-3 py-2.5 border border-border/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-center shrink-0 w-10">
                          <span className="text-[10px] text-text-tertiary block uppercase">{new Date(s.date + 'T00:00').toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-lg font-bold text-text-primary leading-none">{new Date(s.date + 'T00:00').getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-text-primary">{s.campaignName}</span>
                            <Countdown dateStr={s.date} time={s.time} />
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                              <Clock className="w-3 h-3" />{s.time} ({s.duration / 60}h)
                            </span>
                            {s.location && (
                              <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{s.location}
                              </span>
                            )}
                          </div>
                          {s.notes && <p className="text-[10px] text-text-tertiary mt-1 line-clamp-1">{s.notes}</p>}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => markComplete(s.id)}
                            className="p-1 text-text-tertiary hover:text-success cursor-pointer rounded hover:bg-surface-3"
                            title="Mark complete"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingSession(s); setShowForm(true); }}
                            className="p-1 text-text-tertiary hover:text-accent cursor-pointer rounded hover:bg-surface-3"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSession(s.id)}
                            className="p-1 text-text-tertiary hover:text-danger cursor-pointer rounded hover:bg-surface-3"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <Card>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Clock className="w-3.5 h-3.5" /> {t.schedule.sessionHistory}
                </h3>
                <div className="space-y-1">
                  {pastSessions.slice(0, 10).map(s => (
                    <div key={s.id} className="flex items-center gap-3 px-2 py-1.5 text-text-tertiary">
                      <Check className="w-3 h-3 text-success" />
                      <span className="text-[10px]">
                        {new Date(s.date + 'T00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-text-secondary">{s.campaignName}</span>
                      <span className="text-[10px] ml-auto">{s.duration / 60}h</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
