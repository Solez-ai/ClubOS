'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
import { MOCK_PROFILES, MOCK_FESTS, MOCK_EVENTS, MOCK_REGISTRATIONS, MOCK_STAMPS, MOCK_BADGES, MOCK_USER_BADGES } from '@/lib/mockData';
import { Ticket, Award, Stamp as StampIcon, Compass, Users, Clock, Share2, Download, AlertTriangle } from 'lucide-react';

export default function PassportPage() {
  const profile = MOCK_PROFILES[1]; // Demo participant
  const levelInfo = calculateLevel(profile.xp);
  const [activeTab, setActiveTab] = useState('fests');

  const tabs = [
    { id: 'fests', label: 'My Fests', count: MOCK_FESTS.length },
    { id: 'stamps', label: 'Stamps', count: MOCK_STAMPS.length },
    { id: 'badges', label: 'Badges', count: MOCK_USER_BADGES.length },
    { id: 'tickets', label: 'Tickets & Regs', count: MOCK_REGISTRATIONS.length },
    { id: 'connections', label: 'Connections', count: 2 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-12">
        {/* Header Grid: Passport Card (Left) & XP Details (Right) */}
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

            {/* XP Level Bar */}
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
                {levelInfo.nextLevelXp - profile.xp} XP needed for Level {levelInfo.level + 1}
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

        {/* Tab Navigation & Content */}
        <div className="flex flex-col gap-8">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {/* TAB: MY FESTS */}
          {activeTab === 'fests' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MOCK_FESTS.map((fest) => (
                <Card key={fest.id} className="flex flex-col justify-between gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-xs text-[var(--accent)]">FEST PASS</span>
                    <h3 className="font-serif text-2xl text-[var(--text)]">{fest.title}</h3>
                    <p className="text-xs text-[var(--muted)]">{fest.tagline}</p>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 font-mono text-xs text-[var(--muted)]">
                    <div className="flex justify-between">
                      <span>AGENDA ATTENDANCE:</span>
                      <span className="text-[var(--text)]">1 of 3 attended</span>
                    </div>
                    <div className="w-full h-[2px] bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent)] w-1/3" />
                    </div>
                  </div>

                  <Link href={`/passport/fests/${fest.slug}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Open Fest Agenda & Stamps
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}

          {/* TAB: STAMPS */}
          {activeTab === 'stamps' && (
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--muted)]">
                  COLLECTED STAMPS ({MOCK_STAMPS.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-8 items-center justify-start">
                {MOCK_STAMPS.map((stamp) => (
                  <Stamp
                    key={stamp.id}
                    id={stamp.id}
                    title={stamp.event?.title || stamp.fest?.title || 'Stamp'}
                    kind={stamp.kind}
                    date={stamp.earned_at}
                    earned={true}
                  />
                ))}
                {/* Dashed Unearned Slot */}
                <Stamp id="slot-1" title="Competitive Programming" earned={false} />
                <Stamp id="slot-2" title="Robotics Challenge" earned={false} />
              </div>
            </div>
          )}

          {/* TAB: BADGES */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {MOCK_BADGES.map((badge) => {
                const isEarned = MOCK_USER_BADGES.some((ub) => ub.badge_id === badge.id);
                return (
                  <Medallion
                    key={badge.id}
                    name={badge.name}
                    description={badge.description}
                    iconName={badge.icon}
                    rings={badge.rings}
                    earned={isEarned}
                    xpReward={badge.xp_reward}
                  />
                );
              })}
            </div>
          )}

          {/* TAB: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="flex flex-col gap-6">
              {MOCK_REGISTRATIONS.map((reg) => (
                <Card key={reg.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <StatusPill status={reg.status} />
                      <span className="font-mono text-xs text-[var(--muted)]">TICKET: {reg.ticket_code}</span>
                    </div>
                    <h3 className="font-serif text-xl text-[var(--text)]">{reg.event?.title}</h3>
                    <span className="font-mono text-xs text-[var(--muted)]">{reg.event?.venue}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={`/events/${reg.event?.slug}`}>
                      <Button variant="secondary" size="sm">
                        Event Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* TAB: CONNECTIONS */}
          {activeTab === 'connections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center font-serif text-lg text-[var(--accent)]">
                    N
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-sm text-[var(--text)]">Nabil Rahman</span>
                    <span className="font-mono text-xs text-[var(--accent)]">@nabil_rahman</span>
                  </div>
                </div>
                <Link href="/u/nabil_rahman">
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              </Card>

              <Card className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center font-serif text-lg text-[var(--accent)]">
                    S
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-sm text-[var(--text)]">Samiul Islam</span>
                    <span className="font-mono text-xs text-[var(--accent)]">@samiul_islam</span>
                  </div>
                </div>
                <Link href="/u/samiul_islam">
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
