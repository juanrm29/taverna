'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, ArrowRight, Shield, BookOpen, Dices, Map, Sparkles, Users, Zap } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'landing' | 'login' | 'register'>('landing');
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  const handleLogin = async () => {
    setError('');
    if (!form.email || !form.password) {
      setError(t.auth.fillAllFields);
      return;
    }
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: form.email.toLowerCase(),
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError(t.auth.invalidCredentials);
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!form.displayName || !form.email || !form.password) {
      setError(t.auth.fillAllFields);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t.auth.invalidEmail);
      return;
    }
    if (form.password.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName,
          email: form.email.toLowerCase(),
          password: form.password,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t.auth.registrationFailed);
        setLoading(false);
        return;
      }
      const result = await signIn('credentials', {
        email: form.email.toLowerCase(),
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError(t.auth.autoLoginFailed);
        setMode('login');
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  };

  // Handle Enter key on forms
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'login') handleLogin();
      else if (mode === 'register') handleRegister();
    }
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-accent/20 to-accent/5 border border-accent/15 flex items-center justify-center shadow-[0_0_30px_var(--color-accent-glow)]">
            <Swords className="w-5 h-5 text-accent" />
          </div>
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const features = [
    { icon: <Shield className="w-5 h-5" />, title: t.landing.feature1Title, desc: t.landing.feature1Desc },
    { icon: <Map className="w-5 h-5" />, title: t.landing.feature2Title, desc: t.landing.feature2Desc },
    { icon: <Dices className="w-5 h-5" />, title: t.landing.feature3Title, desc: t.landing.feature3Desc },
    { icon: <BookOpen className="w-5 h-5" />, title: t.landing.feature4Title, desc: t.landing.feature4Desc },
  ];

  const stats = [
    { icon: <Users className="w-3.5 h-3.5" />, value: '∞', label: 'Players' },
    { icon: <Zap className="w-3.5 h-3.5" />, value: '55+', label: 'Features' },
    { icon: <Sparkles className="w-3.5 h-3.5" />, value: '100%', label: 'Free' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[52%] bg-surface-1 border-r border-border flex-col justify-between p-14 relative overflow-hidden">
        {/* Rich ambient gradients */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-accent/[0.03] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-accent/[0.02] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-[300px] h-[300px] bg-info/[0.02] rounded-full blur-[80px] pointer-events-none" />

        {/* Decorative grid dots */}
        <div className="absolute inset-0 opacity-[0.012] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-text-primary) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3.5 mb-16"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-accent/20 to-accent/5 border border-accent/15 flex items-center justify-center shadow-[0_0_25px_var(--color-accent-glow)] breathe">
              <Swords className="w-5 h-5 text-accent" />
            </div>
            <div>
              <span className="font-display text-xl font-semibold tracking-tight block">{t.common.taverna}</span>
              <span className="text-[10px] text-text-tertiary tracking-widest uppercase">D&D Platform</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-[3.5rem] font-display font-bold leading-[1.08] mb-6 tracking-tight">
              {t.landing.heroTitle}
              <br />
              <span className="text-gradient-animated">{t.landing.heroTitleHighlight}</span>
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed max-w-md mb-8">
              {t.landing.heroDescription}
            </p>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-center gap-6"
            >
              {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-accent/60">{s.icon}</span>
                  <span className="text-sm font-semibold text-text-primary">{s.value}</span>
                  <span className="text-xs text-text-tertiary">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative z-10 grid grid-cols-2 gap-3"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group bg-surface-2/40 border border-border/40 rounded-xl p-4 hover:border-accent/20 hover:bg-surface-2/60 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/10 flex items-center justify-center mb-2.5">
                <span className="text-accent opacity-80 group-hover:opacity-100 transition-opacity">{f.icon}</span>
              </div>
              <h3 className="text-xs font-semibold text-text-primary mb-0.5">{f.title}</h3>
              <p className="text-[11px] text-text-tertiary leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom ornament */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-6 left-14 right-14 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        />
      </div>

      {/* Right — Auth */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Subtle ambient */}
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-accent/[0.02] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-60 h-60 bg-info/[0.015] rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-accent/20 to-accent/5 border border-accent/15 flex items-center justify-center shadow-[0_0_20px_var(--color-accent-glow)]">
              <Swords className="w-5 h-5 text-accent" />
            </div>
            <div>
              <span className="font-display text-lg font-semibold tracking-tight block">{t.common.taverna}</span>
              <span className="text-[10px] text-text-tertiary tracking-widest uppercase">D&D Platform</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'landing' && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-4"
              >
                <div className="mb-4">
                  <h2 className="text-2xl font-display font-bold mb-2 tracking-tight">{t.landing.whyTaverna}</h2>
                  <p className="text-text-secondary text-sm leading-relaxed">{t.landing.signInSubtitle}</p>
                </div>

                {/* Mobile feature preview */}
                <div className="lg:hidden grid grid-cols-2 gap-2 mb-4">
                  {features.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-surface-1 border border-border/40 rounded-lg">
                      <span className="text-accent opacity-60">{f.icon}</span>
                      <span className="text-xs text-text-secondary">{f.title}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <Button onClick={() => setMode('login')} className="w-full justify-between" size="lg">
                    {t.auth.signIn} <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" onClick={() => setMode('register')} className="w-full justify-between" size="lg">
                    {t.auth.createAccount} <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 mt-8">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
                  <span className="text-[10px] text-text-muted tracking-widest uppercase">{t.common.freeForever}</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
                </div>
              </motion.div>
            )}

            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-4"
                onKeyDown={handleKeyDown}
              >
                <div className="mb-2">
                  <h2 className="text-2xl font-display font-bold mb-2 tracking-tight">{t.auth.signIn}</h2>
                  <p className="text-text-secondary text-sm">{t.landing.builtForDnd}</p>
                </div>

                <Input
                  label={t.auth.email}
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoFocus
                  autoComplete="email"
                />
                <Input
                  label={t.auth.password}
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-danger bg-danger/5 border border-danger/10 rounded-lg px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button onClick={handleLogin} loading={loading} className="w-full mt-3" size="lg">
                  {t.auth.signIn}
                </Button>

                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => { setMode('landing'); setError(''); }}
                    className="text-sm text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => { setMode('register'); setError(''); }}
                    className="text-sm text-accent/80 hover:text-accent transition-colors cursor-pointer"
                  >
                    {t.auth.createAccount} →
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-4"
                onKeyDown={handleKeyDown}
              >
                <div className="mb-2">
                  <h2 className="text-2xl font-display font-bold mb-2 tracking-tight">{t.auth.createAccount}</h2>
                  <p className="text-text-secondary text-sm">{t.landing.builtForDnd}</p>
                </div>

                <Input
                  label={t.auth.displayName}
                  placeholder={t.auth.namePlaceholder}
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                  autoFocus
                  autoComplete="name"
                />
                <Input
                  label={t.auth.email}
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
                <Input
                  label={t.auth.password}
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  hint={t.auth.passwordHint}
                  autoComplete="new-password"
                />

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-danger bg-danger/5 border border-danger/10 rounded-lg px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button onClick={handleRegister} loading={loading} className="w-full mt-3" size="lg">
                  {t.landing.beginStory}
                </Button>

                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => { setMode('landing'); setError(''); }}
                    className="text-sm text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => { setMode('login'); setError(''); }}
                    className="text-sm text-accent/80 hover:text-accent transition-colors cursor-pointer"
                  >
                    {t.auth.signIn} →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
