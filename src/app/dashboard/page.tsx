'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Plus, Users, Crown, Calendar, Copy, Check,
  Scroll, Shield, Trash2, Edit3, MoreVertical,
  Zap, BookOpen, Swords
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input, EmptyState, Skeleton } from '@/components/ui';
import { useAppStore } from '@/lib/zustand';
import { useToast, useConfirm } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n';

interface CampaignData {
  id: string;
  name: string;
  description: string;
  dmId: string;
  inviteCode: string;
  status: string;
  ruleSet: string;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
  dm: { id: string; displayName: string; image?: string };
  _count: { members: number; characters?: number; gameSessions?: number };
}

// Loading skeleton for campaign cards
function DashboardSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <Skeleton variant="title" width="280px" />
          <Skeleton variant="text" width="180px" className="mt-3" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="custom" width="100px" height="36px" className="rounded-lg" />
          <Skeleton variant="custom" width="140px" height="36px" className="rounded-lg" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="card" height="130px" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const user = session?.user;
  const toast = useToast();
  const { confirm } = useConfirm();
  const { setActiveCampaignRole } = useAppStore();
  const { t, fmt } = useTranslation();

  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showEdit, setShowEdit] = useState<CampaignData | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
      if (data.length > 0) {
        const isDM = data.some((c: CampaignData) => c.dmId === user?.id);
        setActiveCampaignRole(isDM ? 'DM' : 'PLAYER');
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [user?.id, setActiveCampaignRole, toast]);

  useEffect(() => {
    if (user) loadCampaigns();
  }, [user, loadCampaigns]);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreate(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  const myCampaigns = campaigns.filter(c => c.dmId === user?.id);
  const joinedCampaigns = campaigns.filter(c => c.dmId !== user?.id);

  const handleCreate = async () => {
    if (!createForm.name.trim()) { setError(t.dashboard.failedCreate); return; }
    try {
      await api.createCampaign({ name: createForm.name.trim(), description: createForm.description.trim() });
      await loadCampaigns();
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      setError('');
      toast.success(t.dashboard.campaignCreated);
    } catch (err: any) { setError(err.message); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setError(t.dashboard.enterInviteCode); return; }
    try {
      const result = await api.joinCampaign(joinCode.trim());
      await loadCampaigns();
      setShowJoin(false);
      setJoinCode('');
      setError('');
      toast.success(`Joined "${result.campaign?.name || 'campaign'}"!`);
    } catch (err: any) { setError(err.message); }
  };

  const handleEdit = async () => {
    if (!showEdit || !editForm.name.trim()) return;
    try {
      await api.updateCampaign(showEdit.id, { name: editForm.name.trim(), description: editForm.description.trim() });
      await loadCampaigns();
      setShowEdit(null);
      toast.success(t.dashboard.campaignUpdated);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (campaign: CampaignData) => {
    const ok = await confirm({ title: t.dashboard.deleteCampaign, description: fmt(t.dashboard.deleteConfirm, { name: campaign.name }), variant: 'danger', confirmText: t.common.delete });
    if (!ok) return;
    try {
      await api.deleteCampaign(campaign.id);
      await loadCampaigns();
      toast.success(t.dashboard.campaignDeleted);
    } catch (err: any) { toast.error(err.message); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.info(t.dashboard.inviteCodeCopied);
    setTimeout(() => setCopied(null), 2000);
  };

  const openEdit = (campaign: CampaignData) => {
    setEditForm({ name: campaign.name, description: campaign.description });
    setShowEdit(campaign);
  };

  const greeting = new Date().getHours() < 12 ? t.dashboard.goodMorning : new Date().getHours() < 18 ? t.dashboard.goodAfternoon : t.dashboard.goodEvening;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            {greeting}, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1.5">
            {campaigns.length === 0 ? t.dashboard.noCampaignsDesc : `${campaigns.length} ${t.nav.campaigns.toLowerCase()} active`}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowJoin(true)}>{t.dashboard.joinCampaign}</Button>
          <Button size="sm" onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>{t.dashboard.createNewCampaign}</Button>
        </motion.div>
      </div>

      {/* Quick Actions when has campaigns */}
      {campaigns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8"
        >
          {[
            { href: '/session-live', icon: <Zap className="w-4 h-4" />, label: t.nav.liveSession, accent: true },
            { href: '/characters', icon: <Users className="w-4 h-4" />, label: t.nav.characters },
            { href: '/compendium', icon: <BookOpen className="w-4 h-4" />, label: t.nav.compendium },
            { href: '/dice', icon: <Swords className="w-4 h-4" />, label: t.nav.dice },
          ].map((action, i) => (
            <Link key={action.href} href={action.href}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all duration-200 group cursor-pointer ${
                  action.accent
                    ? 'bg-accent/5 border-accent/15 hover:bg-accent/10 hover:border-accent/25'
                    : 'bg-surface-1 border-border hover:border-text-tertiary/30 hover:bg-surface-2/50'
                }`}
              >
                <span className={action.accent ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary transition-colors'}>{action.icon}</span>
                <span className={`text-sm font-medium ${action.accent ? 'text-accent' : 'text-text-secondary'}`}>{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}

      {campaigns.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState icon={<Scroll className="w-12 h-12" />} title={t.dashboard.noCampaigns} description={t.dashboard.noCampaignsDesc}
            action={<div className="flex gap-3 mt-2"><Button variant="secondary" size="sm" onClick={() => setShowJoin(true)}>{t.dashboard.joinCampaign}</Button><Button size="sm" onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>{t.common.create}</Button></div>} />
        </motion.div>
      )}

      {myCampaigns.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-3.5 h-3.5 text-accent" />
            <h2 className="text-[10px] font-semibold text-text-tertiary tracking-[0.15em] uppercase">{t.dashboard.asDungeonMaster}</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
            <Badge variant="accent">{myCampaigns.length}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myCampaigns.map((c, i) => (
              <CampaignCard key={c.id} campaign={c} isDM index={i} onCopy={copyCode} copied={copied} onEdit={() => openEdit(c)} onDelete={() => handleDelete(c)} />
            ))}
          </div>
        </motion.section>
      )}

      {joinedCampaigns.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-3.5 h-3.5 text-text-tertiary" />
            <h2 className="text-[10px] font-semibold text-text-tertiary tracking-[0.15em] uppercase">{t.dashboard.asPlayer}</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
            <Badge>{joinedCampaigns.length}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {joinedCampaigns.map((c, i) => (
              <CampaignCard key={c.id} campaign={c} isDM={false} index={i} onCopy={copyCode} copied={copied} />
            ))}
          </div>
        </motion.section>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(''); }}>
        <h3 className="text-lg font-display font-bold mb-1">{t.dashboard.createNewCampaign}</h3>
        <p className="text-text-secondary text-sm mb-5">{t.dashboard.editCampaignSubtitle}</p>
        <div className="flex flex-col gap-4">
          <Input label={t.dashboard.campaignName} placeholder={t.dashboard.campaignNamePlaceholder} value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} autoFocus />
          <Input label={`${t.common.description} (${t.common.optional})`} placeholder={t.dashboard.descriptionPlaceholder} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button onClick={handleCreate} className="w-full">{t.dashboard.createCampaign}</Button>
        </div>
      </Modal>

      <Modal open={showJoin} onClose={() => { setShowJoin(false); setError(''); }}>
        <h3 className="text-lg font-display font-bold mb-1">{t.dashboard.joinCampaign}</h3>
        <p className="text-text-secondary text-sm mb-5">{t.dashboard.enterInviteCode}</p>
        <div className="flex flex-col gap-4">
          <Input label={t.dashboard.inviteCode} placeholder={t.dashboard.inviteCodePlaceholder} value={joinCode} onChange={e => setJoinCode(e.target.value)} autoFocus />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button onClick={handleJoin} className="w-full">{t.dashboard.joinCampaign}</Button>
        </div>
      </Modal>

      <Modal open={!!showEdit} onClose={() => setShowEdit(null)}>
        <h3 className="text-lg font-display font-bold mb-1">{t.dashboard.editCampaign}</h3>
        <p className="text-text-secondary text-sm mb-5">{t.dashboard.editCampaignSubtitle}</p>
        <div className="flex flex-col gap-4">
          <Input label={t.dashboard.campaignName} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} autoFocus />
          <Input label={t.common.description} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
          <Button onClick={handleEdit} className="w-full">{t.common.save}</Button>
        </div>
      </Modal>
    </div>
  );
}

function CampaignCard({ campaign, isDM, index, onCopy, copied, onEdit, onDelete }: {
  campaign: CampaignData; isDM: boolean; index: number; onCopy: (code: string) => void; copied: string | null; onEdit?: () => void; onDelete?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}>
      <Link href={`/campaign/${campaign.id}`}>
        <Card hover className="group relative overflow-hidden">
          {isDM && <div className="absolute top-0 left-0 w-12 h-0.5 bg-gradient-to-r from-accent to-transparent" />}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors truncate">{campaign.name}</h3>
              {campaign.description && <p className="text-xs text-text-tertiary mt-1 line-clamp-2 leading-relaxed">{campaign.description}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={isDM ? 'accent' : 'default'}>{isDM ? t.dashboard.dm : t.dashboard.player}</Badge>
              {isDM && (
                <div className="relative">
                  <button onClick={e => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }} className="p-1 text-text-tertiary hover:text-text-secondary rounded-md hover:bg-surface-2 transition-colors cursor-pointer">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={e => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); }} />
                      <div className="absolute right-0 top-full mt-1 bg-surface-2 border border-border rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onEdit?.(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors cursor-pointer">
                          <Edit3 className="w-3 h-3" /> {t.common.edit}
                        </button>
                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onDelete?.(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger hover:bg-danger/10 transition-colors cursor-pointer">
                          <Trash2 className="w-3 h-3" /> {t.common.delete}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {campaign._count?.members || 0}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(campaign.createdAt).toLocaleDateString()}</span>
            </div>
            {isDM && (
              <button onClick={e => { e.preventDefault(); e.stopPropagation(); onCopy(campaign.inviteCode); }} className="flex items-center gap-1 text-text-tertiary hover:text-accent transition-colors cursor-pointer" title={t.dashboard.copyInviteCode}>
                {copied === campaign.inviteCode ? <><Check className="w-3 h-3 text-success" /> {t.common.copied}</> : <><Copy className="w-3 h-3" /> {t.dashboard.code}</>}
              </button>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
