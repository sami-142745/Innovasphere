import { useId } from 'react';
import { cn } from '../../utils/cn';

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-brand-600 dark:text-brand-400';
  if (score >= 25) return 'text-amber-600 dark:text-amber-400';
  return 'text-slate-500 dark:text-slate-400';
}

export function MatchScore({ score, size = 44 }: { score: number; size?: number }) {
  const gradientId = useId().replace(/:/g, '');
  const radius = (size - size * 0.14) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Match score ${clamped} out of 100`}
      title={`Match score ${clamped}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={`ms-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6D5EF5" />
            <stop offset="55%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#00D1FF" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={size * 0.11} className="stroke-slate-200/80 dark:stroke-white/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={size * 0.11}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={`url(#ms-${gradientId})`}
          className="drop-shadow-[0_0_6px_rgb(109_94_245/0.45)] transition-all duration-500"
        />
      </svg>
      <span className={cn('absolute font-bold', size <= 40 ? 'text-[10px]' : 'text-xs', scoreColor(clamped))}>{clamped}</span>
    </div>
  );
}