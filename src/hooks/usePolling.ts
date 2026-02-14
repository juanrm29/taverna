'use client';

import { useEffect, useRef, useCallback } from 'react';

// ============================================================
// usePolling — Lightweight polling hook for real-time sync
// Polls an async function at a given interval, with auto-pause
// when the tab is hidden and smart deduplication.
// ============================================================

interface UsePollingOptions {
  /** Polling interval in milliseconds (default: 3000) */
  interval?: number;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
  /** Pause when tab is not visible (default: true) */
  pauseOnHidden?: boolean;
}

export function usePolling(
  fn: () => Promise<void> | void,
  options: UsePollingOptions = {},
) {
  const { interval = 3000, enabled = true, pauseOnHidden = true } = options;
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunning = useRef(false);

  // Keep fn ref up to date without restarting interval
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const poll = useCallback(async () => {
    if (isRunning.current) return; // prevent overlapping
    isRunning.current = true;
    try {
      await fnRef.current();
    } catch (err) {
      console.error('[usePolling] error:', err);
    } finally {
      isRunning.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Start polling
    timerRef.current = setInterval(poll, interval);

    // Visibility handler — pause when hidden
    const onVisibility = () => {
      if (!pauseOnHidden) return;
      if (document.hidden) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // Resume — poll immediately then restart interval
        poll();
        timerRef.current = setInterval(poll, interval);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, interval, poll, pauseOnHidden]);
}
