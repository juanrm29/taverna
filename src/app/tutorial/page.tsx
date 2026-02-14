'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Swords, Users, Dices, Shield, Heart, Flame, Target,
  ChevronRight, ChevronLeft, ChevronDown, Star, Zap, Crown, Scroll,
  Eye, Brain, Mountain, Sparkles, Map, MessageCircle, ArrowRight,
  CheckCircle2, Play, RotateCcw, Compass, Wand2, Skull, TreePine,
  GraduationCap, Lightbulb, HelpCircle, Trophy, Layers, Footprints,
  Globe, ScrollText, Sword, Network, ListOrdered, History, SkipForward,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

/* ═══════════════════════════════════════════════════════════
   DICE ROLLER COMPONENT — Interactive dice rolling
   ═══════════════════════════════════════════════════════════ */
function DiceRoller({ sides = 20, label, onRoll }: { sides?: number; label?: string; onRoll?: (v: number) => void }) {
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  const roll = useCallback(() => {
    setRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setResult(Math.floor(Math.random() * sides) + 1);
      count++;
      if (count > 8) {
        clearInterval(interval);
        const final = Math.floor(Math.random() * sides) + 1;
        setResult(final);
        setRolling(false);
        onRoll?.(final);
      }
    }, 60);
  }, [sides, onRoll]);

  return (
    <button
      onClick={roll}
      className="group relative flex flex-col items-center gap-2 cursor-pointer"
    >
      <motion.div
        animate={rolling ? { rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.1, 0.95, 1.05, 1] } : {}}
        transition={{ duration: 0.5 }}
        className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold border-2 transition-all duration-300 ${
          result === sides
            ? 'bg-success/20 border-success text-success shadow-[0_0_20px_rgba(74,171,110,0.3)]'
            : result === 1
            ? 'bg-danger/20 border-danger text-danger shadow-[0_0_20px_rgba(224,85,85,0.3)]'
            : result
            ? 'bg-accent/15 border-accent/40 text-accent-bright'
            : 'bg-surface-3 border-border text-text-secondary group-hover:border-accent/40 group-hover:bg-accent/10'
        }`}
      >
        {result ?? '?'}
      </motion.div>
      <span className="text-xs text-text-tertiary">{label || `d${sides}`}</span>
      {!result && (
        <span className="text-[10px] text-text-muted">Klik untuk lempar</span>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   ABILITY SCORE CARD — Interactive stat explorer
   ═══════════════════════════════════════════════════════════ */
const ABILITIES = [
  { name: 'Strength', abbr: 'STR', icon: Swords, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', desc: 'Kekuatan fisik — mengangkat, mendorong, memukul', example: 'Mendobrak pintu terkunci, mengangkat gerbang besi' },
  { name: 'Dexterity', abbr: 'DEX', icon: Footprints, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', desc: 'Kelincahan & refleks — menghindar, menyelinap', example: 'Menghindari perangkap, bersembunyi dari musuh' },
  { name: 'Constitution', abbr: 'CON', icon: Heart, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', desc: 'Ketahanan & stamina — bertahan hidup', example: 'Bertahan dari racun, berlari tanpa henti' },
  { name: 'Intelligence', abbr: 'INT', icon: Brain, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20', desc: 'Kecerdasan & ingatan — menganalisis, meneliti', example: 'Memecahkan teka-teki, mengingat sejarah kuno' },
  { name: 'Wisdom', abbr: 'WIS', icon: Eye, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', desc: 'Kebijaksanaan & intuisi — mengamati, merasakan', example: 'Mendeteksi kebohongan, merasakan bahaya' },
  { name: 'Charisma', abbr: 'CHA', icon: Crown, color: 'text-[#c084fc]', bg: 'bg-[#c084fc]/10', border: 'border-[#c084fc]/20', desc: 'Karisma & pesona — mempengaruhi, meyakinkan', example: 'Bernegosiasi harga, mengintimidasi musuh' },
];

function AbilityCard({ ability, expanded, onToggle }: { ability: typeof ABILITIES[0]; expanded: boolean; onToggle: () => void }) {
  const Icon = ability.icon;
  return (
    <motion.div
      layout
      onClick={onToggle}
      className={`cursor-pointer rounded-xl border p-4 transition-all duration-300 ${ability.border} ${ability.bg} hover:shadow-lg`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ability.bg} ${ability.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${ability.color}`}>{ability.abbr}</span>
            <span className="text-text-primary text-sm font-medium">{ability.name}</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5 truncate">{ability.desc}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium text-accent">Contoh penggunaan:</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{ability.example}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMBAT SIMULATOR — Interactive combat round demo
   ═══════════════════════════════════════════════════════════ */
