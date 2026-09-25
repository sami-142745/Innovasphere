import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ChipOption {
  value: string;
  label: string;
}

export function FilterChips({
  options,
  active,
  onSelect,
  deselectValue = '',
  className
}: {
  options: ChipOption[];
  active: string;
  onSelect: (value: string) => void;
  deselectValue?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} role="group" aria-label="Filters">
      {options.map((opt) => {
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(isActive ? deselectValue : opt.value)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-all duration-200',
              isActive
                ? 'border-transparent bg-gradient-brand text-white shadow-glow-soft'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-brand-400/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-300'
            )}
          >
            {isActive && <X className="h-3 w-3" aria-hidden="true" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}