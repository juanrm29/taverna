import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DM Screen — Taverna',
  description: 'Quick reference panels for rules, conditions, actions, and custom notes.',
};

export default function DMScreenLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
