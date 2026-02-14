import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Characters — Taverna',
  description: 'View and manage all your D&D characters across campaigns.',
};

export default function CharactersLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
