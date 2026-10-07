'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { generateRotatingToken } from '@/lib/qr';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function VenueQRPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<{ id: string; title: string; venue: string | null; checkin_token: string; fest?: { id: string; title: string } | null } | null>(null);
  const [checkedIn, setCheckedIn] = useState(0);
  const [token, setToken] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return createClient();
  }, []);

  // Load event + live check-in count
  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: eventData } = await supabase
        .from('events')
        .select('*, fest:fest_id(title)')
        .eq('id', eventId)
        .single();

      if (eventData && typeof eventData === 'object') {
        setEvent(eventData as { id: string; title: string; venue: string | null; checkin_token: string; fest?: { id: string; title: string } | null });
      } else {
        setEvent(null);
      }

      if (eventData) {
        const { count } = await supabase
          .from('registrations')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', eventData.id)
          .not('checked_in_at', 'is', null);
        setCheckedIn(typeof count === 'number' ? count : 0);
      }

      setLoading(false);
    };

    load();
  }, [supabase, eventId]);

  // Rotating QR token
  useEffect(() => {
    if (!event?.checkin_token) return;

    const updateQR = () => {
      setToken(generateRotatingToken(event.checkin_token));
      setSecondsLeft(30);
    };

    updateQR();
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          updateQR();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [event?.checkin_token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0C0A] text-[#F3EFE6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0D0C0A] text-[#F3EFE6] flex flex-col items-center justify-center gap-4">
        <h1 className="font-serif text-3xl">Event Not Found</h1>
        <Link href="/organizer">
          <Button variant="secondary" size="sm">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0C0A] text-[#F3EFE6] flex flex-col items-center justify-between p-8">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <Link
          href="/organizer"
          className="font-mono text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Organizer Dashboard</span>
        </Link>
        <div className="font-mono text-xs text-[var(--accent)] border border-[var(--accent)]/40 px-3 py-1 rounded uppercase tracking-wider">
          LIVE PROJECTOR VENUE QR
        </div>
      </div>

      {/* Center QR Display */}
      <div className="flex flex-col items-center text-center gap-6 max-w-xl my-auto">
        <div className="flex flex-col gap-1">
          {event.fest?.title && (
            <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-widest">
              {event.fest.title}
            </span>
          )}
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-[var(--text)]">
            {event.title}
          </h1>
          {event.venue && <span className="font-mono text-xs text-[var(--muted)]">{event.venue}</span>}
        </div>

        {token && (
          <div className="relative p-6 bg-white rounded-[16px] shadow-2xl border-4 border-[var(--accent)] flex flex-col items-center gap-3">
            <QRCodeSVG value={`https://clubos.dev/scan?t=${token}`} size={260} level="H" />
            <span className="font-mono text-xs text-black font-semibold tracking-wider">
              TOKEN: {token}
            </span>
          </div>
        )}

        <div className="flex items-center gap-6 font-mono text-xs text-[var(--muted)]">
          <div className="flex items-center gap-1.5">
            <RefreshCw size={14} className="text-[var(--accent)] animate-spin" />
            <span>Refreshes in {secondsLeft}s (HMAC Signed)</span>
          </div>
          <span>·</span>
          <span className="text-[var(--text)] font-medium">CHECKED IN: {checkedIn}</span>
        </div>
      </div>

      <div className="font-mono text-xs text-[var(--muted)] text-center">
        Point phone camera inside ClubOS app or scan native QR to collect stamp & check in.
      </div>
    </div>
  );
}
