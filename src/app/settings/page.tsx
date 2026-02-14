'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, LogOut, Shield, Download, Upload, Globe } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useSession, signOut } from 'next-auth/react';
import { useToast } from '@/components/Feedback';
import * as api from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

export default function SettingsPage() {
  const router = useRouter();
  const { data: authSession } = useSession();
  const user = authSession?.user ? { id: (authSession.user as any).id || authSession.user.email || '', displayName: authSession.user.name || 'Unknown', createdAt: '' } : null;
  const toast = useToast();
  const { t, locale, setLocale } = useTranslation();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      if (authSession?.user?.email) setEmail(authSession.user.email);
    }
  }, [user, authSession]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error(t.settings.emptyName);
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({ displayName: displayName.trim() });
      toast.success(t.settings.profileSaved);
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error(t.auth.fillAllFields);
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t.auth.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t.settings.passwordMismatch);
      return;
    }
    setSaving(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t.settings.passwordChanged);
    } catch (err: any) {
      toast.error(err?.message || t.settings.passwordIncorrect);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display font-bold mb-1">{t.settings.title}</h1>
      <p className="text-text-secondary text-sm mb-8">{t.settings.subtitle}</p>

      <div className="space-y-6">
        {/* Profile Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-accent" /> {t.settings.profile}
            </h2>
            <div className="space-y-4">
              <Input
                label={t.settings.displayName}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={t.settings.displayNamePlaceholder}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary tracking-wide uppercase">{t.settings.emailLabel}</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-border rounded-md text-sm text-text-tertiary">
                  <Mail className="w-4 h-4" />
                  {email}
                </div>
                <span className="text-[10px] text-text-tertiary">{t.settings.emailCantChange}</span>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-3.5 h-3.5" /> {saving ? t.common.loading : t.settings.saveProfile}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Password Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-accent" /> {t.settings.changePassword}
            </h2>
            <div className="space-y-4">
              <Input
                label={t.settings.currentPassword}
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Input
                label={t.settings.newPassword}
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={t.auth.passwordHint}
              />
              <Input
                label={t.settings.confirmPassword}
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              <div className="flex justify-end">
                <Button size="sm" variant="secondary" onClick={handleChangePassword} disabled={saving}>
                  <Lock className="w-3.5 h-3.5" /> {t.settings.changePassword}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Data Export / Import */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Download className="w-4 h-4 text-accent" /> {t.settings.data}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t.settings.exportData}</p>
                  <p className="text-xs text-text-tertiary">{t.settings.exportDataDesc}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => {
                  const data: Record<string, string | null> = {};
                  const keys = [
                    'taverna_user', 'taverna_users', 'taverna_campaigns', 'taverna_characters',
                    'taverna_npcs', 'taverna_notes', 'taverna_messages', 'taverna_sessions',
                    'taverna_scenes', 'taverna_journals', 'taverna_macros', 'taverna_rollable_tables',
                    'taverna_audio_tracks', 'taverna_timeline', 'taverna_achievements',
                    'taverna_relationships', 'taverna_encounters', 'taverna_scheduled_sessions',
                    'taverna_onboarding',
                  ];
                  keys.forEach(k => { data[k] = localStorage.getItem(k); });
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `taverna-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click(); URL.revokeObjectURL(url);
                  toast.success(t.settings.dataExported);
                }}>
                  <Download className="w-3.5 h-3.5" /> {t.common.export}
                </Button>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t.settings.importData}</p>
                  <p className="text-xs text-text-tertiary">{t.settings.importDataDesc}</p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          const data = JSON.parse(ev.target?.result as string);
                          Object.entries(data).forEach(([k, v]) => {
                            if (v !== null && typeof v === 'string') localStorage.setItem(k, v);
                          });
                          toast.success(t.settings.dataImported);
                          setTimeout(() => window.location.reload(), 500);
                        } catch {
                          toast.error(t.settings.failedImport);
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                  />
                  <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-3.5 h-3.5" /> {t.common.import}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Account Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-accent" /> {t.settings.account}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t.settings.accountCreated}</p>
                  <p className="text-xs text-text-tertiary">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-danger hover:text-danger">
                  <LogOut className="w-3.5 h-3.5" /> {t.auth.logout}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Language Switcher */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-accent" /> {t.settings.language}
            </h2>
            <p className="text-xs text-text-tertiary mb-4">{t.settings.languageDesc}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLocale('id')}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  locale === 'id'
                    ? 'border-accent bg-accent/10 shadow-[0_0_20px_var(--color-accent-glow)]'
                    : 'border-border bg-surface-2 hover:border-text-muted'
                }`}
              >
                <span className="text-2xl">🇮🇩</span>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${locale === 'id' ? 'text-accent' : 'text-text-primary'}`}>{t.settings.indonesian}</p>
                  <p className="text-[10px] text-text-tertiary">Default</p>
                </div>
                {locale === 'id' && <div className="ml-auto w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent-glow)]" />}
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  locale === 'en'
                    ? 'border-accent bg-accent/10 shadow-[0_0_20px_var(--color-accent-glow)]'
                    : 'border-border bg-surface-2 hover:border-text-muted'
                }`}
              >
                <span className="text-2xl">🇺🇸</span>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${locale === 'en' ? 'text-accent' : 'text-text-primary'}`}>{t.settings.english}</p>
                  <p className="text-[10px] text-text-tertiary">English</p>
                </div>
                {locale === 'en' && <div className="ml-auto w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent-glow)]" />}
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
