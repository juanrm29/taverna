'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Trash2, Settings, Sparkles, Key,
  Loader2, ChevronDown, Wand2, BookOpen,
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useToast } from '@/components/Feedback';
import { useTranslation } from '@/lib/i18n';

const STORAGE_KEY = 'taverna_ai_key';
const HISTORY_KEY = 'taverna_ai_history';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS_ID = [
  { key: 'generateNPC', prompt: 'Buatkan NPC acak dengan nama, ras, kelas, kepribadian, motivasi, dan quirk unik.' },
  { key: 'describeRoom', prompt: 'Deskripsikan ruangan dungeon yang misterius dengan detail sensorik — pemandangan, suara, bau, dan atmosfer.' },
  { key: 'narrateCombat', prompt: 'Narasikan pertempuran epik antara seorang paladin dan lich dalam gaya sinematik.' },
  { key: 'suggestEncounter', prompt: 'Sarankan encounter seimbang untuk party level 5 (4 pemain) di hutan belantara.' },
  { key: 'plotIdea', prompt: 'Buatkan ide plot untuk quest side yang menarik dengan twist di akhir.' },
  { key: 'rulesHelp', prompt: 'Jelaskan cara kerja Grapple dan aturan Opportunity Attack di D&D 5e.' },
] as const;

const QUICK_PROMPTS_EN = [
  { key: 'generateNPC', prompt: 'Generate a random NPC with name, race, class, personality, motivation, and a unique quirk.' },
  { key: 'describeRoom', prompt: 'Describe a mysterious dungeon room with sensory details — sights, sounds, smells, and atmosphere.' },
  { key: 'narrateCombat', prompt: 'Narrate an epic battle between a paladin and a lich in cinematic style.' },
  { key: 'suggestEncounter', prompt: 'Suggest a balanced encounter for a level 5 party (4 players) in a wilderness setting.' },
  { key: 'plotIdea', prompt: 'Create a plot idea for an interesting side quest with a twist ending.' },
  { key: 'rulesHelp', prompt: 'Explain how Grapple works and the rules for Opportunity Attacks in D&D 5e.' },
] as const;

export default function AIDMPage() {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickPrompts = locale === 'id' ? QUICK_PROMPTS_ID : QUICK_PROMPTS_EN;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKey(stored);
    const history = localStorage.getItem(HISTORY_KEY);
    if (history) {
      try { setMessages(JSON.parse(history)); } catch {}
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(STORAGE_KEY, key);
    setShowKeyInput(false);
    if (key) toast.success('API Key saved');
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setShowQuickActions(false);

    try {
      const apiMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          apiKey,
          model: 'gpt-4o-mini',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to get AI response');
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [apiKey, loading, messages, toast]);

  const clearChat = () => {
    setMessages([]);
    setShowQuickActions(true);
    localStorage.removeItem(HISTORY_KEY);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] md:h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-purple-500/20 to-purple-500/5 border border-purple-500/15 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold tracking-tight">{t.ai.title}</h1>
            <p className="text-xs text-text-tertiary">{t.ai.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <Trash2 className="w-3.5 h-3.5" /> {t.ai.clearChat}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={apiKey ? 'text-success' : 'text-warning'}
          >
            <Key className="w-3.5 h-3.5" />
            {apiKey ? 'API Key ✓' : 'Set API Key'}
          </Button>
        </div>
      </div>

      {/* API Key Input */}
      <AnimatePresence>
        {showKeyInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="px-4 md:px-6 py-3 bg-surface-1/50">
              <div className="flex items-center gap-3">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={() => saveApiKey(apiKey)}>
                  {t.common.save}
                </Button>
              </div>
              <p className="text-[10px] text-text-tertiary mt-1.5">
                OpenAI API key — {locale === 'id' ? 'disimpan di browser lokal, tidak dikirim ke server kami' : 'stored in your browser only, never sent to our server'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {/* Welcome / Empty State */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-purple-500/20 to-purple-500/5 border border-purple-500/15 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <Wand2 className="w-8 h-8 text-purple-400" />
            </div>

            {!apiKey ? (
              <Card className="max-w-md text-center">
                <Key className="w-8 h-8 text-warning mx-auto mb-3" />
                <h3 className="font-semibold mb-1">{t.ai.noApiKey}</h3>
                <p className="text-xs text-text-tertiary mb-4">{t.ai.noApiKeyDesc}</p>
                <Button size="sm" onClick={() => setShowKeyInput(true)}>
                  <Key className="w-3.5 h-3.5" /> Set API Key
                </Button>
              </Card>
            ) : (
              <>
                <div className="text-center max-w-md">
                  <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                    {t.ai.welcomeMessage}
                  </p>
                </div>

                {/* Quick Action Buttons */}
                {showQuickActions && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-lg w-full">
                    {quickPrompts.map((qp) => (
                      <button
                        key={qp.key}
                        onClick={() => sendMessage(qp.prompt)}
                        className="px-3 py-2.5 rounded-lg bg-surface-2 border border-border hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-200 text-xs text-text-secondary hover:text-purple-400 text-left cursor-pointer group"
                      >
                        <span>{t.ai[qp.key as keyof typeof t.ai]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Chat Messages */}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-purple-500/20 to-purple-500/5 border border-purple-500/15 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent/10 border border-accent/15 text-text-primary'
                  : 'bg-surface-2 border border-border text-text-primary'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="text-[10px] text-text-muted mt-2">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-purple-500/20 to-purple-500/5 border border-purple-500/15 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            </div>
            <div className="bg-surface-2 border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                {t.ai.thinking}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border px-4 md:px-6 py-3 bg-surface-1/50 shrink-0">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.ai.placeholder}
              rows={1}
              className="w-full resize-none bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/30 transition-all max-h-32"
              style={{ minHeight: '44px' }}
              disabled={loading}
            />
          </div>
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="shrink-0 bg-purple-600 hover:bg-purple-500 border-purple-500/30"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick actions row when chatting */}
        {messages.length > 0 && (
          <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
            {quickPrompts.slice(0, 4).map((qp) => (
              <button
                key={qp.key}
                onClick={() => sendMessage(qp.prompt)}
                disabled={loading}
                className="shrink-0 px-2.5 py-1 rounded-md bg-surface-2 border border-border text-[10px] text-text-tertiary hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {t.ai[qp.key as keyof typeof t.ai]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
