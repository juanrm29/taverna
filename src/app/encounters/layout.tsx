import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Encounters — Taverna',
  description: 'Plan and manage combat encounters with CR calculator and monster builder.',
};

export default function EncountersLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
