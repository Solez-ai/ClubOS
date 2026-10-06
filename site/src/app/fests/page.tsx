'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { FestCard } from '@/components/cards/FestCard';
import { createClient } from '@/lib/supabase/client';

export default function FestsPage() {
  const [fests, setFests] = useState<any[]>([]);
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

      const { data, error } = await supabase
        .from('fests')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (data) setFests(data);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const ongoingFests = fests.filter((f: any) => new Date(f.start_date) <= new Date() && new Date(f.end_date) >= new Date());
  const upcomingFests = fests.filter((f: any) => new Date(f.start_date) > new Date());
  const pastFests = fests.filter((f: any) => new Date(f.end_date) < new Date());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--muted)]">Loading fests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-8">
          <Eyebrow>DIRECTORY</Eyebrow>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-[var(--text)]">
            Fest Directory
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-xl">
            Explore technology carnivals, hackathons, and science summits organized by campus clubs.
          </p>
        </div>

        {/* Ongoing Fests */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
            <h2 className="font-serif text-2xl text-[var(--text)]">Ongoing Fests</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ongoingFests.length > 0 ? (
              ongoingFests.map((fest) => <FestCard key={fest.id} fest={fest} />)
            ) : (
              <div className="col-span-3 text-sm text-[var(--muted)] font-mono py-8">
                No fests actively running today.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Fests */}
        <div className="flex flex-col gap-6">
          <h2 className="font-serif text-2xl text-[var(--text)]">Upcoming Fests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {upcomingFests.map((fest) => (
              <FestCard key={fest.id} fest={fest} />
            ))}
          </div>
        </div>

        {/* Past Fests */}
        {pastFests.length > 0 && (
          <div className="flex flex-col gap-6 opacity-75">
            <h2 className="font-serif text-2xl text-[var(--muted)]">Past Fests</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pastFests.map((fest) => (
                <FestCard key={fest.id} fest={fest} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
