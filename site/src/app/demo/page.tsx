'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

/**
 * Demo page – shows the mock data UI (including the Shovro participant).
 * This page is public and does not require authentication.
 */
export default function DemoPage() {
  const [orgs, setOrgs] = useState([]);
  const [events, setEvents] = useState([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const supabase = React.useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    // Load mock data directly – this is the same as the home page but kept separate for demo mode.
    // In a real deployment we would fetch from Supabase, but the demo intentionally uses static mock data.
    // The mock data module is already tree‑shaken; importing it here is safe.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MOCK_FESTS, MOCK_EVENTS, MOCK_PROFILES } = require('@/lib/mockData');
    setOrgs(MOCK_FESTS);
    setEvents(MOCK_EVENTS);
    setProfiles(MOCK_PROFILES);
  }, []);

  const demoProfile = profiles[1] ?? null; // Shovro Hossain

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-10">
        <section className="border-b pb-8">
          <h1 className="text-3xl font-serif mb-4">Demo Mode</h1>
          <p className="text-[var(--muted)] max-w-xl">
            This page uses static mock data to illustrate the UI. Real users will see live data.
          </p>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {orgs.map((fest: any) => (
            <Card key={fest.id} className="p-4">
              <h3 className="font-serif text-xl mb-2">{fest.title}</h3>
              <p className="text-sm text-[var(--muted)]">{fest.tagline}</p>
            </Card>
          ))}
        </section>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.slice(0, 6).map((ev: any) => (
            <Card key={ev.id} className="p-4">
              <h4 className="font-medium">{ev.title}</h4>
              <p className="text-sm text-[var(--muted)]">{ev.description}</p>
            </Card>
          ))}
        </section>
        <section className="mt-8">
          <h2 className="font-serif text-2xl mb-4">Demo Participant</h2>
          {demoProfile ? (
            <Card className="p-4 max-w-sm">
              <p><strong>Name:</strong> {demoProfile.full_name}</p>
              <p><strong>Handle:</strong> {demoProfile.handle}</p>
              <p><strong>Institution:</strong> {demoProfile.institution}</p>
            </Card>
          ) : (
            <Card className="p-4 max-w-sm">
              <p>Loading demo participant data...</p>
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
