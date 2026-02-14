'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Shield, Copy, Check, Scroll,
  Plus, Trash2, BookOpen, MessageSquare, Dices, ArrowLeft,
  Heart, Edit3, Save, Play, Radio
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input, Textarea, EmptyState, StatBlock } from '@/components/ui';
import { useAppStore } from '@/lib/zustand';
import { useToast, useConfirm } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import { getAbilityModifier } from '@/lib/types';
import Link from 'next/link';

type Tab = 'overview' | 'characters' | 'notes' | 'npcs' | 'chat';

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const toast = useToast();
  const { confirm } = useConfirm();
  const { setActiveCampaignRole } = useAppStore();

  const [campaign, setCampaign] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [npcs, setNpcs] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const isDM = campaign?.dmId === user?.id;

  const reload = useCallback(async () => {
    try {
      const [c, chars, notesData, npcsData] = await Promise.all([
        api.getCampaign(id),
        api.getCharactersByCampaign(id),
        api.getNotes(id),
        api.getNPCs(id),
      ]);
      if (!c) { router.replace('/dashboard'); return; }
      setCampaign(c);
      setCharacters(chars);
      setNotes(notesData);
      setNpcs(npcsData);
      setActiveCampaignRole(c.dmId === user?.id ? 'DM' : 'PLAYER');
    } catch (err) {
      console.error('Failed to load campaign:', err);
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id, router, setActiveCampaignRole]);

  useEffect(() => { if (user) reload(); }, [user, reload]);

  const copyCode = () => {
    if (campaign) {
      navigator.clipboard.writeText(campaign.inviteCode);
      setCopied(true);
      toast.info('Invite code copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) return null;

  const memberCount = campaign._count?.members || campaign.members?.length || 0;

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { key: 'characters', label: 'Characters', icon: <Shield className="w-3.5 h-3.5" />, count: characters.length },
    { key: 'notes', label: 'Notes', icon: <Scroll className="w-3.5 h-3.5" />, count: notes.length },
    ...(isDM ? [{ key: 'npcs' as Tab, label: 'NPCs', icon: <Users className="w-3.5 h-3.5" />, count: npcs.length }] : []),
    { key: 'chat', label: 'Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <div>
      <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-4 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-display font-bold">{campaign.name}</h1>
            <Badge variant={isDM ? 'accent' : 'default'}>{isDM ? 'DM' : 'Player'}</Badge>
          </div>
          {campaign.description && <p className="text-text-secondary text-sm max-w-lg">{campaign.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {memberCount} members</span>
            <span>{campaign.ruleSet || '5e'}</span>
            <button onClick={copyCode} className="flex items-center gap-1 hover:text-accent transition-colors cursor-pointer">
              {copied ? <><Check className="w-3 h-3 text-success" /> Copied</> : <><Copy className="w-3 h-3" /> {campaign.inviteCode}</>}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/campaign/${id}/character/new`}>
            <Button size="sm" variant="secondary"><Plus className="w-4 h-4" /> New Character</Button>
          </Link>
          <Link href={`/campaign/${id}/session`}>
            <Button size="sm" variant="primary"><Play className="w-3.5 h-3.5" /> Play Session</Button>
          </Link>
          {!isDM && (
            <Button size="sm" variant="ghost" onClick={async () => {
              const ok = await confirm({ title: 'Leave Campaign', description: `Leave "${campaign.name}"? Your characters will be removed.`, variant: 'danger', confirmText: 'Leave' });
              if (ok) {
                try { await api.leaveCampaign(id); toast.info('Left campaign'); router.push('/dashboard'); } catch (err: any) { toast.error(err.message); }
              }
            }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Leave
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border mb-6 -mx-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors cursor-pointer ${tab === t.key ? 'border-accent text-accent' : 'border-transparent text-text-tertiary hover:text-text-secondary'}`}>
            {t.icon} {t.label}
            {t.count !== undefined && t.count > 0 && <span className="text-[10px] bg-surface-2 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {tab === 'overview' && <OverviewTab campaign={campaign} characters={characters} isDM={isDM} id={id} memberCount={memberCount} />}
          {tab === 'characters' && <CharactersTab characters={characters} isDM={isDM} campaignId={id} onReload={reload} />}
          {tab === 'notes' && <NotesTab notes={notes} isDM={isDM} campaignId={id} onReload={reload} />}
          {tab === 'npcs' && isDM && <NPCsTab npcs={npcs} campaignId={id} onReload={reload} />}
          {tab === 'chat' && user && <ChatTab campaignId={id} userId={user.id!} userName={user.name || 'Unknown'} isDM={isDM} characters={characters} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OverviewTab({ campaign, characters, isDM, id, memberCount }: { campaign: any; characters: any[]; isDM: boolean; id: string; memberCount: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Party</h3>
        {characters.length === 0 ? <p className="text-sm text-text-tertiary">No characters yet</p> : (
          <div className="space-y-2">
            {characters.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-text-tertiary">{c.race} {c.class} · Lv {c.level}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-danger" /> {c.hp?.current || 0}/{c.hp?.max || 0}</span>
                  <span className="flex items-center gap-0.5"><Shield className="w-3 h-3" /> {c.armorClass}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Campaign Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-tertiary">DM</span><span>{campaign.dm?.displayName || 'Unknown'}</span></div>
          <div className="flex justify-between"><span className="text-text-tertiary">Rule Set</span><span className="uppercase">{campaign.ruleSet || '5e'}</span></div>
          <div className="flex justify-between"><span className="text-text-tertiary">Status</span><Badge variant={campaign.status === 'ACTIVE' ? 'success' : 'default'}>{campaign.status}</Badge></div>
          <div className="flex justify-between"><span className="text-text-tertiary">Members</span><span>{memberCount}</span></div>
        </div>
      </Card>
      <Card>
        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Link href={`/campaign/${id}/session`} className="block"><Button variant="primary" size="sm" className="w-full justify-start"><Play className="w-3.5 h-3.5" /> Play Session</Button></Link>
          <Link href={`/campaign/${id}/character/new`} className="block"><Button variant="secondary" size="sm" className="w-full justify-start"><Plus className="w-3.5 h-3.5" /> Create Character</Button></Link>
          <Link href="/dice" className="block"><Button variant="secondary" size="sm" className="w-full justify-start"><Dices className="w-3.5 h-3.5" /> Roll Dice</Button></Link>
        </div>
      </Card>
    </div>
  );
}

function CharactersTab({ characters, isDM, campaignId, onReload }: { characters: any[]; isDM: boolean; campaignId: string; onReload: () => void }) {
  const toast = useToast();
  const { confirm } = useConfirm();

  if (characters.length === 0) {
    return (
      <EmptyState icon={<Shield className="w-8 h-8" />} title="No characters yet" description="Create your first character for this campaign."
        action={<Link href={`/campaign/${campaignId}/character/new`}><Button size="sm"><Plus className="w-4 h-4" /> Create Character</Button></Link>} />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {characters.map((char: any) => (
        <Card key={char.id} hover>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium">{char.name}</h3>
              <p className="text-xs text-text-tertiary">{char.race} {char.class} · Level {char.level}</p>
              {char.player && <p className="text-[10px] text-accent/70 mt-0.5">Player: {char.player.displayName}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="accent">AC {char.armorClass}</Badge>
              <Badge variant={(char.hp?.current || 0) > (char.hp?.max || 1) / 2 ? 'success' : 'danger'}>HP {char.hp?.current || 0}/{char.hp?.max || 0}</Badge>
            </div>
          </div>
          {char.abilityScores && (
            <div className="grid grid-cols-6 gap-1">
              {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(ab => (
                <StatBlock key={ab} label={ab.slice(0, 3).toUpperCase()} score={char.abilityScores[ab]} modifier={getAbilityModifier(char.abilityScores[ab])} />
              ))}
            </div>
          )}
          {isDM && (
            <div className="mt-3 pt-3 border-t border-border flex justify-end">
              <Button variant="ghost" size="sm" onClick={async () => {
                const ok = await confirm({ title: 'Remove Character', description: `Remove ${char.name}?`, variant: 'danger', confirmText: 'Remove' });
                if (ok) { try { await api.deleteCharacter(char.id); onReload(); toast.success('Character removed'); } catch (err: any) { toast.error(err.message); } }
              }}><Trash2 className="w-3.5 h-3.5" /> Remove</Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function NotesTab({ notes, isDM, campaignId, onReload }: { notes: any[]; isDM: boolean; campaignId: string; onReload: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const toast = useToast();
  const { confirm } = useConfirm();

  const handleAdd = async () => {
    if (!noteForm.title.trim()) return;
    try {
      await api.createNote(campaignId, { title: noteForm.title.trim(), content: noteForm.content.trim(), sessionNumber: notes.length + 1 });
      onReload();
      setShowAdd(false);
      setNoteForm({ title: '', content: '' });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleEditSave = async (id: string) => {
    if (!editForm.title.trim()) return;
    try {
      await api.updateNote(id, { title: editForm.title.trim(), content: editForm.content.trim() });
      onReload();
      setEditingNote(null);
      toast.success('Note updated');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (note: any) => {
    const ok = await confirm({ title: 'Delete Note', description: `Delete "${note.title}"?`, variant: 'danger', confirmText: 'Delete' });
    if (ok) { try { await api.deleteNote(note.id); onReload(); toast.success('Note deleted'); } catch (err: any) { toast.error(err.message); } }
  };

  return (
    <div>
      {isDM && <div className="mb-4"><Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Note</Button></div>}
      {notes.length === 0 ? (
        <EmptyState icon={<Scroll className="w-8 h-8" />} title="No session notes" description={isDM ? 'Record what happens in your sessions.' : "The DM hasn't added any notes yet."} />
      ) : (
        <div className="space-y-3">
          {notes.map((note: any) => (
            <Card key={note.id}>
              {editingNote === note.id ? (
                <div className="space-y-3">
                  <Input label="Title" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                  <Textarea label="Content" value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={4} />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditingNote(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => handleEditSave(note.id)}><Save className="w-3.5 h-3.5" /> Save</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-semibold text-accent tracking-wider">SESSION {note.sessionNumber}</span>
                      <h3 className="font-medium text-sm">{note.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-text-tertiary">{new Date(note.createdAt).toLocaleDateString()}</span>
                      {isDM && (
                        <>
                          <button onClick={() => { setEditingNote(note.id); setEditForm({ title: note.title, content: note.content }); }} className="p-1 text-text-tertiary hover:text-accent transition-colors cursor-pointer"><Edit3 className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(note)} className="p-1 text-text-tertiary hover:text-danger transition-colors cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                        </>
                      )}
                    </div>
                  </div>
                  {note.content && <p className="text-sm text-text-secondary whitespace-pre-wrap">{note.content}</p>}
                </>
              )}
            </Card>
          ))}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <h3 className="text-lg font-display font-bold mb-4">New Session Note</h3>
        <div className="flex flex-col gap-4">
          <Input label="Title" placeholder="The Ambush at Cragmaw Castle" value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} />
          <Textarea label="Content" placeholder="What happened this session..." value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} rows={6} />
          <Button onClick={handleAdd} className="w-full">Save Note</Button>
        </div>
      </Modal>
    </div>
  );
}

function NPCsTab({ npcs, campaignId, onReload }: { npcs: any[]; campaignId: string; onReload: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', race: '', description: '', personality: '', motivation: '', location: '', notes: '' });
  const toast = useToast();
  const { confirm } = useConfirm();

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      await api.createNPC(campaignId, { name: form.name.trim(), race: form.race.trim() || 'Unknown', description: form.description.trim(), personality: form.personality.trim(), motivation: form.motivation.trim(), isAlive: true, location: form.location.trim(), notes: form.notes.trim() });
      onReload();
      setShowAdd(false);
      setForm({ name: '', race: '', description: '', personality: '', motivation: '', location: '', notes: '' });
      toast.success(`${form.name.trim()} added`);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="mb-4"><Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add NPC</Button></div>
      {npcs.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No NPCs" description="Track your NPCs, their motivations, and locations." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {npcs.map((npc: any) => (
            <Card key={npc.id} hover>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-sm">{npc.name}</h3>
                  <p className="text-xs text-text-tertiary">{npc.race} {npc.location && `· ${npc.location}`}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={async () => { try { await api.updateNPC(npc.id, { isAlive: !npc.isAlive }); onReload(); } catch {} }} className="cursor-pointer">
                    <Badge variant={npc.isAlive ? 'success' : 'danger'}>{npc.isAlive ? 'Alive' : 'Dead'}</Badge>
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(npc.id); setForm({ name: npc.name, race: npc.race, description: npc.description || '', personality: npc.personality || '', motivation: npc.motivation || '', location: npc.location || '', notes: npc.notes || '' }); }}>
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    const ok = await confirm({ title: 'Delete NPC', description: `Delete ${npc.name}?`, variant: 'danger', confirmText: 'Delete' });
                    if (ok) { try { await api.deleteNPC(npc.id); onReload(); toast.success('NPC deleted'); } catch (err: any) { toast.error(err.message); } }
                  }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              {npc.description && <p className="text-xs text-text-secondary mb-1">{npc.description}</p>}
              {npc.personality && <p className="text-xs text-text-tertiary"><span className="text-accent">Personality:</span> {npc.personality}</p>}
              {npc.motivation && <p className="text-xs text-text-tertiary"><span className="text-accent">Motivation:</span> {npc.motivation}</p>}
            </Card>
          ))}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <h3 className="text-lg font-display font-bold mb-4">New NPC</h3>
        <div className="flex flex-col gap-3">
          <Input label="Name" placeholder="Sildar Hallwinter" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Race" placeholder="Human" value={form.race} onChange={e => setForm({ ...form, race: e.target.value })} />
            <Input label="Location" placeholder="Phandalin" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <Input label="Description" placeholder="A kind old warrior..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <Input label="Personality" placeholder="Brave, protective" value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })} />
          <Input label="Motivation" placeholder="Restore order to Phandalin" value={form.motivation} onChange={e => setForm({ ...form, motivation: e.target.value })} />
          <Textarea label="Notes" placeholder="DM notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
          <Button onClick={handleAdd} className="w-full">Add NPC</Button>
        </div>
      </Modal>
      <Modal open={!!editingId} onClose={() => setEditingId(null)}>
        <h3 className="text-lg font-display font-bold mb-4">Edit NPC</h3>
        <div className="flex flex-col gap-3">
          <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Race" value={form.race} onChange={e => setForm({ ...form, race: e.target.value })} />
            <Input label="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <Input label="Personality" value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })} />
          <Input label="Motivation" value={form.motivation} onChange={e => setForm({ ...form, motivation: e.target.value })} />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
          <Button onClick={async () => {
            if (!editingId || !form.name.trim()) return;
            try {
              await api.updateNPC(editingId, { name: form.name.trim(), race: form.race.trim(), description: form.description.trim(), personality: form.personality.trim(), motivation: form.motivation.trim(), location: form.location.trim(), notes: form.notes.trim() });
              onReload(); setEditingId(null); toast.success('NPC updated');
            } catch (err: any) { toast.error(err.message); }
          }} className="w-full">Save Changes</Button>
        </div>
      </Modal>
    </div>
  );
}

function ChatTab({ campaignId, userId, userName, isDM, characters }: { campaignId: string; userId: string; userName: string; isDM: boolean; characters: any[] }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await api.getMessages(campaignId);
      setMessages(data.messages || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [campaignId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    try {
      await api.sendMessage(campaignId, { type: 'TEXT', content: input.trim(), channel: 'GENERAL' });
      setInput('');
      await loadMessages();
    } catch (err: any) { console.error(err); }
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-8">No messages yet. Say something!</p>
        ) : (
          messages.map((msg: any) => (
            <div key={msg.id} className={`px-3 py-2 rounded-lg ${msg.senderId === userId ? 'bg-accent/10' : 'bg-surface-2/60'}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-accent">{msg.characterName || msg.senderName}</span>
                <span className="text-[10px] text-text-tertiary">{new Date(msg.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-text-primary">{msg.content}</p>
              {msg.diceResult && (
                <div className="mt-1 text-xs font-mono text-accent">🎲 {msg.diceResult.formula} → {msg.diceResult.total}</div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message..." className="flex-1 bg-surface-1 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-dim" />
        <Button onClick={send} disabled={!input.trim()}>Send</Button>
      </div>
    </div>
  );
}
