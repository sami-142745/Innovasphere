import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, rows = 4, ...props },
  ref
) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={areaId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        ref={ref}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full rounded-xl border bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 backdrop-blur transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500',
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-slate-300 hover:border-slate-400 focus:border-brand-500 dark:border-white/10 dark:hover:border-white/20 dark:focus:border-brand-400',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
});