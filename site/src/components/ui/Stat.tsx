import React from 'react';

export interface StatProps {
  value: string | number;
  label: string;
  delta?: string;
  mono?: boolean;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  value,
  label,
  delta,
  mono = true,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div
        className={`text-4xl sm:text-5xl font-light tracking-tight text-[var(--text)] tabular-nums ${
          mono ? 'font-mono' : 'font-serif'
        }`}
      >
        {value}
      </div>
      <div className="font-mono text-xs text-[var(--muted)] uppercase tracking-widest">
        {label}
      </div>
      {delta && <div className="text-xs text-[var(--accent)] font-mono">{delta}</div>}
    </div>
  );
};
