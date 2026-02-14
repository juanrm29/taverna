import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Combat Autopilot — Taverna',
  description: 'Auto-resolve combat actions, simulate encounters, and replay past battles.',
};

export default function CombatAutopilotLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
