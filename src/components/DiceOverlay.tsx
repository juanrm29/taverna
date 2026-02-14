'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, X, Heart, Shield, Minus, Sparkles } from 'lucide-react';

// ============================================================
// Dice Roll Result — global floating overlay
// Listens for "taverna:dice-roll" custom events and shows result
// Can be "applied" as damage/healing to target via callback
// ============================================================

export interface DiceRollEvent {
  formula: string;
  rolls: number[];
  total: number;
  modifier: number;
  kept?: number[];
  dropped?: number[];
  source?: string;
}

interface DiceOverlayProps {
  onApplyDamage?: (amount: number) => void;
  onApplyHealing?: (amount: number) => void;
}

export default function DiceOverlay({ onApplyDamage, onApplyHealing }: DiceOverlayProps) {
  const [result, setResult] = useState<DiceRollEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<DiceRollEvent>).detail;
      setResult(detail);
      setVisible(true);
      setApplied(null);
    };
    window.addEventListener('taverna:dice-roll', handler);
    return () => window.removeEventListener('taverna:dice-roll', handler);
  }, []);

  // Auto-dismiss after 8s
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, [visible, result]);

  const handleApplyDamage = useCallback(() => {
    if (!result) return;
    onApplyDamage?.(result.total);
    setApplied('damage');
    setTimeout(() => setVisible(false), 1200);
  }, [result, onApplyDamage]);

  const handleApplyHealing = useCallback(() => {
    if (!result) return;
    onApplyHealing?.(result.total);
    setApplied('healing');
    setTimeout(() => setVisible(false), 1200);
  }, [result, onApplyHealing]);

  // Detect critical (1d20 = 20) or fumble (1d20 = 1)
  const isCrit = result && result.rolls.length === 1 && /d20/i.test(result.formula) && result.rolls[0] === 20;
  const isFumble = result && result.rolls.length === 1 && /d20/i.test(result.formula) && result.rolls[0] === 1;

  return (
    <AnimatePresence>
      {visible && result && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] pointer-events-auto"
        >
          <div className={`relative rounded-2xl border shadow-2xl backdrop-blur-md px-6 py-4 min-w-[280px] ${
            isCrit ? 'bg-success/10 border-success/40 shadow-success/20' :
            isFumble ? 'bg-danger/10 border-danger/40 shadow-danger/20' :
            'bg-surface-1/95 border-border'
          }`}>
            {/* Close button */}
            <button
              onClick={() => setVisible(false)}
              className="absolute top-2 right-2 text-text-tertiary hover:text-text-secondary cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Result display */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ rotate: -180 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring', damping: 12 }}
                className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  isCrit ? 'bg-success/20' : isFumble ? 'bg-danger/20' : 'bg-accent/15'
                }`}
              >
                <Dices className={`w-7 h-7 ${isCrit ? 'text-success' : isFumble ? 'text-danger' : 'text-accent'}`} />
              </motion.div>

              <div>
                <div className="flex items-baseline gap-2">
                  <motion.span
                    key={result.total}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-3xl font-bold font-mono ${
                      isCrit ? 'text-success' : isFumble ? 'text-danger' : 'text-accent'
                    }`}
                  >
                    {result.total}
                  </motion.span>
                  <span className="text-sm font-mono text-text-tertiary">{result.formula}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                  <span className="font-mono">[{result.rolls.join(', ')}]</span>
                  {result.modifier !== 0 && <span>{result.modifier > 0 ? '+' : ''}{result.modifier}</span>}
                  {result.kept && result.dropped && result.dropped.length > 0 && (
                    <span className="text-warning">kept [{result.kept.join(', ')}]</span>
                  )}
                  {isCrit && <span className="text-success font-bold uppercase tracking-wider">✦ NAT 20!</span>}
                  {isFumble && <span className="text-danger font-bold uppercase tracking-wider">✗ NAT 1</span>}
                </div>
              </div>
            </div>

            {/* Apply buttons */}
            {(onApplyDamage || onApplyHealing) && !applied && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex gap-2 mt-3 pt-3 border-t border-border/50"
              >
                {onApplyDamage && (
                  <button
                    onClick={handleApplyDamage}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" /> Apply as Damage
                  </button>
                )}
                {onApplyHealing && (
                  <button
                    onClick={handleApplyHealing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3 h-3" /> Apply as Healing
                  </button>
                )}
              </motion.div>
            )}

            {/* Applied feedback */}
            {applied && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mt-3 pt-3 border-t border-border/50 text-center text-xs font-medium ${
                  applied === 'damage' ? 'text-danger' : 'text-success'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                {applied === 'damage' ? `${result.total} damage applied!` : `${result.total} HP restored!`}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
