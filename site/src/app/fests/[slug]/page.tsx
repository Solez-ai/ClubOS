'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, MapPin, Layers, Megaphone, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EventCard } from '@/components/cards/EventCard';
import { createClient } from '@/lib/supabase/client';
import { Event } from '@/lib/types';

export default function FestDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [fest, setFest] = useState<{ id: string; title: string; tagline: string | null; description: string | null; cover_url: string | null; venue: string | null; google_maps_url: string | null; start_date: string; end_date: string; org?: { name: string } | null } | null>(null);
  const [festEvents, setFestEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; body: string | null; created_at: string }[]>([]);
  const [topParticipants, setTopParticipants] = useState<{ id: string; full_name: string; xp: number; institution?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

      const { data: festData } = await supabase
        .from('fests')
        .select('*, org:organizations(*)')
        .eq('slug', slug)
        .single();

      if (!festData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setFest(festData);

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('fest_id', festData.id)
        .eq('is_published', true)
        .order('starts_at', { ascending: true });
      setFestEvents(eventsData || []);

      const { data: annData } = await supabase
        .from('announcements')
        .select('*')
        .eq('fest_id', festData.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setAnnouncements(annData || []);

      const { data: leaders } = await supabase
        .from('profiles')
        .select('id, full_name, handle, xp')
        .order('xp', { ascending: false })
        .limit(5);
      setTopParticipants(leaders || []);

      setLoading(false);
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
          <AlertCircle size={40} className="text-[var(--muted)]" />
          <h1 className="font-serif text-3xl">Fest Not Found</h1>
          <p className="text-sm text-[var(--muted)]">This fest doesn&apos;t exist or is not published.</p>
          <Link href="/fests"><Button>Back to Fests</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative w-full h-[320px] sm:h-[420px] bg-[var(--surface-2)] overflow-hidden border-b border-[var(--border)]">
        {fest.cover_url && (
          <img
            src={fest.cover_url}
            alt={fest.title}
            className="w-full h-full object-cover filter saturate-[0.75] contrast-[1.05] sepia-[0.12]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/70 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 max-w-[1200px] mx-auto px-4 sm:px-6 pb-8 flex flex-col gap-3">
          {fest.org?.name && (
            <Eyebrow className="text-[var(--accent)]">{fest.org.name}</Eyebrow>
          )}
          <h1 className="font-serif text-3xl sm:text-5xl font-light text-[var(--text)] tracking-tight max-w-3xl">
            {fest.title}
          </h1>
          {fest.tagline && <p className="text-sm sm:text-base text-[var(--muted)]">{fest.tagline}</p>}

          <div className="flex flex-wrap items-center gap-6 pt-2 font-mono text-xs text-[var(--muted)]">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[var(--accent)]" />
              <span>
                {new Date(fest.start_date).toLocaleDateString()} — {new Date(fest.end_date).toLocaleDateString()}
              </span>
            </div>
            {fest.venue && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-[var(--accent)]" />
                <span>{fest.venue}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Layers size={14} className="text-[var(--accent)]" />
              <span>{festEvents.length} events</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Description & Events */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          {fest.description && (
            <div className="flex flex-col gap-3">
              <h2 className="font-serif text-2xl text-[var(--text)]">About this Fest</h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
                {fest.description}
              </p>
            </div>
          )}

          {fest.google_maps_url && (
            <a
              href={fest.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline w-fit"
            >
              <MapPin size={16} />
              View location on Google Maps
            </a>
          )}

          <div className="flex flex-col gap-6 pt-4 border-t border-[var(--border)]">
            <h2 className="font-serif text-2xl text-[var(--text)]">Fest Events ({festEvents.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {festEvents.length > 0 ? (
                festEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} festName={fest.title} />
                ))
              ) : (
                <p className="text-sm text-[var(--muted)] col-span-full">
                  No events published for this fest yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Announcements & Leaderboard */}
        <div className="lg:col-span-4 flex flex-col gap-8">
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
                      {new Date(ann.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs font-mono text-[var(--muted)]">No announcements posted yet.</span>
              )}
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-serif text-lg text-[var(--text)]">Top Participants</h3>
              <Link href="/leaderboard" className="text-xs font-mono text-[var(--accent)] hover:underline">
                Full list
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {topParticipants.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-[var(--muted)] w-4">{idx + 1}</span>
                    <span className="font-serif text-[var(--text)]">{p.full_name}</span>
                  </div>
                  <span className="font-mono text-[var(--accent)]">{p.xp} XP</span>
                </div>
              ))}
              {topParticipants.length === 0 && (
                <span className="text-xs font-mono text-[var(--muted)]">No participants yet.</span>
              )}
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
