import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onChange: (page: number) => void;
}

function getPageWindow(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set<number>([0, total - 1, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const result: number[] = [];
  let previous = -99;
  for (const p of sorted) {
    if (p - previous > 1) result.push(-1);
    result.push(p);
    previous = p;
  }
  return result;
}

export function Pagination({ page, totalPages, totalElements, pageSize, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = totalElements === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalElements);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{start}–{end}</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{totalElements}</span>
      </p>
      <div className="glass-chip flex items-center gap-1 rounded-xl p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          aria-label="Previous page"
          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-brand-400/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-200"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        {getPageWindow(page, totalPages).map((p, idx) =>
          p === -1 ? (
            <span key={`gap-${idx}`} className="px-1 text-slate-400" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'focus-ring inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition',
                p === page
                  ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-glow-soft'
                  : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-brand-200'
              )}
            >
              {p + 1}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          aria-label="Next page"
          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-brand-400/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-200"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}