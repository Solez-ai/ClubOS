'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Users, Calendar, Check, X, Clock, Ticket, Download, ExternalLink,
  AlertCircle, Shield, Wallet, Phone, Mail
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ManagePage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;

      const { data: { data: authData } } = await supabase.auth.getUser();
      if (!authData?.user) {
        window.location.href = '/login';
        return;
      }

      setUser(data.user);

      // Fetch all registrations for this user
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          event:events(*,
            fest:fest_id(*),
            segments(*)
          ),
          profile:profiles(*)
        `)
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
      } else {
        setRegistrations(data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const activeRegistrations = registrations.filter(
    (r) => r.event && new Date(r.event.starts_at) > new Date() && r.status !== 'cancelled' && r.status !== 'rejected'
  );

  const pastRegistrations = registrations.filter(
    (r) => !r.event || new Date(r.event.starts_at) <= new Date() || r.status === 'cancelled' || r.status === 'rejected'
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-BD', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--muted)]">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-8">
          <div className="flex items-center gap-3 mb-2">
            <Ticket size={24} className="text-[var(--accent)]" />
            <h1 className="font-serif text-3xl">My Registrations</h1>
          </div>
          <p className="text-sm text-[var(--muted)]">
            View all your event registrations, track your participation, and manage your tickets.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-[var(--accent)]">{activeRegistrations.length}</p>
            <p className="text-xs text-[var(--muted)]">Active Events</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{registrations.filter((r) => r.status === 'confirmed' || r.status === 'checked_in').length}</p>
            <p className="text-xs text-[var(--muted)]">Confirmed</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{registrations.filter((r) => r.status === 'pending' || r.payment_status === 'pending').length}</p>
            <p className="text-xs text-[var(--muted)]">Pending</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-[var(--muted)]">{pastRegistrations.length}</p>
            <p className="text-xs text-[var(--muted)]">Past Events</p>
          </Card>
        </div>

        {/* Active Registrations */}
        {activeRegistrations.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="font-medium flex items-center gap-2">
              <Check size={18} className="text-green-500" />
              Active Events ({activeRegistrations.length})
            </h2>

            <div className="flex flex-col gap-4">
              {activeRegistrations.map((reg) => (
                <Card key={reg.id} className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <Link
                            href={`/events/${reg.event.slug}`}
                            className="font-medium hover:text-[var(--accent)] transition-colors"
                          >
                            {reg.event.title}
                          </Link>
                          {reg.event.fest && (
                            <Link
                              href={`/fests/${reg.event.fest.slug}`}
                              className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                            >
                              {reg.event.fest.title}
                            </Link>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          reg.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                          reg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          reg.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                          'bg-[var(--surface-2)] text-[var(--muted)]'
                        }`}>
                          {reg.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-[var(--muted)] mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} />
                          {reg.event.starts_at ? formatDate(reg.event.starts_at) : 'TBA'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={12} />
                          {reg.event.venue || 'TBA'}
                        </div>
                      </div>

                      {/* Payment Info */}
                      {reg.total_price > 0 && (
                        <div className="p-3 bg-[var(--surface-2)] rounded-lg mb-3">
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <Wallet size={12} className="text-[var(--muted)]" />
                            <span className="text-[var(--muted)]">Payment Status:</span>
                            <span className={`font-medium capitalize ${
                              reg.payment_status === 'verified' ? 'text-green-500' :
                              reg.payment_status === 'declined' ? 'text-red-500' :
                              reg.payment_status === 'paid' ? 'text-blue-500' :
                              'text-yellow-500'
                            }`}>
                              {reg.payment_status}
                            </span>
                          </div>
                          {reg.payment_method && (
                            <div className="text-xs text-[var(--muted)]">
                              Paid via: {reg.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          )}
                          {reg.transaction_id && (
                            <div className="text-xs text-[var(--muted)] font-mono mt-1">
                              Transaction ID: {reg.transaction_id}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Registration Segments */}
                      {reg.registration_segments && reg.registration_segments.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {reg.registration_segments.map((seg: any) => (
                            seg.segment && (
                              <span
                                key={seg.id}
                                className="px-2 py-0.5 rounded text-xs bg-[var(--surface-2)] text-[var(--muted)]"
                              >
                                {seg.segment.title}
                              </span>
                            )
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ticket Code & Actions */}
                    <div className="shrink-0">
                      <div className="p-3 bg-[var(--accent)]/10 rounded-lg border border-[var(--accent)]/30 mb-3">
                        <p className="text-xs text-[var(--muted)] mb-1">Ticket ID</p>
                        <p className="font-mono text-sm text-[var(--accent)] font-bold break-all">
                          {reg.ticket_code}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/events/${reg.event.slug}`}>
                          <Button variant="secondary" size="sm" className="flex-1">
                            View Event
                          </Button>
                        </Link>
                        {reg.event && reg.event.starts_at && new Date(reg.event.starts_at) > new Date() && (
                          <Link href="/scan">
                            <Button size="sm" className="flex-1">
                              <Ticket size={14} />
                              My Ticket
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Past Registrations */}
        {pastRegistrations.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="font-medium flex items-center gap-2">
              <Clock size={18} className="text-[var(--muted)]" />
              Past Events ({pastRegistrations.length})
            </h2>

            <div className="flex flex-col gap-4">
              {pastRegistrations.map((reg) => (
                <Card
                  key={reg.id}
                  className="p-5 opacity-60"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="line-through text-[var(--muted)]">
                            {reg.event?.title || 'Unknown Event'}
                          </span>
                          {reg.status === 'cancelled' && (
                            <X size={14} className="text-red-500" />
                          )}
                          {reg.status === 'rejected' && (
                            <AlertCircle size={14} className="text-red-500" />
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          reg.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                          reg.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                          reg.status === 'checked_in' ? 'bg-green-500/20 text-green-500' :
                          'bg-[var(--surface-2)] text-[var(--muted)]'
                        }`}>
                          {reg.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-[var(--muted)]">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} />
                          {reg.event?.starts_at ? formatDate(reg.event.starts_at) : 'TBA'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket size={12} />
                          <span className="font-mono text-xs">{reg.ticket_code.slice(0, 8)}...</span>
                        </div>
                      </div>

                      {reg.decline_reason && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-xs text-red-500 font-medium mb-1">Decline Reason</p>
                          <p className="text-sm text-[var(--text)]">{reg.decline_reason}</p>
                        </div>
                      )}

                      {reg.organizer_note && (
                        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-xs text-yellow-500 font-medium mb-1">Organizer Note</p>
                          <p className="text-sm text-[var(--text)]">{reg.organizer_note}</p>
                        </div>
                      )}
                    </div>

                    {/* Ticket Code */}
                    <div className="shrink-0">
                      <div className="p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
                        <p className="text-xs text-[var(--muted)] mb-1">Ticket ID</p>
                        <p className="font-mono text-sm text-[var(--text)] break-all">
                          {reg.ticket_code}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* No Registrations */}
        {registrations.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
              <Ticket size={24} className="text-[var(--muted)]" />
            </div>
            <h2 className="font-serif text-2xl mb-2">No Registrations Yet</h2>
            <p className="text-[var(--muted)] mb-6">
              You haven't registered for any events yet. Browse events and register to start your journey!
            </p>
            <Link href="/events">
              <Button>Explore Events</Button>
            </Link>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
