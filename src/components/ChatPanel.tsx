'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Dices, EyeOff, BookOpen,
  Hash, Pin, Trash2, X, Swords,
  Search, SmilePlus, Reply, Edit3, CornerUpRight, AtSign, PinOff,
} from 'lucide-react';
import { useChatStore } from '@/lib/chatStore';
import { useSession } from 'next-auth/react';
import { ChatMessage, DiceResult, ChatChannel, CHAT_CHANNELS, ChatReaction, formatModifier } from '@/lib/types';
import * as api from '@/lib/api-client';

// ============================================================
// CONSTANTS
// ============================================================
const QUICK_REACTIONS = ['👍', '❤️', '🎲', '⚔️', '😂', '🔥', '💀', '✨', '👏', '🤔'];

// ============================================================
// Markdown-like Rich Text Renderer
// ============================================================
function RichText({ content }: { content: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`(.+?)`|@(\w+))/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
    }
    if (match[2]) {
      parts.push(<strong key={key++} className="font-bold text-text-primary">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++} className="italic">{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<span key={key++} className="line-through opacity-60">{match[4]}</span>);
    } else if (match[5]) {
      parts.push(
        <code key={key++} className="bg-surface-3/80 text-accent px-1.5 py-0.5 rounded text-[11px] font-mono">{match[5]}</code>
      );
    } else if (match[6]) {
      const isEveryone = match[6] === 'everyone';
      parts.push(
        <span key={key++} className={`px-1 py-0.5 rounded text-[11px] font-semibold ${
          isEveryone ? 'bg-warning/15 text-warning' : 'bg-accent/15 text-accent'
        }`}>@{match[6]}</span>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }
  return <>{parts.length > 0 ? parts : content}</>;
}

// ============================================================
// Date Separator
// ============================================================
function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let label: string;
  if (d.toDateString() === today.toDateString()) label = 'Today';
  else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
  else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

