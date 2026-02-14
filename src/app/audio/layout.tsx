import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audio & SFX — Taverna',
  description: 'Ambient soundscapes, music, and sound effects for your D&D sessions.',
};

export default function AudioLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
