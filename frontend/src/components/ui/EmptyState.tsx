import type { ReactNode } from 'react';
import { AlarmClock, type LucideIcon, PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  children?: ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon = PackageOpen, children }: EmptyStateProps) {
  return (
    <div className="glass relative flex flex-col items-center justify-center overflow-hidden rounded-panel px-6 py-14 text-center">
      <div className="blob blob-purple h-40 w-40 opacity-40" aria-hidden="true" />
      <div className="relative">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
          <Icon className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent-400 ring-alive" aria-hidden="true" />
      </div>
      <h3 className="relative mt-5 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && <p className="relative mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {children}
      {actionLabel && onAction && (
        <Button variant="gradient" className="relative mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingEmptyState() {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-panel px-6 py-14 text-center">
      <div className="rounded-full bg-slate-100 p-4 dark:bg-white/5">
        <AlarmClock className="h-8 w-8 animate-pulse text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
    </div>
  );
}