'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Profile } from '@/lib/types';
import { calculateLevel } from '@/lib/xp';

export interface PassportCardProps {
  profile: Partial<Profile>;
  className?: string;
  allowFlip?: boolean;
}

export const PassportCard: React.FC<PassportCardProps> = ({
  profile,
  className = '',
  allowFlip = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const levelInfo = calculateLevel(profile.xp || 0);

  const fullName = profile.full_name || 'Participant Name';
  const handle = profile.handle || 'handle';
  const passportNo = profile.passport_no || 'CL-2026-000000';
  const institution = profile.institution || 'Dhaka Residential Model College';
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '2026';

  const handleCardClick = () => {
    if (allowFlip) setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={`relative w-full aspect-[3/2] max-w-md cursor-pointer perspective-1000 ${className}`}
      onClick={handleCardClick}
    >
      <motion.div
        className="w-full h-full relative transform-style-preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* FRONT SIDE */}
        <div className="absolute inset-0 w-full h-full bg-[#0D0C0A] border border-[var(--border-strong)] rounded-[10px] p-6 flex flex-col justify-between overflow-hidden backface-hidden shadow-xl select-none group">
          {/* Guilloche Radial Background Pattern */}
          <div className="absolute inset-0 guilloche-bg opacity-40 pointer-events-none" />

          {/* Brass Foil Inset Frame */}
          <div className="absolute inset-2.5 border border-[var(--accent)]/30 rounded-[6px] pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-serif text-xs font-semibold tracking-[0.25em] text-[var(--accent)] uppercase">
                PASSPORT
              </span>
              <span className="font-mono text-[10px] text-[var(--muted)] tracking-wider mt-0.5">
                CLUBOS ECOSYSTEM
              </span>
            </div>
            <div className="font-mono text-xs text-[var(--accent)] border border-[var(--accent)]/40 px-2 py-0.5 rounded uppercase tracking-wider">
              {levelInfo.romanLevel} · {levelInfo.title}
            </div>
          </div>

          {/* Member Name */}
          <div className="relative z-10 flex flex-col my-auto py-2">
            <h3 className="font-serif text-2xl sm:text-3xl text-[var(--text)] tracking-tight font-normal line-clamp-1">
              {fullName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-[var(--accent)]">@{handle}</span>
              <span className="text-[var(--border-strong)]">·</span>
              <span className="font-sans text-xs text-[var(--muted)] line-clamp-1">
                {institution}
              </span>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="relative z-10 flex items-end justify-between border-t border-[var(--border)] pt-3">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">
                PASSPORT NO.
              </span>
              <span className="font-mono text-xs text-[var(--text)] tracking-wider">
                {passportNo}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">
                TOTAL XP
              </span>
              <span className="font-mono text-xs text-[var(--accent)] font-medium">
                {profile.xp || 0} XP
              </span>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="absolute inset-0 w-full h-full bg-[#0D0C0A] border border-[var(--border-strong)] rounded-[10px] p-6 flex flex-col justify-between items-center text-center overflow-hidden backface-hidden rotate-y-180 shadow-xl select-none"
        >
          <div className="absolute inset-2.5 border border-[var(--accent)]/30 rounded-[6px] pointer-events-none" />

          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)] relative z-10 mt-1">
            PERSONAL PASSPORT QR
          </span>

          <div className="relative z-10 p-3 bg-white rounded-md shadow-md my-auto">
            <QRCodeSVG value={`https://clubos.dev/u/${handle}`} size={120} level="M" />
          </div>

          <div className="relative z-10 flex flex-col items-center border-t border-[var(--border)] w-full pt-3">
            <span className="font-mono text-xs text-[var(--text)]">MEMBER SINCE {memberSince}</span>
            <span className="font-mono text-[10px] text-[var(--muted)] mt-0.5">
              Show QR to check in or connect
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
