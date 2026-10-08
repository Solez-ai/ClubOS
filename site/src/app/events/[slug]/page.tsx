'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Tag, DollarSign,
  Lock, Unlock, Check, AlertCircle, ExternalLink, Timer
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { notifyRegistrationEmail } from '@/lib/email-client';
import { Event, CategoryTag } from '@/lib/types';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [userProfile, setUserProfile] = useState<{ id: string; full_name: string; phone: string | null } | null>(null);
  const [hasRegistered, setHasRegistered] = useState(false);

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

      // Check auth
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUser(authData.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        setUserProfile(profile);
      }

      // Fetch event
      const { data: eventDataRaw, error: eventError } = await supabase
        .from('events')
        .select(
          `*,
          fest:fest_id(*),
          segments(*),
          event_tags(tag_id),
          tags_data:event_tags(tag:category_tags(id, name, color))
        `)
        // Resolve by slug OR id so organizer dashboard links (which use ids)
        // and shared public links (which use slugs) both work.
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();

      if (eventError) {
        console.error('Error fetching event:', eventError);
        setError('Event not found');
      } else if (eventDataRaw) {
        // Flatten the nested tag embed ({ tag: {...} }) into the shape the UI expects
        const raw = eventDataRaw as Event;
        const tagRows = (eventDataRaw as { tags_data?: { tag: CategoryTag | null }[] | null }).tags_data;
        setEvent({
          ...raw,
          tags_data: (tagRows || []).map((t) => t.tag).filter((t): t is CategoryTag => Boolean(t)),
        });
      }

      // Check if user already registered
      if (authData?.user && eventDataRaw) {
        const { data: reg } = await supabase
          .from('registrations')
          .select('id, status')
          .eq('event_id', eventDataRaw?.id)
          .eq('user_id', authData.user.id)
          .single();

        if (reg) setHasRegistered(true);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase, slug]);

  const handleRegister = async () => {
    if (!supabase || !user || !event) return;

    setRegistering(true);
    setError('');
    setSuccess('');

    try {
      // Create registration
      const { data: reg, error: regErr } = await supabase
        .from('registrations')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'pending',
          total_price: event.segments?.reduce((sum: number, seg) => sum + (seg.is_free ? 0 : seg.price), 0) || 0,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (regErr) {
        setError(regErr.message);
        setRegistering(false);
        return;
      }

      // Add all non-free segments to registration
      if (reg && event.segments) {
        for (const seg of event.segments) {
          if (!seg.is_free && seg.is_active) {
            await supabase.from('registration_segments').insert({
              registration_id: reg.id,
              segment_id: seg.id,
              price_paid: seg.price,
              status: 'pending',
            });
          }
        }
      }

      setSuccess('Registration submitted! Check your email for confirmation.');
      setHasRegistered(true);

      // Best-effort confirmation email
      if (reg?.id) {
        void notifyRegistrationEmail('registration_confirmation', reg.id);
      }

      // Redirect to payment if there's a paid segment
      const hasPaidSegments = event.segments?.some((s) => !s.is_free);
      if (hasPaidSegments) {
        setTimeout(() => {
          router.push(`/events/${slug}/register`);
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
      setRegistering(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriceLabel = (ev: Pick<Event, 'segments'>) => {
    const hasPaidSegments = ev.segments?.some((s) => !s.is_free);
    if (!hasPaidSegments) return 'Free';
    const total = ev.segments?.reduce((sum: number, s) => sum + (s.is_free ? 0 : s.price), 0) || 0;
    return `BDT ${total.toLocaleString()}`;
  };

  const getPaymentMethods = (ev: Pick<Event, 'segments'>) => {
    const methods = new Set<string>();
    ev.segments?.forEach((s) => {
      if (!s.is_free && s.payment_method) {
        methods.add(s.payment_method);
      }
    });
    return Array.from(methods);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--muted)]">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="font-serif text-2xl mb-2">Event Not Found</h1>
          <p className="text-[var(--muted)] mb-4">The event you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isFull = event.spots_left != null && event.spots_left <= 0;
  const isClosed = new Date() > new Date(event.registration_deadline) || new Date() < new Date(event.registration_opens_at);
  const isPast = new Date(event.starts_at) < new Date();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Back Link */}
        <Link
          href="/events"
          className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </Link>

        {/* Event Header */}
        <div className="flex flex-col gap-6">
          {/* Cover Image */}
          {event.cover_url && (
            <div className="rounded-xl overflow-hidden h-48 md:h-64">
              <img
                src={event.cover_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {event.tags_data?.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    border: `1px solid ${tag.color}40`,
                  }}
                >
                  {tag.name}
                </span>
              ))}
              <span className="px-3 py-1 rounded-full bg-[var(--surface-2)] text-[var(--muted)] text-xs">
                {event.category.replace('_', ' ')}
              </span>
            </div>

            {/* Title & Fest */}
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-3xl md:text-4xl tracking-tight">
                {event.title}
              </h1>
              {event.fest && (
                <Link
                  href={`/fests/${event.fest.slug}`}
                  className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  {event.fest.title}
                </Link>
              )}
            </div>

          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              {isPast && (
                <Badge variant="secondary">Completed</Badge>
              )}
              {isFull && (
                <Badge variant="secondary">Full</Badge>
              )}
              {!isPast && !isFull && isClosed && (
                <Badge variant="secondary">Registration Closed</Badge>
              )}
              {!isPast && !isFull && !isClosed && (
                <Badge>Registration Open</Badge>
              )}
              {event.is_featured && (
                <Badge variant="accent">Featured</Badge>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <Card className="p-6">
                <h2 className="font-medium mb-3">About This Event</h2>
                <p className="text-[var(--text)] leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </Card>
            )}

            {/* Segments */}
            {event.segments && event.segments.length > 0 && (
              <Card className="p-6">
                <h2 className="font-medium mb-4 flex items-center gap-2">
                  <Tag size={18} className="text-[var(--accent)]" />
                  Segments ({event.segments.length})
                </h2>
                <div className="flex flex-col gap-4">
                  {event.segments.map((seg) => (
                    <div
                      key={seg.id}
                      className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-medium">{seg.title}</h3>
                          <span className="text-xs text-[var(--muted)] capitalize">
                            {seg.segment_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className={`text-right shrink-0 ${seg.is_free ? 'text-green-500' : 'text-[var(--text)]'}`}>
                          {seg.is_free ? (
                            <span className="font-medium flex items-center gap-1">
                              <Unlock size={14} />
                              Free
                            </span>
                          ) : (
                            <span className="font-medium">BDT {seg.price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      {seg.description && (
                        <p className="text-sm text-[var(--muted)] mb-2">{seg.description}</p>
                      )}

                      {seg.max_participants && (
                        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                          <Users size={12} />
                          {seg.max_participants} spots available
                          {seg.registered_count !== undefined && (
                            <span className="text-[var(--accent)]">
                              ({seg.registered_count} registered)
                            </span>
                          )}
                        </div>
                      )}

                      {!seg.is_free && seg.payment_info && (
                        <div className="mt-3 p-3 bg-[var(--accent)]/10 rounded-lg text-xs">
                          <p className="font-medium mb-1">Payment Details:</p>
                          <pre className="text-[var(--text)] font-mono whitespace-pre-wrap">
                            {seg.payment_info}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Rules & Prizes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.rules && (
                <Card className="p-6">
                  <h2 className="font-medium mb-3 flex items-center gap-2">
                    <Lock size={18} className="text-[var(--muted)]" />
                    Rules & Requirements
                  </h2>
                  <div className="text-sm text-[var(--text)] whitespace-pre-line">
                    {event.rules}
                  </div>
                </Card>
              )}

              {event.prizes && (
                <Card className="p-6">
                  <h2 className="font-medium mb-3 flex items-center gap-2">
                    <Award size={18} className="text-[var(--accent)]" />
                    Prizes & Rewards
                  </h2>
                  <div className="text-sm text-[var(--text)] whitespace-pre-line">
                    {event.prizes}
                  </div>
                  <div className="mt-3 p-3 bg-[var(--accent)]/10 rounded-lg text-center">
                    <span className="text-2xl font-bold text-[var(--accent)]">+{event.xp_reward}</span>
                    <span className="text-sm text-[var(--muted)]"> XP Reward</span>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Right: Info Panel */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <Card className="p-6 sticky top-24">
              {/* Date/Time */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                    <Calendar size={18} className="text-[var(--muted)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">Date</p>
                    <p className="font-medium">{formatDate(event.starts_at)}</p>
                    {event.ends_at && (
                      <p className="text-sm text-[var(--muted)]">to {formatDate(event.ends_at)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-[var(--muted)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">Time</p>
                    <p className="font-medium">
                      {formatTime(event.starts_at)}
                      {event.ends_at && ` - ${formatTime(event.ends_at)}`}
                    </p>
                  </div>
                </div>

                {event.venue && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-[var(--muted)]" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--muted)]">Venue</p>
                      <p className="font-medium">{event.venue}</p>
                      {event.google_maps_url && (
                        <Link
                          href={event.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          <ExternalLink size={10} />
                          View on Google Maps
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Capacity */}
              <div className="p-4 bg-[var(--surface-2)] rounded-lg mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--muted)]">Capacity</span>
                  <span className="font-mono text-sm">
                    {event.capacity ? `${event.confirmed_count || 0} / ${event.capacity}` : 'Unlimited'}
                  </span>
                </div>
                {event.capacity && (
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        event.is_full ? 'bg-red-500' :
                        event.spots_left != null && event.spots_left < event.capacity * 0.2 ? 'bg-yellow-500' :
                        'bg-[var(--accent)]'
                      }`}
                      style={{ width: `${Math.min(100, ((event.confirmed_count || 0) / event.capacity) * 100)}%` }}
                    />
                  </div>
                )}
                {event.spots_left != null && (
                  <p className="text-xs text-[var(--muted)] mt-2">
                    {event.spots_left} spots left
                  </p>
                )}
              </div>

              {/* Registration Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Registration</span>
                  <span className="font-medium">
                    {formatDate(event.registration_opens_at)} - {formatDate(event.registration_deadline)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Registration Type</span>
                  <span className="font-medium">
                    {event.is_team_event
                      ? `Team (${event.team_min}-${event.team_max} members)`
                      : 'Individual'}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className={`p-4 rounded-lg text-center $                {event.segments?.every((s) => s.is_free) ? 'bg-green-500/10' : 'bg-[var(--surface-2)]'}`}>
                <p className="text-sm text-[var(--muted)] mb-1">Total Price</p>
                <p className={`text-2xl font-bold ${event.segments?.every((s) => s.is_free) ? 'text-green-500' : 'text-[var(--text)]'}`}>
                  {getPriceLabel(event)}
                </p>
                {getPaymentMethods(event).length > 0 && (
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Pay with: {getPaymentMethods(event).map(m => m.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ')}
                  </p>
                )}
              </div>

              {/* Register Button */}
              {user && !isPast && !isFull && (
                hasRegistered ? (
                  <div className="text-center">
                    <Check size={24} className="mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">You&apos;re Registered!</p>
                    <p className="text-xs text-[var(--muted)]">Check your email for confirmation</p>
                  </div>
                ) : isClosed ? (
                  <Button variant="secondary" disabled className="w-full">
                    Registration Closed
                  </Button>
                ) : (
                  <Button
                    onClick={handleRegister}
                    isLoading={registering}
                    disabled={isFull || isClosed}
                    className="w-full gap-2"
                  >
                    {event.segments?.every((s) => s.is_free) ? (
                      'Register Now'
                    ) : (
                      <>
                        <DollarSign size={16} />
                        Register & Pay
                      </>
                    )}
                  </Button>
                )
              )}

              {!user && (
                <div className="text-center">
                  <p className="text-sm text-[var(--muted)] mb-3">Sign in to register</p>
                  <Link href={`/login?redirect=${encodeURIComponent(`/events/${slug}`)}`}>
                    <Button variant="secondary" className="w-full gap-2">
                      <Lock size={14} />
                      Sign In to Register
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Award({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}
