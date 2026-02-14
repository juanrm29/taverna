'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Target, CheckCircle2, XCircle, Eye, EyeOff,
  Star, Coins, ChevronDown, ChevronRight, Users,
  MessageCircle, ThumbsUp, ThumbsDown, Edit2, Trash2, Save, X,
  AlertTriangle, Crown, Flame, Package, ScrollText, Trophy,
  GitBranch,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import { Skull } from 'lucide-react';

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

interface QuestBoardPanelProps {
  campaignId: string;
  isDM: boolean;
}

export default function QuestBoardPanel({ campaignId, isDM }: QuestBoardPanelProps) {
  const toast = useToast();
  const [quests, setQuests] = useState<any[]>([]);
  const [rumors, setRumors] = useState<any[]>([]);
  const [tab, setTab] = useState<'quests' | 'rumors'>('quests');
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Rumor form
  const [showRumorForm, setShowRumorForm] = useState(false);
  const [rumorForm, setRumorForm] = useState({ content: '', source: '' });

  const loadData = useCallback(async () => {
    if (!campaignId) return;
    try {
      const [q, r] = await Promise.all([
        api.getQuests(campaignId),
        api.getRumors(campaignId),
      ]);
      setQuests(q);
      setRumors(r);
    } catch {}
  }, [campaignId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredQuests = useMemo(() => {
    let list = quests.filter(q => !q.parentId);
    if (filterStatus !== 'ALL') list = list.filter(q => q.status === filterStatus);
    if (!isDM) list = list.filter(q => q.status !== 'HIDDEN');
    return list;
  }, [quests, filterStatus, isDM]);

  const handleVote = async (questId: string, vote: number) => {
    try { await api.voteQuest(questId, vote); loadData(); } catch {}
  };

  const handleToggleObjective = async (questId: string, objectiveId: string, isCompleted: boolean) => {
    try {
      await api.updateObjective(questId, objectiveId, { isCompleted });
      toast.success(isCompleted ? 'Objective selesai!' : 'Objective dibatalkan');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleStatusChange = async (questId: string, status: string) => {
    try {
      await api.updateQuest(questId, { status });
      toast.success(`Status: ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}`);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSubmitRumor = async () => {
    if (!rumorForm.content.trim()) return;
    try {
      await api.createRumor(campaignId, { content: rumorForm.content, source: rumorForm.source || 'Unknown' });
      toast.success('Rumor ditambahkan!');
      setRumorForm({ content: '', source: '' });
      setShowRumorForm(false);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteQuest = async (id: string) => {
    try {
      await api.deleteQuest(id);
      toast.success('Quest dihapus');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  // Stats
  const activeCount = quests.filter(q => q.status === 'ACTIVE').length;
  const completedCount = quests.filter(q => q.status === 'COMPLETED').length;

  return (
    <div className="p-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <ScrollText className="w-3.5 h-3.5 text-accent/60" />
        <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Quest Board</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[9px] text-amber-400 font-bold">{activeCount}</span>
          <Flame size={9} className="text-amber-400" />
          <span className="text-[9px] text-green-400 font-bold ml-1">{completedCount}</span>
          <Trophy size={9} className="text-green-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        <button onClick={() => setTab('quests')}
          className={`flex-1 py-1 rounded text-[9px] font-medium transition ${tab === 'quests' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-secondary'}`}>
          <Target size={10} className="inline mr-0.5" /> Quests ({quests.length})
        </button>
        <button onClick={() => setTab('rumors')}
          className={`flex-1 py-1 rounded text-[9px] font-medium transition ${tab === 'rumors' ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-secondary'}`}>
          <MessageCircle size={10} className="inline mr-0.5" /> Rumors ({rumors.length})
        </button>
      </div>

      {/* QUESTS TAB */}
      {tab === 'quests' && (
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {/* Status filter */}
          <div className="flex flex-wrap gap-1 mb-1">
            {['ALL', 'ACTIVE', 'AVAILABLE', 'COMPLETED'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-medium transition ${filterStatus === s ? 'bg-accent text-white' : 'bg-surface-3 text-text-muted hover:bg-surface-4'}`}>
                {s === 'ALL' ? 'Semua' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="popLayout">
            {filteredQuests.map(quest => {
              const st = STATUS_CONFIG[quest.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.HIDDEN;
              const StIcon = st.icon;
              const pr = PRIORITY_CONFIG.find(p => p.value === quest.priority) || PRIORITY_CONFIG[0];
              const PrIcon = pr.icon;
              const isExpanded = expandedQuest === quest.id;
              const totalVotes = (quest.votes || []).reduce((sum: number, v: any) => sum + v.vote, 0);

              return (
                <motion.div key={quest.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={`p-2 rounded-lg border transition ${
                    quest.priority === 2 ? 'border-red-500/30 bg-red-500/5' :
                    quest.priority === 1 ? 'border-amber-500/20 bg-amber-500/5' :
                    'border-border/20 bg-surface-2/30'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <PrIcon size={11} className={pr.color} />
                      <span className="text-xs font-medium text-text-primary truncate flex-1">{quest.title}</span>
                      <Badge className={`${st.color} ${st.bg} text-[8px] px-1 py-0`}>
                        <StIcon size={8} className="mr-0.5" />{st.label}
                      </Badge>
                      {!isDM && quest.status === 'AVAILABLE' && (
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => handleVote(quest.id, 1)} className="p-0.5 rounded hover:bg-green-500/20 text-green-400"><ThumbsUp size={10} /></button>
                          <span className="text-[9px] font-bold text-text-muted">{totalVotes}</span>
                          <button onClick={() => handleVote(quest.id, -1)} className="p-0.5 rounded hover:bg-red-500/20 text-red-400"><ThumbsDown size={10} /></button>
                        </div>
                      )}
                      <button onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
                        className="p-0.5 rounded hover:bg-surface-3 text-text-muted">
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                    </div>

                    {quest.giverNpc && (
                      <p className="text-[9px] text-text-muted mt-0.5 flex items-center gap-0.5 pl-4">
                        <Users size={8} /> Dari: {quest.giverNpc.name}
                      </p>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="mt-2 space-y-2 overflow-hidden">
                          {quest.description && (
                            <p className="text-[10px] text-text-secondary pl-2 border-l border-accent/20">{quest.description}</p>
                          )}

                          {/* Objectives */}
                          {quest.objectives?.length > 0 && (
                            <div className="space-y-1">
                              <h4 className="text-[8px] font-bold text-text-tertiary uppercase">Objectives</h4>
                              {quest.objectives.map((obj: any) => (
                                <div key={obj.id} className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => isDM && handleToggleObjective(quest.id, obj.id, !obj.isCompleted)}
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                                      obj.isCompleted ? 'bg-green-500/20 border-green-500 text-green-400' :
                                      obj.isFailed ? 'bg-red-500/20 border-red-500 text-red-400' :
                                      'border-border hover:border-accent/50'
                                    }`}>
                                    {obj.isCompleted && <CheckCircle2 size={9} />}
                                    {obj.isFailed && <XCircle size={9} />}
                                  </button>
                                  <span className={`text-[10px] ${obj.isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                                    {obj.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Rewards */}
                          {(quest.rewardXP > 0 || quest.rewardGold > 0) && (
                            <div className="flex flex-wrap gap-1">
                              {quest.rewardXP > 0 && <Badge className="text-purple-400 bg-purple-500/10 text-[8px]"><Star size={8} className="mr-0.5" />{quest.rewardXP} XP</Badge>}
                              {quest.rewardGold > 0 && <Badge className="text-yellow-400 bg-yellow-500/10 text-[8px]"><Coins size={8} className="mr-0.5" />{quest.rewardGold} GP</Badge>}
                              {quest.rewardItems?.map((item: string) => (
                                <Badge key={item} className="text-cyan-400 bg-cyan-500/10 text-[8px]"><Package size={8} className="mr-0.5" />{item}</Badge>
                              ))}
                            </div>
                          )}

                          {/* DM controls */}
                          {isDM && (
                            <div className="flex items-center gap-1 pt-1 border-t border-border/20">
                              <select value={quest.status} onChange={e => handleStatusChange(quest.id, e.target.value)}
                                className="bg-surface-2 border border-border rounded px-1 py-0.5 text-[9px] text-text-primary flex-1">
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                              <button onClick={() => handleDeleteQuest(quest.id)} className="p-1 rounded hover:bg-surface-3 text-red-400"><Trash2 size={10} /></button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredQuests.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              <Target size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-[10px]">Belum ada quest</p>
            </div>
          )}
        </div>
      )}

      {/* RUMORS TAB */}
      {tab === 'rumors' && (
        <div className="flex-1 overflow-y-auto space-y-1.5">
          <button onClick={() => setShowRumorForm(!showRumorForm)}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-border/40 text-text-muted hover:text-accent hover:border-accent/30 text-[10px] transition mb-1">
            <Plus size={10} /> Tambah Rumor
          </button>

          <AnimatePresence>
            {showRumorForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="p-2 bg-surface-2/50 border border-border/30 rounded-lg space-y-1.5 mb-1.5">
                  <textarea value={rumorForm.content} onChange={e => setRumorForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Aku dengar..." rows={2}
                    className="w-full bg-surface-2 border border-border rounded px-2 py-1 text-[10px] text-text-primary resize-none" />
                  <div className="flex gap-1.5">
                    <input value={rumorForm.source} onChange={e => setRumorForm(f => ({ ...f, source: e.target.value }))}
                      placeholder="Sumber..." className="flex-1 bg-surface-2 border border-border rounded px-2 py-1 text-[10px] text-text-primary" />
                    <button onClick={handleSubmitRumor} className="px-2 py-1 bg-accent text-white rounded text-[9px] font-medium hover:bg-accent/80">
                      <Save size={9} className="inline mr-0.5" /> Kirim
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {rumors.map(rumor => (
            <div key={rumor.id} className={`p-2 rounded-lg border transition ${rumor.isVerified ? 'border-green-500/20' : 'border-border/20'} bg-surface-2/30`}>
              <div className="flex items-start gap-1.5">
                <MessageCircle size={12} className={rumor.isVerified ? 'text-green-400 mt-0.5' : 'text-amber-400 mt-0.5'} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-primary italic">&ldquo;{rumor.content}&rdquo;</p>
                  <div className="flex items-center gap-2 mt-1 text-[8px] text-text-muted">
                    <span>{rumor.source}</span>
                    {rumor.isVerified && <span className="text-green-400">✓ Verified</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {rumors.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              <MessageCircle size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-[10px]">Belum ada rumor</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
