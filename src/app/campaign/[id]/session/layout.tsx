'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    router.replace('/');
    return null;
  }

  // Full-width immersive layout — NO sidebar, NO max-width
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
