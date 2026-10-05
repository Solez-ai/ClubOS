import React from 'react';
import { RegStatus } from '@/lib/types';

export type PillStatus = RegStatus | 'open' | 'closing_soon' | 'full' | 'closed';

export interface StatusPillProps {
  status: PillStatus;
  label?: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, className = '' }) => {
  const statusMap: Record<PillStatus, { colorClass: string; defaultLabel: string }> = {
    open: { colorClass: 'border-[var(--success)] text-[var(--success)]', defaultLabel: 'OPEN' },
    closing_soon: { colorClass: 'border-[var(--warning)] text-[var(--warning)]', defaultLabel: 'CLOSING SOON' },
    full: { colorClass: 'border-[var(--warning)] text-[var(--warning)]', defaultLabel: 'FULL' },
    closed: { colorClass: 'border-[var(--muted)] text-[var(--muted)]', defaultLabel: 'CLOSED' },
    confirmed: { colorClass: 'border-[var(--success)] text-[var(--success)]', defaultLabel: 'CONFIRMED' },
    pending: { colorClass: 'border-[var(--warning)] text-[var(--warning)]', defaultLabel: 'PENDING' },
    waitlisted: { colorClass: 'border-[var(--warning)] text-[var(--warning)]', defaultLabel: 'WAITLISTED' },
    cancelled: { colorClass: 'border-[var(--danger)] text-[var(--danger)]', defaultLabel: 'CANCELLED' },
    rejected: { colorClass: 'border-[var(--danger)] text-[var(--danger)]', defaultLabel: 'REJECTED' },
    checked_in: { colorClass: 'border-[var(--accent)] text-[var(--accent)]', defaultLabel: 'CHECKED IN' },
  };

  const config = statusMap[status] || { colorClass: 'border-[var(--muted)] text-[var(--muted)]', defaultLabel: String(status).toUpperCase() };
  const displayText = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 border rounded-[4px] font-mono text-[11px] uppercase tracking-[0.08em] bg-transparent select-none whitespace-nowrap ${config.colorClass} ${className}`}
    >
      {displayText}
    </span>
  );
};
