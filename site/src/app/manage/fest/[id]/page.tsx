'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader2, Plus, Users, Calendar, MapPin, Compass, Pencil, AlertCircle } from 'lucide-react';

interface FestRow {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  cover_url: string | null;
  start_date: string;
  end_date: string;
  venue: string | null;
  google_maps_url: string | null;
  tags: string[] | null;
  is_published: boolean;
}

interface EventRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  starts_at: string;
  venue: string | null;
  is_published: boolean;
}

export default function FestManagePage() {
  const params = useParams();
  const festId = params?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [fest, setFest] = useState<FestRow | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!supabase || !festId) return;

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();
      if (profile?.role !== 'organizer') {
        router.push('/');
        return;
      }
      setIsOrganizer(true);

      const { data: festData, error: festErr } = await supabase
        .from('fests')
        .select('*')
        .or(`id.eq.${festId},slug.eq.${festId}`)
        .maybeSingle();

      if (festErr || !festData) {
        setError('Fest not found or you do not have access to it.');
        setLoading(false);
        return;
      }
      setFest(festData as FestRow);

      const { data: eventsData } = await supabase
        .from('events')
        .select('id, slug, title, category, starts_at, venue, is_published')
        .eq('fest_id', festData.id)
        .order('starts_at', { ascending: true });
      setEvents(eventsData ?? []);

      setLoading(false);
    };

    init();
  }, [supabase, router, festId]);

  if (!supabase || !isOrganizer || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (error || !fest) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <AlertCircle size={40} className="mx-auto mb-4 text-[var(--muted)]" />
            <p className="text-[var(--muted)] mb-4">{error || 'Fest not found.'}</p>
            <Link href="/organizer">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-12 flex flex-col gap-8">
        {/* Fest overview */}
        <Card className="overflow-hidden">
          <div className="h-40 bg-[var(--surface-2)]">
            {fest.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fest.cover_url} alt={fest.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                <Compass size={32} />
              </div>
            )}
          </div>
          <div className="p-6 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="font-mono text-xs text-[var(--accent)] uppercase">
                  {fest.is_published ? 'Published' : 'Draft'}
                </span>
                <h1 className="font-serif text-3xl">{fest.title}</h1>
                {fest.tagline && <p className="text-sm text-[var(--muted)] mt-1">{fest.tagline}</p>}
              </div>
              <Link href={`/manage/fest/${fest.id}/edit`}>
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <Pencil size={13} /> Edit Fest
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(fest.start_date).toLocaleDateString()} – {new Date(fest.end_date).toLocaleDateString()}
              </span>
              {fest.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {fest.venue}
                </span>
              )}
            </div>

            {fest.description && <p className="text-sm text-[var(--text)]/90">{fest.description}</p>}

            {fest.tags && fest.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fest.tags.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-[var(--accent-soft)] text-[var(--accent)]">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {fest.google_maps_url && (
              <a
                href={fest.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[var(--accent)] hover:underline"
              >
                Open in Google Maps →
              </a>
            )}
          </div>
        </Card>

        {/* Events inside this fest */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Events & Segments</h2>
            <Link href={`/manage/event/create?festId=${fest.id}`}>
              <Button size="sm" className="gap-1.5">
                <Plus size={13} /> New Event
              </Button>
            </Link>
          </div>

          {events.length > 0 ? (
            events.map((ev) => (
              <Card key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                <div>
                  <span className="font-mono text-xs text-[var(--accent)] uppercase">
                    {ev.category.replace('_', ' ')} · {ev.is_published ? 'Published' : 'Draft'}
                  </span>
                  <h3 className="font-serif text-lg">{ev.title}</h3>
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {new Date(ev.starts_at).toLocaleString()} · {ev.venue || 'TBA'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/manage/event/${ev.id}/edit`}>
                    <Button size="sm" variant="secondary" className="gap-1.5">
                      <Pencil size={13} /> Edit
                    </Button>
                  </Link>
                  <Link href={`/organizer/events/${ev.id}/participants`}>
                    <Button size="sm" variant="secondary" className="gap-1.5">
                      <Users size={13} /> Participants
                    </Button>
                  </Link>
                  <Link href={`/events/${ev.slug || ev.id}`}>
                    <Button size="sm" variant="secondary" className="gap-1.5">
                      <Compass size={13} /> View
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 bg-[var(--surface)] rounded-xl border border-[var(--border)] text-center">
              <p className="text-sm text-[var(--muted)]">No events in this fest yet.</p>
              <Link href={`/manage/event/create?festId=${fest.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Plus size={13} /> Create the first event
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
