import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  clearLabel?: string;
  inputClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, onClear, clearLabel = 'Clear', inputClassName, value, ...props },
  ref
) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        role="searchbox"
        value={value}
        className={cn(
          'h-10 w-full rounded-xl border border-slate-300 bg-white/80 pl-10 pr-10 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 backdrop-blur focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500',
          inputClassName
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
});