'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { ArrowLeft, Camera, CheckCircle2, UserCheck } from 'lucide-react';

export default function OrganizerCheckInPage() {
  const [ticketInput, setTicketInput] = useState('');
  const [lastCheckIn, setLastCheckIn] = useState<{ ticket_code: string; participant: string; handle: string; event: string; status: string; time: string } | null>(null);
  const [count, setCount] = useState(12);

  const handleCheckIn = (code: string) => {
    setLastCheckIn({
      ticket_code: code || 'TC2026-WEB1',
      participant: 'Tanvir Hossain',
      handle: 'tanvir_hossain',
      event: 'AI Web Development Contest',
      status: 'checked_in',
      time: new Date().toLocaleTimeString(),
    });
    setCount((prev) => prev + 1);
    setTicketInput('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[700px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-8 flex-1 items-center justify-center">
        <div className="w-full flex items-center justify-between">
          <Link href="/organizer" className="font-mono text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1">
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </Link>
          <Eyebrow>ORGANIZER ATTENDEE SCANNER</Eyebrow>
        </div>

        <Card className="w-full flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <h2 className="font-serif text-2xl text-[var(--text)]">Scan Ticket QR</h2>
            <span className="font-mono text-xs text-[var(--accent)] font-medium">
              Checked In: {count}
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCheckIn(ticketInput);
            }}
            className="flex flex-col gap-4"
          >
            <Input
              label="Enter Participant Ticket Code"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              placeholder="e.g. TC2026-WEB1"
              className="font-mono text-sm"
              required
            />
            <Button type="submit" className="w-full gap-2">
              <UserCheck size={16} />
              <span>Verify & Check In Participant</span>
            </Button>
          </form>
        </Card>

        {/* Visual Result Card (Audio-free) */}
        {lastCheckIn && (
          <Card className="w-full border-[var(--success)]/60 bg-[var(--surface)] p-6 flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--success)]">
                <CheckCircle2 size={20} />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                  CHECK-IN SUCCESSFUL
                </span>
              </div>
              <span className="font-mono text-xs text-[var(--muted)]">{lastCheckIn.time}</span>
            </div>

            <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-3">
              <h3 className="font-serif text-xl text-[var(--text)]">{lastCheckIn.participant}</h3>
              <span className="font-mono text-xs text-[var(--accent)]">@{lastCheckIn.handle}</span>
              <span className="font-mono text-xs text-[var(--muted)] mt-1">{lastCheckIn.event}</span>
            </div>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
