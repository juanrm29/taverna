'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

// ============================================================
// Toast System
// ============================================================
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-success shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-danger shrink-0" />,
  info: <Info className="w-4 h-4 text-info shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning shrink-0" />,
};

const BORDERS: Record<ToastType, string> = {
  success: 'border-success/30',
  error: 'border-danger/30',
  info: 'border-info/30',
  warning: 'border-warning/30',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-center gap-2.5 px-4 py-3 bg-surface-1/95 border ${BORDERS[toast.type]} rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-sm w-full backdrop-blur-xl`}
    >
      {ICONS[toast.type]}
      <span className="text-sm text-text-primary flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer shrink-0 p-0.5 rounded-md hover:bg-surface-2"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration = 3500) => {
    const id = `toast-${++counterRef.current}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const value: ToastContextValue = {
    toast: addToast,
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    info: (msg) => addToast('info', msg),
    warning: (msg) => addToast('warning', msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none" role="status" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ============================================================
// Confirm Dialog
// ============================================================
interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((v: boolean) => void) | null;
  }>({ open: false, options: { title: '' }, resolve: null });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    state.resolve?.(result);
    setState({ open: false, options: { title: '' }, resolve: null });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {state.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => handleClose(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="relative bg-surface-1 border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4"
            >
              <h3 className="text-base font-display font-semibold text-text-primary mb-1">{state.options.title}</h3>
              {state.options.description && (
                <p className="text-sm text-text-secondary mb-5">{state.options.description}</p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-sm text-text-secondary bg-surface-2 border border-border rounded-lg hover:bg-surface-3 transition-colors cursor-pointer"
                >
                  {state.options.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    state.options.variant === 'danger'
                      ? 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20'
                      : 'bg-accent text-surface-0 hover:brightness-110'
                  }`}
                >
                  {state.options.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

// ============================================================
// Combined Provider
// ============================================================
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </ToastProvider>
  );
}
