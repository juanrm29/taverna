'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Plus, Search, Edit2, Trash2, Save, X, EyeOff,
  Users, MapPin, Shield, Scroll, Star, Landmark, Skull, Package,
  ChevronRight, Link2, Tag, FileText, ArrowLeft, Crown,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';

const CATEGORIES = [
  { value: 'NPC', label: 'NPC', icon: Users, color: 'text-blue-400' },
  { value: 'LOCATION', label: 'Lokasi', icon: MapPin, color: 'text-green-400' },
  { value: 'FACTION', label: 'Faksi', icon: Shield, color: 'text-purple-400' },
  { value: 'ITEM', label: 'Artefak', icon: Package, color: 'text-yellow-400' },
  { value: 'EVENT', label: 'Event', icon: Star, color: 'text-orange-400' },
  { value: 'LORE', label: 'Lore', icon: Scroll, color: 'text-cyan-400' },
  { value: 'DEITY', label: 'Dewa', icon: Crown, color: 'text-amber-400' },
  { value: 'CREATURE', label: 'Makhluk', icon: Skull, color: 'text-red-400' },
  { value: 'MISC', label: 'Lainnya', icon: FileText, color: 'text-gray-400' },
] as const;

function getCategoryConfig(cat: string) {
  return CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];
}

interface LoreWikiPanelProps {
  campaignId: string;
  isDM: boolean;
}

