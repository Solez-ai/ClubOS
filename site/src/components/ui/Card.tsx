import React, { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverEffect = true, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 transition-all duration-200 ${
          hoverEffect ? 'hover:border-[var(--accent)]/50 hover:shadow-sm' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
