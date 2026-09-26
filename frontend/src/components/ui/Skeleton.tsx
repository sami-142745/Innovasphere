import { cn } from '../../utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('shimmer-animate rounded-lg', className)} aria-hidden="true">
      <div className="absolute inset-0 -translate-x-full animate-shimmer" aria-hidden="true" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-panel p-5 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-shimmer" aria-hidden="true" />
      <div className="flex items-center gap-3 relative z-10">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}