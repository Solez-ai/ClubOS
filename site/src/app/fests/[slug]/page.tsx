import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Layers, Trophy, Megaphone, ArrowRight, UserCheck } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EventCard } from '@/components/cards/EventCard';
import { formatEventDate } from '@/lib/dates';
import { MOCK_FESTS, MOCK_EVENTS, MOCK_ANNOUNCEMENTS, MOCK_PROFILES } from '@/lib/mockData';

export default async function FestDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const fest = MOCK_FESTS.find((f) => f.slug === slug) || MOCK_FESTS[0];

  const festEvents = MOCK_EVENTS.filter((e) => e.fest_id === fest.id);
  const announcements = MOCK_ANNOUNCEMENTS.filter((a) => a.fest_id === fest.id);
  const topParticipants = MOCK_PROFILES;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative w-full h-[320px] sm:h-[420px] bg-[var(--surface-2)] overflow-hidden border-b border-[var(--border)]">
        <img
          src={fest.cover_url || ''}
          alt={fest.title}
          className="w-full h-full object-cover filter saturate-[0.75] contrast-[1.05] sepia-[0.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/70 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 max-w-[1200px] mx-auto px-4 sm:px-6 pb-8 flex flex-col gap-3">
          <Eyebrow className="text-[var(--accent)]">
            {fest.org?.name || 'DRMC IT CLUB'}
          </Eyebrow>
          <h1 className="font-serif text-3xl sm:text-5xl font-light text-[var(--text)] tracking-tight max-w-3xl">
            {fest.title}
          </h1>
          {fest.tagline && <p className="text-sm sm:text-base text-[var(--muted)]">{fest.tagline}</p>}

          <div className="flex flex-wrap items-center gap-6 pt-2 font-mono text-xs text-[var(--muted)]">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[var(--accent)]" />
              <span>
                {formatEventDate(fest.start_date)} — {formatEventDate(fest.end_date)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-[var(--accent)]" />
              <span>{fest.venue}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers size={14} className="text-[var(--accent)]" />
              <span>{festEvents.length} events</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column (8 cols): Description & Event List */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          {/* Your Progress Strip */}
          <div className="p-4 bg-[var(--accent-soft)] border border-[var(--accent)]/30 rounded-[8px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck size={20} className="text-[var(--accent)]" />
              <div className="flex flex-col">
                <span className="text-xs font-mono font-medium text-[var(--text)]">YOUR FEST PROGRESS</span>
                <span className="text-xs text-[var(--muted)]">1 of {festEvents.length} events attended</span>
              </div>
            </div>
            <Link href={`/passport/fests/${fest.slug}`}>
              <Button size="sm" variant="secondary" className="text-xs">
                Open Fest Pass
              </Button>
            </Link>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-3">
            <h2 className="font-serif text-2xl text-[var(--text)]">About this Fest</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
              {fest.description}
            </p>
          </div>

          {/* Events Grid */}
          <div className="flex flex-col gap-6 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[var(--text)]">Fest Events ({festEvents.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {festEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} festName={fest.title} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Announcements & Mini Leaderboard */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Announcements */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Megaphone size={16} className="text-[var(--accent)]" />
              <h3 className="font-serif text-lg text-[var(--text)]">Announcements</h3>
            </div>
            <div className="flex flex-col gap-4">
              {announcements.length > 0 ? (
                announcements.map((ann) => (
                  <div key={ann.id} className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-[var(--text)]">{ann.title}</span>
                    <p className="text-[var(--muted)] leading-relaxed">{ann.body}</p>
                    <span className="font-mono text-[10px] text-[var(--muted)] mt-1">
                      {new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs font-mono text-[var(--muted)]">No announcements posted yet.</span>
              )}
            </div>
          </Card>

          {/* Mini Leaderboard */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-[var(--accent)]" />
                <h3 className="font-serif text-lg text-[var(--text)]">Fest Leaderboard</h3>
              </div>
              <Link href="/leaderboard" className="text-xs font-mono text-[var(--accent)] hover:underline">
                Full list
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {topParticipants.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-[var(--muted)] w-4">{idx + 1}</span>
                    <span className="font-serif text-[var(--text)]">{p.full_name}</span>
                  </div>
                  <span className="font-mono text-[var(--accent)]">{p.xp} XP</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
