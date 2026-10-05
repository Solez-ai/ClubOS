import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Trophy, ShieldCheck, Zap, Users, Download, Share2, Clock, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CapacityMeter } from '@/components/ui/CapacityMeter';
import { StatusPill, PillStatus } from '@/components/ui/StatusPill';
import { formatEventDateTime, formatDeadlineCountdown } from '@/lib/dates';
import { MOCK_EVENTS } from '@/lib/mockData';

export default async function EventDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const event = MOCK_EVENTS.find((e) => e.slug === slug) || MOCK_EVENTS[0];

  const deadlineInfo = formatDeadlineCountdown(event.registration_deadline);

  let pillStatus: PillStatus = 'open';
  if (deadlineInfo.isExpired) pillStatus = 'closed';
  else if (event.is_full && event.waitlist_enabled) pillStatus = 'waitlisted';
  else if (event.is_full) pillStatus = 'full';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      {/* Hero Treated Cover */}
      <div className="relative w-full h-[280px] sm:h-[380px] bg-[var(--surface-2)] overflow-hidden border-b border-[var(--border)]">
        <img
          src={event.cover_url || ''}
          alt={event.title}
          className="w-full h-full object-cover filter saturate-[0.75] contrast-[1.05] sepia-[0.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 max-w-[1200px] mx-auto px-4 sm:px-6 pb-6 flex flex-col gap-2">
          <Link
            href={`/fests/${event.fest?.slug}`}
            className="font-mono text-xs text-[var(--accent)] hover:underline uppercase tracking-wider"
          >
            ← {event.fest?.title}
          </Link>
          <h1 className="font-serif text-3xl sm:text-5xl font-light text-[var(--text)] tracking-tight">
            {event.title}
          </h1>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Content Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[10px] font-mono text-xs text-[var(--muted)]">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-[var(--accent)]">DATE & TIME</span>
              <span className="text-[var(--text)] font-medium">{formatEventDateTime(event.starts_at)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-[var(--accent)]">VENUE</span>
              <span className="text-[var(--text)] font-medium">{event.venue}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-[var(--accent)]">REWARD</span>
              <span className="text-[var(--accent)] font-medium">+{event.xp_reward} XP</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-[var(--accent)]">TEAM FORMAT</span>
              <span className="text-[var(--text)] font-medium">
                {event.is_team_event ? `Team (${event.team_min}–${event.team_max} members)` : 'Solo Entry'}
              </span>
            </div>
          </div>

          {/* Event Description */}
          <div className="flex flex-col gap-3">
            <h2 className="font-serif text-2xl text-[var(--text)] font-normal">Description</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Rules */}
          {event.rules && (
            <div className="flex flex-col gap-3 pt-6 border-t border-[var(--border)]">
              <h2 className="font-serif text-2xl text-[var(--text)] font-normal">Rules & Guidelines</h2>
              <div className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line bg-[var(--surface)] p-5 rounded-[10px] border border-[var(--border)] font-mono text-xs">
                {event.rules}
              </div>
            </div>
          )}

          {/* Prizes */}
          {event.prizes && (
            <div className="flex flex-col gap-3 pt-6 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-[var(--accent)]" />
                <h2 className="font-serif text-2xl text-[var(--text)] font-normal">Prizes & Awards</h2>
              </div>
              <div className="text-sm text-[var(--accent)] leading-relaxed whitespace-pre-line bg-[var(--accent-soft)] p-5 rounded-[10px] border border-[var(--accent)]/30 font-mono text-xs">
                {event.prizes}
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Registration Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <Card className="flex flex-col gap-6 p-6">
              <div className="flex items-center justify-between">
                <StatusPill status={pillStatus} />
                <span className="font-mono text-xs text-[var(--accent)]">
                  {event.fee_amount === 0 ? 'FREE REGISTRATION' : `BDT ${event.fee_amount}`}
                </span>
              </div>

              {/* Ring Capacity Meter */}
              <div className="py-2 flex justify-center">
                <CapacityMeter
                  current={event.registered_count || 12}
                  capacity={event.capacity}
                  variant="ring"
                />
              </div>

              {/* Countdown Bar */}
              <div className="flex flex-col items-center gap-1 p-3 bg-[var(--surface-2)] rounded-[6px] border border-[var(--border)] text-center font-mono">
                <span className="text-[10px] text-[var(--muted)] uppercase">REGISTRATION COUNTDOWN</span>
                <span className="text-xs text-[var(--text)] font-medium">{deadlineInfo.text}</span>
              </div>

              {/* Action Button */}
              {deadlineInfo.isExpired ? (
                <Button disabled className="w-full">
                  Registration Closed
                </Button>
              ) : event.is_full && !event.waitlist_enabled ? (
                <Button disabled className="w-full">
                  Event Full
                </Button>
              ) : (
                <Link href={`/events/${event.slug}/register`} className="w-full">
                  <Button className="w-full">
                    {event.is_full ? 'Join Waitlist' : 'Register Now'}
                  </Button>
                </Link>
              )}

              {/* Add to Calendar & Share */}
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] text-xs">
                <a
                  href={`/api/ics/${event.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[var(--border)] rounded-[6px] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-colors"
                >
                  <Download size={14} />
                  <span>Add to Calendar</span>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
