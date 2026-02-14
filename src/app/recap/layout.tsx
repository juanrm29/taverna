import AppShell from '@/components/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Session Recap — Taverna',
  description: 'AI-generated session summaries and campaign history.',
};

export default function RecapLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
