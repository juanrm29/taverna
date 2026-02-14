'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Plus, Search, Filter, Edit2, Trash2, Save, X, Eye, EyeOff,
  Users, MapPin, Shield, Scroll, Star, Landmark, Skull, Package, Sparkles,
  ChevronRight, Link2, Network, Tag, FileText, ArrowLeft, Layers,
  Crown, Swords, BookOpen, Brain,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { useToast } from '@/components/Feedback';
import { useTranslation } from '@/lib/i18n';
import * as api from '@/lib/api-client';
import { useSession } from 'next-auth/react';

// ============================================================
// Category config
// ============================================================
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

// ============================================================
// WORLD LORE WIKI PAGE
// ============================================================
export default function LoreWikiPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const toast = useToast();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<string>('');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [showSecrets, setShowSecrets] = useState(false);

  // Detail / Edit state
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'graph' | 'map'>('list');

  // Form
  const [form, setForm] = useState({
    title: '', category: 'NPC', content: '', summary: '', tags: '',
    isSecret: false, mapPinX: 50, mapPinY: 50, parentId: '', linkedEntryIds: [] as string[],
  });

  // isDM check
  const isDM = useMemo(() => {
    const c = campaigns.find(c => c.id === activeCampaign);
    return c?.dmId === session?.user?.id;
  }, [campaigns, activeCampaign, session]);

  // Load campaigns
  useEffect(() => {
    api.getCampaigns().then(c => {
      setCampaigns(c);
      if (c.length) setActiveCampaign(c[0].id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Load entries when campaign changes
  const loadEntries = useCallback(async () => {
    if (!activeCampaign) return;
    try {
      const data = await api.getLoreEntries(activeCampaign);
      setEntries(data);
    } catch { }
  }, [activeCampaign]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // Filtered entries
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

  // Save entry
  const handleSave = async () => {
    try {
      const data = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (creating) {
        await api.createLoreEntry(activeCampaign, data);
        toast.success('Lore entry dibuat!');
      } else if (selectedEntry) {
        await api.updateLoreEntry(selectedEntry.id, data);
        toast.success('Lore entry diperbarui!');
      }
      setCreating(false);
      setEditing(false);
      setSelectedEntry(null);
      loadEntries();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Delete entry
  const handleDelete = async (id: string) => {
    try {
      await api.deleteLoreEntry(id);
      toast.success('Entry dihapus');
      setSelectedEntry(null);
      loadEntries();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Open create form
  const openCreate = () => {
    setForm({ title: '', category: 'NPC', content: '', summary: '', tags: '', isSecret: false, mapPinX: 50, mapPinY: 50, parentId: '', linkedEntryIds: [] });
    setCreating(true);
    setEditing(true);
    setSelectedEntry(null);
  };

  // Open edit form
  const openEdit = (entry: any) => {
    setForm({
      title: entry.title,
      category: entry.category,
      content: entry.content,
      summary: entry.summary || '',
      tags: (entry.tags || []).join(', '),
      isSecret: entry.isSecret,
      mapPinX: entry.mapPinX ?? 50,
      mapPinY: entry.mapPinY ?? 50,
      parentId: entry.parentId || '',
      linkedEntryIds: [
        ...(entry.linksFrom || []).map((l: any) => l.to?.id),
        ...(entry.linksTo || []).map((l: any) => l.from?.id),
      ].filter(Boolean),
    });
    setSelectedEntry(entry);
    setEditing(true);
    setCreating(false);
  };

  // Get all linked entries for graph view
  const graphData = useMemo(() => {
    const nodes = entries.map(e => ({
      id: e.id, label: e.title, category: e.category,
      x: e.mapPinX ?? Math.random() * 100,
      y: e.mapPinY ?? Math.random() * 100,
    }));
    const links: { from: string; to: string; label: string }[] = [];
    entries.forEach(e => {
      (e.linksFrom || []).forEach((l: any) => {
        if (l.to) links.push({ from: e.id, to: l.to.id, label: l.label || '' });
      });
    });
    return { nodes, links };
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
          className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  // ---- DETAIL VIEW ----
  if (selectedEntry && !editing) {
    const cat = getCategoryConfig(selectedEntry.category);
    const CatIcon = cat.icon;
    const allLinks = [
      ...(selectedEntry.linksFrom || []).map((l: any) => ({ ...l.to, label: l.label })),
      ...(selectedEntry.linksTo || []).map((l: any) => ({ ...l.from, label: l.label })),
    ].filter(Boolean);

    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <button onClick={() => setSelectedEntry(null)}
          className="flex items-center gap-2 text-text-secondary hover:text-accent transition">
          <ArrowLeft size={16} /> Kembali ke Wiki
        </button>

        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center ${cat.color}`}>
                <CatIcon size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{selectedEntry.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cat.color}>{cat.label}</Badge>
                  {selectedEntry.isSecret && <Badge className="text-red-400"><EyeOff size={12} className="mr-1" /> Rahasia DM</Badge>}
                </div>
              </div>
            </div>
            {isDM && (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(selectedEntry)}><Edit2 size={14} /></Button>
                <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(selectedEntry.id)}><Trash2 size={14} /></Button>
              </div>
            )}
          </div>

          {selectedEntry.summary && (
            <p className="text-text-secondary italic border-l-2 border-accent/40 pl-4">{selectedEntry.summary}</p>
          )}

          <div className="prose prose-invert max-w-none text-text-primary whitespace-pre-wrap">
            {selectedEntry.content || 'Belum ada konten.'}
          </div>

          {selectedEntry.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedEntry.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-surface-3 rounded text-xs text-text-secondary">
                  <Tag size={10} className="inline mr-1" />{tag}
                </span>
              ))}
            </div>
          )}

          {/* Linked entries */}
          {allLinks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Link2 size={14} /> Terhubung Dengan
              </h3>
              <div className="flex flex-wrap gap-2">
                {allLinks.map((link: any) => {
                  const lc = getCategoryConfig(link.category);
                  const LcIcon = lc.icon;
                  return (
                    <button key={link.id}
                      onClick={() => { const full = entries.find((e: any) => e.id === link.id); if (full) setSelectedEntry(full); }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-surface-3 hover:bg-surface-4 rounded-lg transition text-sm">
                      <LcIcon size={14} className={lc.color} />
                      <span className="text-text-primary">{link.title}</span>
                      {link.label && <span className="text-text-muted text-xs">({link.label})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Children */}
          {selectedEntry.children?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Layers size={14} /> Sub-entry
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedEntry.children.map((child: any) => (
                  <button key={child.id}
                    onClick={() => { const full = entries.find((e: any) => e.id === child.id); if (full) setSelectedEntry(full); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface-3 hover:bg-surface-4 rounded-lg transition text-sm">
                    <ChevronRight size={14} /> {child.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ---- EDIT / CREATE FORM ----
  if (editing) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">{creating ? 'Buat Lore Baru' : 'Edit Lore'}</h1>
          <Button variant="ghost" onClick={() => { setEditing(false); setCreating(false); }}><X size={16} /></Button>
        </div>

        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Judul</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nama entry..." />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Kategori</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Ringkasan</label>
            <Input value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Deskripsi singkat..." />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Konten (Markdown)</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={12} placeholder="Tulis lore detail di sini..."
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary font-mono text-sm resize-y" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Tags (pisahkan koma)</label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="elvish, magic, ancient..." />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Parent Entry</label>
              <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-text-primary">
                <option value="">Tidak ada (root)</option>
                {entries.filter(e => e.id !== selectedEntry?.id).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
          </div>

          {/* Linked entries multi-select */}
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Link ke Entry Lain</label>
            <div className="flex flex-wrap gap-2 p-2 bg-surface-2 border border-border rounded-lg min-h-[40px]">
              {form.linkedEntryIds.map(lid => {
                const linked = entries.find(e => e.id === lid);
                return linked ? (
                  <span key={lid} className="flex items-center gap-1 px-2 py-1 bg-accent/20 rounded text-xs text-accent">
                    {linked.title}
                    <button onClick={() => setForm(f => ({ ...f, linkedEntryIds: f.linkedEntryIds.filter(i => i !== lid) }))}><X size={10} /></button>
                  </span>
                ) : null;
              })}
              <select value="" onChange={e => {
                if (e.target.value && !form.linkedEntryIds.includes(e.target.value)) {
                  setForm(f => ({ ...f, linkedEntryIds: [...f.linkedEntryIds, e.target.value] }));
                }
              }} className="bg-transparent text-text-secondary text-xs">
                <option value="">+ Tambah link...</option>
                {entries.filter(e => e.id !== selectedEntry?.id && !form.linkedEntryIds.includes(e.id)).map(e =>
                  <option key={e.id} value={e.id}>{e.title}</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={form.isSecret} onChange={e => setForm(f => ({ ...f, isSecret: e.target.checked }))}
                className="rounded border-border" />
              <EyeOff size={14} /> Rahasia (hanya DM)
            </label>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="bg-accent hover:bg-accent/80">
              <Save size={14} className="mr-2" /> Simpan
            </Button>
            <Button variant="ghost" onClick={() => { setEditing(false); setCreating(false); }}>Batal</Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- MAIN LIST VIEW ----
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Globe className="text-accent" size={28} /> World Lore Wiki
          </h1>
          <p className="text-text-secondary mt-1">Ensiklopedia dunia kampanye — NPC, lokasi, faksi, artefak</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={activeCampaign} onChange={e => setActiveCampaign(e.target.value)}
            className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {isDM && (
            <Button onClick={openCreate} className="bg-accent hover:bg-accent/80">
              <Plus size={16} className="mr-2" /> Tambah Entry
            </Button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari lore..." className="pl-10" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFilterCat('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterCat === 'ALL' ? 'bg-accent text-white' : 'bg-surface-3 text-text-secondary hover:bg-surface-4'}`}>
            Semua
          </button>
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            return (
              <button key={c.value} onClick={() => setFilterCat(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${filterCat === c.value ? 'bg-accent text-white' : 'bg-surface-3 text-text-secondary hover:bg-surface-4'}`}>
                <Icon size={12} /> {c.label}
              </button>
            );
          })}
        </div>
        {isDM && (
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer ml-auto">
            <input type="checkbox" checked={showSecrets} onChange={e => setShowSecrets(e.target.checked)} />
            <EyeOff size={12} /> Tampilkan rahasia
          </label>
        )}
      </div>

      {/* View mode tabs */}
      <div className="flex gap-2">
        {[
          { key: 'list', label: 'Daftar', icon: FileText },
          { key: 'graph', label: 'Relasi', icon: Network },
          { key: 'map', label: 'Peta', icon: MapPin },
        ].map(v => {
          const Icon = v.icon;
          return (
            <button key={v.key} onClick={() => setViewMode(v.key as any)}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition ${viewMode === v.key ? 'bg-accent text-white' : 'bg-surface-3 text-text-secondary hover:bg-surface-4'}`}>
              <Icon size={14} /> {v.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(entry => {
              const cat = getCategoryConfig(entry.category);
              const CatIcon = cat.icon;
              return (
                <motion.div key={entry.id} layout
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setSelectedEntry(entry)} className="cursor-pointer">
                  <Card className="p-4 hover:border-accent/40 transition-all group">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center ${cat.color} group-hover:scale-110 transition`}>
                        <CatIcon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text-primary truncate">{entry.title}</h3>
                          {entry.isSecret && <EyeOff size={12} className="text-red-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{entry.summary || entry.content?.slice(0, 100) || 'Tidak ada deskripsi'}</p>
                        {entry.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.slice(0, 3).map((tag: string) => (
                              <span key={tag} className="px-1.5 py-0.5 bg-surface-3 rounded text-[10px] text-text-muted">{tag}</span>
                            ))}
                            {entry.tags.length > 3 && <span className="text-[10px] text-text-muted">+{entry.tags.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Link count */}
                    {((entry.linksFrom?.length || 0) + (entry.linksTo?.length || 0)) > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                        <Link2 size={10} /> {(entry.linksFrom?.length || 0) + (entry.linksTo?.length || 0)} koneksi
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-text-muted">
              <Globe size={48} className="mx-auto mb-4 opacity-30" />
              <p>Belum ada lore entry. {isDM ? 'Klik "Tambah Entry" untuk memulai.' : 'DM belum menambahkan lore.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Graph View — Relationship visualization */}
      {viewMode === 'graph' && (
        <Card className="p-6 min-h-[500px] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.05),transparent_70%)]" />
          <svg className="w-full h-[500px]" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Links */}
            {graphData.links.map((link, i) => {
              const from = graphData.nodes.find(n => n.id === link.from);
              const to = graphData.nodes.find(n => n.id === link.to);
              if (!from || !to) return null;
              return (
                <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="rgba(201,169,110,0.3)" strokeWidth="0.3" />
              );
            })}
            {/* Nodes */}
            {graphData.nodes.map(node => {
              const cat = getCategoryConfig(node.category);
              return (
                <g key={node.id} className="cursor-pointer"
                  onClick={() => { const full = entries.find(e => e.id === node.id); if (full) setSelectedEntry(full); }}>
                  <circle cx={node.x} cy={node.y} r="2.5" fill="rgba(201,169,110,0.2)" stroke="rgba(201,169,110,0.6)" strokeWidth="0.3" />
                  <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize="2.2" fill="rgba(255,255,255,0.8)">{node.label}</text>
                </g>
              );
            })}
          </svg>
          {graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <Network size={48} className="mx-auto mb-4 opacity-30" />
                <p>Belum ada data untuk graf relasi</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Map View — World map with pins */}
      {viewMode === 'map' && (
        <Card className="p-6 min-h-[500px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/20 via-surface-1 to-blue-950/20 rounded-xl" />
          {/* Grid overlay for map feel */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
          <div className="relative w-full h-[500px]">
            {entries.filter(e => e.mapPinX != null && e.mapPinY != null).map(entry => {
              const cat = getCategoryConfig(entry.category);
              const CatIcon = cat.icon;
              return (
                <button key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  style={{ left: `${entry.mapPinX}%`, top: `${entry.mapPinY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group">
                  <motion.div whileHover={{ scale: 1.3 }}
                    className={`w-8 h-8 rounded-full bg-surface-2 border-2 border-accent/60 flex items-center justify-center ${cat.color} shadow-lg`}>
                    <CatIcon size={14} />
                  </motion.div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-surface-0 rounded text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                    {entry.title}
                  </div>
                </button>
              );
            })}
            {entries.filter(e => e.mapPinX != null).length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                <div className="text-center">
                  <MapPin size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Belum ada pin peta. Edit entry dan tambahkan koordinat peta.</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORIES.slice(0, 4).map(c => {
          const Icon = c.icon;
          const count = entries.filter(e => e.category === c.value).length;
          return (
            <Card key={c.value} className="p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center ${c.color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{count}</p>
                <p className="text-xs text-text-secondary">{c.label}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
