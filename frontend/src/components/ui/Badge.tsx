import type { HTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type BadgeTone =
  | 'default'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'indigo'
  | 'accent'
  | 'orchid'
  | 'info'
  | 'open'
  | 'in-progress'
  | 'completed'
  | 'rejected';

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
    'border-status-open-200 bg-status-open-50 text-status-open-700 dark:border-status-open-400/20 dark:bg-status-open-500/15 dark:text-status-open-300',
  warning:
    'border-status-in-progress-200 bg-status-in-progress-50 text-status-in-progress-700 dark:border-status-in-progress-400/20 dark:bg-status-in-progress-500/15 dark:text-status-in-progress-300',
  danger:
    'border-status-rejected-200 bg-status-rejected-50 text-status-rejected-700 dark:border-status-rejected-400/20 dark:bg-status-rejected-500/15 dark:text-status-rejected-300',
  indigo:
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/15 dark:text-indigo-300',
  accent:
    'border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-400/20 dark:bg-accent-500/15 dark:text-accent-300',
  orchid:
    'border-orchid-200 bg-orchid-50 text-orchid-800 dark:border-orchid-400/20 dark:bg-orchid-500/15 dark:text-orchid-200',
  info:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/15 dark:text-sky-300',
  open:
    'border-status-open-200 bg-status-open-50 text-status-open-700 dark:border-status-open-400/20 dark:bg-status-open-500/15 dark:text-status-open-300',
  'in-progress':
    'border-status-in-progress-200 bg-status-in-progress-50 text-status-in-progress-700 dark:border-status-in-progress-400/20 dark:bg-status-in-progress-500/15 dark:text-status-in-progress-300',
  completed:
    'border-status-completed-200 bg-status-completed-50 text-status-completed-700 dark:border-status-completed-400/20 dark:bg-status-completed-500/15 dark:text-status-completed-300',
  rejected:
    'border-status-rejected-200 bg-status-rejected-50 text-status-rejected-700 dark:border-status-rejected-400/20 dark:bg-status-rejected-500/15 dark:text-status-rejected-300'
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  default: 'bg-slate-400',
  brand: 'bg-brand-500',
  success: 'bg-status-open-500',
  warning: 'bg-status-in-progress-500',
  danger: 'bg-status-rejected-500',
  indigo: 'bg-indigo-500',
  accent: 'bg-accent-500',
  orchid: 'bg-orchid-500',
  info: 'bg-sky-500',
  open: 'bg-status-open-500',
  'in-progress': 'bg-status-in-progress-500',
  completed: 'bg-status-completed-500',
  rejected: 'bg-status-rejected-500'
};

export function Badge({ tone = 'default', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm backdrop-blur-sm',
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
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        'border border-slate-200 bg-slate-100/80 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200',
        rest.className
      )}
    >
      <button type="button" onClick={onDismiss} aria-label="Remove filter" className="focus-ring rounded-full hover:text-slate-900 dark:hover:text-white">
        <span className="sr-only">Remove</span>
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
      {children}
    </span>
  );
}