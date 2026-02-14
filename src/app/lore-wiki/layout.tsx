import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'World Lore Wiki — Taverna',
  description: 'Campaign world encyclopedia — NPCs, locations, factions, artifacts, and more.',
};

export default function LoreWikiLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