// ============================================================
// Reaction Bar
// ============================================================
function ReactionBar({ reactions, userId, onToggle }: {
  reactions: ChatReaction[];
  userId: string;
  onToggle: (emoji: string) => void;
}) {
  if (!reactions || reactions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map(r => (
        <button key={r.emoji} onClick={() => onToggle(r.emoji)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] transition-all cursor-pointer border ${
            r.userIds.includes(userId)
              ? 'bg-accent/15 border-accent/30 text-accent'
              : 'bg-surface-2/60 border-border/40 text-text-tertiary hover:border-accent/20'
          }`}>
          <span>{r.emoji}</span>
          <span className="font-mono text-[10px]">{r.userIds.length}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Add Reaction Popover
// ============================================================
function ReactionPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 4 }}
      className="absolute bottom-full right-0 mb-1 bg-surface-2 border border-border/60 rounded-xl p-2 shadow-2xl shadow-black/40 z-50">
      <div className="grid grid-cols-5 gap-1">
        {QUICK_REACTIONS.map(e => (
          <button key={e} onClick={() => onPick(e)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-3 cursor-pointer transition-all hover:scale-110 text-sm">{e}</button>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// Message Action Bar (Discord-style floating toolbar)
// ============================================================
function MessageActionBar({ msg, isDM, isOwn, onReply, onReaction, onEdit, onPin, onDelete }: {
  msg: ChatMessage; isDM: boolean; isOwn: boolean;
  onReply: () => void; onReaction: () => void; onEdit?: () => void; onPin?: () => void; onDelete?: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="absolute -top-3 right-2 flex items-center gap-0.5 bg-surface-2 border border-border/60 rounded-lg p-0.5 shadow-xl shadow-black/20 z-20">
      <button onClick={onReply} className="p-1 hover:bg-surface-3 rounded text-text-tertiary hover:text-accent cursor-pointer" title="Reply"><Reply className="w-3 h-3" /></button>
      <button onClick={onReaction} className="p-1 hover:bg-surface-3 rounded text-text-tertiary hover:text-accent cursor-pointer" title="React"><SmilePlus className="w-3 h-3" /></button>
      {isOwn && onEdit && <button onClick={onEdit} className="p-1 hover:bg-surface-3 rounded text-text-tertiary hover:text-accent cursor-pointer" title="Edit"><Edit3 className="w-3 h-3" /></button>}
      {isDM && onPin && <button onClick={onPin} className="p-1 hover:bg-surface-3 rounded text-text-tertiary hover:text-accent cursor-pointer" title={msg.pinned ? 'Unpin' : 'Pin'}>{msg.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}</button>}
      {(isDM || isOwn) && onDelete && <button onClick={onDelete} className="p-1 hover:bg-surface-3 rounded text-text-tertiary hover:text-danger cursor-pointer" title="Delete"><Trash2 className="w-3 h-3" /></button>}
    </motion.div>
  );
}

// ============================================================
// Reply Preview Block
// ============================================================
function ReplyPreview({ sender, content }: { sender?: string; content?: string }) {
  if (!content) return null;
  return (
    <div className="flex items-center gap-1.5 mt-0.5 mb-0.5">
      <div className="w-0.5 h-3 rounded-full bg-accent/40 shrink-0" />
      <CornerUpRight className="w-2.5 h-2.5 text-text-tertiary/50 shrink-0" />
      <span className="text-[10px] text-accent/60 font-medium">{sender}</span>
      <span className="text-[10px] text-text-tertiary/50 truncate max-w-[200px]">{content}</span>
    </div>
  );
}

// ============================================================
// Dice Quick-Roll Panel
// ============================================================
function DiceQuickPanel({ onRoll }: { onRoll: (result: DiceResult) => void }) {
  const [formula, setFormula] = useState('1d20');
  const [label, setLabel] = useState('');
  const QUICK_DICE = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6', '1d100'];

  const doRoll = (f?: string) => {
    const useFormula = f || formula;
    const result = api.rollDiceLocal(useFormula);
    const firstRoll = result.rolls[0];
    const sides = parseInt(useFormula.match(/d(\d+)/)?.[1] || '0');
    onRoll({
      formula: useFormula, ...result, label: label || undefined,
      isCritical: sides === 20 && result.rolls.length === 1 && firstRoll === 20,
      isFumble: sides === 20 && result.rolls.length === 1 && firstRoll === 1,
    });
    setLabel('');
  };

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="p-2.5 bg-surface-2/50 border-b border-border/40 space-y-2">
        <div className="flex flex-wrap gap-1">
          {QUICK_DICE.map(d => (
            <button key={d} onClick={() => doRoll(d)}
              className="px-2 py-1 text-[10px] bg-surface-1 border border-border/50 rounded-lg hover:border-accent/40 text-text-secondary hover:text-accent transition-colors cursor-pointer font-mono">{d}</button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input type="text" value={formula} onChange={e => setFormula(e.target.value)} onKeyDown={e => e.key === 'Enter' && doRoll()}
            className="flex-1 text-[11px] font-mono bg-surface-1 border border-border/50 rounded-lg px-2 py-1 focus:border-accent/40 outline-none" placeholder="e.g. 2d6+3" />
          <input type="text" value={label} onChange={e => setLabel(e.target.value)}
            className="flex-1 text-[11px] bg-surface-1 border border-border/50 rounded-lg px-2 py-1 focus:border-accent/40 outline-none" placeholder="Label" />
          <button onClick={() => doRoll()} className="px-3 py-1 bg-accent text-surface-0 rounded-lg text-[10px] font-bold hover:brightness-110 transition cursor-pointer">Roll</button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Single Message Renderer — Discord-level
// ============================================================
function ChatMessageItem({ msg, currentUserId, isDM, onPin, onDelete, onReaction, onReply, onEdit }: {
  msg: ChatMessage;
  currentUserId: string;
  isDM: boolean;
  onPin?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReaction?: (id: string, emoji: string) => void;
  onReply?: (msg: ChatMessage) => void;
  onEdit?: (msg: ChatMessage) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const isOwn = msg.senderId === currentUserId;

  if (msg.type === 'whisper' && msg.senderId !== currentUserId && msg.whisperTo !== currentUserId && !isDM) return null;

  // System messages
  if (msg.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="text-[10px] text-text-tertiary italic bg-surface-2/60 px-3 py-0.5 rounded-full">{msg.content}</span>
      </div>
    );
  }

  // Narration (DM)
  if (msg.type === 'narration') {
    return (
      <div className="mx-2 my-1.5 group relative" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}>
        <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-semibold text-accent tracking-wider uppercase">DM Narration</span>
            <span className="text-[10px] text-text-tertiary ml-auto">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <ReplyPreview sender={msg.replyToSender} content={msg.replyToPreview} />
          <p className="text-sm text-text-primary italic leading-relaxed"><RichText content={msg.content} /></p>
          <ReactionBar reactions={msg.reactions || []} userId={currentUserId} onToggle={e => onReaction?.(msg.id, e)} />
        </div>
        <AnimatePresence>
          {showActions && (
            <div className="relative">
              <MessageActionBar msg={msg} isDM={isDM} isOwn={isOwn}
                onReply={() => onReply?.(msg)} onReaction={() => setShowReactionPicker(!showReactionPicker)}
                onPin={() => onPin?.(msg.id)} onDelete={() => onDelete?.(msg.id)} />
              {showReactionPicker && <ReactionPicker onPick={e => { onReaction?.(msg.id, e); setShowReactionPicker(false); }} />}
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Emote
  if (msg.type === 'emote') {
    return (
      <div className="px-3 py-1 group relative" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}>
        <span className="text-sm text-text-secondary italic">
          <span className="text-accent font-medium">{msg.characterName || msg.senderName}</span> {msg.content}
        </span>
        <span className="text-[10px] text-text-tertiary ml-2">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <ReactionBar reactions={msg.reactions || []} userId={currentUserId} onToggle={e => onReaction?.(msg.id, e)} />
        <AnimatePresence>
          {showActions && (
            <MessageActionBar msg={msg} isDM={isDM} isOwn={isOwn}
              onReply={() => onReply?.(msg)} onReaction={() => setShowReactionPicker(!showReactionPicker)} />
          )}
          {showReactionPicker && <ReactionPicker onPick={e => { onReaction?.(msg.id, e); setShowReactionPicker(false); }} />}
        </AnimatePresence>
      </div>
    );
  }

  // Whisper
  if (msg.type === 'whisper') {
    return (
      <div className="mx-2 my-1">
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <EyeOff className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-purple-400 font-medium">
              {isOwn ? `Whisper to ${msg.whisperToName}` : `${msg.senderName} whispers to you`}
            </span>
            <span className="text-[10px] text-text-tertiary ml-auto">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="text-sm text-purple-300/80 italic"><RichText content={msg.content} /></p>
        </div>
      </div>
    );
  }

  // Combat result
  if (msg.type === 'combat' && msg.combatResult) {
    const cr = msg.combatResult;
    return (
      <div className="mx-2 my-1.5 group relative" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}>
        <div className="bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Swords className="w-3.5 h-3.5 text-danger" />
            <span className="text-[10px] font-semibold text-danger tracking-wider uppercase">Combat</span>
            <span className="text-[10px] text-text-tertiary ml-auto">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="text-sm text-text-primary font-medium">{msg.senderName}{cr.targetName ? ` → ${cr.targetName}` : ''}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
            {cr.attackRoll && <span className="font-mono">🎯 {cr.attackRoll.total} to hit</span>}
            {cr.hit !== undefined && <span className={cr.hit ? 'text-success font-semibold' : 'text-danger font-semibold'}>{cr.hit ? '✓ Hit' : '✗ Miss'}</span>}
            {cr.damageRoll && <span className="font-mono">⚔️ {cr.damageRoll.total} {cr.damageRoll.type || ''} dmg</span>}
            {cr.savingThrow && <span className="font-mono">🛡️ DC {cr.savingThrow.dc} {cr.savingThrow.ability} save</span>}
          </div>
          {cr.spellName && <p className="text-[10px] text-text-tertiary mt-1 italic">{cr.spellName}</p>}
          <ReactionBar reactions={msg.reactions || []} userId={currentUserId} onToggle={e => onReaction?.(msg.id, e)} />
        </div>
        <AnimatePresence>
          {showActions && (
            <MessageActionBar msg={msg} isDM={isDM} isOwn={isOwn}
              onReply={() => onReply?.(msg)} onReaction={() => setShowReactionPicker(!showReactionPicker)} />
          )}
          {showReactionPicker && <ReactionPicker onPick={e => { onReaction?.(msg.id, e); setShowReactionPicker(false); }} />}
        </AnimatePresence>
      </div>
    );
  }

  // Dice roll
  if (msg.type === 'dice' && msg.diceResult) {
    const r = msg.diceResult;
    return (
      <div className="flex gap-2 px-3 py-1.5 group relative" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}>
        <div className="w-6 h-6 rounded-full bg-surface-2 text-text-tertiary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
          {(msg.characterName || msg.senderName).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-text-primary">{msg.characterName || msg.senderName}</span>
            {msg.characterName && <span className="text-[10px] text-text-tertiary">({msg.senderName})</span>}
            <span className="text-[10px] text-text-tertiary">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <ReplyPreview sender={msg.replyToSender} content={msg.replyToPreview} />
          <div className={`inline-block mt-1 rounded-lg px-3 py-2 ${
            r.isCritical ? 'bg-success/10 border border-success/30' :
            r.isFumble ? 'bg-danger/10 border border-danger/30' :
            'bg-surface-2/60 border border-border/40'
          }`}>
            <div className="flex items-center gap-2.5">
              <Dices className={`w-4 h-4 ${r.isCritical ? 'text-success' : r.isFumble ? 'text-danger' : 'text-accent'}`} />
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-text-secondary">{r.formula}</span>
                  <span className="text-text-tertiary">→</span>
                  <span className="font-mono text-xs text-text-tertiary">[{r.rolls.join(', ')}]</span>
                  {r.modifier !== 0 && <span className="text-text-tertiary text-xs">{formatModifier(r.modifier)}</span>}
                  <span className={`font-bold text-lg ${r.isCritical ? 'text-success' : r.isFumble ? 'text-danger' : 'text-accent'}`}>{r.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.label && <span className="text-[10px] text-text-tertiary">{r.label}</span>}
                  {r.isCritical && <span className="text-[10px] text-success font-semibold uppercase tracking-wider">✦ Critical!</span>}
                  {r.isFumble && <span className="text-[10px] text-danger font-semibold uppercase tracking-wider">✗ Fumble!</span>}
                </div>
              </div>
            </div>
          </div>
          <ReactionBar reactions={msg.reactions || []} userId={currentUserId} onToggle={e => onReaction?.(msg.id, e)} />
        </div>
        <AnimatePresence>
          {showActions && (
            <MessageActionBar msg={msg} isDM={isDM} isOwn={isOwn}
              onReply={() => onReply?.(msg)} onReaction={() => setShowReactionPicker(!showReactionPicker)}
              onPin={() => onPin?.(msg.id)} onDelete={() => onDelete?.(msg.id)} />
          )}
          {showReactionPicker && <ReactionPicker onPick={e => { onReaction?.(msg.id, e); setShowReactionPicker(false); }} />}
        </AnimatePresence>
      </div>
    );
  }

  // Regular text / OOC — Discord-level
  const isOOC = msg.type === 'ooc';
  return (
    <div
      className={`flex gap-2 px-3 py-1.5 group relative transition-colors ${
        msg.mentionEveryone || msg.mentions?.includes(currentUserId) ? 'bg-warning/5 border-l-2 border-warning/40' : 'hover:bg-surface-2/20'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}
    >
      <div className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
        isOOC ? 'bg-surface-3 text-text-tertiary' : 'bg-accent/20 text-accent'
      }`}>
        {(msg.characterName || msg.senderName).charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-xs font-semibold ${isOOC ? 'text-text-secondary' : 'text-text-primary'}`}>
            {msg.characterName || msg.senderName}
          </span>
          {msg.characterName && <span className="text-[10px] text-text-tertiary">({msg.senderName})</span>}
          {isOOC && <span className="text-[9px] text-text-tertiary/60 bg-surface-2/60 px-1.5 py-0.5 rounded">OOC</span>}
          <span className="text-[10px] text-text-tertiary/50">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {msg.pinned && <Pin className="w-2.5 h-2.5 text-accent/60" />}
          {msg.editedAt && <span className="text-[9px] text-text-tertiary/40 italic">(edited)</span>}
        </div>
        <ReplyPreview sender={msg.replyToSender} content={msg.replyToPreview} />
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isOOC ? 'text-text-tertiary' : 'text-text-secondary'}`}>
          <RichText content={msg.content} />
        </p>
        <ReactionBar reactions={msg.reactions || []} userId={currentUserId} onToggle={e => onReaction?.(msg.id, e)} />
      </div>
      {/* Action bar — Discord style floating */}
      <AnimatePresence>
        {showActions && (
          <>
            <MessageActionBar msg={msg} isDM={isDM} isOwn={isOwn}
              onReply={() => onReply?.(msg)} onReaction={() => setShowReactionPicker(!showReactionPicker)}
              onEdit={() => onEdit?.(msg)} onPin={() => onPin?.(msg.id)} onDelete={() => onDelete?.(msg.id)} />
            {showReactionPicker && <ReactionPicker onPick={e => { onReaction?.(msg.id, e); setShowReactionPicker(false); }} />}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Pinned Messages Panel
// ============================================================
function PinnedPanel({ pinnedMessages, onClose, onUnpin }: {
  pinnedMessages: ChatMessage[];
  onClose: () => void;
  onUnpin: (id: string) => void;
}) {
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="border-b border-border/40 bg-surface-2/30">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Pin className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Pinned Messages</span>
            <span className="text-[9px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-full font-mono">{pinnedMessages.length}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-3 rounded text-text-tertiary hover:text-text-primary cursor-pointer"><X className="w-3 h-3" /></button>
        </div>
        <div className="max-h-[200px] overflow-y-auto px-3 pb-2 space-y-1">
          {pinnedMessages.length === 0 ? (
            <p className="text-[10px] text-text-tertiary text-center py-3 italic">No pinned messages</p>
          ) : pinnedMessages.map(m => (
            <div key={m.id} className="flex items-start gap-2 bg-surface-1/50 rounded-lg px-2.5 py-2 border border-border/20">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-accent">{m.characterName || m.senderName}</span>
                  <span className="text-[9px] text-text-tertiary">{new Date(m.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{m.content}</p>
              </div>
              <button onClick={() => onUnpin(m.id)} className="p-1 hover:bg-surface-3 rounded text-text-tertiary hover:text-danger cursor-pointer shrink-0" title="Unpin"><PinOff className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Search Panel
// ============================================================
function SearchPanel({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const { searchQuery, setSearchQuery, performSearch, searchResults } = useChatStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) performSearch(campaignId);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, campaignId, performSearch]);

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="border-b border-border/40 bg-surface-2/30">
        <div className="flex items-center gap-2 px-3 py-2">
          <Search className="w-3 h-3 text-accent shrink-0" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages..." autoFocus
            className="flex-1 text-[11px] bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary/50" />
          <span className="text-[9px] text-text-tertiary font-mono">{searchResults.length} results</span>
          <button onClick={onClose} className="p-1 hover:bg-surface-3 rounded text-text-tertiary hover:text-text-primary cursor-pointer"><X className="w-3 h-3" /></button>
        </div>
        {searchResults.length > 0 && (
          <div className="max-h-[200px] overflow-y-auto px-3 pb-2 space-y-1">
            {searchResults.slice(0, 20).map(m => (
              <div key={m.id} className="bg-surface-1/50 rounded-lg px-2.5 py-2 border border-border/20">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-accent">{m.characterName || m.senderName}</span>
                  {m.channel && <span className="text-[9px] text-text-tertiary/50">#{m.channel}</span>}
                  <span className="text-[9px] text-text-tertiary ml-auto">{new Date(m.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{m.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Channel Sidebar
// ============================================================
function ChannelList({ activeChannel, onSelect, messageCounts }: {
  activeChannel: ChatChannel;
  onSelect: (ch: ChatChannel) => void;
  messageCounts: Record<string, number>;
}) {
  return (
    <div className="w-[130px] shrink-0 border-r border-border/30 bg-surface-1/50 flex flex-col">
      <div className="px-3 py-2 border-b border-border/30">
        <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Channels</span>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {CHAT_CHANNELS.map(ch => {
          const count = messageCounts[ch.id] || 0;
          return (
            <button key={ch.id} onClick={() => onSelect(ch.id)}
              className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                activeChannel === ch.id ? 'bg-accent/10 text-accent' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2/50'
              }`}>
              <span className="text-xs">{ch.icon}</span>
              <span className="text-[10px] font-medium flex-1 truncate">{ch.label}</span>
              {count > 0 && activeChannel !== ch.id && (
                <span className="text-[8px] bg-accent/20 text-accent px-1 py-0.5 rounded-full font-bold min-w-[16px] text-center">{count > 99 ? '99+' : count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Chat Panel (Main Component) — Discord-level
// ============================================================
interface ChatPanelProps {
  campaignId: string;
  isDM: boolean;
  players?: { id: string; name: string }[];
  characterName?: string;
  className?: string;
  height?: string;
}

export default function ChatPanel({ campaignId, isDM, players = [], characterName, className = '', height = 'h-[65vh]' }: ChatPanelProps) {
  const { data: session } = useSession();
  const user = session?.user ? { id: (session.user as any).id || session.user.email || '', displayName: session.user.name || 'Unknown' } : null;
  const {
    messages, sendText, sendDiceRoll, sendWhisper, sendNarration, sendEmote, sendSystem,
    loadMessages, pinMessage, deleteMessage, clearChat, editMessage, toggleReaction,
    chatMode, setChatMode, whisperTarget, setWhisperTarget,
    showDicePanel, setShowDicePanel, isNarrationMode, setNarrationMode,
    activeChannel, setActiveChannel,
    replyingTo, setReplyingTo, editingMessage, setEditingMessage,
    isSearchOpen, toggleSearch, showPinnedPanel, togglePinnedPanel, pinnedMessages,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { loadMessages(campaignId); }, [campaignId, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeChannel]);

  // When editing, populate input
  useEffect(() => {
    if (editingMessage) { setInput(editingMessage.content); inputRef.current?.focus(); }
  }, [editingMessage]);

  // Filter messages by active channel
  const channelMessages = useMemo(() => {
    if (activeChannel === 'whispers') return messages.filter(m => m.type === 'whisper' || m.channel === 'whispers');
    return messages.filter(m => {
      if (m.type === 'system') return true;
      return (m.channel || 'general') === activeChannel;
    });
  }, [messages, activeChannel]);

  // Message counts per channel
  const messageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    messages.forEach(m => {
      const ch = m.type === 'whisper' ? 'whispers' : (m.channel || 'general');
      counts[ch] = (counts[ch] || 0) + 1;
    });
    return counts;
  }, [messages]);

  // Group messages with date separators
  const groupedMessages = useMemo(() => {
    const result: { type: 'date' | 'message'; date?: string; msg?: ChatMessage }[] = [];
    let lastDate = '';
    channelMessages.forEach(msg => {
      const msgDate = new Date(msg.timestamp).toDateString();
      if (msgDate !== lastDate) { result.push({ type: 'date', date: msg.timestamp }); lastDate = msgDate; }
      result.push({ type: 'message', msg });
    });
    return result;
  }, [channelMessages]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    const text = input.trim();
    setInput('');

    // If editing
    if (editingMessage) { editMessage(editingMessage.id, text); setEditingMessage(null); return; }

    // Command parsing
    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const cmd = parts[0].toLowerCase();
      const rest = parts.slice(1).join(' ');

      switch (cmd) {
        case '/roll': case '/r': {
          const result = api.rollDiceLocal(rest || '1d20');
          const sides = parseInt((rest || '1d20').match(/d(\d+)/)?.[1] || '0');
          sendDiceRoll(campaignId, user.id, user.displayName, {
            formula: rest || '1d20', ...result,
            isCritical: sides === 20 && result.rolls.length === 1 && result.rolls[0] === 20,
            isFumble: sides === 20 && result.rolls.length === 1 && result.rolls[0] === 1,
          }, characterName);
          return;
        }
        case '/w': case '/whisper': {
          const firstSpace = rest.indexOf(' ');
          if (firstSpace > 0) {
            const targetName = rest.slice(0, firstSpace);
            const whisperMsg = rest.slice(firstSpace + 1);
            const target = players.find(p => p.name.toLowerCase().startsWith(targetName.toLowerCase()));
            if (target) sendWhisper(campaignId, user.id, user.displayName, whisperMsg, target.id, target.name);
          }
          return;
        }
        case '/narrate': case '/n': { if (isDM) sendNarration(campaignId, user.id, user.displayName, rest); return; }
        case '/me': case '/emote': { sendEmote(campaignId, user.id, user.displayName, rest, characterName); return; }
        case '/clear': {
          if (isDM) { clearChat(campaignId); sendSystem(campaignId, 'Chat has been cleared by the DM.'); }
          return;
        }
        default: break;
      }
    }

    if (whisperTarget) { sendWhisper(campaignId, user.id, user.displayName, text, whisperTarget.id, whisperTarget.name); return; }
    if (isNarrationMode && isDM) { sendNarration(campaignId, user.id, user.displayName, text); return; }
    sendText(campaignId, user.id, user.displayName, text, characterName);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') { setReplyingTo(null); setEditingMessage(null); setInput(''); }
    if (e.key === '@') setShowMentions(true);
  };

  const insertMention = (name: string) => {
    setInput(prev => prev + `@${name} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleDiceRoll = useCallback((result: DiceResult) => {
    if (!user) return;
    sendDiceRoll(campaignId, user.id, user.displayName, result, characterName);
  }, [campaignId, user, characterName, sendDiceRoll]);

  const handleReaction = useCallback((msgId: string, emoji: string) => {
    if (!user) return;
    toggleReaction(msgId, emoji, user.id);
  }, [user, toggleReaction]);

  if (!user) return null;

  const activeChannelInfo = CHAT_CHANNELS.find(c => c.id === activeChannel);

  return (
    <div className={`flex bg-surface-1 border border-border/50 rounded-xl overflow-hidden ${className}`} style={{ height: height === 'h-full' ? '100%' : undefined }}>
      {/* Channel Sidebar */}
      <ChannelList activeChannel={activeChannel} onSelect={setActiveChannel} messageCounts={messageCounts} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-surface-2/30 shrink-0">
          <div className="flex items-center gap-2">
            <Hash className="w-3.5 h-3.5 text-text-tertiary" />
            <span className="text-xs font-bold text-text-primary">{activeChannelInfo?.label || 'general'}</span>
            <span className="text-[9px] text-text-tertiary/50 hidden md:inline">{activeChannelInfo?.desc}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setChatMode(chatMode === 'ic' ? 'ooc' : 'ic')}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-colors cursor-pointer ${
                chatMode === 'ic' ? 'bg-accent/15 text-accent' : 'bg-surface-3/50 text-text-tertiary'
              }`}>{chatMode === 'ic' ? 'IC' : 'OOC'}</button>
            <button onClick={() => setShowDicePanel(!showDicePanel)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showDicePanel ? 'bg-accent/15 text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}>
              <Dices className="w-3 h-3" />
            </button>
            <button onClick={toggleSearch}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isSearchOpen ? 'bg-accent/15 text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}>
              <Search className="w-3 h-3" />
            </button>
            <button onClick={togglePinnedPanel}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${showPinnedPanel ? 'bg-accent/15 text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}>
              <Pin className="w-3 h-3" />
              {pinnedMessages.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent text-surface-0 text-[7px] font-bold rounded-full flex items-center justify-center">{pinnedMessages.length}</span>}
            </button>
            {isDM && (
              <button onClick={() => setNarrationMode(!isNarrationMode)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isNarrationMode ? 'bg-accent/15 text-accent' : 'text-text-tertiary hover:text-text-secondary'}`} title="Narration Mode">
                <BookOpen className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Search Panel */}
        <AnimatePresence>{isSearchOpen && <SearchPanel campaignId={campaignId} onClose={toggleSearch} />}</AnimatePresence>

        {/* Pinned Panel */}
        <AnimatePresence>{showPinnedPanel && <PinnedPanel pinnedMessages={pinnedMessages} onClose={togglePinnedPanel} onUnpin={pinMessage} />}</AnimatePresence>

        {/* Dice Panel */}
        <AnimatePresence>{showDicePanel && <DiceQuickPanel onRoll={handleDiceRoll} />}</AnimatePresence>

        {/* Whisper bar */}
        {whisperTarget && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border-b border-purple-500/20 shrink-0">
            <EyeOff className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-purple-400">Whispering to <strong>{whisperTarget.name}</strong></span>
            <button onClick={() => setWhisperTarget(null)} className="ml-auto text-purple-400 hover:text-purple-300 cursor-pointer"><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* Narration mode bar */}
        {isNarrationMode && isDM && !whisperTarget && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 border-b border-accent/20 shrink-0">
            <BookOpen className="w-3 h-3 text-accent" />
            <span className="text-[10px] text-accent">Narration Mode — messages appear as DM narration</span>
            <button onClick={() => setNarrationMode(false)} className="ml-auto text-accent hover:text-accent/80 cursor-pointer"><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className={`flex-1 overflow-y-auto py-1 scrollbar-thin ${height === 'h-full' ? '' : height}`}>
          {groupedMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
              <div className="w-12 h-12 rounded-2xl bg-surface-2/30 border border-border/20 flex items-center justify-center mb-3">
                <Hash className="w-6 h-6 text-text-tertiary/15" />
              </div>
              <p className="text-xs font-semibold text-text-tertiary/40">Welcome to #{activeChannelInfo?.label}</p>
              <p className="text-[10px] mt-1 text-text-tertiary/25">{activeChannelInfo?.desc}</p>
              <p className="text-[10px] mt-2 text-text-tertiary/30">Use **bold**, *italic*, `code`, ~~strike~~, @mention</p>
            </div>
          )}
          {groupedMessages.map((item, i) =>
            item.type === 'date' ? (
              <DateSeparator key={`date-${i}`} date={item.date!} />
            ) : (
              <ChatMessageItem
                key={item.msg!.id}
                msg={item.msg!}
                currentUserId={user.id}
                isDM={isDM}
                onPin={pinMessage}
                onDelete={deleteMessage}
                onReaction={handleReaction}
                onReply={setReplyingTo}
                onEdit={setEditingMessage}
              />
            )
          )}
        </div>

        {/* Reply / Edit bar */}
        <AnimatePresence>
          {(replyingTo || editingMessage) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2/40 border-t border-border/30 shrink-0">
                {replyingTo && (
                  <>
                    <CornerUpRight className="w-3 h-3 text-accent shrink-0" />
                    <span className="text-[10px] text-text-tertiary">Replying to</span>
                    <span className="text-[10px] font-semibold text-accent">{replyingTo.characterName || replyingTo.senderName}</span>
                    <span className="text-[10px] text-text-tertiary/50 truncate flex-1">{replyingTo.content.slice(0, 60)}</span>
                  </>
                )}
                {editingMessage && (
                  <>
                    <Edit3 className="w-3 h-3 text-accent shrink-0" />
                    <span className="text-[10px] text-accent font-medium">Editing message</span>
                    <span className="text-[10px] text-text-tertiary/50 flex-1">Press Escape to cancel</span>
                  </>
                )}
                <button onClick={() => { setReplyingTo(null); setEditingMessage(null); setInput(''); }}
                  className="p-0.5 hover:bg-surface-3 rounded text-text-tertiary hover:text-text-primary cursor-pointer shrink-0"><X className="w-3 h-3" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input — Multiline textarea */}
        <div className="border-t border-border/40 p-2 shrink-0">
          <div className="relative">
            {/* Mentions popup */}
            <AnimatePresence>
              {showMentions && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full left-0 mb-1 bg-surface-2 border border-border/60 rounded-xl p-1.5 shadow-2xl shadow-black/40 z-50 min-w-[180px]">
                  <span className="text-[9px] text-text-tertiary px-2 py-0.5 block font-bold uppercase tracking-wider">Mention</span>
                  <button onClick={() => insertMention('everyone')} className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-warning hover:bg-surface-3 rounded-lg cursor-pointer transition-colors">
                    <AtSign className="w-3 h-3" /> @everyone
                  </button>
                  {players.map(p => (
                    <button key={p.id} onClick={() => insertMention(p.name)} className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-text-secondary hover:text-accent hover:bg-surface-3 rounded-lg cursor-pointer transition-colors">
                      <AtSign className="w-3 h-3" /> {p.name}
                    </button>
                  ))}
                  <button onClick={() => setShowMentions(false)} className="w-full text-center text-[9px] text-text-tertiary/50 py-1 cursor-pointer hover:text-text-tertiary">Close</button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-1.5 items-end">
              <button onClick={() => setShowMentions(!showMentions)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${showMentions ? 'bg-accent/15 text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}>
                <AtSign className="w-3.5 h-3.5" />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); if (!e.target.value.includes('@')) setShowMentions(false); }}
                onKeyDown={handleKeyDown}
                placeholder={
                  editingMessage ? 'Edit your message...' :
                  isNarrationMode && isDM ? 'Write narration...' :
                  whisperTarget ? `Whisper to ${whisperTarget.name}...` :
                  chatMode === 'ic' ? `Speak as ${characterName || 'character'}...` :
                  `Message #${activeChannelInfo?.label || 'general'}`
                }
                rows={1}
                className="flex-1 text-sm bg-surface-2/40 border border-border/40 rounded-xl px-3 py-2 resize-none focus:border-accent/40 outline-none transition-colors text-text-primary placeholder:text-text-tertiary/40 max-h-[120px] scrollbar-thin"
                style={{ minHeight: '36px' }}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
              {/* Whisper button */}
              {players.length > 0 && (
                <div className="relative group shrink-0">
                  <button className="p-1.5 text-text-tertiary hover:text-purple-400 transition-colors cursor-pointer rounded-lg hover:bg-surface-2/50">
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-50">
                    <div className="bg-surface-2 border border-border/60 rounded-xl p-1.5 shadow-2xl shadow-black/40 min-w-[140px]">
                      <span className="text-[9px] text-text-tertiary px-2 py-0.5 block font-bold uppercase tracking-wider">Whisper to</span>
                      {players.map(p => (
                        <button key={p.id} onClick={() => { setWhisperTarget(p); setActiveChannel('whispers'); inputRef.current?.focus(); }}
                          className="block w-full text-left px-2 py-1.5 text-[11px] text-text-secondary hover:text-accent hover:bg-surface-3 rounded-lg cursor-pointer transition-colors">{p.name}</button>
                      ))}
                      {whisperTarget && (
                        <button onClick={() => setWhisperTarget(null)}
                          className="block w-full text-left px-2 py-1.5 text-[11px] text-danger hover:bg-surface-3 rounded-lg cursor-pointer mt-0.5 border-t border-border/30 pt-1.5">Cancel Whisper</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <button onClick={handleSend}
                className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                  input.trim() ? 'bg-accent text-surface-0 hover:brightness-110 shadow-md shadow-accent/20' : 'bg-surface-2/60 text-text-tertiary'
                }`}>
                {editingMessage ? <Edit3 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
