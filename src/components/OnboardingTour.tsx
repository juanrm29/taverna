'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Swords, Map, Users, MessageSquare, Dices } from 'lucide-react';

// ============================================================
// OnboardingTour — Interactive guided tour for new users
// Highlights key UI areas with tooltips and step navigation
// ============================================================

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  selector?: string;       // CSS selector to highlight
  position: 'center' | 'bottom-right' | 'top-center';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Taverna! 🎲',
    description: 'Your virtual tabletop for D&D 5e adventures. Let\'s take a quick tour of the key features so you can start playing right away.',
    icon: <Sparkles className="w-5 h-5" />,
    position: 'center',
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    description: 'Create and manage your D&D campaigns here. As a DM, you can set up the world, scenes, and invite players. As a player, join campaigns with invite codes.',
    icon: <Swords className="w-5 h-5" />,
    selector: '[data-tour="campaigns"]',
    position: 'bottom-right',
  },
  {
    id: 'characters',
    title: 'Characters',
    description: 'Build your heroes! Create characters with full ability scores, spell slots, equipment, and backstory. Track HP, conditions, and spell concentration in real-time.',
    icon: <Users className="w-5 h-5" />,
    selector: '[data-tour="characters"]',
    position: 'bottom-right',
  },
  {
    id: 'battle-map',
    title: 'Battle Map & VTT',
    description: 'The live session page features an interactive battle map with grid, tokens, fog of war, initiative tracker, and real-time dice rolling. DMs can drag tokens and reveal fog.',
    icon: <Map className="w-5 h-5" />,
    selector: '[data-tour="sessions"]',
    position: 'bottom-right',
  },
  {
    id: 'dice',
    title: 'Dice Roller',
    description: 'Roll dice anywhere! Use the dice tray or type formulas like "2d6+3" in chat. Rolls are animated and shared with the party. Press D to quick-roll a d20.',
    icon: <Dices className="w-5 h-5" />,
    selector: '[data-tour="dice"]',
    position: 'bottom-right',
  },
  {
    id: 'chat',
    title: 'In-Game Chat',
    description: 'Communicate with your party during sessions. Send messages, whisper to the DM, and share dice roll results. Everything is logged for your session history.',
    icon: <MessageSquare className="w-5 h-5" />,
    selector: '[data-tour="chat"]',
    position: 'bottom-right',
  },
  {
    id: 'done',
    title: 'You\'re Ready! ⚔️',
    description: 'That\'s the basics! Start by creating a campaign or joining one with an invite code. Check the Tutorial page in the sidebar for detailed guides. Happy adventuring!',
    icon: <Sparkles className="w-5 h-5" />,
    position: 'center',
  },
];

const STORAGE_KEY = 'taverna_onboarding_complete';

export default function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Show tour only on first visit
  useEffect(() => {
    const timer = setTimeout(() => {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        setIsActive(true);
      }
    }, 1500); // Delay to let the page load
    return () => clearTimeout(timer);
  }, []);

  // Listen for manual trigger
  useEffect(() => {
    const handler = () => {
      setCurrentStep(0);
      setIsActive(true);
    };
    window.addEventListener('taverna:start-tour', handler);
    return () => window.removeEventListener('taverna:start-tour', handler);
  }, []);

  // Find and highlight target element
  useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    if (step.selector) {
      const el = document.querySelector(step.selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);
        return;
      }
    }
    setHighlightRect(null);
  }, [isActive, currentStep]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const next = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      completeTour();
    }
  }, [currentStep, completeTour]);

  const prev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  // Keyboard nav
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') completeTour();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, next, prev, completeTour]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isCenter = step.position === 'center' || !highlightRect;
  const padding = 8;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (isCenter) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }
    if (highlightRect) {
      const top = highlightRect.bottom + 12;
      const left = Math.max(16, Math.min(highlightRect.left, window.innerWidth - 380));
      return {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
      };
    }
    return {};
  };

  return (
    <AnimatePresence>
      {isActive && (
        <div ref={overlayRef} className="fixed inset-0 z-[9999]">
          {/* Backdrop with cutout */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="tour-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {highlightRect && (
                  <rect
                    x={highlightRect.x - padding}
                    y={highlightRect.y - padding}
                    width={highlightRect.width + padding * 2}
                    height={highlightRect.height + padding * 2}
                    rx="8"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0" y="0"
              width="100%" height="100%"
              fill="rgba(0,0,0,0.7)"
              mask="url(#tour-mask)"
            />
          </svg>

          {/* Highlight border */}
          {highlightRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute border-2 border-accent rounded-lg pointer-events-none"
              style={{
                top: highlightRect.y - padding,
                left: highlightRect.x - padding,
                width: highlightRect.width + padding * 2,
                height: highlightRect.height + padding * 2,
                boxShadow: '0 0 20px rgba(201,169,110,0.3)',
              }}
            />
          )}

          {/* Tooltip Card */}
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={getTooltipStyle()}
            className="relative z-10 bg-surface-1 border border-surface-3 rounded-xl shadow-2xl w-[360px] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2 text-accent">
                {step.icon}
                <h3 className="font-bold text-sm">{step.title}</h3>
              </div>
              <button
                onClick={completeTour}
                className="p-1 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer rounded-md hover:bg-surface-2"
                title="Skip tour (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 pb-3">
              <p className="text-xs text-text-secondary leading-relaxed">{step.description}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface-0/50 border-t border-surface-2">
              {/* Step dots */}
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      i === currentStep
                        ? 'bg-accent w-4'
                        : i < currentStep
                          ? 'bg-accent/40'
                          : 'bg-surface-3'
                    }`}
                  />
                ))}
              </div>

              {/* Nav buttons */}
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary cursor-pointer px-2 py-1 rounded-md hover:bg-surface-2 transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" /> Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1 text-xs font-semibold text-surface-0 bg-accent hover:bg-accent/80 cursor-pointer px-3 py-1.5 rounded-md transition-colors"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Start Playing!' : 'Next'}
                  {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-surface-2">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
