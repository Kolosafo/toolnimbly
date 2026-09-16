import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-contrast hover:bg-brand-hover disabled:hover:bg-brand shadow-xs',
  secondary:
    'bg-surface text-foreground border border-border-strong hover:bg-surface-sunken disabled:hover:bg-surface',
  ghost: 'bg-transparent text-foreground hover:bg-surface-sunken disabled:hover:bg-transparent',
  danger: 'bg-danger text-white hover:opacity-90 disabled:hover:opacity-100 shadow-xs',
};

const sizeClasses: Record<ButtonSize, string> = {
  // Every size keeps the 44px minimum touch target (spec §5.4).
  sm: 'min-h-11 px-3 text-sm gap-1.5',
  md: 'min-h-11 px-4 text-sm gap-2',
  lg: 'min-h-12 px-5 text-base gap-2',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a busy state and disables the control. */
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-55',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
