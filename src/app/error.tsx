'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <AlertTriangle className="w-16 h-16 text-danger/40 mx-auto mb-6" />
        <h1 className="text-2xl font-display font-bold text-text-primary mb-2">Something Went Wrong</h1>
        <p className="text-text-secondary text-sm mb-2">
          A wild error appeared! The party failed their saving throw.
        </p>
        {error.message && (
          <p className="text-xs text-text-tertiary font-mono bg-surface-1 border border-border rounded-md px-3 py-2 mb-6">
            {error.message}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="w-4 h-4" /> Try Again
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
