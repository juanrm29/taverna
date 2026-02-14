import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dice Roller — Taverna',
  description: 'Roll dice for your D&D sessions — d4 through d100 with modifiers.',
};

export default function DiceLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
