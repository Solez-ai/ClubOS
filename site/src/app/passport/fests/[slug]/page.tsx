import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Stamp } from '@/components/ui/Stamp';
import { StatusPill } from '@/components/ui/StatusPill';
import { MOCK_FESTS, MOCK_EVENTS, MOCK_REGISTRATIONS, MOCK_ANNOUNCEMENTS } from '@/lib/mockData';
import { Calendar, MapPin, Trophy, CheckCircle2 } from 'lucide-react';

export default async function FestPassPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const fest = MOCK_FESTS.find((f) => f.slug === slug) || MOCK_FESTS[0];
  const festEvents = MOCK_EVENTS.filter((e) => e.fest_id === fest.id);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-8">
          <Link href="/passport" className="font-mono text-xs text-[var(--accent)] hover:underline">
            ← Back to Passport Home
          </Link>
          <Eyebrow>FEST PASS & AGENDA</Eyebrow>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-[var(--text)]">
            {fest.title}
          </h1>
          <span className="font-mono text-xs text-[var(--muted)]">{fest.venue}</span>
        </div>

        {/* Agenda Timeline */}
        <div className="flex flex-col gap-6">
          <h2 className="font-serif text-2xl text-[var(--text)]">My Fest Agenda</h2>
          <div className="flex flex-col gap-4">
            {festEvents.map((ev, idx) => (
              <Card key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[var(--accent)]">EVENT #{idx + 1}</span>
                    <StatusPill status={idx === 0 ? 'confirmed' : 'checked_in'} />
                  </div>
                  <h3 className="font-serif text-xl text-[var(--text)]">{ev.title}</h3>
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {ev.venue} · {new Date(ev.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <Link href={`/events/${ev.slug}`}>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Stamps in Fest */}
        <div className="flex flex-col gap-6 border-t border-[var(--border)] pt-8">
          <h2 className="font-serif text-2xl text-[var(--text)]">Stamps in this Fest</h2>
          <div className="flex flex-wrap gap-8 items-center">
            <Stamp id="fest-stamp-1" title={fest.title} kind="fest" earned={true} />
            <Stamp id="event-stamp-1" title="Keynote Address" kind="event" earned={true} />
            <Stamp id="event-stamp-2" title="AI Web Dev Contest" kind="event" earned={false} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
