'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, QrCode } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Stat } from '@/components/ui/Stat';
import { Reveal } from '@/components/ui/Reveal';
import { FestCard } from '@/components/cards/FestCard';
import { EventCard } from '@/components/cards/EventCard';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const [fests, setFests] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = React.useMemo(() => {
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

      // Fetch published fests
      const { data: festsData } = await supabase
        .from('fests')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (festsData) setFests(festsData);

      // Fetch upcoming published events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, fest:fest_id(title, slug)')
        .eq('is_published', true)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(3);

      if (eventsData) setEvents(eventsData);

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative w-full pt-12 sm:pt-20 pb-20 sm:pb-32 overflow-hidden border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <Reveal>
              <Eyebrow className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                9th DRMC International Tech Carnival 2026
              </Eyebrow>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 className="font-serif text-5xl sm:text-7xl lg:text-[80px] leading-[1.05] tracking-tight font-light text-[var(--text)]">
                One passport for every fest.
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-lg sm:text-xl text-[var(--muted)] font-normal max-w-xl leading-relaxed">
                Discover fests, register for contests, scan venue QR codes to collect digital stamps, and own your verified student tech passport.
              </p>
            </Reveal>

            <Reveal delay={0.3} className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/fests">
                <Button size="lg" className="gap-2">
                  <span>Explore Fests</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/passport">
                <Button variant="secondary" size="lg" className="gap-2">
                  <Compass size={16} />
                  <span>View Your Passport</span>
                </Button>
              </Link>
            </Reveal>
          </div>

          {/* Right Column (5 cols) — Empty state or CTA */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <Reveal delay={0.2} className="w-full max-w-md">
              <Card className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
                  <Compass size={32} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-serif text-xl mb-2">Your Passport Awaits</h3>
                <p className="text-sm text-[var(--muted)] mb-4">
                  Sign up to get your digital passport and start collecting stamps across all fests.
                </p>
                <Link href="/signup">
                  <Button size="lg" className="gap-2 mx-auto w-fit">
                    <span>Create Your Passport</span>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STAT STRIP (Hairline separated) */}
      <section className="w-full border-b border-[var(--border)] bg-[var(--surface)]/50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat value="Real-time" label="Live Data" delta="From your database" />
          <Stat value="Dynamic" label="Fests" delta="Published events only" />
          <Stat value="Actual" label="Events" delta="Upcoming only" />
          <Stat value="Secure" label="Platform" delta="Built for real use" />
        </div>
      </section>

      {/* SECTION 01 — FESTS */}
      <section className="w-full py-20 sm:py-28 border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Eyebrow>01 — FEST DIRECTORY</Eyebrow>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text)] tracking-tight">
                Featured Fests
              </h2>
            </div>
            <Link href="/fests">
              <Button variant="ghost" className="gap-1.5 p-0 text-sm">
                <span>View all fests</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-[var(--surface-2)] rounded-xl animate-pulse" />
              ))
            ) : fests.length > 0 ? (
              fests.map((fest: any) => (
                <FestCard key={fest.id} fest={fest} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-[var(--muted)]">No fests published yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 02 — HOW IT WORKS */}
      <section className="w-full py-20 sm:py-28 border-b border-[var(--border)] bg-[var(--surface)]/30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-16">
          <div className="flex flex-col gap-2 max-w-xl">
            <Eyebrow>02 — HOW IT WORKS</Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text)] tracking-tight">
              An ecosystem, not just forms.
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Participants build a persistent digital credentials passport across every fest they attend.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="flex flex-col gap-4">
              <div className="font-mono text-3xl font-light text-[var(--accent)]">01</div>
              <h3 className="font-serif text-xl font-normal text-[var(--text)]">Get Your Passport</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Sign up in seconds to generate your unique passport number (`CL-2026-XXXXXX`) and handle. Customize your student profile and institution.
              </p>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="font-mono text-3xl font-light text-[var(--accent)]">02</div>
              <h3 className="font-serif text-xl font-normal text-[var(--text)]">Register & Waitlist</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Register for web contests, CP challenges, and robotics. Automatic waitlist promotion frees seats instantly when spots open up.
              </p>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="font-mono text-3xl font-light text-[var(--accent)]">03</div>
              <h3 className="font-serif text-xl font-normal text-[var(--text)]">Scan & Collect Stamps</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Scan venue QR codes at events to ink digital stamps into your passport, level up XP, earn rarity badges, and issue verified PDF certificates.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 03 — UPCOMING EVENTS */}
      <section className="w-full py-20 sm:py-28 border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Eyebrow>03 — UPCOMING EVENTS</Eyebrow>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text)] tracking-tight">
                Live & Upcoming Events
              </h2>
            </div>
            <Link href="/events">
              <Button variant="ghost" className="gap-1.5 p-0 text-sm">
                <span>Browse all events</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-[var(--surface-2)] rounded-xl animate-pulse" />
              ))
            ) : events.length > 0 ? (
              events.map((ev: any) => (
                <EventCard key={ev.id} event={ev} festName={ev.fest?.title} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-[var(--muted)]">No upcoming events</p>
              </div>
            )}
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
}
