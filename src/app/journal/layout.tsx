import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journal — Taverna',
  description: 'Session notes, handouts, and shared documents for your campaign.',
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
