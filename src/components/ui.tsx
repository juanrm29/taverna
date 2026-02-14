'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---- Button ----
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, icon, className = '', children, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-[10px] active:scale-[0.97] relative overflow-hidden select-none';

  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-b from-accent to-accent-dim text-surface-0 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_0_20px_var(--color-accent-glow),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_0_30px_var(--color-accent-glow),inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110',
    secondary: 'bg-surface-2 text-text-primary border border-border hover:border-text-tertiary hover:bg-surface-3 shadow-[0_1px_2px_rgba(0,0,0,0.2)]',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2/80',
    danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 hover:border-danger/30',
  };

  const sizes: Record<string, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm px-6 py-2.5 gap-2.5',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

// ---- IconButton ----
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  tooltip?: string;
  children: React.ReactNode;
}

export function IconButton({ variant = 'ghost', size = 'md', tooltip, className = '', children, ...props }: IconButtonProps) {
  const variants: Record<string, string> = {
    ghost: 'text-text-tertiary hover:text-text-primary hover:bg-surface-2/80',
    secondary: 'text-text-secondary bg-surface-2 border border-border hover:bg-surface-3 hover:border-text-tertiary',
    danger: 'text-text-tertiary hover:text-danger hover:bg-danger/10',
  };

  const sizes: Record<string, string> = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${variants[variant]} ${sizes[size]} ${className}`}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
}

// ---- Input ----
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, hint, icon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium text-text-secondary tracking-wide uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`w-full ${icon ? 'pl-10' : ''} ${error ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(224,85,85,0.15)]' : ''} ${className}`}
          {...props}
        />
      </div>
      {hint && !error && <span className="text-[10px] text-text-tertiary">{hint}</span>}
      {error && <span className="text-xs text-danger flex items-center gap-1">⚠ {error}</span>}
    </div>
  );
}

// ---- Textarea ----
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({ label, hint, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium text-text-secondary tracking-wide uppercase">
          {label}
        </label>
      )}
      <textarea className={`w-full resize-none ${className}`} rows={3} {...props} />
      {hint && <span className="text-[10px] text-text-tertiary">{hint}</span>}
    </div>
  );
}

// ---- Select ----
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium text-text-secondary tracking-wide uppercase">
          {label}
        </label>
      )}
      <select className={`w-full ${className}`} {...props}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ---- Card ----
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className = '', onClick, hover = false, glow = false }: CardProps) {
  return (
    <div
      className={`bg-surface-1 border border-border rounded-xl p-5 relative ${
        hover ? 'card-hover hover:border-text-tertiary/30 cursor-pointer' : ''
      } ${glow ? 'glow-accent-sm' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Top edge shine */}
      <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-border/60 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

// ---- Badge ----
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'danger' | 'warning';
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'default', dot, className }: BadgeProps) {
  const colors: Record<string, string> = {
    default: 'bg-surface-3/80 text-text-secondary border border-border/50',
    accent: 'bg-accent/10 text-accent border border-accent/15',
    success: 'bg-success/10 text-success border border-success/15',
    danger: 'bg-danger/10 text-danger border border-danger/15',
    warning: 'bg-warning/10 text-warning border border-warning/15',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${colors[variant]} ${className || ''}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-success pulse-dot' : variant === 'danger' ? 'bg-danger' : variant === 'accent' ? 'bg-accent' : variant === 'warning' ? 'bg-warning' : 'bg-text-tertiary'}`} />}
      {children}
    </span>
  );
}

// ---- Tooltip ----
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, side = 'top' }: TooltipProps) {
  const positions: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group inline-flex">
      {children}
      <span className={`absolute ${positions[side]} px-2.5 py-1.5 text-xs bg-surface-3 text-text-primary border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-[0_4px_20px_rgba(0,0,0,0.4)] scale-95 group-hover:scale-100`}>
        {content}
      </span>
    </div>
  );
}

// ---- Modal ----
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`relative bg-surface-1 border border-border rounded-2xl p-6 w-full ${sizeClasses[size]} max-h-[85vh] overflow-y-auto mx-4 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.6),0_0_40px_rgba(201,169,110,0.04)]`}
      >
        {/* Modal top shine */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-accent/15 to-transparent pointer-events-none" />
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-display font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-2 cursor-pointer text-lg leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}

