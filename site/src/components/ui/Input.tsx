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
          className={`h-11 px-3.5 bg-[var(--surface)] border ${
            error ? 'border-[var(--danger)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          } rounded-[6px] text-sm text-[var(--text)] placeholder-[var(--muted)]/50 focus:outline-none focus:border-[var(--accent)] transition-colors duration-150 ${className}`}
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
