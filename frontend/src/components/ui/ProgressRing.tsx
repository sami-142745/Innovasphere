import { useId } from 'react';
import { cn } from '../../utils/cn';

export interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  gradient?: boolean;
  className?: string;
  trackClassName?: string;
}

/** SVG progress ring with optional gradient stroke. Clamps value to 0–100. */
export function ProgressRing({
  value,
  size = 44,
  strokeWidth = 5,
  label,
  gradient = false,
  className,
  trackClassName
}: ProgressRingProps) {
  const gradientId = useId().replace(/:/g, '');
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const textColor = clamped >= 80 ? 'text-emerald-500' : clamped >= 50 ? 'text-brand-500' : clamped >= 25 ? 'text-amber-500' : 'text-slate-400';

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `Progress ${clamped} out of 100`}
      title={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {gradient && (
          <defs>
            <linearGradient id={`pg-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6D5EF5" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#00D1FF" />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('stroke-slate-200 dark:stroke-white/10', trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={gradient ? `url(#pg-${gradientId})` : undefined}
          className={cn('transition-all duration-700 ease-out', !gradient && textColor)}
          style={gradient ? { strokeDasharray: circumference, strokeDashoffset: offset } : undefined}
        />
      </svg>
      <span className={cn('absolute text-xs font-bold', gradient ? 'text-slate-800 dark:text-white' : textColor)}>{clamped}</span>
    </div>
  );
}