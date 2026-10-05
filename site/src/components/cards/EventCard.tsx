'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Calendar, MapPin, Zap } from 'lucide-react';
import { Event } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { StatusPill, PillStatus } from '@/components/ui/StatusPill';
import { CapacityMeter } from '@/components/ui/CapacityMeter';
import { formatEventDate, formatEventTime, formatDeadlineCountdown } from '@/lib/dates';

export interface EventCardProps {
  event: Event;
  festName?: string;
  isBookmarked?: boolean;
  onBookmarkToggle?: (eventId: string) => void;
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  festName,
  isBookmarked = false,
  onBookmarkToggle,
  className = '',
}) => {
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarked(!bookmarked);
    if (onBookmarkToggle) onBookmarkToggle(event.id);
  };

  const coverUrl =
    event.cover_url ||
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80';

  const deadlineInfo = formatDeadlineCountdown(event.registration_deadline);

  // Compute status pill state
  let pillStatus: PillStatus = 'open';
  if (deadlineInfo.isExpired) pillStatus = 'closed';
  else if (event.is_full && event.waitlist_enabled) pillStatus = 'waitlisted';
  else if (event.is_full) pillStatus = 'full';
  else if (deadlineInfo.isClosingSoon) pillStatus = 'closing_soon';

  return (
    <Link href={`/events/${event.slug}`} className="block group">
      <Card className={`p-0 overflow-hidden flex flex-col h-full ${className}`}>
        {/* Cover Image 4:3 */}
        <div className="relative w-full aspect-[4/3] bg-[var(--surface-2)] overflow-hidden">
          <img
            src={coverUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] filter saturate-[0.75] contrast-[1.05] sepia-[0.12]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent opacity-60" />

          {/* Category Top-Left */}
          <div className="absolute top-3 left-3 bg-[var(--bg)]/80 backdrop-blur-xs px-2.5 py-1 rounded border border-[var(--border)] font-mono text-[10px] uppercase tracking-wider text-[var(--text)]">
            {event.category}
          </div>

          {/* Bookmark Top-Right */}
          <button
            onClick={handleBookmark}
            className={`absolute top-3 right-3 p-2 rounded-full bg-[var(--bg)]/80 border border-[var(--border)] transition-colors ${
              bookmarked ? 'text-[var(--accent)] border-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            title="Bookmark Event"
          >
            <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            {festName && (
              <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">
                {festName}
              </span>
            )}

            <h3 className="font-serif text-lg sm:text-xl text-[var(--text)] font-normal group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
              {event.title}
            </h3>

            {/* Meta row */}
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--muted)] mt-1">
              <Calendar size={13} className="text-[var(--accent)] shrink-0" />
              <span className="truncate">
                {formatEventDate(event.starts_at)} · {formatEventTime(event.starts_at)}
              </span>
            </div>

            {event.venue && (
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--muted)]">
                <MapPin size={13} className="text-[var(--accent)] shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            )}
          </div>

          {/* Hairline divider & Footer Row */}
          <div className="pt-4 hairline-t flex flex-col gap-3">
            <CapacityMeter
              current={event.registered_count || 12}
              capacity={event.capacity}
            />

            <div className="flex items-center justify-between">
              <StatusPill status={pillStatus} />

              <div className="flex items-center gap-1 font-mono text-xs text-[var(--accent)] font-medium">
                <Zap size={13} />
                <span>+{event.xp_reward || 100} XP</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
