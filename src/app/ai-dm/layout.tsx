import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Dungeon Master — Taverna',
  description: 'AI-powered Dungeon Master assistant for your campaign.',
};

export default function AiDmLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
