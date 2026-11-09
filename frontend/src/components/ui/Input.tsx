import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-10 w-full rounded-xl border bg-white/85 px-3.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 backdrop-blur transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-300/30',
          error
            ? 'border-status-rejected-400 focus:border-status-rejected-500 focus:ring-status-rejected-500/30'
            : 'border-slate-300 hover:border-brand-300 focus:border-brand-500 dark:border-white/10 dark:hover:border-brand-400/40 dark:focus:border-brand-400',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-status-rejected-700 dark:text-status-rejected-300">
          {error}
        </p>
      )}
    </div>
  );
});