'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Plus, Users, QrCode, Calendar, Activity, AlertCircle } from 'lucide-react';

interface EventRow {
  id: string;
  title: string;
  category: string;
  venue: string | null;
  starts_at: string;
  is_published: boolean;
  registered_count?: number;
  confirmed_count?: number;
  checked_in_count?: number;
}

export default function OrganizerDashboardPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .single();

      if (profile?.role !== 'organizer') {
        // Not an organizer — send to participant home
        window.location.href = '/events';
        return;
      }
      setIsOrganizer(true);

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
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto mb-4 text-[var(--muted)]" />
          <p className="text-[var(--muted)] mb-4">Organizer access required.</p>
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
                    <Link href={`/events/${ev.id}`}>
                      <Button size="sm" className="font-mono text-xs gap-1.5">
                        <Calendar size={13} />
                        View
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
                  Create a fest first, then add events with segments and pricing.
                </p>
                <Link href="/manage/fest/create">
                  <Button className="gap-2">
                    <Plus size={14} />
                    Create Your First Fest
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
