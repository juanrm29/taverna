'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Skull, Sparkles, Heart, Zap, Shield } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

// ============================================================
// Cinematic Combat Mode — Dramatic narration overlays
// Shows epic text animations for attacks, crits, kills, heals
// ============================================================

export type CinematicEventType =
  | 'attack'
  | 'crit'
  | 'miss'
  | 'kill'
  | 'heal'
  | 'spell'
  | 'deathSave'
  | 'initiativeStart';

export interface CinematicEvent {
  id: string;
  type: CinematicEventType;
  vars: Record<string, string | number>;
}

const EVENT_STYLES: Record<CinematicEventType, {
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  shake?: boolean;
  screenFlash?: string;
}> = {
  attack: {
    icon: <Swords className="w-8 h-8" />,
    gradient: 'from-orange-500 to-red-500',
    glow: 'rgba(249,115,22,0.3)',
  },
  crit: {
    icon: <Zap className="w-10 h-10" />,
    gradient: 'from-yellow-400 to-orange-500',
    glow: 'rgba(250,204,21,0.5)',
    shake: true,
    screenFlash: 'rgba(250,204,21,0.15)',
  },
  miss: {
    icon: <Shield className="w-8 h-8" />,
    gradient: 'from-gray-400 to-gray-500',
    glow: 'rgba(156,163,175,0.2)',
  },
  kill: {
    icon: <Skull className="w-10 h-10" />,
    gradient: 'from-red-600 to-red-800',
    glow: 'rgba(220,38,38,0.5)',
    shake: true,
    screenFlash: 'rgba(220,38,38,0.15)',
  },
  heal: {
    icon: <Heart className="w-8 h-8" />,
    gradient: 'from-emerald-400 to-green-500',
    glow: 'rgba(52,211,153,0.3)',
  },
  spell: {
    icon: <Sparkles className="w-8 h-8" />,
    gradient: 'from-purple-400 to-blue-500',
    glow: 'rgba(168,85,247,0.4)',
    screenFlash: 'rgba(168,85,247,0.1)',
  },
  deathSave: {
    icon: <Skull className="w-8 h-8" />,
    gradient: 'from-gray-600 to-red-800',
    glow: 'rgba(220,38,38,0.3)',
  },
  initiativeStart: {
    icon: <Swords className="w-10 h-10" />,
    gradient: 'from-accent to-orange-500',
    glow: 'rgba(201,169,110,0.4)',
    shake: true,
  },
};

const NARRATION_MAP: Record<CinematicEventType, keyof ReturnType<typeof useTranslation>['t']['cinematic']> = {
  attack: 'attackNarration',
  crit: 'critNarration',
  miss: 'missNarration',
  kill: 'killNarration',
  heal: 'healNarration',
  spell: 'spellNarration',
  deathSave: 'deathSave',
  initiativeStart: 'initiativeStart',
};

interface CinematicOverlayProps {
  event: CinematicEvent | null;
  onComplete?: () => void;
}

export function CinematicOverlay({ event, onComplete }: CinematicOverlayProps) {
  const { t, fmt } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!event) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, event.type === 'crit' || event.type === 'kill' ? 3500 : 2500);
    return () => clearTimeout(timer);
  }, [event, onComplete]);

  if (!event) return null;

  const style = EVENT_STYLES[event.type];
  const narrationKey = NARRATION_MAP[event.type];
  const narrationTemplate = t.cinematic[narrationKey];
  const narration = fmt(narrationTemplate, event.vars as Record<string, string | number>);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Screen flash */}
          {style.screenFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9998] pointer-events-none"
              style={{ backgroundColor: style.screenFlash }}
            />
          )}

          {/* Main cinematic overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 30 }}
              animate={{
                scale: [0.3, 1.1, 1],
                opacity: 1,
                y: 0,
                ...(style.shake ? {
                  x: [0, -5, 5, -3, 3, 0],
                } : {}),
              }}
              exit={{ scale: 0.8, opacity: 0, y: -30 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                ...(style.shake ? {
                  x: { duration: 0.4, delay: 0.3, repeat: 1 },
                } : {}),
              }}
              className="flex flex-col items-center gap-4 max-w-lg text-center"
            >
              {/* Icon with glow */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: event.type === 'crit' ? [0, -5, 5, 0] : 0,
                }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`w-20 h-20 rounded-2xl bg-gradient-to-b ${style.gradient} flex items-center justify-center text-white`}
                style={{
                  boxShadow: `0 0 60px ${style.glow}, 0 0 120px ${style.glow}`,
                }}
              >
                {style.icon}
              </motion.div>

              {/* Narration text */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-xl md:text-2xl font-display font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                style={{
                  textShadow: `0 0 20px ${style.glow}, 0 0 40px ${style.glow}`,
                }}
              >
                {narration}
              </motion.p>

              {/* Damage / Amount indicator for crits and heals */}
              {(event.type === 'crit' || event.type === 'heal') && event.vars.damage && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                  className={`px-6 py-2 rounded-full text-2xl font-mono font-bold ${
                    event.type === 'heal'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {event.type === 'heal' ? '+' : ''}{event.vars.damage || event.vars.amount}
                </motion.div>
              )}
            </motion.div>

            {/* Particle effects for crits */}
            {(event.type === 'crit' || event.type === 'kill') && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: '50%',
                      y: '50%',
                      scale: 0,
                      opacity: 1,
                    }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 80}%`,
                      y: `${50 + (Math.random() - 0.5) * 80}%`,
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.5 + Math.random(),
                      delay: 0.2 + Math.random() * 0.3,
                      ease: 'easeOut',
                    }}
                    className={`absolute w-2 h-2 rounded-full ${
                      event.type === 'kill' ? 'bg-red-500' : 'bg-yellow-400'
                    }`}
                    style={{
                      boxShadow: `0 0 8px ${event.type === 'kill' ? 'rgba(220,38,38,0.8)' : 'rgba(250,204,21,0.8)'}`,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Hook to trigger cinematic events from anywhere
// ============================================================

let _triggerCinematic: ((event: CinematicEvent) => void) | null = null;

export function triggerCinematic(type: CinematicEventType, vars: Record<string, string | number> = {}) {
  const event: CinematicEvent = {
    id: crypto.randomUUID(),
    type,
    vars,
  };
  _triggerCinematic?.(event);
}

export function CinematicProvider({ children }: { children: React.ReactNode }) {
  const [event, setEvent] = useState<CinematicEvent | null>(null);

  useEffect(() => {
    _triggerCinematic = setEvent;
    return () => { _triggerCinematic = null; };
  }, []);

  return (
    <>
      {children}
      <CinematicOverlay event={event} onComplete={() => setEvent(null)} />
    </>
  );
}
