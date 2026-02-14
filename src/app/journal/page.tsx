'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Lock, Unlock, Trash2, Search, Edit3, Eye, X } from 'lucide-react';
import { Button, Card, Badge, Input, Textarea, Modal, EmptyState } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import { JournalEntry, Campaign } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

export default function JournalPage() {
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown' } : null;
  const toast = useToast();
  const { t } = useTranslation();

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState<JournalEntry | null>(null);
  const [editing, setEditing] = useState<JournalEntry | null>(null);

  // New entry form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'journal' | 'handout' | 'secret'>('journal');
  const [newCampaignId, setNewCampaignId] = useState('');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const allCamps = await api.getCampaigns();
        const camps = allCamps.filter((c: any) => c.dmId === user.id || (c.players && c.players.includes(user.id)));
        setCampaigns(camps);
        if (camps.length > 0 && !newCampaignId) setNewCampaignId(camps[0].id);
        // Load journals from all user campaigns
        const journalArrays = await Promise.all(camps.map((c: any) => api.getJournals(c.id)));
        const allJournals = journalArrays.flat();
        setJournals(allJournals);
      } catch (err) {
        console.error('Failed to load journal data:', err);
      }
    };
    loadData();
  }, [user, newCampaignId]);

  const filtered = journals.filter(j => {
    if (selectedCampaign !== 'all' && j.campaignId !== selectedCampaign) return false;
    if (search) {
      const q = search.toLowerCase();
      return j.title.toLowerCase().includes(q) || j.content.toLowerCase().includes(q);
    }
    return true;
  });

  const create = async () => {
    if (!newTitle.trim() || !newCampaignId) return;
    try {
      const entry = await api.createJournal(newCampaignId, {
        title: newTitle.trim(),
        content: newContent,
        type: newType,
        visibleTo: newType === 'secret' ? [user?.id || ''] : [],
      });
      setJournals(prev => [entry, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      setNewContent('');
      setNewType('journal');
      toast.success(t.journal.entryCreated);
    } catch (err) {
      console.error('Failed to create journal:', err);
      toast.error('Failed to create journal entry');
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const updated = await api.updateJournal(editing.id, { title: editing.title, content: editing.content, type: editing.type });
      if (updated) {
        setJournals(prev => prev.map(j => j.id === updated.id ? updated : j));
        setEditing(null);
        toast.success(t.journal.entrySaved);
      }
    } catch (err) {
      console.error('Failed to update journal:', err);
      toast.error('Failed to save journal entry');
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteJournal(id);
      setJournals(prev => prev.filter(j => j.id !== id));
      setViewing(null);
      toast.success(t.journal.entryDeleted);
    } catch (err) {
      console.error('Failed to delete journal:', err);
      toast.error('Failed to delete journal entry');
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'handout': return '📜';
      case 'secret': return '🔒';
      default: return '📖';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">{t.journal.title}</h1>
          <p className="text-text-secondary text-sm">{t.journal.subtitle}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> {t.journal.newEntry}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder={t.journal.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-1 border border-border rounded-md text-sm"
          />
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

      {/* Entries grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          title={t.common.noResults}
          description={t.journal.subtitle}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card hover onClick={() => setViewing(entry)} className="group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{typeIcon(entry.type)}</span>
                    <h3 className="font-medium text-sm group-hover:text-accent transition-colors line-clamp-1">{entry.title}</h3>
                  </div>
                  <Badge variant={entry.type === 'secret' ? 'danger' : entry.type === 'handout' ? 'accent' : 'default'}>
                    {entry.type}
                  </Badge>
                </div>
                <p className="text-xs text-text-tertiary line-clamp-3">{entry.content || 'Empty entry...'}</p>
                <p className="text-[10px] text-text-tertiary mt-2">{new Date(entry.createdAt).toLocaleDateString()}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* View Modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title || ''}>
        {viewing && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={viewing.type === 'secret' ? 'danger' : viewing.type === 'handout' ? 'accent' : 'default'}>
                {typeIcon(viewing.type)} {viewing.type}
              </Badge>
              <span className="text-xs text-text-tertiary">{new Date(viewing.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="prose prose-sm max-w-none text-text-secondary whitespace-pre-wrap text-sm">
              {viewing.content || t.common.noResults}
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button variant="danger" size="sm" onClick={() => remove(viewing.id)}>
                <Trash2 className="w-3.5 h-3.5" /> {t.common.delete}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setEditing(viewing); setViewing(null); }}>
                <Edit3 className="w-3.5 h-3.5" /> {t.common.edit}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={t.common.edit}>
        {editing && (
          <div className="space-y-4">
            <Input label="Title" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
            <select
              value={editing.type}
              onChange={e => setEditing({ ...editing, type: e.target.value as 'journal' | 'handout' | 'secret' })}
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm"
            >
              <option value="journal">📖 Journal</option>
              <option value="handout">📜 Handout</option>
              <option value="secret">🔒 Secret (DM Only)</option>
            </select>
            <Textarea value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>{t.common.cancel}</Button>
              <Button size="sm" onClick={saveEdit}>{t.common.save}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t.journal.newEntry}>
        <div className="space-y-4">
          <Input label="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Entry title..." />
          <select
            value={newCampaignId}
            onChange={e => setNewCampaignId(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm"
          >
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as 'journal' | 'handout' | 'secret')}
            className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="journal">📖 Journal</option>
            <option value="handout">📜 Handout</option>
            <option value="secret">🔒 Secret (DM Only)</option>
          </select>
          <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write your entry..." />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>{t.common.cancel}</Button>
            <Button size="sm" onClick={create} disabled={!newTitle.trim()}>
              <Plus className="w-3.5 h-3.5" /> {t.common.create}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
