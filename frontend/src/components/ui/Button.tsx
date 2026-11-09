import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'light';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

const BASE_CLASSES =
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:scale-[0.98] disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none dark:focus-visible:outline-brand-300';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'gradient-primary-readable text-white shadow-glow hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-10px_rgb(124_58_237/0.65)] active:translate-y-0 active:brightness-95',
  gradient:
    'gradient-animated text-white shadow-[0_10px_30px_-8px_rgb(124_58_237/0.55)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-10px_rgb(6_182_212/0.45)] active:translate-y-0 active:brightness-95',
  secondary:
    'bg-slate-900 text-white shadow-card hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 active:bg-slate-700 dark:bg-white/95 dark:text-slate-900 dark:hover:bg-white',
  outline:
    'border border-slate-300/80 bg-white/70 text-slate-700 shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-brand-400/40 dark:hover:bg-white/10 dark:hover:text-brand-200',
  ghost:
    'bg-transparent text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
  danger:
    'bg-status-rejected-600 text-white shadow-[0_8px_24px_-8px_rgb(244_63_94/0.55)] hover:-translate-y-0.5 hover:bg-status-rejected-700 active:translate-y-0 active:bg-status-rejected-800',
  light:
    'bg-white text-brand-700 shadow-card hover:-translate-y-0.5 hover:bg-brand-50 active:translate-y-0 active:bg-brand-100'
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
        BASE_CLASSES,
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

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { className, variant = 'primary', size = 'md', fullWidth = false, children, ...props },
  ref
) {
  return (
    <Link
      ref={ref}
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {children}
    </Link>
  );
});