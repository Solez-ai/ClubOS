'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { Trophy } from 'lucide-react';
import { calculateLevel } from '@/lib/xp';

interface ProfileRow {
  id: string;
  handle: string;
  full_name: string;
  xp: number;
  institution?: string | null;
}

export default function LeaderboardPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

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
      const { data } = await supabase
        .from('profiles')
        .select('id, handle, full_name, xp, institution')
        .order('xp', { ascending: false })
        .limit(100);
      setProfiles(data || []);
      setLoading(false);
    };
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sorted = [...profiles].sort((a, b) => b.xp - a.xp);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-12">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-8">
          <Eyebrow>RANKINGS</Eyebrow>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-[var(--text)]">
            Global XP Leaderboard
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-xl">
            Participants earn XP by registering for events, checking in at venues, and earning achievement badges.
          </p>
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-16">
            No participants yet — the leaderboard fills up as people join and earn XP.
          </p>
        ) : (
          <>
            {/* TOP 3 PODIUM */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
                {top3.map((p, idx) => {
                  const levelInfo = calculateLevel(p.xp);
                  const orderClasses = [
                    'md:order-1',
                    'md:order-2 md:-translate-y-4 border-[var(--accent)]',
                    'md:order-3',
                  ];
                  return (
                    <Card key={p.id} className={`flex flex-col items-center text-center p-6 gap-4 ${orderClasses[idx]}`}>
                      <div className="relative w-16 h-16 rounded-full bg-[var(--surface-2)] border border-[var(--accent)] flex items-center justify-center font-serif text-2xl text-[var(--accent)]">
                        {p.full_name.charAt(0)}
                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] font-mono text-xs flex items-center justify-center font-bold">
                          {idx === 0 ? 2 : idx === 1 ? 1 : 3}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <h3 className="font-serif text-xl font-normal text-[var(--text)]">{p.full_name}</h3>
                        <Link href={`/u/${p.handle}`} className="font-mono text-xs text-[var(--accent)] hover:underline">
                          @{p.handle}
                        </Link>
                        {p.institution && <span className="text-xs text-[var(--muted)] mt-1">{p.institution}</span>}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-sm text-[var(--accent)] font-medium pt-2 border-t border-[var(--border)] w-full justify-center">
                        <Trophy size={16} />
                        <span>{p.xp} XP</span>
                        <span className="text-[var(--muted)]">· Level {levelInfo.romanLevel}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* FULL RANKINGS */}
            <div className="flex flex-col gap-4">
              <h2 className="font-serif text-2xl text-[var(--text)]">Full Rankings</h2>
              <Card className="p-0 overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left font-sans text-sm">
                    <thead className="bg-[var(--surface-2)] font-mono text-xs text-[var(--muted)] uppercase">
                      <tr>
                        <th className="py-3.5 px-4 font-normal">RANK</th>
                        <th className="py-3.5 px-4 font-normal">PARTICIPANT</th>
                        <th className="py-3.5 px-4 font-normal">INSTITUTION</th>
                        <th className="py-3.5 px-4 font-normal">LEVEL</th>
                        <th className="py-3.5 px-4 font-normal text-right">TOTAL XP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {sorted.map((p, idx) => {
                        const levelInfo = calculateLevel(p.xp);
                        return (
                          <tr key={p.id} className="hover:bg-[var(--surface-2)] transition-colors">
                            <td className="py-4 px-4 font-mono text-xs font-medium text-[var(--muted)]">#{idx + 1}</td>
                            <td className="py-4 px-4 font-medium text-[var(--text)]">
                              <Link href={`/u/${p.handle}`} className="hover:text-[var(--accent)] transition-colors">
                                {p.full_name} <span className="font-mono text-xs text-[var(--muted)]">(@{p.handle})</span>
                              </Link>
                            </td>
                            <td className="py-4 px-4 text-xs text-[var(--muted)]">{p.institution || '—'}</td>
                            <td className="py-4 px-4 font-mono text-xs text-[var(--text)]">
                              Level {levelInfo.romanLevel} ({levelInfo.title})
                            </td>
                            <td className="py-4 px-4 font-mono text-xs text-[var(--accent)] font-medium text-right tabular-nums">
                              {p.xp} XP
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
