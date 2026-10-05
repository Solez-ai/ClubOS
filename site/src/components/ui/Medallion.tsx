import React from 'react';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface MedallionProps {
  name: string;
  description?: string;
  iconName?: string;
  rings?: number;
  earned?: boolean;
  xpReward?: number;
  className?: string;
}

export const Medallion: React.FC<MedallionProps> = ({
  name,
  description,
  iconName = 'award',
  rings = 1,
  earned = true,
  xpReward,
  className = '',
}) => {
  // Dynamically resolve icon from lucide-react
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[
    iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())
  ] || Icons.Award;

  const ringCount = Math.min(4, Math.max(1, rings));

  return (
    <div
      className={`group relative flex flex-col items-center gap-2 p-3 text-center transition-all ${className}`}
      title={description || name}
    >
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Render Concentric Brass Rings based on Rarity */}
        {Array.from({ length: ringCount }).map((_, idx) => (
          <div
            key={idx}
            className={`absolute rounded-full border transition-colors ${
              earned ? 'border-[var(--accent)]' : 'border-[var(--border)]'
            }`}
            style={{
              inset: `${idx * 3}px`,
              opacity: earned ? 1 - idx * 0.15 : 0.4,
            }}
          />
        ))}

        <div className="relative z-10 flex items-center justify-center text-[var(--accent)]">
          <IconComponent
            size={22}
            strokeWidth={1.25}
            className={earned ? 'text-[var(--accent)]' : 'text-[var(--muted)] opacity-30'}
          />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span
          className={`font-serif text-xs font-medium line-clamp-1 ${
            earned ? 'text-[var(--text)]' : 'text-[var(--muted)]'
          }`}
        >
          {name}
        </span>
        {xpReward ? (
          <span className="font-mono text-[10px] text-[var(--accent)]">+{xpReward} XP</span>
        ) : null}
      </div>
    </div>
  );
};
