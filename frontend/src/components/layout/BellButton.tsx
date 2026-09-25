import { Bell, MessagesSquare } from 'lucide-react';
import { cn } from '../../utils/cn';

export function BellButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Notifications ${count > 0 ? `, ${count} unread` : ''}`}
      className="glass-chip relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:border-brand-300 hover:text-brand-600 dark:text-slate-300 dark:hover:border-brand-400/40 dark:hover:text-brand-300"
    >
      {count > 0 ? <Bell className="h-4 w-4" aria-hidden="true" /> : <MessagesSquare className="h-4 w-4" aria-hidden="true" />}
      {count > 0 && (
        <>
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" aria-hidden="true" />
          <span
            className={cn(
              'absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-brand px-1 text-[10px] font-bold text-white shadow-glow-soft'
            )}
            aria-hidden="true"
          >
            {count > 99 ? '99+' : count}
          </span>
        </>
      )}
    </button>
  );
}