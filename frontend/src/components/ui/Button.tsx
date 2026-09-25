import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_8px_24px_-8px_rgb(109_94_245/0.55)] hover:bg-brand-500 active:bg-brand-700 disabled:hover:bg-brand-600',
  gradient:
    'gradient-animated text-white shadow-[0_10px_30px_-8px_rgb(109_94_245/0.6)] hover:shadow-[0_14px_36px_-8px_rgb(0_209_255/0.55)] active:brightness-95 disabled:hover:shadow-[0_10px_30px_-8px_rgb(109_94_245/0.6)]',
  secondary:
    'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 dark:bg-white/95 dark:text-slate-900 dark:hover:bg-white',
  outline:
    'border border-slate-300/80 bg-white/70 text-slate-700 backdrop-blur hover:border-slate-400 hover:bg-white dark:border-white/12 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/25 dark:hover:bg-white/10',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white',
  danger:
    'bg-rose-600 text-white shadow-[0_8px_24px_-8px_rgb(239_68_68/0.55)] hover:bg-rose-500 active:bg-rose-700 disabled:hover:bg-rose-600'
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading = false, fullWidth = false, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});