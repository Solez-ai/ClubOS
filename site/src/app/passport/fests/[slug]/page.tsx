'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Stamp } from '@/components/ui/Stamp';
import { StatusPill } from '@/components/ui/StatusPill';
import { createClient } from '@/lib/supabase/client';
import { RegStatus } from '@/lib/types';
import { Calendar, MapPin } from 'lucide-react';

interface FestRow {
  id: string;
  title: string;
  slug: string;
  venue: string | null;
  start_date: string;
  end_date: string;
  description: string | null;
  google_maps_url: string | null;
  cover_url: string | null;
  tagline: string | null;
}

interface FestEventRow {
  id: string;
  title: string;
  slug: string;
  venue: string | null;
  starts_at: string;
  is_published: boolean;
  fest_id: string;
}

interface RegRow {
  id: string;
  status: RegStatus;
  event: {
    title: string;
    venue: string | null;
    starts_at: string;
    slug: string;
  } | null;
}

interface StampRow {
  id: string;
  kind: 'event' | 'fest';
  earned_at: string;
  event: { title: string } | null;
  fest_id: string;
}

export default function FestPassPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [fest, setFest] = useState<FestRow | null>(null);
  const [festEvents, setFestEvents] = useState<FestEventRow[]>([]);
  const [myRegs, setMyRegs] = useState<RegRow[]>([]);
  const [myStamps, setMyStamps] = useState<StampRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: festData } = await supabase
          .from('fests')
          .select('*')
          // Resolve by slug OR id so dashboard links (ids) work too.
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .single();

        if (!festData) {
          setNotFound(true);
          return;
        }
        setFest(festData as FestRow);

        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .eq('fest_id', festData.id)
          .eq('is_published', true)
          .order('starts_at', { ascending: true });
        setFestEvents((eventsData as FestEventRow[]) || []);

        // If signed in, load this user's registrations and stamps for this fest
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          setIsLoggedIn(true);

          const eventIds = ((eventsData as FestEventRow[]) || []).map((e) => e.id);
          if (eventIds.length > 0) {
            const { data: regsData } = await supabase
              .from('registrations')
              .select('*, event:events(*)')
              .eq('user_id', authData.user.id)
              .in('event_id', eventIds)
              .order('created_at', { ascending: false });
            setMyRegs((regsData as RegRow[]) || []);
          }

          const { data: stampsData } = await supabase
            .from('stamps')
            .select('*, event:events(title)')
            .eq('user_id', authData.user.id)
            .eq('fest_id', festData.id)
            .order('earned_at', { ascending: false });
          setMyStamps((stampsData as StampRow[]) || []);
        }
      } catch (err) {
        console.error('Failed to load fest data:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [supabase, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !fest) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <h1 className="font-serif text-3xl">Fest Not Found</h1>
          <Link href="/passport"><Button variant="secondary" size="sm">Back to Passport</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

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
          <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-[var(--muted)]">
            {fest.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {fest.venue}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {new Date(fest.start_date).toLocaleDateString()} — {new Date(fest.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="text-center py-16 flex flex-col items-center gap-4">
            <p className="text-sm text-[var(--muted)] max-w-md">
              Sign in to see your registrations and collected stamps for this fest.
            </p>
            <Link href="/login"><Button>Sign In</Button></Link>
          </div>
        ) : (
          <>
            {/* Agenda */}
            <div className="flex flex-col gap-6">
              <h2 className="font-serif text-2xl text-[var(--text)]">My Fest Agenda</h2>
              <div className="flex flex-col gap-4">
                {myRegs.length > 0 ? (
                  myRegs.map((reg, idx) => (
                    <Card key={reg.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-[var(--accent)]">EVENT #{idx + 1}</span>
                          <StatusPill status={reg.status} />
                        </div>
                        <h3 className="font-serif text-xl text-[var(--text)]">{reg.event?.title}</h3>
                        <span className="font-mono text-xs text-[var(--muted)]">
                          {reg.event?.venue} · {reg.event ? new Date(reg.event.starts_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <Link href={`/events/${reg.event?.slug}`}>
                        <Button variant="secondary" size="sm">View Details</Button>
                      </Link>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    You have no registrations in this fest yet. Browse the{' '}
                    <Link href="/events" className="text-[var(--accent)] hover:underline">event feed</Link> to join one.
                  </p>
                )}
              </div>
            </div>

            {/* Stamps */}
            <div className="flex flex-col gap-6 border-t border-[var(--border)] pt-8">
              <h2 className="font-serif text-2xl text-[var(--text)]">Stamps in this Fest</h2>
              {myStamps.length > 0 ? (
                <div className="flex flex-wrap gap-8 items-center">
                  {myStamps.map((stamp) => (
                    <Stamp
                      key={stamp.id}
                      id={stamp.id}
                      title={stamp.event?.title || fest.title}
                      kind={stamp.kind}
                      date={stamp.earned_at}
                      earned={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  No stamps earned in this fest yet — scan the venue QR at events to collect them.
                </p>
              )}
            </div>

            {/* All fest events for browsing */}
            <div className="flex flex-col gap-6 border-t border-[var(--border)] pt-8">
              <h2 className="font-serif text-2xl text-[var(--text)]">All Fest Events</h2>
              <div className="flex flex-col gap-4">
                {festEvents.map((ev) => (
                  <Card key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-serif text-lg text-[var(--text)]">{ev.title}</h3>
                      <span className="font-mono text-xs text-[var(--muted)]">
                        {ev.venue} · {new Date(ev.starts_at).toLocaleString()}
                      </span>
                    </div>
                    <Link href={`/events/${ev.slug}`}>
                      <Button variant="secondary" size="sm">View</Button>
                    </Link>
                  </Card>
                ))}
                {festEvents.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">No events published in this fest yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
