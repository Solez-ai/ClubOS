import React from 'react';
import Link from 'next/link';
import { Fest } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatEventDate } from '@/lib/dates';
import { MapPin, Calendar, Layers } from 'lucide-react';

export interface FestCardProps {
  fest: Fest;
  eventCount?: number;
  participantCount?: number;
  className?: string;
}

export const FestCard: React.FC<FestCardProps> = ({
  fest,
  eventCount = 4,
  participantCount = 120,
  className = '',
}) => {
  const coverUrl =
    fest.cover_url ||
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';

  return (
    <Link href={`/fests/${fest.slug}`} className="block group">
      <Card className={`overflow-hidden p-0 flex flex-col h-full ${className}`}>
        {/* Cover Image 16:9 */}
        <div className="relative w-full aspect-[16/9] bg-[var(--surface-2)] overflow-hidden">
          <img
            src={coverUrl}
            alt={fest.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] filter saturate-[0.75] contrast-[1.05] sepia-[0.12]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent opacity-80" />
          
          <div className="absolute top-3 right-3">
            <StatusPill status="open" label="REGISTRATION OPEN" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1 justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--accent)]">
              <Calendar size={13} />
              <span>
                {formatEventDate(fest.start_date)} — {formatEventDate(fest.end_date)}
              </span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl text-[var(--text)] font-normal group-hover:text-[var(--accent)] transition-colors leading-snug">
              {fest.title}
            </h3>

            {fest.tagline && (
              <p className="text-xs text-[var(--muted)] line-clamp-2">{fest.tagline}</p>
            )}
          </div>

          {/* Meta Footer */}
          <div className="pt-4 hairline-t flex items-center justify-between font-mono text-xs text-[var(--muted)]">
            <div className="flex items-center gap-1.5 line-clamp-1">
              <MapPin size={13} className="text-[var(--accent)] shrink-0" />
              <span className="truncate">{fest.venue || 'DRMC Tech Complex'}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Layers size={13} />
              <span>{eventCount} events</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
