import { Link } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Logo({ className, to = '/', compact = false }: { className?: string; to?: string; compact?: boolean }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2 font-extrabold', className)} aria-label="INNOVASPHERE home">
      <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-brand text-white shadow-glow-soft transition group-hover:scale-105">
        <span className="absolute inset-x-0 top-0 h-1/2 bg-white/25" aria-hidden="true" />
        <FlaskConical className="relative h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg tracking-[0.08em] uppercase gradient-text">
          INNOVASPHERE
        </span>
      )}
    </Link>
  );
}