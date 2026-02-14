import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compendium — Taverna',
  description: 'Browse D&D 5e spells, monsters, equipment, classes, races, and rules.',
};

export default function CompendiumLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
