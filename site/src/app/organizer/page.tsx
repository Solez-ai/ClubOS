'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Stat } from '@/components/ui/Stat';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_EVENTS, MOCK_REGISTRATIONS } from '@/lib/mockData';
import { Plus, Users, QrCode, FileSpreadsheet, Megaphone, Calendar, Activity } from 'lucide-react';

export default function OrganizerDashboardPage() {
  const liveEvent = MOCK_EVENTS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-12">
        {/* Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-8">
          <div className="flex flex-col gap-1">
            <Eyebrow>ORGANIZER PORTAL</Eyebrow>
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-[var(--text)]">
              DRMC IT Club Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/organizer/events/${liveEvent.id}/qr`}>
              <Button variant="secondary" size="sm" className="gap-1.5 font-mono text-xs">
                <QrCode size={14} />
                <span>Live Venue QR</span>
              </Button>
            </Link>
            <Link href="/organizer/check-in">
              <Button variant="secondary" size="sm" className="gap-1.5 font-mono text-xs">
                <Users size={14} />
                <span>Attendee Scanner</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="p-5">
            <Stat value="312" label="TOTAL REGISTRATIONS" delta="+42 this week" />
          </Card>
          <Card className="p-5">
            <Stat value="240" label="CONFIRMED SEATS" delta="77% fill rate" />
          </Card>
          <Card className="p-5">
            <Stat value="12" label="WAITLISTED" delta="Auto-promotion active" />
          </Card>
          <Card className="p-5">
            <Stat value="68%" label="CHECK-IN RATE" delta="165 checked in" />
          </Card>
        </div>

        {/* Event Management & Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Managed Events (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[var(--text)]">Active & Upcoming Events</h2>
            </div>

            <div className="flex flex-col gap-4">
              {MOCK_EVENTS.map((ev) => (
                <Card key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs text-[var(--accent)] uppercase">{ev.category}</span>
                    <h3 className="font-serif text-lg text-[var(--text)]">{ev.title}</h3>
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {ev.registered_count} registered · {ev.checked_in_count} checked in · {ev.venue}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/organizer/events/${ev.id}/participants`}>
                      <Button variant="secondary" size="sm" className="font-mono text-xs">
                        Participants Table
                      </Button>
                    </Link>
                    <Link href={`/organizer/events/${ev.id}/qr`}>
                      <Button size="sm" className="font-mono text-xs">
                        Projector QR
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Live Activity Feed (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <Activity size={16} className="text-[var(--accent)]" />
                <h3 className="font-serif text-lg text-[var(--text)]">Live Activity Feed</h3>
              </div>

              <div className="flex flex-col gap-3 font-mono text-xs text-[var(--muted)]">
                <div className="flex flex-col gap-0.5 border-b border-[var(--border)]/50 pb-2">
                  <span className="text-[var(--text)]">Tanvir Hossain registered for AI Web Dev</span>
                  <span className="text-[10px] text-[var(--accent)]">2 mins ago</span>
                </div>
                <div className="flex flex-col gap-0.5 border-b border-[var(--border)]/50 pb-2">
                  <span className="text-[var(--text)]">Nabil Rahman checked in at Keynote</span>
                  <span className="text-[10px] text-[var(--accent)]">15 mins ago</span>
                </div>
                <div className="flex flex-col gap-0.5 border-b border-[var(--border)]/50 pb-2">
                  <span className="text-[var(--text)]">Waitlist auto-promoted: Samiul Islam</span>
                  <span className="text-[10px] text-[var(--accent)]">1 hour ago</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
