import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-slate-200/80 bg-gradient-to-br from-white via-white to-brand-50/40 shadow-card dark:border-white/[0.08] dark:from-deep-800/90 dark:via-deep-800/80 dark:to-deep-750/70 dark:shadow-none',
        className
      )}
      {...props}
    />
  );
}

/** Frosted-glass panel — the signature premium surface. */
export function GlassCard({ className, interactive = false, ...props }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'glass-panel rounded-panel',
        interactive &&
          'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-soft dark:hover:border-white/20',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 border-b border-slate-100/80 p-5 dark:border-white/[0.06]', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-slate-900 dark:text-slate-50', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-500 dark:text-slate-400', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-2 border-t border-slate-100/80 p-4 dark:border-white/[0.06]', className)} {...props} />;
}

export function PageHeader({
  title,
  description,
  actions,
  className
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('page-header', className)}>
      <div>
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

/** Section heading used inside pages (title + optional description + actions). */
export function SectionHeading({
  title,
  description,
  actions,
  className
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="relative pl-3.5">
        <span className="absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-brand-500 via-accent-500 to-orchid-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl dark:text-slate-50">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}