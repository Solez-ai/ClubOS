import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const variantClasses = {
    default: 'bg-[var(--surface-2)] text-[var(--muted)]',
    accent: 'bg-[var(--accent)]/20 text-[var(--accent)]',
    secondary: 'bg-[var(--surface)] text-[var(--text)]',
    success: 'bg-green-500/20 text-green-500',
    warning: 'bg-yellow-500/20 text-yellow-500',
    danger: 'bg-red-500/20 text-red-500',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
