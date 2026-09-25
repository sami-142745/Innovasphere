import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface HeroBannerProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  accent?: 'brand' | 'faculty' | 'admin';
  className?: string;
  children?: ReactNode;
}

/** Signature frosted-glass hero used on dashboards. */
export function HeroBanner({ eyebrow, title, description, actions, accent = 'brand', className, children }: HeroBannerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'glass-panel relative overflow-hidden rounded-panel px-6 py-8 sm:px-8 sm:py-10',
        className
      )}
    >
      {/* Decorative aurora */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="blob blob-purple -left-16 -top-24 h-72 w-72 animate-float-slow" />
        <div className={cn('blob -right-12 -top-16 h-60 w-60 animate-float',
          accent === 'faculty' ? 'blob-blue' : accent === 'admin' ? 'blob-orchid' : 'blob-cyan')} />
        <div className="absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_20%,black,transparent)]" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/70 bg-brand-50/70 px-3 py-1 text-xs font-medium text-brand-700 backdrop-blur dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {eyebrow}
            </span>
          )}
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-[32px] dark:text-slate-50">{title}</h1>
          {description && (
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
          )}
          {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </motion.section>
  );
}