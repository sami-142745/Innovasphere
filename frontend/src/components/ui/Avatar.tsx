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
    <img src={src} alt={name} className={cn('h-full w-full object-cover', className)} />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-full w-full select-none items-center justify-center bg-gradient-to-br from-brand-500 via-brand-600 to-accent-600 font-semibold text-white',
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
          ? 'ring-2 ring-white shadow-[0_0_0_1px_rgb(2_8_23/0.06)] dark:ring-deep-900/80'
          : '',
        SIZE_CLASSES[size]
      )}
    >
      {img}
    </span>
  );
}