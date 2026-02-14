'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <Compass className="w-16 h-16 text-accent/30 mx-auto mb-6" />
        <h1 className="text-5xl font-display font-bold text-accent mb-2">404</h1>
        <h2 className="text-lg font-display font-semibold text-text-primary mb-2">Page Not Found</h2>
        <p className="text-text-secondary text-sm mb-8">
          You&apos;ve wandered into uncharted territory. This page doesn&apos;t exist — perhaps the DM moved it?
        </p>
        <Link href="/dashboard">
          <Button>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