export default function LoreWikiPanel({ campaignId, isDM }: LoreWikiPanelProps) {
  const toast = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [showSecrets, setShowSecrets] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '', category: 'NPC', content: '', summary: '', tags: '',
    isSecret: false, mapPinX: 50, mapPinY: 50, parentId: '', linkedEntryIds: [] as string[],
  });

  const loadEntries = useCallback(async () => {
    if (!campaignId) return;
    try { setEntries(await api.getLoreEntries(campaignId)); } catch {}
  }, [campaignId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const filtered = useMemo(() => {
    let list = entries;
    if (filterCat !== 'ALL') list = list.filter(e => e.category === filterCat);
    if (!showSecrets) list = list.filter(e => !e.isSecret);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.summary?.toLowerCase().includes(q) ||
        e.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [entries, filterCat, showSecrets, search]);

  const handleSave = async () => {
    try {
      const data = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (creating) {
        await api.createLoreEntry(campaignId, data);
        toast.success('Lore entry dibuat!');
      } else if (selectedEntry) {
        await api.updateLoreEntry(selectedEntry.id, data);
        toast.success('Lore entry diperbarui!');
      }
      setCreating(false); setEditing(false); setSelectedEntry(null);
      loadEntries();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteLoreEntry(id);
      toast.success('Entry dihapus'); setSelectedEntry(null); loadEntries();
    } catch (err: any) { toast.error(err.message); }
  };

  const openCreate = () => {
    setForm({ title: '', category: 'NPC', content: '', summary: '', tags: '', isSecret: false, mapPinX: 50, mapPinY: 50, parentId: '', linkedEntryIds: [] });
    setCreating(true); setEditing(true); setSelectedEntry(null);
  };

  const openEdit = (entry: any) => {
    setForm({
      title: entry.title, category: entry.category, content: entry.content,
      summary: entry.summary || '', tags: (entry.tags || []).join(', '),
      isSecret: entry.isSecret, mapPinX: entry.mapPinX ?? 50, mapPinY: entry.mapPinY ?? 50,
      parentId: entry.parentId || '',
      linkedEntryIds: [
        ...(entry.linksFrom || []).map((l: any) => l.to?.id),
        ...(entry.linksTo || []).map((l: any) => l.from?.id),
      ].filter(Boolean),
    });
    setSelectedEntry(entry); setEditing(true); setCreating(false);
  };

  // ── DETAIL VIEW ──
  if (selectedEntry && !editing) {
    const cat = getCategoryConfig(selectedEntry.category);
    const CatIcon = cat.icon;
    const allLinks = [
      ...(selectedEntry.linksFrom || []).map((l: any) => ({ ...l.to, label: l.label })),
      ...(selectedEntry.linksTo || []).map((l: any) => ({ ...l.from, label: l.label })),
    ].filter(Boolean);

    return (
      <div className="p-3 h-full flex flex-col overflow-y-auto">
        <button onClick={() => setSelectedEntry(null)}
          className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition text-xs mb-3">
          <ArrowLeft size={12} /> Kembali
        </button>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center ${cat.color}`}>
            <CatIcon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-text-primary truncate">{selectedEntry.title}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge className={`${cat.color} text-[9px]`}>{cat.label}</Badge>
              {selectedEntry.isSecret && <Badge className="text-red-400 text-[9px]"><EyeOff size={8} className="mr-0.5" />DM</Badge>}
            </div>
          </div>
          {isDM && (
            <div className="flex gap-1">
              <button onClick={() => openEdit(selectedEntry)} className="p-1 rounded hover:bg-surface-3 text-text-muted"><Edit2 size={12} /></button>
              <button onClick={() => handleDelete(selectedEntry.id)} className="p-1 rounded hover:bg-surface-3 text-red-400"><Trash2 size={12} /></button>
            </div>
          )}
        </div>
        {selectedEntry.summary && (
          <p className="text-xs text-text-secondary italic border-l-2 border-accent/40 pl-2 mb-2">{selectedEntry.summary}</p>
        )}
        <div className="text-xs text-text-primary whitespace-pre-wrap flex-1 mb-2">{selectedEntry.content || 'Belum ada konten.'}</div>
        {selectedEntry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedEntry.tags.map((tag: string) => (
              <span key={tag} className="px-1.5 py-0.5 bg-surface-3 rounded text-[9px] text-text-muted">
                <Tag size={8} className="inline mr-0.5" />{tag}
              </span>
            ))}
          </div>
        )}
        {allLinks.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-[9px] font-bold text-text-tertiary uppercase flex items-center gap-1"><Link2 size={9} /> Terhubung</h4>
            <div className="flex flex-wrap gap-1">
              {allLinks.map((link: any) => {
                const lc = getCategoryConfig(link.category);
                const LcIcon = lc.icon;
                return (
                  <button key={link.id}
                    onClick={() => { const full = entries.find(e => e.id === link.id); if (full) setSelectedEntry(full); }}
                    className="flex items-center gap-1 px-2 py-1 bg-surface-3 hover:bg-surface-4 rounded text-[10px] transition">
                    <LcIcon size={10} className={lc.color} />
                    <span className="text-text-primary">{link.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── EDIT / CREATE FORM ──
  if (editing) {
    return (
      <div className="p-3 h-full flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-text-primary">{creating ? 'Buat Lore Baru' : 'Edit Lore'}</h3>
          <button onClick={() => { setEditing(false); setCreating(false); }} className="p-1 text-text-muted hover:text-text-primary"><X size={14} /></button>
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto">
          <div>
            <label className="text-[9px] text-text-tertiary uppercase">Judul</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nama..." className="text-xs h-8" />
          </div>
          <div>
            <label className="text-[9px] text-text-tertiary uppercase">Kategori</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] text-text-tertiary uppercase">Ringkasan</label>
            <Input value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Deskripsi singkat..." className="text-xs h-8" />
          </div>
          <div>
            <label className="text-[9px] text-text-tertiary uppercase">Konten</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={6} placeholder="Detail lore..."
              className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary resize-y" />
          </div>
          <div>
            <label className="text-[9px] text-text-tertiary uppercase">Tags (koma)</label>
            <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="elvish, magic..." className="text-xs h-8" />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input type="checkbox" checked={form.isSecret} onChange={e => setForm(f => ({ ...f, isSecret: e.target.checked }))} className="rounded border-border" />
            <EyeOff size={11} /> Rahasia DM
          </label>
        </div>
        <div className="flex gap-2 pt-2 border-t border-border/20 mt-2">
          <Button onClick={handleSave} size="sm" className="bg-accent hover:bg-accent/80 flex-1 text-xs"><Save size={12} className="mr-1" /> Simpan</Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setCreating(false); }} className="text-xs">Batal</Button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center gap-1.5 mb-2">
        <Globe className="w-3.5 h-3.5 text-accent/60" />
        <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">World Lore</span>
        {isDM && (
          <button onClick={openCreate} className="ml-auto p-1 rounded hover:bg-surface-3 text-accent transition" title="Tambah Entry">
            <Plus size={12} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari lore..."
          className="w-full bg-surface-2/50 border border-border/30 rounded-lg pl-6 pr-2 py-1.5 text-[10px] text-text-secondary outline-none focus:border-accent/30" />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1 mb-2">
        <button onClick={() => setFilterCat('ALL')}
          className={`px-2 py-0.5 rounded text-[9px] font-medium transition ${filterCat === 'ALL' ? 'bg-accent text-white' : 'bg-surface-3 text-text-muted hover:bg-surface-4'}`}>
          All
        </button>
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.value} onClick={() => setFilterCat(c.value)}
              className={`px-1.5 py-0.5 rounded text-[9px] transition flex items-center gap-0.5 ${filterCat === c.value ? 'bg-accent text-white' : 'bg-surface-3 text-text-muted hover:bg-surface-4'}`}>
              <Icon size={9} /> {c.label}
            </button>
          );
        })}
        {isDM && (
          <label className="flex items-center gap-1 text-[9px] text-text-muted cursor-pointer ml-auto">
            <input type="checkbox" checked={showSecrets} onChange={e => setShowSecrets(e.target.checked)} className="w-3 h-3" />
            <EyeOff size={9} />
          </label>
        )}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        <AnimatePresence mode="popLayout">
          {filtered.map(entry => {
            const cat = getCategoryConfig(entry.category);
            const CatIcon = cat.icon;
            return (
              <motion.button key={entry.id} layout
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedEntry(entry)}
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-surface-2/30 hover:bg-surface-2/60 border border-border/20 hover:border-accent/30 transition text-left">
                <div className={`w-7 h-7 rounded-md bg-surface-3 flex items-center justify-center ${cat.color} shrink-0`}>
                  <CatIcon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-text-primary truncate">{entry.title}</span>
                    {entry.isSecret && <EyeOff size={9} className="text-red-400 shrink-0" />}
                  </div>
                  <p className="text-[9px] text-text-muted truncate">{entry.summary || entry.content?.slice(0, 60) || 'Tidak ada deskripsi'}</p>
                </div>
                <ChevronRight size={11} className="text-text-muted shrink-0" />
              </motion.button>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            <Globe size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-[10px]">Belum ada lore entry</p>
          </div>
        )}
      </div>
    </div>
  );
}
