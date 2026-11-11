import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, className, id, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-10 w-full appearance-none rounded-xl border bg-white/85 px-3.5 pr-9 text-sm text-slate-900 shadow-sm backdrop-blur transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:bg-white/[0.04] dark:text-slate-100 dark:focus:ring-brand-300/30 dark:[&>option]:bg-deep-800',
            error
              ? 'border-status-rejected-400 focus:border-status-rejected-500 focus:ring-status-rejected-500/30'
              : 'border-slate-300 hover:border-brand-300 focus:border-brand-500 dark:border-white/10 dark:hover:border-brand-400/40 dark:focus:border-brand-400',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-deep-800">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-status-rejected-700 dark:text-status-rejected-300">
          {error}
        </p>
      )}
    </div>
  );
});