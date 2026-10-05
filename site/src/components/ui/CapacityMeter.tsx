import React from 'react';

export interface CapacityMeterProps {
  current: number;
  capacity?: number | null;
  className?: string;
  variant?: 'bar' | 'ring';
}

export const CapacityMeter: React.FC<CapacityMeterProps> = ({
  current,
  capacity,
  className = '',
  variant = 'bar',
}) => {
  if (capacity == null || capacity === 0) {
    return (
      <div className={`font-mono text-xs text-[var(--muted)] ${className}`}>
        {current} registered · Unlimited spots
      </div>
    );
  }

  const spotsLeft = Math.max(0, capacity - current);
  const percentage = Math.min(100, Math.max(0, (current / capacity) * 100));
  const isHighCapacity = percentage >= 85;

  const barColorClass = isHighCapacity ? 'bg-[var(--warning)]' : 'bg-[var(--accent)]';

  if (variant === 'ring') {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={`flex flex-col items-center justify-center gap-1 ${className}`}>
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-[var(--surface-2)] fill-none stroke-[1.5]"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`fill-none stroke-[1.5] transition-all duration-500 ${
                isHighCapacity ? 'stroke-[var(--warning)]' : 'stroke-[var(--accent)]'
              }`}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-lg font-medium text-[var(--text)]">{current}</span>
            <span className="font-mono text-[10px] text-[var(--muted)]">/ {capacity}</span>
          </div>
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">
          {spotsLeft === 0 ? '0 spots left' : `${spotsLeft} left`}
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      <div className="w-full h-[2px] bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div
          className={`h-full ${barColorClass} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between font-mono text-xs text-[var(--muted)]">
        <span>
          {current} / {capacity}
        </span>
        <span>{spotsLeft === 0 ? 'Full' : `${spotsLeft} left`}</span>
      </div>
    </div>
  );
};
