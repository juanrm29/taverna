import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Battle Map — Taverna',
  description: 'Interactive battle maps with tokens, grid, fog of war, and drawing tools.',
};

export default function BattleMapLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
