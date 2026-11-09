import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string | null;
  className?: string;
  ring?: boolean;
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl'
};

export function Avatar({ name, size = 'md', src, className, ring = true }: AvatarProps) {
  const img = src ? (
    <img
      src={src}
      alt={name}
      className={cn('h-full w-full object-cover', className)}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-full w-full select-none items-center justify-center bg-gradient-to-br from-brand-600 via-brand-500 to-accent-700 font-bold text-white',
        className
      )}
    >
      {initials(name)}
    </span>
  );

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        ring
          ? 'shadow-glow-soft ring-2 ring-white/95 dark:ring-deep-900/80'
          : '',
        SIZE_CLASSES[size]
      )}
    >
      {img}
    </span>
  );
}