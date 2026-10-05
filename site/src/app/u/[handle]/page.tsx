import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PassportCard } from '@/components/ui/PassportCard';
import { Stamp } from '@/components/ui/Stamp';
import { Medallion } from '@/components/ui/Medallion';
import { MOCK_PROFILES, MOCK_STAMPS, MOCK_USER_BADGES } from '@/lib/mockData';
import { UserPlus, Lock } from 'lucide-react';

export default async function PublicPassportPage(props: { params: Promise<{ handle: string }> }) {
  const { handle } = await props.params;
  const profile = MOCK_PROFILES.find((p) => p.handle === handle) || MOCK_PROFILES[1];

  if (!profile.passport_public) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <Navbar />
        <main className="max-w-[600px] mx-auto w-full px-4 py-20 flex flex-col items-center text-center gap-4 flex-1 justify-center">
          <Lock size={40} className="text-[var(--muted)]" />
          <h1 className="font-serif text-3xl text-[var(--text)]">This passport is private.</h1>
          <p className="text-sm text-[var(--muted)]">
            The member has chosen to keep their passport statistics and achievements hidden.
          </p>
          <Link href="/">
            <Button variant="secondary" size="sm">Back to Home</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

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

            <div className="flex items-center gap-3">
              <Button className="gap-2">
                <UserPlus size={15} />
                <span>Connect Passport</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Badges & Stamps */}
        <div className="flex flex-col gap-8">
          <h2 className="font-serif text-2xl text-[var(--text)]">Verified Stamps & Badges</h2>
          <div className="flex flex-wrap gap-8 items-center">
            {MOCK_STAMPS.map((stamp) => (
              <Stamp key={stamp.id} id={stamp.id} title={stamp.event?.title || 'Stamp'} earned={true} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
