'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, MapPin, Ticket } from 'lucide-react';

type RegistrationRow = {
  id: string;
  status: string;
  ticket_code: string;
  total_price: number | null;
  payment_status: string | null;
  payment_method: string | null;
  event?: {
    id: string;
    title: string;
    slug: string;
    starts_at: string;
    venue: string | null;
    fest?: { id: string; title: string; slug: string } | null;
  } | null;
};

const STATUS_STYLES: Record<string, { variant: 'default' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'success', label: 'Confirmed' },
  waitlisted: { variant: 'secondary', label: 'Waitlisted' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  rejected: { variant: 'danger', label: 'Rejected' },
  checked_in: { variant: 'accent', label: 'Checked in' },
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Payment pending',
  paid: 'Paid — awaiting verification',
  verified: 'Payment verified',
  declined: 'Payment declined',
  refunded: 'Refunded',
};

const PAYMENT_VARIANTS: Record<string, 'default' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  paid: 'accent',
  verified: 'success',
  declined: 'danger',
  refunded: 'secondary',
};

/**
 * /dashboard – the signed-in user's registrations: tickets, statuses, and
 * payment states. Organizers additionally see their organizations with
 * shortcuts to create fests / events.
 */
export default function DashboardPage() {
  const [regs, setRegs] = useState<RegistrationRow[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = React.useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const load = async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        router.push('/login');
        return;
      }

      // Registrations for this user with their event + fest.
      const { data: regData, error: regErr } = await supabase
        .from('registrations')
        .select(`
          id, status, ticket_code, total_price, payment_status, payment_method,
          event:events(id, title, slug, starts_at, venue, fest:fests(id, title, slug))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (regErr) {
        setError(regErr.message);
        setLoading(false);
        return;
      }
      setRegs(((regData || []) as unknown as RegistrationRow[]));

      // Organizations where the user has any membership role. The table is
      // `organization_members` (the `org_members` name has no FK to
      // `organizations`, which made PostgREST reject the embed).
      const { data: orgData, error: orgErr } = await supabase
        .from('organization_members')
        .select('role, organizations(id, name, slug)')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin', 'organizer']);
      if (!orgErr) {
        type OrgRow = { organizations?: { id: string; name: string; slug: string } | null };
        const owned = ((orgData || []) as unknown as OrgRow[])
          .map((row) => row.organizations)
          .filter((o): o is { id: string; name: string; slug: string } => Boolean(o));
        setOrgs(owned);
        setIsOrganizer(owned.length > 0);
      }
      setLoading(false);
    };
    load();
  }, [supabase, router]);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-12 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-2xl">My Dashboard</h2>
          <p className="text-sm text-[var(--muted)]">Your tickets, registration statuses, and payment states.</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading your registrations...</p>
        ) : regs.length === 0 ? (
          <Card className="p-6 flex flex-col gap-3">
            <p className="text-sm text-[var(--muted)]">No registrations yet.</p>
            <Link href="/events" className="w-fit">
              <Button variant="secondary">Browse Events</Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {regs.map((reg) => {
              const st = STATUS_STYLES[reg.status] ?? { variant: 'secondary' as const, label: reg.status };
              const ev = reg.event;
              return (
                <Card key={reg.id} className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex flex-col gap-1">
                      {ev?.fest && (
                        <Link href={`/fests/${ev.fest.slug}`} className="text-xs text-[var(--accent)] hover:underline">
                          {ev.fest.title}
                        </Link>
                      )}
                      {ev ? (
                        <Link href={`/events/${ev.slug || ev.id}`} className="text-lg font-medium hover:underline">
                          {ev.title}
                        </Link>
                      ) : (
                        <span className="text-lg font-medium">Event unavailable</span>
                      )}
                      <div className="flex items-center gap-4 text-xs text-[var(--muted)] mt-1">
                        {ev?.starts_at && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={13} /> {formatDate(ev.starts_at)}
                          </span>
                        )}
                        {ev?.venue && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={13} /> {ev.venue}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <Badge variant={PAYMENT_VARIANTS[reg.payment_status ?? ''] ?? 'secondary'}>
                        {PAYMENT_LABELS[reg.payment_status ?? ''] ?? 'Free entry'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-[var(--border)]">
                    <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Ticket size={14} className="text-[var(--accent)]" />
                      <span className="mono">Ticket {reg.ticket_code}</span>
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {reg.total_price != null && reg.total_price > 0
                        ? `BDT ${reg.total_price.toLocaleString()}${reg.payment_method ? ` via ${reg.payment_method.replace(/_/g, ' ')}` : ''}`
                        : 'Free'}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {isOrganizer && (
          <Card className="p-6 mt-4">
            <h3 className="text-lg font-medium mb-4">Your Organizations</h3>
            <ul className="space-y-4">
              {orgs.map((org) => (
                <li key={org.id} className="border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
                  <h4 className="font-medium">{org.name}</h4>
                  <div className="flex gap-3 mt-2">
                    <Link href={`/manage/fest/create?orgId=${org.id}`}>
                      <Button variant="secondary">Create Fest</Button>
                    </Link>
                    <Link href={`/manage/event/create?orgId=${org.id}`}>
                      <Button variant="secondary">Create Event</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
