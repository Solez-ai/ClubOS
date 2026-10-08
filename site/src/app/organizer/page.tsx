'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { ensureProfile, DB_SETUP_HINT } from '@/lib/profile';
import { Plus, Users, QrCode, Calendar, Activity, AlertCircle, Compass } from 'lucide-react';

interface EventRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  venue: string | null;
  starts_at: string;
  is_published: boolean;
}

interface FestRow {
  id: string;
  title: string;
  venue: string | null;
  start_date: string;
  is_published: boolean;
}

export default function OrganizerDashboardPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [fests, setFests] = useState<FestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0 });

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Check auth + organizer role
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        window.location.href = '/login';
        return;
      }
      setUser(authData.user);

      // Self-heal: a missing profile row (from earlier broken signups) used to
      // bounce real organizers to /events. Recreate it from auth metadata first.
      const healed = await ensureProfile(supabase, authData.user);
      if (!healed.ok) {
        setSetupError(healed.setupIncomplete ? DB_SETUP_HINT : healed.error ?? 'Profile error');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .single();

      if (profile?.role !== 'organizer') {
        window.location.href = '/events';
        return;
      }
      setIsOrganizer(true);

      // Fetch fests created by this organizer
      const { data: festsData } = await supabase
        .from('fests')
        .select('*')
        .eq('created_by', authData.user.id)
        .order('start_date', { ascending: true });        if (festsData) setFests(festsData);

      // Fetch events created by this organizer
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', authData.user.id)
        .order('starts_at', { ascending: true });

      if (eventsData) {
        setEvents(eventsData);

        // Fetch registration counts for this organizer's events
        const eventIds = eventsData.map((e) => e.id);
        if (eventIds.length > 0) {
          const { data: regs } = await supabase
            .from('registrations')
            .select('id, status')
            .in('event_id', eventIds);

          if (regs) {
            setStats({
              total: regs.length,
              confirmed: regs.filter((r) => r.status === 'confirmed' || r.status === 'checked_in').length,
              pending: regs.filter((r) => r.status === 'pending').length,
            });
          }
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--muted)]">Loading organizer dashboard...</p>
        </div>
      </div>
    );
  }

  if (!supabase || !isOrganizer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center max-w-md px-4">
          <AlertCircle size={40} className="mx-auto mb-4 text-[var(--muted)]" />
          {setupError ? (
            <>
              <p className="text-[var(--text)] mb-2 font-medium">Account setup incomplete</p>
              <p className="text-[var(--muted)] mb-4 text-sm">{setupError}</p>
            </>
          ) : (
            <p className="text-[var(--muted)] mb-4">Organizer access required.</p>
          )}
          <Link href="/login"><Button>Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-12">
        {/* Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-8">
          <div className="flex flex-col gap-1">
            <Eyebrow>ORGANIZER PORTAL</Eyebrow>
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-[var(--text)]">
              {user?.email ? user.email.split('@')[0] : 'Organizer'}&apos;s Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/manage/fest/create">
              <Button size="sm" className="gap-1.5 font-mono text-xs">
                <Plus size={14} />
                <span>New Fest</span>
              </Button>
            </Link>
            <Link href="/manage/event/create">
              <Button variant="secondary" size="sm" className="gap-1.5 font-mono text-xs">
                <Plus size={14} />
                <span>New Event</span>
              </Button>
            </Link>
            <Link href="/organizer/check-in">
              <Button variant="secondary" size="sm" className="gap-1.5 font-mono text-xs">
                <QrCode size={14} />
                <span>Attendee Scanner</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="p-5">
            <div className="font-serif text-3xl text-[var(--text)]">{events.length}</div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider mt-1">My Events</p>
          </Card>
          <Card className="p-5">
            <div className="font-serif text-3xl text-[var(--text)]">{stats.total}</div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider mt-1">Total Registrations</p>
          </Card>
          <Card className="p-5">
            <div className="font-serif text-3xl text-[var(--accent)]">{stats.confirmed}</div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider mt-1">Confirmed</p>
          </Card>
          <Card className="p-5">
            <div className="font-serif text-3xl text-yellow-500">{stats.pending}</div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider mt-1">Pending Review</p>
          </Card>
        </div>

        {/* My Fests List */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[var(--text)]">My Fests</h2>
          </div>

          <div className="flex flex-col gap-4">
            {fests.length > 0 ? (
              fests.map((fest) => (
                <Card key={fest.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-[var(--accent)] uppercase">Fest</span>
                    <h3 className="font-serif text-lg text-[var(--text)]">{fest.title}</h3>
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {new Date(fest.start_date).toLocaleDateString()} · {fest.venue || 'TBA'} · {fest.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/manage/fest/${fest.id}`}>
                      <Button size="sm" className="font-mono text-xs gap-1.5">
                        <Calendar size={13} />
                        Manage
                      </Button>
                    </Link>
                    <Link href={`/fests/${fest.id}`}>
                      <Button size="sm" variant="secondary" className="font-mono text-xs gap-1.5">
                        <Compass size={13} />
                        View Page
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <Compass size={32} className="text-[var(--muted)]" />
                <p className="text-sm text-[var(--muted)] max-w-sm">
                  You haven&apos;t created any fests yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* My Events List */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[var(--text)]">My Events</h2>
          </div>

          <div className="flex flex-col gap-4">
            {events.length > 0 ? (
              events.map((ev) => (
                <Card key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-[var(--accent)] uppercase">{ev.category.replace('_', ' ')}</span>
                    <h3 className="font-serif text-lg text-[var(--text)]">{ev.title}</h3>
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {new Date(ev.starts_at).toLocaleDateString()} · {ev.venue || 'TBA'} · {ev.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/organizer/events/${ev.id}/participants`}>
                      <Button variant="secondary" size="sm" className="font-mono text-xs gap-1.5">
                        <Users size={13} />
                        Participants
                      </Button>
                    </Link>
                    <Link href={`/events/${ev.slug || ev.id}`}>
                      <Button size="sm" className="font-mono text-xs gap-1.5">
                        <Calendar size={13} />
                        View
                      </Button>
                    </Link>
                    <Link href={`/manage/event/${ev.id}/edit`}>
                      <Button size="sm" variant="secondary" className="font-mono text-xs gap-1.5">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <Calendar size={32} className="text-[var(--muted)]" />
                <h3 className="font-serif text-xl">No events yet</h3>
                <p className="text-sm text-[var(--muted)] max-w-sm">
                  Create an event with segments and pricing to start taking registrations.
                </p>
                <Link href="/manage/event/create">
                  <Button className="gap-2">
                    <Plus size={14} />
                    Create Your First Event
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

