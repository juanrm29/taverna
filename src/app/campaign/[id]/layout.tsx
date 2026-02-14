import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campaign — Taverna',
  description: 'Manage your D&D campaign — characters, notes, NPCs, and live sessions.',
};

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
