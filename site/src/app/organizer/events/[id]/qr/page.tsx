'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { generateRotatingToken } from '@/lib/qr';
import { MOCK_EVENTS } from '@/lib/mockData';
import { ArrowLeft, RefreshCw, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function VenueQRPage() {
  const event = MOCK_EVENTS[0];
  const [token, setToken] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    const updateQR = () => {
      const newToken = generateRotatingToken(event.checkin_token);
      setToken(newToken);
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
  }, [event.checkin_token]);

  return (
    <div className="min-h-screen bg-[#0D0C0A] text-[#F3EFE6] flex flex-col items-center justify-between p-8">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <Link href="/organizer" className="font-mono text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1.5">
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
          <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-widest">
            {event.fest?.title}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-[var(--text)]">
            {event.title}
          </h1>
          <span className="font-mono text-xs text-[var(--muted)]">{event.venue}</span>
        </div>

        {/* Big Rotating QR Code Card */}
        <div className="relative p-6 bg-white rounded-[16px] shadow-2xl border-4 border-[var(--accent)] flex flex-col items-center gap-3">
          <QRCodeSVG value={`https://clubos.dev/scan?t=${token}`} size={260} level="H" />
          <span className="font-mono text-xs text-black font-semibold tracking-wider">
            TOKEN: {token}
          </span>
        </div>

        {/* Rotation Timer & Check-in Counter */}
        <div className="flex items-center gap-6 font-mono text-xs text-[var(--muted)]">
          <div className="flex items-center gap-1.5">
            <RefreshCw size={14} className="text-[var(--accent)] animate-spin" />
            <span>Refreshes in {secondsLeft}s (HMAC Signed)</span>
          </div>
          <span>·</span>
          <span className="text-[var(--text)] font-medium">CHECKED IN: 12 / 50</span>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="font-mono text-xs text-[var(--muted)] text-center">
        Point phone camera inside ClubOS app or scan native QR to collect stamp & check in.
      </div>
    </div>
  );
}
