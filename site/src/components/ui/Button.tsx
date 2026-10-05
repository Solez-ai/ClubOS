import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-[6px] transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

    const sizeStyles = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-7 text-base',
    };

    const variantStyles = {
      primary: 'bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 font-medium',
      secondary: 'bg-transparent border border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--surface-2)]',
      ghost: 'bg-transparent text-[var(--text)] hover:underline underline-offset-4',
      destructive: 'bg-transparent border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)]/10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
