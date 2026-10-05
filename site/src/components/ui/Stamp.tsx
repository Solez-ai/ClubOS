'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { formatEventDate } from '@/lib/dates';

export interface StampProps {
  id: string;
  title: string;
  kind?: 'event' | 'fest';
  date?: string;
  earned?: boolean;
  animate?: boolean;
  className?: string;
}

export const Stamp: React.FC<StampProps> = ({
  id,
  title,
  kind = 'event',
  date,
  earned = true,
  animate = false,
  className = '',
}) => {
  // Stable random rotation between -6deg and +6deg based on stamp id hash
  const rotationDeg = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return ((Math.abs(hash) % 120) - 60) / 10;
  }, [id]);

  if (!earned) {
    return (
      <div
        className={`w-32 h-32 rounded-full border border-dashed border-[var(--border)] flex flex-col items-center justify-center p-3 text-center transition-colors ${className}`}
        style={{ transform: `rotate(${rotationDeg}deg)` }}
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] line-clamp-2">
          {title}
        </span>
        <span className="font-mono text-[9px] text-[var(--muted)]/50 mt-1">LOCKED</span>
      </div>
    );
  }

  const content = (
    <div
      className={`relative w-32 h-32 ${
        kind === 'fest' ? 'rounded-md w-36 h-28' : 'rounded-full'
      } border-2 border-[var(--accent)] border-double p-2 flex flex-col items-center justify-center text-center select-none ${className}`}
      style={{
        transform: `rotate(${rotationDeg}deg)`,
        boxShadow: 'inset 0 0 0 2px var(--accent)',
      }}
    >
      <div className="absolute inset-1 rounded-full border border-[var(--accent)]/40 pointer-events-none" />
      <span className="font-serif text-[11px] uppercase tracking-tight text-[var(--accent)] line-clamp-2 px-1 leading-tight font-medium">
        {title}
      </span>
      {date && (
        <span className="font-mono text-[9px] text-[var(--accent)]/80 mt-1 uppercase tracking-widest">
          {formatEventDate(date)}
        </span>
      )}
      <span className="font-mono text-[8px] text-[var(--accent)]/60 mt-0.5 tracking-wider">
        VERIFIED STAMP
      </span>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.85 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {content}
      </motion.div>
    );
  }

  return <div className="opacity-90 hover:opacity-100 transition-opacity">{content}</div>;
};