// ---- Tabs ----
interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-surface-2/50 rounded-xl border border-border/50 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex items-center gap-2 px-3.5 py-1.5 text-sm rounded-lg transition-all duration-200 cursor-pointer ${
            active === tab.id
              ? 'text-accent bg-surface-1 shadow-[0_1px_4px_rgba(0,0,0,0.3),0_0_12px_var(--color-accent-glow)]'
              : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2/60'
          }`}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          <span className="font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---- Progress ----
interface ProgressProps {
  value: number; // 0–100
  variant?: 'accent' | 'success' | 'danger' | 'info';
  size?: 'sm' | 'md';
  label?: string;
}

export function Progress({ value, variant = 'accent', size = 'sm', label }: ProgressProps) {
  const colors: Record<string, string> = {
    accent: 'bg-accent',
    success: 'bg-success',
    danger: 'bg-danger',
    info: 'bg-info',
  };

  const heights: Record<string, string> = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-tertiary tabular-nums">{Math.round(value)}%</span>
        </div>
      )}
      <div className={`w-full bg-surface-3 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${colors[variant]} ${heights[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

// ---- Stat Block (for ability scores) ----
interface StatBlockProps {
  label: string;
  score: number;
  modifier: number;
  proficient?: boolean;
}

export function StatBlock({ label, score, modifier, proficient }: StatBlockProps) {
  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
  return (
    <div className="flex flex-col items-center gap-1 bg-surface-2 border border-border rounded-xl p-3 min-w-[72px] relative overflow-hidden group hover:border-accent/20 transition-colors">
      <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      <span className="text-[10px] font-semibold text-text-tertiary tracking-widest uppercase">{label.slice(0, 3)}</span>
      <span className="text-2xl font-bold text-accent tabular-nums">{modStr}</span>
      <span className="text-xs text-text-secondary tabular-nums flex items-center gap-1">
        {score}
        {proficient && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
      </span>
      {proficient && <div className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-bl-md" />}
    </div>
  );
}

// ---- Empty State ----
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {icon && (
        <div className="text-text-tertiary mb-5 opacity-30 p-4 bg-surface-2/50 rounded-2xl border border-border/30">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-text-secondary mb-1.5">{title}</h3>
      {description && <p className="text-sm text-text-tertiary max-w-sm mb-5 leading-relaxed">{description}</p>}
      {action}
    </div>
  );
}

// ---- Section Header ----
interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export function SectionHeader({ icon, title, description, action, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-3">
          {icon && <span className="text-accent">{icon}</span>}
          {title}
          {badge && <span className="ml-1">{badge}</span>}
        </h1>
        {description && <p className="text-text-secondary text-sm mt-1.5 max-w-lg">{description}</p>}
      </div>
      {action && <div className="flex gap-2 shrink-0">{action}</div>}
    </div>
  );
}

// ---- Divider ----
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="border-t border-border my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
      <span className="text-[10px] font-semibold text-text-tertiary tracking-widest uppercase">{label}</span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}

// ---- Kbd (keyboard shortcut) ----
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary bg-surface-2 border border-border rounded-md shadow-[0_1px_0_var(--color-surface-4)]">
      {children}
    </kbd>
  );
}

// ---- Skeleton ----
interface SkeletonProps {
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'custom';
  className?: string;
  width?: string;
  height?: string;
  count?: number;
}

export function Skeleton({ variant = 'text', className = '', width, height, count = 1 }: SkeletonProps) {
  const variantClasses: Record<string, string> = {
    text: 'skeleton skeleton-text w-full',
    title: 'skeleton skeleton-title',
    avatar: 'skeleton skeleton-avatar w-10 h-10',
    card: 'skeleton skeleton-card w-full',
    custom: 'skeleton',
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  ));

  return count > 1 ? <div className="flex flex-col gap-2">{items}</div> : items[0];
}

// ---- Avatar ----
interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const sizes: Record<string, string> = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-b from-accent/20 to-accent/5 text-accent font-bold flex items-center justify-center shrink-0 border border-accent/15 ${className}`}>
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );
}
