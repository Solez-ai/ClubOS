import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[var(--muted)] tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-12 px-4 bg-[var(--bg-elevated)] border ${
            error ? 'border-[var(--danger)] focus:ring-[var(--danger)]/20' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          } rounded-[var(--radius)] text-sm text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-colors duration-150 ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs text-[var(--danger)]">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-[var(--muted)]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
