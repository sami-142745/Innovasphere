import { cn } from '../../utils/cn';

export function Spinner({ className, label = 'Loading…' }: { className?: string; label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex items-center justify-center py-12', className)}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600 dark:border-brand-900 dark:border-t-brand-400"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}