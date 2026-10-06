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
    open: { colorClass: 'bg-[var(--success)]/15 border-[var(--success)] text-[var(--success-fg)]', defaultLabel: 'OPEN' },
    closing_soon: { colorClass: 'bg-[var(--warning)]/15 border-[var(--warning)] text-[var(--warning-fg)]', defaultLabel: 'CLOSING SOON' },
    full: { colorClass: 'bg-[var(--warning)]/15 border-[var(--warning)] text-[var(--warning-fg)]', defaultLabel: 'FULL' },
    closed: { colorClass: 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)]', defaultLabel: 'CLOSED' },
    confirmed: { colorClass: 'bg-[var(--success)]/15 border-[var(--success)] text-[var(--success-fg)]', defaultLabel: 'CONFIRMED' },
    pending: { colorClass: 'bg-[var(--warning)]/15 border-[var(--warning)] text-[var(--warning-fg)]', defaultLabel: 'PENDING' },
    waitlisted: { colorClass: 'bg-[var(--warning)]/15 border-[var(--warning)] text-[var(--warning-fg)]', defaultLabel: 'WAITLISTED' },
    cancelled: { colorClass: 'bg-[var(--danger)]/15 border-[var(--danger)] text-[var(--danger-fg)]', defaultLabel: 'CANCELLED' },
    rejected: { colorClass: 'bg-[var(--danger)]/15 border-[var(--danger)] text-[var(--danger-fg)]', defaultLabel: 'REJECTED' },
    checked_in: { colorClass: 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent-fg)]', defaultLabel: 'CHECKED IN' },
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
