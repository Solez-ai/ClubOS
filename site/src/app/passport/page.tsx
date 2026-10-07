'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { PassportCard } from '@/components/ui/PassportCard';
import { Stamp } from '@/components/ui/Stamp';
import { Medallion } from '@/components/ui/Medallion';
import { StatusPill } from '@/components/ui/StatusPill';
import { calculateLevel } from '@/lib/xp';
import { createClient } from '@/lib/supabase/client';
import { RegStatus } from '@/lib/types';
import { Share2 } from 'lucide-react';

interface ProfileRow {
  id: string;
  handle: string;
  full_name: string;
  email: string;
  xp: number;
  passport_no: string;
  bio?: string | null;
  institution?: string | null;
  avatar_url?: string | null;
}

export default function PassportPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [myFests, setMyFests] = useState<{ id: string; title: string; slug: string; tagline: string | null }[]>([]);
  const [myStamps, setMyStamps] = useState<{ id: string; kind: 'event' | 'fest'; earned_at: string; event: { title: string } | null; fest: { title: string } | null }[]>([]);
  const [myBadges, setMyBadges] = useState<{ badge: { id: string; name: string; description: string | null; icon: string | null; rings: number | null; xp_reward: number | null }; earned: boolean }[]>([]);
  const [myRegs, setMyRegs] = useState<{ id: string; status: RegStatus; ticket_code: string; event: { id: string; title: string; venue: string | null; slug: string; fest?: { id: string; title: string; slug: string } | null } | null }[]>([]);
  const [connections, setConnections] = useState<{ id: string; full_name: string; handle: string }[]>([]);
  const [activeTab, setActiveTab] = useState('fests');
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

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      setProfile(profileData);

      // Registrations -> events + fests
      const { data: regs } = await supabase
        .from('registrations')
        .select('*, event:events(*, fest:fest_id(*))')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false });
      setMyRegs(regs || []);

      // Derive unique fests from registrations
      const festMap = new Map<string, { id: string; title: string; slug: string; tagline: string | null }>();
      ((regs || []) as { event?: { fest?: { id: string; title: string; slug: string; tagline: string | null } | null } | null }[]).forEach((r) => {
        if (r.event?.fest && !festMap.has(r.event.fest.id)) {
          festMap.set(r.event.fest.id, r.event.fest);
        }
      });
      setMyFests(Array.from(festMap.values()));

      // Stamps
      const { data: stamps } = await supabase
        .from('stamps')
        .select('*, event:events(title), fest:fests(title)')
        .eq('user_id', authData.user.id)
        .order('earned_at', { ascending: false });
      setMyStamps(stamps || []);

      // Badges (catalog + earned)
      const { data: badgeCatalog } = await supabase.from('badges').select('*');
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', authData.user.id);
      const earnedIds = new Set<string>();
      (userBadges || []).forEach((ub) => {
        if (ub.badge_id) {
          earnedIds.add(ub.badge_id);
        }
      });
      setMyBadges((badgeCatalog || []).map((b) => ({ badge: b as { id: string; name: string; description: string | null; icon: string | null; rings: number | null; xp_reward: number | null }, earned: earnedIds.has(b.id) })));

      // Connections
      const { data: connsA } = await supabase
        .from('connections')
        .select('*, a:profiles!connections_user_a_fkey(*)')
        .eq('user_b', authData.user.id);
      const { data: connsB } = await supabase
        .from('connections')
        .select('*, b:profiles!connections_user_b_fkey(*)')
        .eq('user_a', authData.user.id);
      type ConnProfile = { id: string; full_name: string; handle: string };
      const conns = [
        ...(connsA || []).map((c) => c.a as ConnProfile | null),
        ...(connsB || []).map((c) => c.b as ConnProfile | null),
      ].filter((c): c is ConnProfile => c !== null && typeof c.full_name === 'string' && typeof c.handle === 'string');
      setConnections(conns);

      setLoading(false);
    };

    load();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--muted)]">Loading passport...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Link href="/login"><Button>Sign In to View Passport</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const levelInfo = calculateLevel(profile.xp ?? 0);
  const tabs = [
    { id: 'fests', label: 'My Fests', count: myFests.length },
    { id: 'stamps', label: 'Stamps', count: myStamps.length },
    { id: 'badges', label: 'Badges', count: myBadges.filter((b) => b.earned).length },
    { id: 'tickets', label: 'Tickets & Regs', count: myRegs.length },
    { id: 'connections', label: 'Connections', count: connections.length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-12">
        {/* Header: Passport Card + XP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[var(--border)] pb-12">
          <div className="lg:col-span-6 flex justify-center lg:justify-start">
            <PassportCard profile={profile} />
          </div>

          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <Eyebrow>PARTICIPANT PASSPORT</Eyebrow>
              <h1 className="font-serif text-3xl sm:text-4xl font-light text-[var(--text)]">
                {profile.full_name}
              </h1>
              <span className="font-mono text-sm text-[var(--accent)]">@{profile.handle}</span>
            </div>

            <div className="flex flex-col gap-2 bg-[var(--surface)] p-5 rounded-[10px] border border-[var(--border)]">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[var(--text)] font-medium">
                  LEVEL {levelInfo.romanLevel} · {levelInfo.title}
                </span>
                <span className="text-[var(--accent)] font-medium">
                  {profile.xp} XP / {levelInfo.nextLevelXp} XP
                </span>
              </div>
              <div className="w-full h-[3px] bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-500"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-[var(--muted)]">
                {Math.max(0, levelInfo.nextLevelXp - profile.xp)} XP needed for Level {levelInfo.level + 1}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/u/${profile.handle}`}>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Share2 size={14} />
                  <span>Public Passport</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col gap-8">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {/* MY FESTS */}
          {activeTab === 'fests' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myFests.length > 0 ? (
                myFests.map((fest) => {
                  const festRegs = myRegs.filter((r) => r.event?.fest?.id === fest.id);
                  return (
                    <Card key={fest.id} className="flex flex-col justify-between gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="font-mono text-xs text-[var(--accent)]">FEST PASS</span>
                        <h3 className="font-serif text-2xl text-[var(--text)]">{fest.title}</h3>
                        {fest.tagline && <p className="text-xs text-[var(--muted)]">{fest.tagline}</p>}
                      </div>
                      <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 font-mono text-xs text-[var(--muted)]">
                        <div className="flex justify-between">
                          <span>YOUR REGISTRATIONS:</span>
                          <span className="text-[var(--text)]">{festRegs.length}</span>
                        </div>
                      </div>
                      <Link href={`/passport/fests/${fest.slug}`}>
                        <Button variant="secondary" size="sm" className="w-full">
                          Open Fest Agenda
                        </Button>
                      </Link>
                    </Card>
                  );
                })
              ) : (
                <div className="md:col-span-2 text-center py-12 text-[var(--muted)] text-sm">
                  No fests yet — register for an event to start your passport.
                </div>
              )}
            </div>
          )}

          {/* STAMPS */}
          {activeTab === 'stamps' && (
            <div className="flex flex-col gap-8">
              <span className="font-mono text-xs text-[var(--muted)]">
                COLLECTED STAMPS ({myStamps.length})
              </span>
              {myStamps.length > 0 ? (
                <div className="flex flex-wrap gap-8 items-center justify-start">
                  {myStamps.map((stamp) => (
                    <Stamp
                      key={stamp.id}
                      id={stamp.id}
                      title={stamp.event?.title || stamp.fest?.title || 'Stamp'}
                      kind={stamp.kind}
                      date={stamp.earned_at}
                      earned={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  No stamps yet. Scan the venue QR at events to collect them.
                </p>
              )}
            </div>
          )}

          {/* BADGES */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {myBadges.map(({ badge, earned }) => (
                <Medallion
                  key={badge.id}
                  name={badge.name}
                  description={badge.description ?? undefined}
                  iconName={badge.icon ?? undefined}
                  rings={badge.rings ?? undefined}
                  earned={earned}
                  xpReward={badge.xp_reward ?? undefined}
                />
              ))}
              {myBadges.length === 0 && (
                <p className="col-span-full text-sm text-[var(--muted)]">No badges configured yet.</p>
              )}
            </div>
          )}

          {/* TICKETS */}
          {activeTab === 'tickets' && (
            <div className="flex flex-col gap-6">
              {myRegs.length > 0 ? (
                myRegs.map((reg) => (
                  <Card key={reg.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <StatusPill status={reg.status} />
                        <span className="font-mono text-xs text-[var(--muted)]">TICKET: {reg.ticket_code}</span>
                      </div>
                      <h3 className="font-serif text-xl text-[var(--text)]">{reg.event?.title ?? 'Event'}</h3>
                      <span className="font-mono text-xs text-[var(--muted)]">{reg.event?.venue ?? 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/events/${reg.event?.slug}`}>
                        <Button variant="secondary" size="sm">Event Details</Button>
                      </Link>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">No registrations yet.</p>
              )}
            </div>
          )}

          {/* CONNECTIONS */}
          {activeTab === 'connections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {connections.length > 0 ? (
                connections.map((c) => (
                  <Card key={c.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center font-serif text-lg text-[var(--accent)]">
                        {c.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-serif text-sm text-[var(--text)]">{c.full_name}</span>
                        <span className="font-mono text-xs text-[var(--accent)]">@{c.handle}</span>
                      </div>
                    </div>
                    <Link href={`/u/${c.handle}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">No connections yet.</p>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
