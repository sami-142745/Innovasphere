import type { HTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type BadgeTone = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'indigo' | 'accent' | 'orchid' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  default:
    'border border-slate-200 bg-slate-100/80 text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300',
  brand:
    'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-400/20 dark:bg-brand-500/15 dark:text-brand-200',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-300',
  danger:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/15 dark:text-rose-300',
  indigo:
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/15 dark:text-indigo-300',
  accent:
    'border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-400/20 dark:bg-accent-500/15 dark:text-accent-300',
  orchid:
    'border-orchid/20 bg-orchid/10 text-purple-700 dark:text-purple-300 dark:bg-purple-500/15',
  info:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/15 dark:text-sky-300'
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  default: 'bg-slate-400',
  brand: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  indigo: 'bg-indigo-500',
  accent: 'bg-accent-500',
  orchid: 'bg-purple-500',
  info: 'bg-sky-500'
};

export function Badge({ tone = 'default', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASSES[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function DismissibleBadge({ onDismiss, children, ...rest }: BadgeProps & { onDismiss: () => void }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'border border-slate-200 bg-slate-100/80 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200',
        rest.className
      )}
    >
      <button type="button" onClick={onDismiss} aria-label="Remove filter" className="hover:text-slate-900 dark:hover:text-white">
        <span className="sr-only">Remove</span>
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
      {children}
    </span>
  );
}