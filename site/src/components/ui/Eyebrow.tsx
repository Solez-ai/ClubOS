import React, { HTMLAttributes } from 'react';

export interface EyebrowProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Eyebrow: React.FC<EyebrowProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`font-mono text-[11px] sm:text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--muted)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
