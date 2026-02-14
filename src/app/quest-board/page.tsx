'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText, Plus, Target, CheckCircle2, XCircle, Clock, Eye, EyeOff,
  Star, Coins, Sword, Sparkles, ChevronDown, ChevronRight, Users,
  MessageCircle, ThumbsUp, ThumbsDown, Edit2, Trash2, Save, X,
  AlertTriangle, Trophy, GitBranch, ArrowRight, Skull, Shield,
  Crown, Flag, Flame, Package, MapPin, Filter,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { useToast } from '@/components/Feedback';
import { useTranslation } from '@/lib/i18n';
import * as api from '@/lib/api-client';
import { useSession } from 'next-auth/react';

// ============================================================
const STATUS_CONFIG = {
  HIDDEN: { label: 'Tersembunyi', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: EyeOff },
  AVAILABLE: { label: 'Tersedia', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Eye },
  ACTIVE: { label: 'Aktif', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Flame },
  COMPLETED: { label: 'Selesai', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle2 },
  FAILED: { label: 'Gagal', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
  ABANDONED: { label: 'Ditinggalkan', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: Skull },
} as const;

const PRIORITY_CONFIG = [
  { value: 0, label: 'Side Quest', icon: ScrollText, color: 'text-text-secondary' },
  { value: 1, label: 'Main Quest', icon: Crown, color: 'text-amber-400' },
  { value: 2, label: 'Urgent!', icon: AlertTriangle, color: 'text-red-400' },
] as const;

// ============================================================
export default function QuestBoardPage() {
  const { data: session } = useSession();
  const toast = useToast();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState('');
  const [quests, setQuests] = useState<any[]>([]);
  const [rumors, setRumors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'board' | 'story' | 'rumors'>('board');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<any | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', status: 'HIDDEN', priority: 0,
    giverNpcId: '', rewardXP: 0, rewardGold: 0, rewardItems: '',
    parentId: '', objectives: [{ title: '', description: '' }],
  });
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
  const [rumorForm, setRumorForm] = useState({ content: '', source: '' });
  const [showRumorForm, setShowRumorForm] = useState(false);

  const isDM = useMemo(() => {
    const c = campaigns.find(c => c.id === activeCampaign);
    return c?.dmId === session?.user?.id;
  }, [campaigns, activeCampaign, session]);

  useEffect(() => {
    api.getCampaigns().then(c => {
      setCampaigns(c);
      if (c.length) setActiveCampaign(c[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const loadData = useCallback(async () => {
    if (!activeCampaign) return;
    try {
      const [q, r] = await Promise.all([
        api.getQuests(activeCampaign),
        api.getRumors(activeCampaign),
      ]);
      setQuests(q);
      setRumors(r);
    } catch { }
  }, [activeCampaign]);

  useEffect(() => { loadData(); }, [loadData]);

  // Kanban columns
  const columns = useMemo(() => {
    const cols: Record<string, any[]> = { AVAILABLE: [], ACTIVE: [], COMPLETED: [], FAILED: [] };
    if (isDM) cols.HIDDEN = [];
    quests.filter(q => !q.parentId).forEach(q => {
      if (cols[q.status]) cols[q.status].push(q);
      else if (q.status === 'ABANDONED') cols.FAILED?.push(q);
    });
    return cols;
  }, [quests, isDM]);

  // Story arc tree (quests with children)
  const storyArcs = useMemo(() => {
    return quests.filter(q => !q.parentId && (q.children?.length > 0 || q.priority >= 1));
  }, [quests]);

  // Save quest
  const handleSave = async () => {
    try {
      const data = {
        ...form,
        rewardItems: form.rewardItems.split(',').map(s => s.trim()).filter(Boolean),
        objectives: form.objectives.filter(o => o.title.trim()),
        giverNpcId: form.giverNpcId || undefined,
        parentId: form.parentId || undefined,
      };
      if (editingQuest) {
        await api.updateQuest(editingQuest.id, data);
        toast.success('Quest diperbarui!');
      } else {
        await api.createQuest(activeCampaign, data);
        toast.success('Quest dibuat!');
      }
      setShowForm(false);
      setEditingQuest(null);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  // Vote quest
  const handleVote = async (questId: string, vote: number) => {
    try {
      await api.voteQuest(questId, vote);
      loadData();
    } catch { }
  };

  // Toggle objective
  const handleToggleObjective = async (questId: string, objectiveId: string, isCompleted: boolean) => {
    try {
      await api.updateObjective(questId, objectiveId, { isCompleted });
      toast.success(isCompleted ? 'Objective selesai!' : 'Objective dibatalkan');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  // Update quest status
  const handleStatusChange = async (questId: string, status: string) => {
    try {
      await api.updateQuest(questId, { status });
      toast.success(`Quest status: ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}`);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  // Submit rumor
  const handleSubmitRumor = async () => {
    if (!rumorForm.content.trim()) return;
    try {
      await api.createRumor(activeCampaign, { content: rumorForm.content, source: rumorForm.source || 'Unknown' });
      toast.success('Rumor ditambahkan!');
      setRumorForm({ content: '', source: '' });
      setShowRumorForm(false);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  // Open edit form
  const openEdit = (quest: any) => {
    setForm({
      title: quest.title, description: quest.description, status: quest.status,
      priority: quest.priority, giverNpcId: quest.giverNpcId || '',
      rewardXP: quest.rewardXP, rewardGold: quest.rewardGold,
      rewardItems: (quest.rewardItems || []).join(', '), parentId: quest.parentId || '',
      objectives: quest.objectives?.length ? quest.objectives.map((o: any) => ({ title: o.title, description: o.description })) : [{ title: '', description: '' }],
    });
    setEditingQuest(quest);
    setShowForm(true);
  };

  // Delete quest
  const handleDelete = async (id: string) => {
    try {
      await api.deleteQuest(id);
      toast.success('Quest dihapus');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
          className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  // ---- Quest Card component ----
  const QuestCard = ({ quest }: { quest: any }) => {
    const st = STATUS_CONFIG[quest.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.HIDDEN;
    const StIcon = st.icon;
    const pr = PRIORITY_CONFIG.find(p => p.value === quest.priority) || PRIORITY_CONFIG[0];
    const PrIcon = pr.icon;
    const isExpanded = expandedQuest === quest.id;
    const totalVotes = (quest.votes || []).reduce((sum: number, v: any) => sum + v.vote, 0);

    return (
      <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`p-4 hover:border-accent/30 transition-all ${quest.priority === 2 ? 'border-red-500/30 shadow-red-500/10 shadow-lg' : quest.priority === 1 ? 'border-amber-500/20' : ''}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <PrIcon size={14} className={pr.color} />
                <h3 className="font-semibold text-text-primary truncate">{quest.title}</h3>
                <Badge className={`${st.color} ${st.bg} text-xs`}><StIcon size={10} className="mr-1" />{st.label}</Badge>
              </div>
              {quest.giverNpc && (
                <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                  <Users size={10} /> Dari: {quest.giverNpc.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Vote buttons for players */}
              {!isDM && quest.status === 'AVAILABLE' && (
                <div className="flex items-center gap-1 mr-2">
                  <button onClick={() => handleVote(quest.id, 1)}
                    className="p-1 rounded hover:bg-green-500/20 text-green-400 transition"><ThumbsUp size={14} /></button>
                  <span className="text-xs font-bold text-text-secondary">{totalVotes}</span>
                  <button onClick={() => handleVote(quest.id, -1)}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400 transition"><ThumbsDown size={14} /></button>
                </div>
              )}
              <button onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
                className="p-1 rounded hover:bg-surface-3 transition text-text-muted">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mt-3 space-y-3 overflow-hidden">
                {quest.description && <p className="text-sm text-text-secondary">{quest.description}</p>}

                {/* Objectives */}
                {quest.objectives?.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-text-secondary uppercase">Objectives</h4>
                    {quest.objectives.map((obj: any) => (
                      <div key={obj.id} className="flex items-center gap-2">
                        <button
                          onClick={() => isDM && handleToggleObjective(quest.id, obj.id, !obj.isCompleted)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                            obj.isCompleted ? 'bg-green-500/20 border-green-500 text-green-400' :
                            obj.isFailed ? 'bg-red-500/20 border-red-500 text-red-400' :
                            'border-border hover:border-accent/50'
                          }`}>
                          {obj.isCompleted && <CheckCircle2 size={12} />}
                          {obj.isFailed && <XCircle size={12} />}
                        </button>
                        <span className={`text-sm ${obj.isCompleted ? 'line-through text-text-muted' : obj.isFailed ? 'line-through text-red-400' : 'text-text-primary'}`}>
                          {obj.title}
                        </span>
                        {obj.branchQuestId && <span title="Membuka quest baru"><GitBranch size={12} className="text-accent" /></span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rewards */}
                {(quest.rewardXP > 0 || quest.rewardGold > 0 || quest.rewardItems?.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-semibold text-text-secondary uppercase">Reward:</span>
                    {quest.rewardXP > 0 && <Badge className="text-purple-400 bg-purple-500/10"><Star size={10} className="mr-1" />{quest.rewardXP} XP</Badge>}
                    {quest.rewardGold > 0 && <Badge className="text-yellow-400 bg-yellow-500/10"><Coins size={10} className="mr-1" />{quest.rewardGold} GP</Badge>}
                    {quest.rewardItems?.map((item: string) => (
                      <Badge key={item} className="text-cyan-400 bg-cyan-500/10"><Package size={10} className="mr-1" />{item}</Badge>
                    ))}
                  </div>
                )}

                {/* Sub-quests */}
                {quest.children?.length > 0 && (
                  <div className="pl-4 border-l-2 border-accent/20 space-y-2">
                    <h4 className="text-xs font-semibold text-text-secondary">Sub-quests</h4>
                    {quest.children.map((child: any) => {
                      const cs = STATUS_CONFIG[child.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.HIDDEN;
                      return (
                        <div key={child.id} className="flex items-center gap-2 text-sm">
                          <cs.icon size={12} className={cs.color} />
                          <span className="text-text-primary">{child.title}</span>
                          <Badge className={`${cs.color} text-[10px]`}>{cs.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* DM Controls */}
                {isDM && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <select value={quest.status} onChange={e => handleStatusChange(quest.id, e.target.value)}
                      className="bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary">
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(quest)}><Edit2 size={12} /></Button>
                    <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(quest.id)}><Trash2 size={12} /></Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <ScrollText className="text-accent" size={28} /> Quest Board
          </h1>
          <p className="text-text-secondary mt-1">Kelola quest, lacak storyline, dan kumpulkan rumor</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={activeCampaign} onChange={e => setActiveCampaign(e.target.value)}
            className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {isDM && (
            <Button onClick={() => { setForm({ title: '', description: '', status: 'HIDDEN', priority: 0, giverNpcId: '', rewardXP: 0, rewardGold: 0, rewardItems: '', parentId: '', objectives: [{ title: '', description: '' }] }); setEditingQuest(null); setShowForm(true); }}
              className="bg-accent hover:bg-accent/80">
              <Plus size={16} className="mr-2" /> Buat Quest
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'board', label: 'Quest Board', icon: Target },
          { key: 'story', label: 'Story Arc', icon: GitBranch },
          { key: 'rumors', label: 'Rumor Board', icon: MessageCircle },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition ${tab === t.key ? 'bg-accent text-white' : 'bg-surface-3 text-text-secondary hover:bg-surface-4'}`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* BOARD TAB — Kanban style */}
      {tab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(columns).map(([status, qs]) => {
            const st = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
            if (!st) return null;
            const StIcon = st.icon;
            return (
              <div key={status} className="space-y-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${st.bg}`}>
                  <StIcon size={16} className={st.color} />
                  <span className={`font-semibold text-sm ${st.color}`}>{st.label}</span>
                  <Badge className="ml-auto text-xs">{qs.length}</Badge>
                </div>
                <div className="space-y-2">
                  {qs.map(q => <QuestCard key={q.id} quest={q} />)}
                  {qs.length === 0 && (
                    <div className="text-center py-8 text-text-muted text-xs border border-dashed border-border rounded-lg">
                      Kosong
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STORY ARC TAB — Visual storyline tree */}
      {tab === 'story' && (
        <div className="space-y-6">
          {storyArcs.length === 0 ? (
            <Card className="p-8 text-center text-text-muted">
              <GitBranch size={48} className="mx-auto mb-4 opacity-30" />
              <p>Belum ada story arc. Buat Main Quest dengan sub-quest untuk visualisasi cerita.</p>
            </Card>
          ) : storyArcs.map(arc => {
            const st = STATUS_CONFIG[arc.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.HIDDEN;
            const completedObj = (arc.objectives || []).filter((o: any) => o.isCompleted).length;
            const totalObj = (arc.objectives || []).length;
            const progress = totalObj > 0 ? Math.round((completedObj / totalObj) * 100) : 0;

            return (
              <Card key={arc.id} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {arc.priority >= 1 ? <Crown size={20} className="text-amber-400" /> : <ScrollText size={20} className="text-text-secondary" />}
                  <h2 className="text-lg font-bold text-text-primary">{arc.title}</h2>
                  <Badge className={`${st.color} ${st.bg}`}>{st.label}</Badge>
                  {totalObj > 0 && (
                    <span className="ml-auto text-sm text-text-secondary">{progress}% selesai</span>
                  )}
                </div>
                {totalObj > 0 && (
                  <div className="w-full h-2 bg-surface-3 rounded-full mb-4 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-accent to-green-500 rounded-full" />
                  </div>
                )}
                {arc.description && <p className="text-sm text-text-secondary mb-4">{arc.description}</p>}

                {/* Objectives as timeline */}
                <div className="space-y-2 pl-4 border-l-2 border-accent/30">
                  {(arc.objectives || []).map((obj: any, i: number) => (
                    <div key={obj.id} className="flex items-center gap-3 relative">
                      <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 ${
                        obj.isCompleted ? 'bg-green-500 border-green-500' : obj.isFailed ? 'bg-red-500 border-red-500' : 'bg-surface-2 border-accent/50'
                      }`} />
                      <span className={`text-sm ${obj.isCompleted ? 'text-green-400 line-through' : obj.isFailed ? 'text-red-400 line-through' : 'text-text-primary'}`}>
                        {obj.title}
                      </span>
                      {obj.branchQuestId && <ArrowRight size={12} className="text-accent" />}
                    </div>
                  ))}
                </div>

                {/* Sub-quests branching */}
                {arc.children?.length > 0 && (
                  <div className="mt-4 pl-6 space-y-2">
                    {arc.children.map((child: any) => {
                      const cs = STATUS_CONFIG[child.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.HIDDEN;
                      return (
                        <div key={child.id} className="flex items-center gap-2 text-sm p-2 bg-surface-2 rounded-lg">
                          <GitBranch size={14} className="text-accent" />
                          <span className="text-text-primary font-medium">{child.title}</span>
                          <Badge className={`${cs.color} ${cs.bg} text-[10px]`}>{cs.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* RUMORS TAB */}
      {tab === 'rumors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Papan Rumor</h2>
            <Button onClick={() => setShowRumorForm(!showRumorForm)} size="sm" className="bg-accent hover:bg-accent/80">
              <Plus size={14} className="mr-2" /> Tambah Rumor
            </Button>
          </div>

          <AnimatePresence>
            {showRumorForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <Card className="p-4 space-y-3">
                  <textarea value={rumorForm.content} onChange={e => setRumorForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Aku dengar dari pedagang di pelabuhan bahwa..."
                    rows={3} className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm resize-none" />
                  <div className="flex gap-3">
                    <Input value={rumorForm.source} onChange={e => setRumorForm(f => ({ ...f, source: e.target.value }))}
                      placeholder="Sumber (NPC, tavern gossip...)" className="flex-1" />
                    <Button onClick={handleSubmitRumor} className="bg-accent"><Save size={14} className="mr-2" /> Kirim</Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rumors.map(rumor => (
              <motion.div key={rumor.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className={`p-4 ${rumor.isVerified ? 'border-green-500/30' : 'border-amber-500/20'}`}>
                  <div className="flex items-start gap-3">
                    <MessageCircle size={20} className={rumor.isVerified ? 'text-green-400' : 'text-amber-400'} />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary italic">&ldquo;{rumor.content}&rdquo;</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span>Sumber: {rumor.source}</span>
                        <span>oleh {rumor.postedBy?.displayName || 'Unknown'}</span>
                        {rumor.isVerified && <Badge className="text-green-400 bg-green-500/10">Terverifikasi</Badge>}
                        {rumor.quest && <Badge className="text-accent bg-accent/10">Quest: {rumor.quest.title}</Badge>}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {rumors.length === 0 && (
              <div className="col-span-full text-center py-16 text-text-muted">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                <p>Belum ada rumor. Kumpulkan informasi dari NPC dan tavern!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUEST FORM MODAL */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-surface-1 border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">{editingQuest ? 'Edit Quest' : 'Buat Quest Baru'}</h2>
                <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Judul Quest</label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Mencari Pedang Suci..." />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Prioritas</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary">
                    {PRIORITY_CONFIG.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-1 block">Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Detail quest..."
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary text-sm resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Reward XP</label>
                  <Input type="number" value={form.rewardXP} onChange={e => setForm(f => ({ ...f, rewardXP: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Reward Gold</label>
                  <Input type="number" value={form.rewardGold} onChange={e => setForm(f => ({ ...f, rewardGold: Number(e.target.value) }))} />
                </div>
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-1 block">Reward Items (koma)</label>
                <Input value={form.rewardItems} onChange={e => setForm(f => ({ ...f, rewardItems: e.target.value }))} placeholder="Pedang Api, Cincin Perlindungan..." />
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-1 block">Parent Quest (untuk sub-quest)</label>
                <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary">
                  <option value="">Tidak ada (root quest)</option>
                  {quests.filter(q => q.id !== editingQuest?.id).map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
              </div>

              {/* Objectives */}
              <div className="space-y-2">
                <label className="text-sm text-text-secondary">Objectives</label>
                {form.objectives.map((obj, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={obj.title} onChange={e => {
                      const objs = [...form.objectives];
                      objs[i] = { ...objs[i], title: e.target.value };
                      setForm(f => ({ ...f, objectives: objs }));
                    }} placeholder={`Objective ${i + 1}...`} className="flex-1" />
                    <button onClick={() => setForm(f => ({ ...f, objectives: f.objectives.filter((_, j) => j !== i) }))}
                      className="text-red-400 hover:text-red-300"><X size={16} /></button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" onClick={() => setForm(f => ({ ...f, objectives: [...f.objectives, { title: '', description: '' }] }))}>
                  <Plus size={12} className="mr-1" /> Tambah Objective
                </Button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} className="bg-accent hover:bg-accent/80"><Save size={14} className="mr-2" /> Simpan</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Quest Aktif', count: quests.filter(q => q.status === 'ACTIVE').length, icon: Flame, color: 'text-amber-400' },
          { label: 'Selesai', count: quests.filter(q => q.status === 'COMPLETED').length, icon: Trophy, color: 'text-green-400' },
          { label: 'Tersedia', count: quests.filter(q => q.status === 'AVAILABLE').length, icon: Target, color: 'text-blue-400' },
          { label: 'Rumor', count: rumors.length, icon: MessageCircle, color: 'text-amber-400' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center ${s.color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{s.count}</p>
                <p className="text-xs text-text-secondary">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
