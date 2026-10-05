import React from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, QrCode, ShieldCheck, Trophy, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Stat } from '@/components/ui/Stat';
import { Reveal } from '@/components/ui/Reveal';
import { FestCard } from '@/components/cards/FestCard';
import { EventCard } from '@/components/cards/EventCard';
import { PassportCard } from '@/components/ui/PassportCard';
import { Card } from '@/components/ui/Card';
import { MOCK_FESTS, MOCK_EVENTS, MOCK_PROFILES } from '@/lib/mockData';

export default function HomePage() {
  const featuredFests = MOCK_FESTS;
  const upcomingEvents = MOCK_EVENTS.slice(0, 3);
  const demoProfile = MOCK_PROFILES[1];

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

          {/* Right Column (5 cols) — Passport Card Preview */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <Reveal delay={0.2} className="w-full max-w-md">
              <div className="relative">
                <PassportCard profile={demoProfile} />
                <div className="text-center mt-3 font-mono text-xs text-[var(--muted)]">
                  Click card to flip front / back QR
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STAT STRIP (Hairline separated) */}
      <section className="w-full border-b border-[var(--border)] bg-[var(--surface)]/50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat value="3,000+" label="Participants" delta="From 150+ institutions" />
          <Stat value="03" label="Fests Seeded" delta="Carnival, Winter, Freshers" />
          <Stat value="16+" label="Events & Contests" delta="Web, CP, AI, Robotics, Gaming" />
          <Stat value="01" label="Unified Passport" delta="Digital Stamps & XP Ledger" />
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
            {featuredFests.map((fest) => (
              <FestCard key={fest.id} fest={fest} />
            ))}
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
            {upcomingEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} festName="9th DRMC Tech Carnival 2026" />
            ))}
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
}
