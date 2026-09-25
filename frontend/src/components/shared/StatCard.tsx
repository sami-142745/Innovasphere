import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'indigo' | 'accent';
  delay?: number;
}

const ACCENT_STYLES = {
  brand: {
    tile: 'bg-gradient-to-br from-brand-500 to-indigo-600 shadow-glow',
    text: 'text-brand-600 dark:text-brand-400'
  },
  accent: {
    tile: 'bg-gradient-to-br from-accent-500 to-brand-600 shadow-glow-cyan',
    text: 'text-accent-600 dark:text-accent-400'
  },
  success: {
    tile: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_10px_30px_-10px_rgb(16_185_129/0.55)]',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  warning: {
    tile: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_10px_30px_-10px_rgb(245_158_11/0.55)]',
    text: 'text-amber-600 dark:text-amber-400'
  },
  danger: {
    tile: 'bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_10px_30px_-10px_rgb(239_68_68/0.55)]',
    text: 'text-rose-600 dark:text-rose-400'
  },
  indigo: {
    tile: 'bg-gradient-to-br from-orchid-500 to-purple-700 shadow-[0_10px_30px_-10px_rgb(168_85_247/0.55)]',
    text: 'text-purple-600 dark:text-purple-400'
  }
} as const;

function AnimatedValue({ value }: { value: number | string }) {
  const [display, setDisplay] = useState(0);
  const numeric = typeof value === 'number';

  useEffect(() => {
    if (!numeric) return;
    const target = value as number;
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numeric, value]);

  return <span>{numeric ? display.toLocaleString() : String(value)}</span>;
}

export function StatCard({ label, value, icon: Icon, hint, accent = 'brand', delay = 0 }: StatCardProps) {
  const style = ACCENT_STYLES[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="glass-panel group relative overflow-hidden rounded-panel p-5"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-brand opacity-[0.07] blur-2xl transition-opacity group-hover:opacity-15" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className={cn('mt-1.5 text-[28px] font-bold leading-none tracking-tight', style.text)}>
            <AnimatedValue value={value} />
          </p>
          {hint && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3', style.tile)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </motion.div>
  );
}