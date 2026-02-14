import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'D&D Tutorial — Taverna',
  description: 'Learn how to play Dungeons & Dragons from scratch with interactive demos.',
};

export default function TutorialLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