function CombatSimulator() {
  const [phase, setPhase] = useState(0);
  const [attackRoll, setAttackRoll] = useState<number | null>(null);
  const [damageRoll, setDamageRoll] = useState<number | null>(null);

  const goblinAC = 15;
  const attackMod = 5; // +5 to hit
  const hit = attackRoll !== null ? (attackRoll + attackMod) >= goblinAC || attackRoll === 20 : null;
  const isCrit = attackRoll === 20;

  const phases = [
    { title: '⚔️ Giliran Kamu!', desc: 'Kamu seorang Fighter level 1. Seekor Goblin muncul di hadapanmu (AC 15, HP 7). Lempar d20 untuk menyerang!' },
    { title: hit ? (isCrit ? '💥 CRITICAL HIT!' : '✅ Seranganmu Mengenai!') : '❌ Meleset!', desc: hit ? `Kamu melempar ${attackRoll} + ${attackMod} (modifier) = ${attackRoll! + attackMod}${isCrit ? ' — Natural 20! CRITICAL!' : ''} vs AC ${goblinAC}. Seranganmu mengenai! ${isCrit ? 'Lempar damage dua kali!' : 'Sekarang lempar damage!'}` : `Kamu melempar ${attackRoll} + ${attackMod} = ${attackRoll! + attackMod} vs AC ${goblinAC}. Belum cukup! Tapi tidak apa, coba lagi nanti.` },
    { title: damageRoll ? '🩸 Damage Dealt!' : '🎯 Lempar Damage', desc: damageRoll ? `Pedangmu mengenai Goblin sebesar ${isCrit ? damageRoll * 2 : damageRoll} + 3 (STR mod) = ${(isCrit ? damageRoll * 2 : damageRoll) + 3} damage!${(isCrit ? damageRoll * 2 : damageRoll) + 3 >= 7 ? ' 💀 Goblin dikalahkan!' : ` Goblin memiliki ${7 - (isCrit ? damageRoll * 2 : damageRoll) - 3} HP tersisa.`}` : 'Longsword menggunakan 1d8 untuk damage. Lempar sekarang!' },
  ];

  const reset = () => { setPhase(0); setAttackRoll(null); setDamageRoll(null); };

  const currentPhase = phases[Math.min(phase, phases.length - 1)];

  return (
    <div className="bg-surface-2 rounded-xl border border-border p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
          <Swords className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-primary">{currentPhase.title}</h4>
          <p className="text-xs text-text-secondary mt-0.5">{currentPhase.desc}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 py-4">
        {phase === 0 && (
          <DiceRoller
            sides={20}
            label="Attack Roll (d20)"
            onRoll={(v) => { setAttackRoll(v); setPhase(1); }}
          />
        )}
        {phase === 1 && hit && (
          <DiceRoller
            sides={8}
            label="Damage (d8)"
            onRoll={(v) => { setDamageRoll(v); setPhase(2); }}
          />
        )}
        {(phase === 2 || (phase === 1 && !hit)) && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Coba Lagi
          </button>
        )}
      </div>

      {/* Visual combat field */}
      <div className="flex items-center justify-between px-8 py-3 bg-surface-3/50 rounded-lg mt-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-info/20 border-2 border-info flex items-center justify-center text-lg">🧑‍⚔️</div>
          <span className="text-xs font-medium text-info">Fighter</span>
          <span className="text-[10px] text-text-tertiary">HP 12/12</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence>
            {attackRoll !== null && (
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`text-xl font-bold ${hit ? 'text-success' : 'text-danger'}`}
              >
                {hit ? '⚔️ HIT!' : '💨 MISS'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className={`w-12 h-12 rounded-full bg-danger/20 border-2 border-danger flex items-center justify-center text-lg transition-all ${damageRoll && (isCrit ? damageRoll * 2 : damageRoll) + 3 >= 7 ? 'opacity-30 grayscale' : ''}`}>👺</div>
          <span className="text-xs font-medium text-danger">Goblin</span>
          <span className="text-[10px] text-text-tertiary">AC {goblinAC} • HP {damageRoll ? Math.max(0, 7 - (isCrit ? damageRoll * 2 : damageRoll) - 3) : 7}/7</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SKILL CHECK SIMULATOR
   ═══════════════════════════════════════════════════════════ */
function SkillCheckDemo() {
  const [roll, setRoll] = useState<number | null>(null);
  const dc = 15; // Locked door DC
  const profBonus = 2;
  const dexMod = 3;
  const total = roll ? roll + profBonus + dexMod : null;
  const success = total ? total >= dc : null;

  return (
    <div className="bg-surface-2 rounded-xl border border-border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Target className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-primary">Cek Kemampuan: Membuka Kunci Pintu</h4>
          <p className="text-xs text-text-secondary">DC {dc} — Dexterity (Sleight of Hand) check</p>
        </div>
      </div>

      <div className="bg-surface-3/60 rounded-lg p-3 mb-4 text-xs text-text-secondary">
        <p>Kamu menemukan pintu terkunci di dungeon. Sebagai Rogue dengan Thieves&apos; Tools, kamu mencoba membukanya.</p>
        <p className="mt-1 text-text-muted">Bonus: DEX modifier (+{dexMod}) + Proficiency Bonus (+{profBonus}) = <span className="text-accent">+{dexMod + profBonus}</span></p>
      </div>

      <div className="flex items-center justify-center gap-6 py-2">
        {!roll ? (
          <DiceRoller sides={20} label="Skill Check (d20)" onRoll={setRoll} />
        ) : (
          <div className="text-center">
            <div className={`text-3xl font-bold mb-1 ${success ? 'text-success' : 'text-danger'}`}>
              {roll} + {profBonus + dexMod} = {total}
            </div>
            <p className={`text-sm font-medium ${success ? 'text-success' : 'text-danger'}`}>
              {success ? '🔓 Berhasil! Pintu terbuka!' : '🔒 Gagal! Pintu tetap terkunci.'}
            </p>
            <p className="text-xs text-text-muted mt-1">Target: {dc} | Hasil kamu: {total}</p>
            <button
              onClick={() => setRoll(null)}
              className="mt-3 text-xs text-accent hover:underline cursor-pointer"
            >
              Coba lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TUTORIAL SECTIONS DATA
   ═══════════════════════════════════════════════════════════ */
interface TutorialSection {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
}

const SECTIONS: TutorialSection[] = [
  { id: 'welcome', icon: BookOpen, title: 'Apa itu D&D?', subtitle: 'Pengenalan dunia Dungeons & Dragons', color: 'text-accent' },
  { id: 'roles', icon: Users, title: 'Peran dalam Permainan', subtitle: 'Dungeon Master vs Player', color: 'text-info' },
  { id: 'character', icon: Star, title: 'Membuat Karakter', subtitle: 'Ras, kelas, dan latar belakang', color: 'text-success' },
  { id: 'abilities', icon: Brain, title: '6 Ability Score', subtitle: 'STR, DEX, CON, INT, WIS, CHA', color: 'text-warning' },
  { id: 'dice', icon: Dices, title: 'Dadu & Mekanik', subtitle: 'D20 test, advantage, proficiency', color: 'text-danger' },
  { id: 'combat', icon: Swords, title: 'Pertempuran (Combat)', subtitle: 'Initiative, giliran, serangan', color: 'text-danger' },
  { id: 'exploration', icon: Compass, title: 'Eksplorasi & Sosial', subtitle: 'Tiga pilar gameplay', color: 'text-[#c084fc]' },
  { id: 'hp', icon: Heart, title: 'HP, Damage & Healing', subtitle: 'Kehidupan, kematian, penyembuhan', color: 'text-danger' },
  { id: 'taverna', icon: Map, title: 'Cara Pakai Taverna', subtitle: 'Panduan lengkap VTT ini', color: 'text-accent' },
  { id: 'lore-wiki', icon: Globe, title: 'World Lore Wiki', subtitle: 'Ensiklopedia dunia kampanye', color: 'text-cyan-400' },
  { id: 'quest-board', icon: ScrollText, title: 'Quest Board', subtitle: 'Kelola misi & alur cerita', color: 'text-amber-400' },
  { id: 'combat-autopilot', icon: Sword, title: 'Combat Autopilot', subtitle: 'Auto-resolve & replay combat', color: 'text-red-400' },
];

/* ═══════════════════════════════════════════════════════════
   MAIN TUTORIAL PAGE
   ═══════════════════════════════════════════════════════════ */
export default function TutorialPage() {
  const [activeSection, setActiveSection] = useState('welcome');
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [expandedAbility, setExpandedAbility] = useState<string | null>(null);
  const [showNav, setShowNav] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const { t } = useTranslation();

  const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);

  const markComplete = useCallback((id: string) => {
    setCompletedSections(prev => new Set([...prev, id]));
  }, []);

  const goTo = useCallback((id: string) => {
    setActiveSection(id);
    setShowNav(false);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goNext = useCallback(() => {
    markComplete(activeSection);
    if (currentIndex < SECTIONS.length - 1) {
      goTo(SECTIONS[currentIndex + 1].id);
    }
  }, [activeSection, currentIndex, markComplete, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goTo(SECTIONS[currentIndex - 1].id);
    }
  }, [currentIndex, goTo]);

  const progress = (completedSections.size / SECTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-surface-0 pb-24 pt-12 md:pt-0">
      {/* ── Progress bar ── */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-surface-2 z-40 md:left-16">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-accent-bright"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* ── Mobile Section Switcher ── */}
      <div className="md:hidden fixed top-12 left-0 right-0 z-30 bg-surface-1/95 backdrop-blur-xl border-b border-border">
        <button
          onClick={() => setShowNav(!showNav)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer"
        >
          <span className="font-medium text-text-primary">{SECTIONS[currentIndex]?.title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{currentIndex + 1}/{SECTIONS.length}</span>
            <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${showNav ? 'rotate-180' : ''}`} />
          </div>
        </button>
        <AnimatePresence>
          {showNav && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-border bg-surface-1"
            >
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    activeSection === s.id ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-2'
                  }`}
                >
                  {completedSections.has(s.id) ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-border text-[10px] flex items-center justify-center text-text-muted shrink-0">{i + 1}</span>
                  )}
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-16 md:mt-8">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4 border border-accent/15">
            <GraduationCap className="w-3.5 h-3.5" />
            Tutorial Interaktif
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-3">
            Belajar Dungeons & Dragons
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto text-sm leading-relaxed">
            Panduan komprehensif untuk pemula. Pelajari cara bermain D&D dari nol — mulai dari konsep dasar
            hingga sesi pertamamu. Dengan demo interaktif yang bisa kamu coba langsung! 🎲
          </p>
        </motion.div>

        {/* ── Desktop sidebar nav ── */}
        <div className="flex gap-8">
          <aside className="hidden md:block w-56 shrink-0">
            <div className="sticky top-8 space-y-1">
              <p className="text-[10px] font-semibold text-text-muted tracking-[0.15em] uppercase mb-3 px-3">Daftar Materi</p>
              {SECTIONS.map((s, i) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                const isDone = completedSections.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => goTo(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all cursor-pointer ${
                      isActive
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/80'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${isActive ? 'border-accent text-accent' : 'border-border text-text-muted'}`}>{i + 1}</span>
                    )}
                    <span className="truncate">{s.title}</span>
                  </button>
                );
              })}
              {/* Progress */}
              <div className="mt-6 px-3">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                  <span>Progress</span>
                  <span>{completedSections.size}/{SECTIONS.length}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent to-success rounded-full"
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                {completedSections.size === SECTIONS.length && (
                  <div className="mt-3 flex items-center gap-2 text-success text-xs font-medium">
                    <Trophy className="w-3.5 h-3.5" />
                    Tutorial selesai!
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 space-y-16">

            {/* ═══════ SECTION: Welcome ═══════ */}
            <section ref={el => { sectionRefs.current['welcome'] = el; }} id="welcome" className={activeSection === 'welcome' ? '' : 'opacity-70'}>
              <SectionHeader icon={BookOpen} title="Apa itu D&D?" color="text-accent" number={1} />

              <div className="space-y-4 mt-5">
                <ContentCard>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    <strong className="text-text-primary">Dungeons & Dragons (D&D)</strong> adalah permainan <em>tabletop roleplaying game</em> di mana
                    kamu dan teman-temanmu bersama-sama menciptakan cerita petualangan yang epik. Bayangkan
                    seperti menonton film fantasi — tapi <strong className="text-accent">kamu adalah aktornya!</strong>
                  </p>
                </ContentCard>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FeatureBox icon={MessageCircle} title="Ceritakan" color="text-info">
                    Satu orang menjadi narrator (Dungeon Master), yang lain memerankan karakter heroik
                  </FeatureBox>
                  <FeatureBox icon={Dices} title="Lempar Dadu" color="text-warning">
                    Dadu menentukan apakah aksimu berhasil atau gagal — setiap momen penuh kejutan
                  </FeatureBox>
                  <FeatureBox icon={Sparkles} title="Berimajinasi" color="text-[#c084fc]">
                    Tidak ada layar game — dunia D&D ada di imajinasi kalian bersama
                  </FeatureBox>
                </div>

                <ContentCard variant="highlight">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text-primary mb-1">Analogi Sederhana</p>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Bayangkan kamu sedang main drama improv bersama teman-teman, tapi ada aturan mainnya.
                        DM bilang &quot;Kalian memasuki gua gelap, terdengar suara geraman...&quot; — lalu kamu memutuskan:
                        maju menyerang? Bersembunyi? Mencoba bicara? Keputusanmu + lemparan dadu = cerita yang terjadi! 🎭
                      </p>
                    </div>
                  </div>
                </ContentCard>

                <ContentCard>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Yang kamu butuhkan untuk bermain:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Users, text: '3–6 pemain (1 DM + 2–5 player)' },
                      { icon: Dices, text: 'Set dadu polyhedral (d4–d20)' },
                      { icon: Scroll, text: 'Character sheet (lembar karakter)' },
                      { icon: Sparkles, text: 'Imajinasi & semangat petualang!' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                        <item.icon className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </ContentCard>
              </div>
            </section>

            {/* ═══════ SECTION: Roles ═══════ */}
            <section ref={el => { sectionRefs.current['roles'] = el; }} id="roles" className={activeSection === 'roles' ? '' : 'opacity-70'}>
              <SectionHeader icon={Users} title="Peran dalam Permainan" color="text-info" number={2} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {/* DM Card */}
                <div className="rounded-xl border border-accent/20 bg-gradient-to-b from-accent/5 to-transparent p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-accent">Dungeon Master (DM)</h3>
                      <p className="text-xs text-text-tertiary">Narator & Wasit Permainan</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      'Membangun & menceritakan petualangan',
                      'Mendeskripsikan dunia, lokasi & NPC',
                      'Memainkan semua monster & musuh',
                      'Menetapkan aturan & Difficulty Class (DC)',
                      'Memastikan semua pemain bersenang-senang',
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                        <ChevronRight className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 rounded-lg bg-surface-3/60 text-xs text-text-muted">
                    💡 DM bukan musuh pemain — mereka adalah pemandu cerita yang memastikan petualangan seru dan adil.
                  </div>
                </div>

                {/* Player Card */}
                <div className="rounded-xl border border-info/20 bg-gradient-to-b from-info/5 to-transparent p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-info/15 border border-info/20 flex items-center justify-center">
                      <Swords className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-info">Player (Pemain)</h3>
                      <p className="text-xs text-text-tertiary">Petualang & Pahlawan</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      'Membuat & memainkan karakter unikmu',
                      'Membuat keputusan apa yang karakter lakukan',
                      'Berinteraksi dengan dunia & NPC',
                      'Bertarung bersama tim melawan monster',
                      'Menjelajahi dungeon & memecahkan teka-teki',
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                        <ChevronRight className="w-3 h-3 text-info shrink-0 mt-0.5" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 rounded-lg bg-surface-3/60 text-xs text-text-muted">
                    💡 Tidak ada cara &quot;salah&quot; bermain — yang penting kamu menikmati karakter dan ceritanya!
                  </div>
                </div>
              </div>

              <ContentCard variant="highlight" className="mt-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">🔄 Ritme Permainan</p>
                <div className="flex flex-col md:flex-row items-center gap-3">
                  {[
                    { step: '1', text: 'DM mendeskripsikan situasi', icon: Eye },
                    { step: '2', text: 'Pemain memutuskan aksi', icon: Brain },
                    { step: '3', text: 'Lempar dadu jika diperlukan', icon: Dices },
                    { step: '4', text: 'DM menceritakan hasilnya', icon: MessageCircle },
                  ].map((item, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2 border border-border">
                        <item.icon className="w-4 h-4 text-accent" />
                        <div>
                          <span className="text-[10px] text-accent font-bold">Step {item.step}</span>
                          <p className="text-xs text-text-secondary">{item.text}</p>
                        </div>
                      </div>
                      {i < 3 && <ArrowRight className="w-4 h-4 text-text-muted shrink-0 hidden md:block" />}
                    </React.Fragment>
                  ))}
                </div>
              </ContentCard>
            </section>

            {/* ═══════ SECTION: Character ═══════ */}
            <section ref={el => { sectionRefs.current['character'] = el; }} id="character" className={activeSection === 'character' ? '' : 'opacity-70'}>
              <SectionHeader icon={Star} title="Membuat Karakter" color="text-success" number={3} />

              <div className="space-y-4 mt-5">
                <ContentCard>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Karaktermu adalah avatar-mu di dunia D&D. Pikirkan mereka seperti tokoh utama dalam novel —
                    dengan <strong className="text-text-primary">ras</strong>, <strong className="text-text-primary">kelas</strong>,
                    <strong className="text-text-primary"> latar belakang</strong>, dan <strong className="text-text-primary">kepribadian</strong> yang unik.
                  </p>
                </ContentCard>

                {/* Race */}
                <div className="rounded-xl border border-border bg-surface-2 p-5">
                  <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-success" /> Ras (Species)
                  </h4>
                  <p className="text-xs text-text-secondary mb-3">Menentukan penampilan fisik & kemampuan bawaan karaktermu.</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Human', desc: 'Serba bisa, adaptif' },
                      { name: 'Elf', desc: 'Anggun, darkvision' },
                      { name: 'Dwarf', desc: 'Tangguh, tahan racun' },
                      { name: 'Halfling', desc: 'Lincah, keberuntungan' },
                      { name: 'Dragonborn', desc: 'Napas naga, kuat' },
                      { name: 'Tiefling', desc: 'Darah iblis, sihir' },
                      { name: 'Orc', desc: 'Kuat, agresif' },
                      { name: 'Gnome', desc: 'Pintar, kreatif' },
                    ].map(race => (
                      <div key={race.name} className="group px-3 py-1.5 rounded-lg bg-surface-3 border border-border hover:border-success/30 hover:bg-success/5 transition-all cursor-default">
                        <span className="text-xs font-medium text-text-primary">{race.name}</span>
                        <span className="text-[10px] text-text-muted ml-1.5">{race.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Class */}
                <div className="rounded-xl border border-border bg-surface-2 p-5">
                  <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <Swords className="w-4 h-4 text-danger" /> Kelas (Class)
                  </h4>
                  <p className="text-xs text-text-secondary mb-3">Menentukan kemampuan pertarungan & spesialisasi karaktermu. Ini adalah pilihan paling penting!</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { name: 'Fighter', role: 'Tank / DPS', desc: 'Ahli senjata, armor berat', icon: '⚔️' },
                      { name: 'Wizard', role: 'Spellcaster', desc: 'Sihir kuat dari buku mantra', icon: '🧙' },
                      { name: 'Rogue', role: 'DPS / Utility', desc: 'Siluman, sneak attack', icon: '🗡️' },
                      { name: 'Cleric', role: 'Healer / Support', desc: 'Penyembuh suci, armor medium', icon: '⛪' },
                      { name: 'Ranger', role: 'DPS / Scout', desc: 'Pemanah alam, animal companion', icon: '🏹' },
                      { name: 'Barbarian', role: 'Tank / DPS', desc: 'Rage! HP tinggi, damage besar', icon: '💪' },
                      { name: 'Paladin', role: 'Tank / Healer', desc: 'Ksatria suci, smite divine', icon: '🛡️' },
                      { name: 'Bard', role: 'Support / Face', desc: 'Musisi yang menginspirasi tim', icon: '🎵' },
                      { name: 'Warlock', role: 'Spellcaster', desc: 'Perjanjian dengan makhluk kuat', icon: '👁️' },
                      { name: 'Druid', role: 'Healer / Shape', desc: 'Berubah jadi hewan, alam', icon: '🌿' },
                      { name: 'Sorcerer', role: 'Spellcaster', desc: 'Sihir bawaan lahir, metamagic', icon: '✨' },
                      { name: 'Monk', role: 'DPS / Mobile', desc: 'Seni bela diri, cepat', icon: '👊' },
                    ].map(cls => (
                      <div key={cls.name} className="rounded-lg bg-surface-3 border border-border p-3 hover:border-accent/20 hover:bg-accent/5 transition-all cursor-default">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{cls.icon}</span>
                          <span className="text-xs font-bold text-text-primary">{cls.name}</span>
                        </div>
                        <span className="text-[10px] font-medium text-accent">{cls.role}</span>
                        <p className="text-[10px] text-text-muted mt-0.5">{cls.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <ContentCard variant="highlight">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text-primary mb-1">Tips untuk Pemula</p>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        <strong>Fighter</strong> atau <strong>Barbarian</strong> adalah pilihan terbaik untuk pemula — sederhana dan efektif.
                        Jika kamu ingin mencoba sihir, coba <strong>Warlock</strong> (lebih sedikit spell, mudah dikelola).
                        Yang penting: pilih karakter yang <em>ingin</em> kamu mainkan, bukan yang &quot;paling kuat&quot;! 🎮
                      </p>
                    </div>
                  </div>
                </ContentCard>
              </div>
            </section>

            {/* ═══════ SECTION: Abilities ═══════ */}
            <section ref={el => { sectionRefs.current['abilities'] = el; }} id="abilities" className={activeSection === 'abilities' ? '' : 'opacity-70'}>
              <SectionHeader icon={Brain} title="6 Ability Score" color="text-warning" number={4} />

              <ContentCard className="mt-5">
                <p className="text-sm text-text-secondary leading-relaxed">
                  Setiap karakter memiliki <strong className="text-text-primary">6 Ability Score</strong> yang menentukan kekuatan & kelemahan mereka.
                  Skor berkisar dari 1 (sangat lemah) hingga 20 (batas manusia). Rata-rata manusia adalah 10–11.
                </p>
                <p className="text-xs text-text-muted mt-2">
                  Dari skor, dihitung <strong className="text-text-secondary">modifier</strong>: (skor − 10) ÷ 2 dibulatkan ke bawah.
                  Contoh: Skor 16 → modifier +3. Skor 8 → modifier −1.
                </p>
              </ContentCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {ABILITIES.map(ability => (
                  <AbilityCard
                    key={ability.abbr}
                    ability={ability}
                    expanded={expandedAbility === ability.abbr}
                    onToggle={() => setExpandedAbility(expandedAbility === ability.abbr ? null : ability.abbr)}
                  />
                ))}
              </div>

              <ContentCard variant="highlight" className="mt-4">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Modifier Quick Reference</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { score: '8–9', mod: '−1', color: 'text-danger' },
                    { score: '10–11', mod: '+0', color: 'text-text-muted' },
                    { score: '12–13', mod: '+1', color: 'text-text-secondary' },
                    { score: '14–15', mod: '+2', color: 'text-success' },
                    { score: '16–17', mod: '+3', color: 'text-success' },
                    { score: '18–19', mod: '+4', color: 'text-accent' },
                    { score: '20', mod: '+5', color: 'text-accent-bright' },
                  ].map(m => (
                    <span key={m.score} className="px-2 py-1 rounded bg-surface-3 text-[10px] border border-border">
                      <span className="text-text-muted">{m.score}:</span> <span className={`font-bold ${m.color}`}>{m.mod}</span>
                    </span>
                  ))}
                </div>
              </ContentCard>
            </section>

            {/* ═══════ SECTION: Dice ═══════ */}
            <section ref={el => { sectionRefs.current['dice'] = el; }} id="dice" className={activeSection === 'dice' ? '' : 'opacity-70'}>
              <SectionHeader icon={Dices} title="Dadu & Mekanik Dasar" color="text-danger" number={5} />

              <div className="space-y-4 mt-5">
                <ContentCard>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    D&D menggunakan <strong className="text-text-primary">dadu polyhedral</strong> — dadu dengan berbagai jumlah sisi.
                    Yang paling penting adalah <strong className="text-accent">d20</strong> (dadu 20 sisi), digunakan hampir untuk semua cek.
                  </p>
                </ContentCard>

                {/* Interactive dice */}
                <div className="rounded-xl border border-border bg-surface-2 p-5">
                  <h4 className="text-sm font-bold text-text-primary mb-4">🎲 Coba Lempar Dadu!</h4>
                  <div className="flex flex-wrap items-center justify-center gap-5 py-2">
                    {[4, 6, 8, 10, 12, 20].map(sides => (
                      <DiceRoller key={sides} sides={sides} />
                    ))}
                  </div>
                </div>

                {/* D20 Test explanation */}
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
                  <h4 className="text-sm font-bold text-accent mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" /> D20 Test — Inti Mekanik D&D
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed mb-3">
                    Kapanpun karaktermu mencoba sesuatu yang hasilnya tidak pasti, DM memintamu melempar d20.
                    Ada 3 jenis D20 Test:
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: 'Ability Check', desc: 'Mencoba melakukan sesuatu: mengangkat batu besar, membujuk pedagang, mengingat sejarah', formula: 'd20 + ability modifier + proficiency bonus (jika proficient)', example: 'STR Check DC 15 untuk mendobrak pintu' },
                      { name: 'Attack Roll', desc: 'Menyerang musuh: pedang, panah, atau spell', formula: 'd20 + ability modifier + proficiency bonus', example: 'd20 + 5 vs AC 15 musuh' },
                      { name: 'Saving Throw', desc: 'Bertahan dari ancaman: menghindari ledakan, menolak sihir mental', formula: 'd20 + ability modifier + proficiency bonus (jika proficient)', example: 'DEX Save DC 14 untuk menghindari Fireball' },
                    ].map(test => (
                      <div key={test.name} className="bg-surface-2 rounded-lg p-3 border border-border">
                        <p className="text-xs font-bold text-text-primary">{test.name}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">{test.desc}</p>
                        <p className="text-[10px] text-accent mt-1 font-mono">📐 {test.formula}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">Contoh: {test.example}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advantage / Disadvantage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                    <h4 className="text-sm font-bold text-success mb-2 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" /> Advantage ✅
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Lempar <strong>2d20, ambil yang lebih tinggi</strong>. Didapat saat kondisi menguntungkan — menyerang dari bayang-bayang,
                      diberkati teman, musuh terjatuh, dll.
                    </p>
                  </div>
                  <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                    <h4 className="text-sm font-bold text-danger mb-2 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" /> Disadvantage ❌
                    </h4>
                    <p className="text-xs text-text-secondary">
                      Lempar <strong>2d20, ambil yang lebih rendah</strong>. Terjadi saat kondisi tidak menguntungkan — keracunan,
                      menyerang dalam gelap, dll.
                    </p>
                  </div>
                </div>

                {/* Interactive skill check */}
                <SkillCheckDemo />
              </div>
            </section>

            {/* ═══════ SECTION: Combat ═══════ */}
            <section ref={el => { sectionRefs.current['combat'] = el; }} id="combat" className={activeSection === 'combat' ? '' : 'opacity-70'}>
              <SectionHeader icon={Swords} title="Pertempuran (Combat)" color="text-danger" number={6} />

              <div className="space-y-4 mt-5">
                <ContentCard>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Pertempuran D&D berjalan dalam <strong className="text-text-primary">giliran (turn-based)</strong>.
                    Satu <strong className="text-accent">round</strong> ≈ 6 detik dalam dunia game. Setiap round, semua peserta
                    bertindak sekali dalam urutan <em>Initiative</em>.
                  </p>
                </ContentCard>

                {/* Combat flow */}
                <div className="rounded-xl border border-border bg-surface-2 p-5">
                  <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-danger" /> Alur Combat
                  </h4>
                  <div className="space-y-3">
                    {[
                      { step: '1', title: 'Roll Initiative', desc: 'Semua lempar d20 + DEX modifier. Urutan tertinggi bertindak pertama.', icon: Dices, color: 'text-accent' },
                      { step: '2', title: 'Giliran Kamu', desc: 'Kamu bisa: BERGERAK (sejauh Speed-mu) + mengambil 1 ACTION.', icon: Play, color: 'text-info' },
                      { step: '3', title: 'Action: Menyerang', desc: 'Lempar d20 + modifier vs AC musuh. Hit? Lempar damage dice!', icon: Target, color: 'text-danger' },
                      { step: '4', title: 'Bonus Action & Reaction', desc: 'Beberapa skill memberi bonus action. Opportunity Attack = reaction.', icon: Zap, color: 'text-warning' },
                      { step: '5', title: 'Musuh Bertindak', desc: 'Monster bertindak berdasarkan initiative mereka. DM melempar dadu untuk mereka.', icon: Skull, color: 'text-text-tertiary' },
                      { step: '6', title: 'Round Berikutnya', desc: 'Ulangi hingga pertarungan selesai — musuh kalah, melarikan diri, atau menyerah.', icon: RotateCcw, color: 'text-success' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center shrink-0 border border-border`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-text-muted">STEP {item.step}</span>
                            <span className="text-xs font-bold text-text-primary">{item.title}</span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions table */}
                <div className="rounded-xl border border-border bg-surface-2 p-5">
                  <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-warning" /> Aksi dalam Combat
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { name: 'Attack', desc: 'Serang dengan senjata atau Unarmed Strike' },
                      { name: 'Dash', desc: 'Gerak 2× lipat Speed kamu' },
                      { name: 'Disengage', desc: 'Bergerak tanpa provoke Opportunity Attack' },
                      { name: 'Dodge', desc: 'Serangan musuh mendapat Disadvantage' },
                      { name: 'Help', desc: 'Bantu teman → Advantage di roll berikutnya' },
                      { name: 'Hide', desc: 'DEX (Stealth) check untuk bersembunyi' },
                      { name: 'Magic', desc: 'Cast spell, gunakan item magic' },
                      { name: 'Ready', desc: 'Siapkan aksi untuk trigger tertentu' },
                      { name: 'Search', desc: 'Cari sesuatu di sekitarmu' },
                    ].map(action => (
                      <div key={action.name} className="bg-surface-3/60 rounded-lg p-2.5 border border-border/50">
                        <p className="text-xs font-bold text-text-primary">{action.name}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{action.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Combat Simulator */}
                <div>
                  <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4 text-success" /> Simulasi Pertarungan Interaktif
                  </h4>
                  <CombatSimulator />
                </div>

                {/* Nat 20 / Nat 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                    <h4 className="text-sm font-bold text-success mb-2">🎯 Natural 20 (Critical Hit!)</h4>
                    <p className="text-xs text-text-secondary">
                      Roll 20 pada d20 untuk serangan = <strong>selalu mengenai</strong>, apapun AC musuh! Lempar damage dice <strong>dua kali</strong>!
                    </p>
                  </div>
                  <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                    <h4 className="text-sm font-bold text-danger mb-2">💨 Natural 1 (Critical Fail!)</h4>
                    <p className="text-xs text-text-secondary">
                      Roll 1 pada d20 untuk serangan = <strong>selalu meleset</strong>, apapun modifier-mu! Momen dramatis (atau lucu)!
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ═══════ SECTION: Exploration ═══════ */}
            <section ref={el => { sectionRefs.current['exploration'] = el; }} id="exploration" className={activeSection === 'exploration' ? '' : 'opacity-70'}>
              <SectionHeader icon={Compass} title="Tiga Pilar Gameplay" color="text-[#c084fc]" number={7} />

              <div className="space-y-4 mt-5">
                <ContentCard>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    D&D bukan cuma soal bertarung! Ada tiga pilar utama gameplay yang menjadikan petualangan seru dan bervariasi.
                  </p>
                </ContentCard>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Combat */}
                  <div className="rounded-xl border border-danger/20 bg-gradient-to-b from-danger/5 to-transparent p-5">
                    <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center mb-3">
                      <Swords className="w-5 h-5 text-danger" />
                    </div>
                    <h4 className="text-sm font-bold text-danger mb-2">⚔️ Combat</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Pertarungan melawan monster, bandit, & musuh berbahaya. Strategi & kerja sama tim sangat penting!
                    </p>
                    <ul className="mt-2 space-y-1 text-[10px] text-text-muted">
                      <li>• Pertempuran turn-based</li>
                      <li>• Positioning & taktik</li>
                      <li>• Sinergi antar kelas</li>
                    </ul>
                  </div>

                  {/* Exploration */}
                  <div className="rounded-xl border border-success/20 bg-gradient-to-b from-success/5 to-transparent p-5">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                      <TreePine className="w-5 h-5 text-success" />
                    </div>
                    <h4 className="text-sm font-bold text-success mb-2">🌍 Exploration</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Menjelajahi dungeon, hutan, kota, & reruntuhan kuno. Cari harta karun, hindari jebakan, temukan rahasia!
                    </p>
                    <ul className="mt-2 space-y-1 text-[10px] text-text-muted">
                      <li>• Perception & Investigation check</li>
                      <li>• Jebakan & teka-teki</li>
                      <li>• Perjalanan & navigasi</li>
                    </ul>
                  </div>

                  {/* Social */}
                  <div className="rounded-xl border border-[#c084fc]/20 bg-gradient-to-b from-[#c084fc]/5 to-transparent p-5">
                    <div className="w-10 h-10 rounded-lg bg-[#c084fc]/10 flex items-center justify-center mb-3">
                      <MessageCircle className="w-5 h-5 text-[#c084fc]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#c084fc] mb-2">🗣️ Social Interaction</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Berinteraksi dengan NPC: negosiasi, intimidasi, diplomasi, penipuan. Roleplay pada intinya!
                    </p>
                    <ul className="mt-2 space-y-1 text-[10px] text-text-muted">
                      <li>• Persuasion, Deception, Intimidation</li>
                      <li>• Insight untuk membaca motif</li>
                      <li>• Bangun aliansi atau musuh baru</li>
                    </ul>
                  </div>
                </div>

                <ContentCard variant="highlight">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <p className="text-xs text-text-secondary leading-relaxed">
                      <strong className="text-text-primary">DM yang baik</strong> menyeimbangkan ketiga pilar ini.
                      Tidak semua sesi harus penuh pertarungan — sesi roleplay murni, eksplorasi misteri, atau intrik politik
                      bisa sama serunya! Bicarakan dengan DM & tim tentang gaya bermain yang kalian suka.
                    </p>
                  </div>
                </ContentCard>
              </div>
            </section>

            {/* ═══════ SECTION: HP & Healing ═══════ */}
            <section ref={el => { sectionRefs.current['hp'] = el; }} id="hp" className={activeSection === 'hp' ? '' : 'opacity-70'}>
              <SectionHeader icon={Heart} title="HP, Damage & Healing" color="text-danger" number={8} />

              <div className="space-y-4 mt-5">
                <ContentCard>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    <strong className="text-text-primary">Hit Points (HP)</strong> menunjukkan seberapa tahan karaktermu terhadap luka.
                    Saat HP mencapai 0, kamu jatuh <em>unconscious</em> dan mulai membuat <strong className="text-danger">Death Saving Throws</strong>.
                  </p>
                </ContentCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Death saves */}
                  <div className="rounded-xl border border-danger/20 bg-surface-2 p-5">
                    <h4 className="text-sm font-bold text-danger mb-3 flex items-center gap-2">
                      <Skull className="w-4 h-4" /> Death Saving Throws
                    </h4>
                    <p className="text-xs text-text-secondary mb-3">
                      Saat HP = 0, lempar d20 setiap giliran:
                    </p>
                    <ul className="space-y-2 text-xs text-text-secondary">
                      <li className="flex items-start gap-2">
                        <span className="text-success">✅</span>
                        <span><strong>10+</strong>: Sukses (kumpulkan 3 = stabil)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-danger">❌</span>
                        <span><strong>1–9</strong>: Gagal (kumpulkan 3 = mati)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent">⭐</span>
                        <span><strong>Natural 20</strong>: Langsung bangkit dengan 1 HP!</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-danger">💀</span>
                        <span><strong>Natural 1</strong>: Hitung sebagai 2 kegagalan!</span>
                      </li>
                    </ul>
                  </div>

                  {/* Healing & Rest */}
                  <div className="rounded-xl border border-success/20 bg-surface-2 p-5">
                    <h4 className="text-sm font-bold text-success mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4" /> Healing & Istirahat
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-surface-3/60 rounded-lg p-3">
                        <p className="text-xs font-bold text-info mb-1">⏰ Short Rest (1 jam)</p>
                        <p className="text-[10px] text-text-secondary">Gunakan Hit Dice untuk pulihkan HP. Beberapa kemampuan reset.</p>
                      </div>
                      <div className="bg-surface-3/60 rounded-lg p-3">
                        <p className="text-xs font-bold text-accent mb-1">🌙 Long Rest (8 jam)</p>
                        <p className="text-[10px] text-text-secondary">HP pulih sepenuhnya. Spell slots reset. Separuh Hit Dice pulih.</p>
                      </div>
                      <div className="bg-surface-3/60 rounded-lg p-3">
                        <p className="text-xs font-bold text-success mb-1">✨ Penyembuhan Magic</p>
                        <p className="text-[10px] text-text-secondary">Spell (Cure Wounds, Healing Word), Potion of Healing, dll.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Damage types */}
                <ContentCard>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Tipe Damage Umum</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Slashing', icon: '⚔️' }, { name: 'Piercing', icon: '🏹' }, { name: 'Bludgeoning', icon: '🔨' },
                      { name: 'Fire', icon: '🔥' }, { name: 'Cold', icon: '❄️' }, { name: 'Lightning', icon: '⚡' },
                      { name: 'Poison', icon: '☠️' }, { name: 'Necrotic', icon: '💀' }, { name: 'Radiant', icon: '☀️' },
                      { name: 'Psychic', icon: '🧠' }, { name: 'Thunder', icon: '💥' }, { name: 'Force', icon: '✨' },
                      { name: 'Acid', icon: '🧪' },
                    ].map(dt => (
                      <span key={dt.name} className="px-2 py-1 rounded bg-surface-3 text-[10px] border border-border">
                        {dt.icon} {dt.name}
                      </span>
                    ))}
                  </div>
                </ContentCard>
              </div>
            </section>

            {/* ═══════ SECTION: Taverna VTT ═══════ */}
            <section ref={el => { sectionRefs.current['taverna'] = el; }} id="taverna" className={activeSection === 'taverna' ? '' : 'opacity-70'}>
              <SectionHeader icon={Map} title="Cara Pakai Taverna VTT" color="text-accent" number={9} />

              <div className="space-y-4 mt-5">
                <ContentCard>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    <strong className="text-accent">Taverna</strong> adalah Virtual Tabletop (VTT) buatan kami yang memudahkan bermain D&D secara online.
                    Berikut panduan fitur-fitur utama:
                  </p>
                </ContentCard>

                <div className="space-y-3">
                  {[
                    { icon: Map, title: 'Campaigns', desc: 'Buat campaign baru, undang pemain, atur pengaturan campaign. Ini adalah "home base" petualanganmu.', path: '/dashboard', color: 'text-accent' },
                    { icon: Users, title: 'Characters', desc: 'Buat karakter dengan stat lengkap, pilih ras & kelas, kelola inventory & spell list.', path: '/characters', color: 'text-info' },
                    { icon: Zap, title: 'Live Session', desc: 'Mulai sesi bermain real-time! Chat, lempar dadu, kelola initiative tracker, dan mainkan combat.', path: '/session-live', color: 'text-success' },
                    { icon: Dices, title: 'Dice Roller', desc: 'Lempar semua jenis dadu — d4 hingga d100. Buat macro roll, advantage/disadvantage, custom formula.', path: '/dice', color: 'text-warning' },
                    { icon: BookOpen, title: 'Compendium', desc: 'Referensi lengkap: spells, monsters, equipment, classes, races — semuanya ada di sini.', path: '/compendium', color: 'text-[#c084fc]' },
                    { icon: Swords, title: 'Battle Map', desc: 'Peta pertarungan visual. Upload map, taruh token karakter & monster, kelola positioning.', path: '/battle-map', color: 'text-danger' },
                    { icon: Target, title: 'Encounters', desc: 'DM tool: rancang encounter, atur monster, hitung challenge rating (CR), kelola initiative.', path: '/encounters', color: 'text-danger' },
                    { icon: BookOpen, title: 'Journal & Notes', desc: 'Catatan kampanye: NPC, lokasi, plot, clue. Terorganisir per sesi.', path: '/journal', color: 'text-accent' },
                    { icon: Sparkles, title: 'Generators', desc: 'Generator random: nama NPC, tavern, quest hook, loot, encounter, dan banyak lagi.', path: '/generators', color: 'text-[#c084fc]' },
                    { icon: Globe, title: 'World Lore Wiki', desc: 'Ensiklopedia dunia kampanye bergaya Wikipedia. Tulis lore NPC, lokasi, faksi, artefak — dengan relasi antar entri dan graph view.', path: '/lore-wiki', color: 'text-cyan-400' },
                    { icon: ScrollText, title: 'Quest Board', desc: 'Papan misi bergaya Kanban. Buat quest dengan objectives, reward, voting pemain, branching storylines, dan rumor board.', path: '/quest-board', color: 'text-amber-400' },
                    { icon: Sword, title: 'Combat Autopilot', desc: 'Simulator combat otomatis. Auto-resolve attack, damage, concentration check, death save. Replay combat sebelumnya.', path: '/combat-autopilot', color: 'text-red-400' },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-4 rounded-xl bg-surface-2 border border-border p-4 hover:border-accent/20 transition-colors">
                      <div className={`w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center shrink-0`}>
                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-text-primary">{feature.title}</h4>
                        <p className="text-xs text-text-secondary mt-0.5">{feature.desc}</p>
                        <span className="text-[10px] text-text-muted mt-1 block font-mono">{feature.path}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <ContentCard variant="highlight">
                  <div className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text-primary mb-1">🎉 Kamu Siap Bermain!</p>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Selamat! Kamu sudah mempelajari dasar-dasar D&D dan cara menggunakan Taverna.
                        Langkah selanjutnya: buat campaign pertamamu, ajak teman-teman, dan mulai berpetualang!
                        Ingat, aturan itu panduan — yang terpenting adalah bersenang-senang bersama. Selamat berpetualang, adventurer! ⚔️🐉
                      </p>
                    </div>
                  </div>
                </ContentCard>
              </div>
            </section>

            {/* ═══════ SECTION: World Lore Wiki ═══════ */}
            <section ref={el => { sectionRefs.current['lore-wiki'] = el; }} id="lore-wiki" className={activeSection === 'lore-wiki' ? '' : 'opacity-70'}>
              <SectionHeader icon={Globe} title="World Lore Wiki" color="text-cyan-400" number={10} />

              <div className="space-y-4 mt-5">
                <ContentCard>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    <strong className="text-cyan-400">World Lore Wiki</strong> adalah ensiklopedia dunia kampanye bergaya Wikipedia.
                    DM bisa menulis lore yang terstruktur tentang NPC, lokasi, faksi, artefak, dewa, makhluk, dan event penting
                    dalam kampanye — semua saling terhubung layaknya wiki sungguhan.
                  </p>
                </ContentCard>

                {/* Key features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-cyan-500/20 bg-surface-2 p-4">
                    <h4 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
                      <Network className="w-4 h-4" /> Graph View
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Visualisasi hubungan antar entri dalam bentuk graph interaktif. Lihat bagaimana NPC terhubung
                      dengan faksi, lokasi, dan event — temukan koneksi yang mungkin belum terlihat!
                    </p>
                  </div>
                  <div className="rounded-xl border border-cyan-500/20 bg-surface-2 p-4">
                    <h4 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Secret Entries
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      DM bisa menandai entri sebagai <em>rahasia</em> — hanya DM yang bisa melihatnya. Sempurna untuk
                      menyimpan plot twist, BBEG backstory, atau info yang belum waktunya diungkap.
                    </p>
                  </div>
                </div>

                {/* Categories */}
                <div className="rounded-xl border border-border bg-surface-2 p-5">
                  <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" /> Kategori Lore
                  </h4>
                  <p className="text-xs text-text-secondary mb-3">Organisasi konten dunia kampanye berdasarkan kategori:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'NPC', icon: '👤', desc: 'Karakter non-player' },
                      { name: 'Lokasi', icon: '📍', desc: 'Kota, dungeon, landmark' },
                      { name: 'Faksi', icon: '🛡️', desc: 'Guild, kerajaan, organisasi' },
                      { name: 'Artefak', icon: '📦', desc: 'Item legendaris & magic' },
                      { name: 'Event', icon: '⭐', desc: 'Peristiwa penting sejarah' },
                      { name: 'Dewa', icon: '👑', desc: 'Deity & pantheon' },
                      { name: 'Makhluk', icon: '💀', desc: 'Ras, monster, beast' },
                      { name: 'Lore', icon: '📜', desc: 'Mitos, legenda, profesi' },
                    ].map(cat => (
                      <div key={cat.name} className="px-3 py-1.5 rounded-lg bg-surface-3 border border-border">
                        <span className="text-xs">{cat.icon} <strong className="text-text-primary">{cat.name}</strong></span>
                        <span className="text-[10px] text-text-muted ml-1">— {cat.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How to use */}
                <div className="rounded-xl border border-border bg-surface-2 p-5">
                  <h4 className="text-sm font-bold text-text-primary mb-3">📝 Cara Menggunakan</h4>
                  <div className="space-y-2">
                    {[
                      { step: '1', text: 'Buka halaman World Lore Wiki dari sidebar', detail: 'Pilih campaign aktif untuk mulai menulis lore.' },
                      { step: '2', text: 'Klik "Tambah Entri" untuk membuat entri baru', detail: 'Isi judul, kategori, konten, dan tag. Tandai sebagai rahasia jika perlu.' },
                      { step: '3', text: 'Hubungkan entri dengan Link', detail: 'Tambahkan link ke entri lain untuk membuat relasi (misal: NPC → Faksi yang diikuti).' },
                      { step: '4', text: 'Gunakan Graph View untuk eksplorasi', detail: 'Lihat seluruh dunia kampanye dalam bentuk graph interaktif.' },
                      { step: '5', text: 'Map View untuk lokasi', detail: 'Entri dengan koordinat akan muncul sebagai pin di peta dunia.' },
                    ].map(item => (
                      <div key={item.step} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">{item.step}</span>
                        <div>
                          <p className="text-xs font-medium text-text-primary">{item.text}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <ContentCard variant="highlight">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text-primary mb-1">💡 Tips World Building</p>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Mulai dari entri yang langsung dibutuhkan pemain: kota awal, NPC penting, dan faksi utama.
                        Jangan menulis semuanya sekaligus — biarkan dunia berkembang seiring kampanye berjalan.
                        Gunakan tag seperti &quot;arc-1&quot; atau &quot;mystery&quot; untuk organisasi yang lebih rapi!
                      </p>
                    </div>
                  </div>
                </ContentCard>
              </div>
            </section>

            {/* ═══════ SECTION: Quest Board ═══════ */}
            <section ref={el => { sectionRefs.current['quest-board'] = el; }} id="quest-board" className={activeSection === 'quest-board' ? '' : 'opacity-70'}>
              <SectionHeader icon={ScrollText} title="Quest Board & Story Tracker" color="text-amber-400" number={11} />

              <div className="space-y-4 mt-5">
                <ContentCard>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    <strong className="text-amber-400">Quest Board</strong> adalah sistem manajemen misi bergaya Kanban.
                    DM membuat quest dengan objective, reward, dan branching storyline — sementara pemain bisa voting quest
                    mana yang ingin diambil dan memasang rumor di papan pengumuman.
                  </p>
                </ContentCard>

                {/* Three tabs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-5">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                      <ListOrdered className="w-5 h-5 text-amber-400" />
                    </div>
                    <h4 className="text-sm font-bold text-amber-400 mb-2">📋 Kanban Board</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Lihat semua quest dalam kolom: Hidden, Available, Active, Completed, Failed.
                      Drag-and-drop untuk mengubah status quest.
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent p-5">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                      <Network className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="text-sm font-bold text-purple-400 mb-2">🌳 Story Arc</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Visualisasi alur cerita utama. Lihat progress quest, timeline objective,
                      dan branching sub-quest yang terhubung.
                    </p>
                  </div>
                  <div className="rounded-xl border border-green-500/20 bg-gradient-to-b from-green-500/5 to-transparent p-5">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <h4 className="text-sm font-bold text-green-400 mb-2">💬 Rumor Board</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Pemain bisa memasang rumor yang mereka dengar dari NPC atau pengamatan.
                      DM bisa menggunakan ini sebagai hook untuk quest baru.
                    </p>
                  </div>
                </div>

                {/* Quest anatomy */}
                <div className="rounded-xl border border-border bg-surface-2 p-5">
                  <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-400" /> Anatomi Sebuah Quest
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Judul & Deskripsi', desc: 'Nama quest dan narasi singkat yang memancing pemain', icon: '📝' },
                      { label: 'Priority', desc: 'Side Quest, Main Quest, atau Urgent — menentukan tampilan visual', icon: '🔥' },
                      { label: 'Objectives', desc: 'Daftar tugas yang harus diselesaikan (bisa dengan flag hidden/branching)', icon: '✅' },
                      { label: 'Rewards', desc: 'XP, gold, dan item yang didapat jika berhasil', icon: '🏆' },
                      { label: 'NPC & Lokasi', desc: 'Quest giver NPC dan lokasi tujuan', icon: '👤' },
                      { label: 'Voting', desc: 'Pemain bisa vote 👍/👎 untuk menentukan quest mana yang diambil', icon: '🗳️' },
                      { label: 'Branching', desc: 'Quest bisa memiliki parent quest — selesaikan satu untuk membuka lainnya', icon: '🌳' },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-3 bg-surface-3/60 rounded-lg p-3">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-text-primary">{item.label}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status flow */}
                <ContentCard variant="highlight">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">🔄 Alur Status Quest</p>
                  <div className="flex flex-col md:flex-row items-center gap-2">
                    {[
                      { status: 'HIDDEN', desc: 'Hanya DM', color: 'text-gray-400', bg: 'bg-gray-500/10' },
                      { status: 'AVAILABLE', desc: 'Pemain lihat', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      { status: 'ACTIVE', desc: 'Sedang dijalankan', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                      { status: 'COMPLETED', desc: 'Berhasil!', color: 'text-green-400', bg: 'bg-green-500/10' },
                    ].map((s, i) => (
                      <React.Fragment key={s.status}>
                        <div className={`px-3 py-2 rounded-lg border border-border ${s.bg} text-center`}>
                          <span className={`text-xs font-bold ${s.color}`}>{s.status}</span>
                          <p className="text-[10px] text-text-muted mt-0.5">{s.desc}</p>
                        </div>
                        {i < 3 && <ArrowRight className="w-4 h-4 text-text-muted shrink-0 hidden md:block" />}
                      </React.Fragment>
                    ))}
                  </div>
                </ContentCard>
              </div>
            </section>

            {/* ═══════ SECTION: Combat Autopilot ═══════ */}
            <section ref={el => { sectionRefs.current['combat-autopilot'] = el; }} id="combat-autopilot" className={activeSection === 'combat-autopilot' ? '' : 'opacity-70'}>
              <SectionHeader icon={Sword} title="Smart Combat Autopilot" color="text-red-400" number={12} />

              <div className="space-y-4 mt-5">
                <ContentCard>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    <strong className="text-red-400">Combat Autopilot</strong> memungkinkan DM menjalankan pertarungan secara otomatis.
                    Sistem ini auto-resolve attack roll, damage, concentration check, death save, dan reactions — sehingga
                    combat berjalan cepat tanpa menghitung manual. Sempurna untuk encounter besar atau combat testing!
                  </p>
                </ContentCard>

                {/* Modes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-red-500/20 bg-surface-2 p-4">
                    <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Full Auto
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Semua aksi dijalankan otomatis — monster <em>dan</em> player.
                      Berguna untuk simulasi &quot;apa yang terjadi jika...&quot; atau testing encounter balance.
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-surface-2 p-4">
                    <h4 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Monsters Only
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Monster bertindak otomatis, tapi berhenti saat giliran player.
                      Pemain memilih target secara manual — mode paling sering digunakan.
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-500/20 bg-surface-2 p-4">
                    <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                      <SkipForward className="w-4 h-4" /> Manual Step
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Setiap aksi dilakukan satu per satu secara manual. Seperti combat normal
                      tapi dengan auto-calculation untuk attack roll, damage, dll.
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="rounded-xl border border-border bg-surface-2 p-5">
                  <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-400" /> Fitur Smart Autopilot
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { icon: '🎯', title: 'Auto Attack Roll', desc: 'd20 + modifier vs AC target, termasuk advantage/disadvantage' },
                      { icon: '💥', title: 'Auto Damage', desc: 'Kalkulasi damage otomatis — critical hit = double damage dice' },
                      { icon: '🧠', title: 'Concentration Check', desc: 'Otomatis CON save saat caster yang konsentrasi terkena damage' },
                      { icon: '💀', title: 'Death Saves', desc: 'Auto death save saat giliran karakter yang unconscious (HP 0)' },
                      { icon: '📊', title: 'Combat Statistics', desc: 'Statistik real-time: hit rate, total damage, critical hits' },
                      { icon: '⏩', title: 'Speed Control', desc: 'Atur kecepatan autopilot dari 0.5× hingga 5× — nonton combat secepat kilat!' },
                    ].map(f => (
                      <div key={f.title} className="flex items-start gap-3 bg-surface-3/60 rounded-lg p-3">
                        <span className="text-base shrink-0">{f.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-text-primary">{f.title}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Combat Replay */}
                <div className="rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent p-5">
                  <h4 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
                    <History className="w-4 h-4" /> Combat Replay
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed mb-3">
                    Setiap aksi combat dicatat dan disimpan. Setelah sesi berakhir, kamu bisa membuka kembali
                    combat replay untuk menonton ulang pertarungan step-by-step — seperti film highlight!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Play/Pause', 'Speed Control', 'Step Forward', 'Progress Bar', 'Round & Turn Marker'].map(f => (
                      <span key={f} className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">{f}</span>
                    ))}
                  </div>
                </div>

                <ContentCard variant="highlight">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text-primary mb-1">💡 Tips Combat Autopilot</p>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Gunakan <strong>Full Auto</strong> untuk testing apakah encounter terlalu mudah/sulit sebelum sesi.
                        Saat bermain sungguhan, gunakan <strong>Monsters Only</strong> agar pemain tetap punya kontrol atas karakter mereka.
                        Tambahkan combatant custom (NPC, boss) dengan tombol &quot;Tambah&quot; di initiative tracker!
                      </p>
                    </div>
                  </div>
                </ContentCard>
              </div>
            </section>

            {/* ── Navigation buttons ── */}
            <div className="flex items-center justify-between pt-6 pb-8 border-t border-border">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  currentIndex === 0
                    ? 'text-text-muted cursor-not-allowed'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </button>

              {currentIndex < SECTIONS.length - 1 ? (
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all cursor-pointer border border-accent/20"
                >
                  Lanjut
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => markComplete('taverna')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-success/10 text-success hover:bg-success/20 transition-all cursor-pointer border border-success/20"
                >
                  <Trophy className="w-4 h-4" />
                  Selesai!
                </button>
              )}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════════ */
function SectionHeader({ icon: Icon, title, color, number }: { icon: React.ElementType; title: string; color: string; number: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="flex items-center gap-3"
    >
      <div className={`w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <span className="text-[10px] font-semibold text-text-muted tracking-wider uppercase">Bab {number}</span>
        <h2 className="text-xl font-display font-bold text-text-primary">{title}</h2>
      </div>
    </motion.div>
  );
}

function ContentCard({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: 'default' | 'highlight'; className?: string }) {
  return (
    <div className={`rounded-xl border p-5 ${
      variant === 'highlight'
        ? 'border-accent/15 bg-gradient-to-r from-accent/5 to-transparent'
        : 'border-border bg-surface-2'
    } ${className}`}>
      {children}
    </div>
  );
}

function FeatureBox({ icon: Icon, title, color, children }: { icon: React.ElementType; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4 hover:border-accent/15 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-bold text-text-primary">{title}</span>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}
