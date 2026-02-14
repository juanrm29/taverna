import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campaign Timeline — Taverna',
  description: 'Visual timeline of campaign events, milestones, and story arcs.',
};

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
