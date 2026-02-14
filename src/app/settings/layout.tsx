import React from 'react';
import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings — Taverna',
  description: 'Manage your account settings, profile, and data.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
