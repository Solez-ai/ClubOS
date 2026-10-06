'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PassportCard } from '@/components/ui/PassportCard';
import { Stamp } from '@/components/ui/Stamp';
import { calculateLevel } from '@/lib/xp';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Lock, AlertCircle } from 'lucide-react';

export default function PublicPassportPage() {
  const params = useParams();
  const handle = params.handle as string;
  const [profile, setProfile] = useState<any>(null);
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('handle', handle)
        .single();

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(profileData);

      if (profileData.passport_public !== false) {
        const { data: stampsData } = await supabase
          .from('stamps')
          .select('*, event:events(title)')
          .eq('user_id', profileData.id)
          .order('earned_at', { ascending: false });
        setStamps(stampsData || []);
      }

      setLoading(false);
    };

    load();
  }, [supabase, handle]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <AlertCircle size={40} className="text-[var(--muted)]" />
          <h1 className="font-serif text-3xl">Passport Not Found</h1>
          <p className="text-sm text-[var(--muted)]">No member found with the handle @{handle}.</p>
          <Link href="/"><Button variant="secondary" size="sm">Back to Home</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (profile.passport_public === false) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <Lock size={40} className="text-[var(--muted)]" />
          <h1 className="font-serif text-3xl">This passport is private.</h1>
          <p className="text-sm text-[var(--muted)]">
            The member has chosen to keep their passport statistics and achievements hidden.
          </p>
          <Link href="/"><Button variant="secondary" size="sm">Back to Home</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const levelInfo = calculateLevel(profile.xp ?? 0);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[var(--border)] pb-12">
          <div className="lg:col-span-6 flex justify-center lg:justify-start">
            <PassportCard profile={profile} />
          </div>

          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <Eyebrow>PUBLIC STUDENT PASSPORT</Eyebrow>
              <h1 className="font-serif text-3xl sm:text-4xl font-light text-[var(--text)]">
                {profile.full_name}
              </h1>
              <span className="font-mono text-sm text-[var(--accent)]">@{profile.handle}</span>
            </div>

            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {profile.bio || 'Student technologist participating in campus carnivals and contests.'}
            </p>

            <div className="flex flex-col gap-2 bg-[var(--surface)] p-5 rounded-[10px] border border-[var(--border)] w-fit">
              <div className="flex items-center justify-between font-mono text-xs gap-8">
                <span className="text-[var(--text)] font-medium">
                  LEVEL {levelInfo.romanLevel} · {levelInfo.title}
                </span>
                <span className="text-[var(--accent)] font-medium">{profile.xp} XP</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button className="gap-2">
                <UserPlus size={15} />
                <span>Connect Passport</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <h2 className="font-serif text-2xl text-[var(--text)]">Verified Stamps</h2>
          {stamps.length > 0 ? (
            <div className="flex flex-wrap gap-8 items-center">
              {stamps.map((stamp) => (
                <Stamp
                  key={stamp.id}
                  id={stamp.id}
                  title={stamp.event?.title || 'Stamp'}
                  earned={true}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No stamps collected yet.</p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
