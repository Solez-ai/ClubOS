'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, QrCode, ShieldCheck, Sparkles, Calendar, CheckCircle2, User, Building2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        setUserRole(profile?.role || 'participant');
      }
    };
    checkAuth();
  }, []);

  const dashboardHref = userRole === 'organizer' ? '/organizer' : '/events';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      {/* HERO SECTION — What is ClubOS */}
      <section className="relative w-full pt-12 sm:pt-20 pb-20 sm:pb-32 overflow-hidden border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <Reveal>
              <Eyebrow className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                Smart Club Operations Ecosystem
              </Eyebrow>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 className="font-serif text-5xl sm:text-7xl lg:text-[76px] leading-[1.05] tracking-tight font-light text-[var(--text)]">
                One platform for every club event.
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-lg sm:text-xl text-[var(--muted)] font-normal max-w-xl leading-relaxed">
                ClubOS connects campus clubs with participants. Organizers create fests, events, and paid segments.
                Participants discover events, register, pay with bKash or Nagad, and track everything in one place.
              </p>
            </Reveal>

            <Reveal delay={0.3} className="flex flex-wrap items-center gap-4 pt-2">
              {isLoggedIn ? (
                <Link href={dashboardHref}>
                  <Button size="lg" className="gap-2">
                    <span>Go to Your Dashboard</span>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="gap-2">
                      <span>Get Started Free</span>
                      <ArrowRight size={16} />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary" size="lg" className="gap-2">
                      <span>Sign In</span>
                    </Button>
                  </Link>
                </>
              )}
            </Reveal>
          </div>

          {/* Right Column — Role cards */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Reveal delay={0.2}>
              <Card className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-1">For Participants</h3>
                  <p className="text-sm text-[var(--muted)]">
                    Browse the event feed, filter by tags and dates, register in minutes, and pay securely with bKash or Nagad.
                  </p>
                </div>
              </Card>
            </Reveal>
            <Reveal delay={0.3}>
              <Card className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] text-[var(--text)] flex items-center justify-center shrink-0">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-1">For Organizers</h3>
                  <p className="text-sm text-[var(--muted)]">
                    Create fests and events with segments and pricing, then manage participants and verify payments from one dashboard.
                  </p>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 01 — How it works for Organizers */}
      <section className="w-full py-20 sm:py-28 border-b border-[var(--border)] bg-[var(--surface)]/30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-12">
          <div className="flex flex-col gap-2 max-w-xl">
            <Eyebrow>FOR ORGANIZERS</Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text)] tracking-tight">
              From idea to a fully-managed event.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="flex flex-col gap-4">
              <div className="font-mono text-3xl font-light text-[var(--accent)]">01</div>
              <h3 className="font-serif text-xl font-normal text-[var(--text)]">Create a Fest</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Set up your fest with a title, description, cover image, and a Google Maps location so participants know exactly where to go.
              </p>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="font-mono text-3xl font-light text-[var(--accent)]">02</div>
              <h3 className="font-serif text-xl font-normal text-[var(--text)]">Add Events & Segments</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Build events with multiple segments. Choose tags like Science & Technology or Music & Art, set prices, or make segments free. Pick bKash or Nagad and send money or pay bill for each paid segment.
              </p>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="font-mono text-3xl font-light text-[var(--accent)]">03</div>
              <h3 className="font-serif text-xl font-normal text-[var(--text)]">Verify & Manage</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Registrations appear instantly in your participant table with unique ticket IDs. Verify or decline payments with a comment, and participants are notified by email.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 02 — How it works for Participants */}
      <section className="w-full py-20 sm:py-28 border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-12">
          <div className="flex flex-col gap-2 max-w-xl">
            <Eyebrow>FOR PARTICIPANTS</Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text)] tracking-tight">
              Discover, register, and track it all.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="flex flex-col gap-4">
              <div className="font-mono text-3xl font-light text-[var(--accent)]">01</div>
              <h3 className="font-serif text-xl font-normal text-[var(--text)]">Explore the Feed</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                A live home feed of active events from organizers. Powerful search and feature-filled filters — date ranges, categories, and dozens of tags.
              </p>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="font-mono text-3xl font-light text-[var(--accent)]">02</div>
              <h3 className="font-serif text-xl font-normal text-[var(--text)]">Register & Pay</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Fill the registration form, pick your segments, and see the total price instantly. Free events skip payment — paid ones accept bKash or Nagad with a screenshot, transaction ID, and mobile number.
              </p>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="font-mono text-3xl font-light text-[var(--accent)]">03</div>
              <h3 className="font-serif text-xl font-normal text-[var(--text)]">Track Your History</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Every registration gets a unique ID. See your full history in the Manage tab — active events highlighted, past events grayed out, with payment details and segments.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 03 — Features grid */}
      <section className="w-full py-20 sm:py-28 border-b border-[var(--border)] bg-[var(--surface)]/30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-12">
          <div className="flex flex-col gap-2 max-w-xl">
            <Eyebrow>EVERYTHING INCLUDED</Eyebrow>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text)] tracking-tight">
              Built for real campus operations.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building2, title: 'Role-Based Accounts', desc: 'Sign up as a participant or organizer — each gets their own tailored workspace.' },
              { icon: Calendar, title: 'Fests & Events', desc: 'Organize multi-day carnivals with unlimited events and segments under each fest.' },
              { icon: Sparkles, title: 'Rich Category Tags', desc: 'Science & Tech, Music & Art, Robotics, Gaming, Business, and many more.' },
              { icon: QrCode, title: 'Payments Made Simple', desc: 'bKash and Nagad with send-money or pay-bill flows, screenshot proof, and manual verification.' },
              { icon: ShieldCheck, title: 'Verification Workflow', desc: 'Organizers verify or decline payments with comments; unique ticket IDs issued on approval.' },
              { icon: CheckCircle2, title: 'Email Notifications', desc: 'Automated confirmation emails with event details, segments, and payment instructions.' },
            ].map((feature) => (
              <Card key={feature.title} className="flex flex-col gap-3 p-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                  <feature.icon size={20} className="text-[var(--accent)]" />
                </div>
                <h3 className="font-medium text-lg">{feature.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="w-full py-20 sm:py-28">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 text-center flex flex-col gap-6 items-center">
          <Eyebrow>READY TO START?</Eyebrow>
          <h2 className="font-serif text-4xl sm:text-5xl font-normal text-[var(--text)] tracking-tight">
            Create your account in minutes.
          </h2>
          <p className="text-[var(--muted)] max-w-lg">
            Whether you run a club or love joining events — ClubOS has the right tools for you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {isLoggedIn ? (
              <Link href={dashboardHref}>
                <Button size="lg" className="gap-2">
                  <span>Open Your Dashboard</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    <Compass size={16} />
                    <span>Sign Up as Participant or Organizer</span>
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
