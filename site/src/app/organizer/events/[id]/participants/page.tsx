'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft, Check, X, Search, Filter, Download, Mail, User,
  Calendar, Clock, Wallet, Phone, ExternalLink, AlertCircle, Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { notifyRegistrationEmail } from '@/lib/email-client';

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'paid' | 'declined'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [declineComment, setDeclineComment] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

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

      // Check auth and organizer permission
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login');
        return;
      }

      setUser(authData.user);

      // Check if user is the event creator
      const { data: eventData } = await supabase
        .from('events')
        .select('*, fest:fest_id(*)')
        .eq('id', eventId)
        .single();

      if (!eventData) {
        router.push('/events');
        return;
      }

      setEvent(eventData);

      // Fetch registrations with user profiles
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          profile:profiles(*),
          registration_segments(segments(*))
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
      } else {
        setRegistrations(data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase, eventId, router]);

  const handleVerify = async (registrationId: string) => {
    if (!supabase) return;

    setActionLoading(registrationId);

    try {
      // Update registration status to confirmed
      const { error } = await supabase
        .from('registrations')
        .update({
          status: 'confirmed',
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          payment_status: 'verified',
        })
        .eq('id', registrationId);

      if (error) throw error;

      // Refresh data
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (data) setRegistrations(data);

      // Best-effort confirmation email via server route
      try {
        await notifyRegistrationEmail('registration_confirmation', registrationId);
      } catch (emailErr) {
        console.warn('Registration confirmation email failed:', emailErr);
      }
    } catch (err) {
      console.error('Error verifying registration:', err);
    }

    setActionLoading(null);
  };

  const handleDecline = async (registrationId: string) => {
    if (!supabase || !declineComment.trim()) return;

    setActionLoading(registrationId);

    try {
      // Update registration status to rejected
      const { error } = await supabase
        .from('registrations')
        .update({
          status: 'rejected',
          decline_reason: declineComment,
          declined_at: new Date().toISOString(),
          declined_by: user?.id,
          payment_status: 'declined',
        })
        .eq('id', registrationId);

      if (error) throw error;

      // Best-effort decline email via server route (reason included)
      try {
        await notifyRegistrationEmail('payment_declined', registrationId, { declineReason: declineComment });
      } catch (emailErr) {
        console.warn('Decline email failed:', emailErr);
      }

      // Clear modal
      setShowDeclineModal(null);
      setDeclineComment('');

      // Refresh data
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (data) setRegistrations(data);
    } catch (err) {
      console.error('Error declining registration:', err);
    }

    setActionLoading(null);
  };

  const filteredRegistrations = registrations.filter((reg) => {
    // Filter by status
    if (filter !== 'all') {
      if (filter === 'paid' && reg.payment_status !== 'paid' && reg.payment_status !== 'verified') return false;
      if (filter === 'pending' || filter === 'confirmed' || filter === 'declined') {
        if (reg.status !== filter) return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        reg.profile?.full_name?.toLowerCase().includes(query) ||
        reg.profile?.email?.toLowerCase().includes(query) ||
        reg.profile?.phone?.includes(query) ||
        reg.ticket_code?.toLowerCase().includes(query) ||
        reg.team_name?.toLowerCase().includes(query);
      if (!matches) return false;
    }

    return true;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--muted)]">Loading participants...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const pendingCount = registrations.filter((r) => r.status === 'pending').length;
  const confirmedCount = registrations.filter((r) => r.status === 'confirmed' || r.status === 'checked_in').length;
  const declinedCount = registrations.filter((r) => r.status === 'rejected').length;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/organizer"
            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
          >
            <ArrowLeft size={20} className="text-[var(--muted)]" />
          </Link>
          <div className="flex-1">
            <h1 className="font-serif text-2xl">Participants</h1>
            <p className="text-sm text-[var(--muted)]">{event.title}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-2xl font-bold text-[var(--accent)]">{registrations.length}</p>
            <p className="text-xs text-[var(--muted)]">Total</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
            <p className="text-xs text-[var(--muted)]">Pending</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-green-500">{confirmedCount}</p>
            <p className="text-xs text-[var(--muted)]">Confirmed</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-red-500">{declinedCount}</p>
            <p className="text-xs text-[var(--muted)]">Declined</p>
          </Card>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'confirmed', 'declined', 'paid'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, ticket..."
                className="w-full pl-9 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <Button variant="secondary" size="sm">
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Participants Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider hidden md:table-cell">
                    Registration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider hidden lg:table-cell">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-[var(--surface)]/50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                            {reg.profile?.avatar_url ? (
                              <img src={reg.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User size={16} className="text-[var(--muted)]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{reg.profile?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-[var(--muted)] font-mono">@{reg.profile?.handle}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1 text-sm">
                          <a href={`mailto:${reg.profile?.email || ''}`} className="text-[var(--muted)] hover:text-[var(--text)]">{reg.profile?.email}</a>
                          {reg.profile?.phone && <a href={`tel:${reg.profile.phone}`} className="text-[var(--muted)] hover:text-[var(--text)]">{reg.profile.phone}</a>}
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="space-y-1 text-sm">
                          <span className="font-mono text-xs">{reg.ticket_code}</span>
                          <span className="text-[var(--muted)]">{reg.created_at ? formatDateTime(reg.created_at) : '—'}</span>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell">
                        {reg.total_price > 0 ? (
                          <div className="text-sm">
                            <span className="font-medium">BDT {reg.total_price.toLocaleString()}</span>
                            {reg.payment_status && <span className="text-xs ml-2 capitalize">{reg.payment_status}</span>}
                          </div>
                        ) : (
                          <span className="text-sm text-green-500">Free</span>
                        )}
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          reg.status === 'confirmed' || reg.status === 'checked_in' ? 'bg-green-500/20 text-green-500' :
                          reg.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                          'bg-[var(--surface-2)] text-[var(--muted)]'
                        }`}>{reg.status}</span>
                      </td>
                      <td className="text-right">
                        {reg.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setShowDeclineModal(reg.id)} className="p-2 rounded hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500"><X size={16} /></button>
                            <button onClick={() => handleVerify(reg.id)} disabled={actionLoading === reg.id} className="p-2 rounded hover:bg-green-500/10 text-[var(--muted)] hover:text-green-500 disabled:opacity-50">
                              {actionLoading === reg.id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-sm text-[var(--muted)]">No participants found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md">
              <div className="p-4 border-b border-[var(--border)]">
                <h2 className="font-medium flex items-center gap-2 text-red-500">
                  <X size={18} />
                  Decline Registration
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-[var(--muted)]">
                  Are you sure you want to decline this registration? The participant will be notified via email.
                </p>

                <div className="p-3 bg-[var(--surface-2)] rounded-lg">
                  <p className="text-xs text-[var(--muted)] mb-1">Participant</p>
                  <p className="font-medium">{selectedRegistration?.profile?.full_name}</p>
                  <p className="text-xs text-[var(--muted)]">{selectedRegistration?.profile?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Reason for Decline *</label>
                  <textarea
                    value={declineComment}
                    onChange={(e) => setDeclineComment(e.target.value)}
                    placeholder="Enter the reason for declining this registration..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowDeclineModal(null);
                      setDeclineComment('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDecline(showDeclineModal)}
                    disabled={!declineComment.trim() || actionLoading !== null}
                    className="flex-1 gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10"
                  >
                    {actionLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <X size={14} />
                        Decline
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
