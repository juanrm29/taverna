'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import CommandPalette from '@/components/CommandPalette';
import DiceOverlay from '@/components/DiceOverlay';
import OnboardingTour from '@/components/OnboardingTour';
import { useAppStore } from '@/lib/zustand';
import { Swords } from 'lucide-react';

export default function AppShell({ children, fullscreen = false }: { children: React.ReactNode; fullscreen?: boolean }) {
  const { sidebarOpen } = useAppStore();
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 bg-surface-0" />
        {/* Subtle ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/[0.02] rounded-full blur-[100px] pointer-events-none" />
        <div className="relative flex flex-col items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-accent/20 to-accent/5 border border-accent/15 flex items-center justify-center shadow-[0_0_30px_var(--color-accent-glow)] breathe">
            <Swords className="w-6 h-6 text-accent" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-xs text-text-muted tracking-widest uppercase">Loading</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    router.replace('/');
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={`flex-1 transition-all duration-200 pt-12 md:pt-0 ${
          sidebarOpen ? 'md:ml-56' : 'md:ml-16'
        }`}
      >
        {fullscreen ? children : (
          <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        )}
      </main>
      {/* Global overlays available on every page */}
      <CommandPalette />
      {!fullscreen && <DiceOverlay />}
      <OnboardingTour />
    </div>
  );
}
