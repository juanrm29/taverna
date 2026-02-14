import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quest Board — Taverna',
  description: 'Manage quests, story arcs, and player rumors in your campaign.',
};

export default function QuestBoardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
