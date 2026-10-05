'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { User, Shield, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = (role: 'participant' | 'organizer') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (role === 'organizer') router.push('/organizer');
      else router.push('/passport');
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[480px] mx-auto w-full px-4 py-16 flex flex-col gap-6 flex-1 justify-center">
        <div className="flex flex-col text-center gap-2">
          <Eyebrow>WELCOME BACK</Eyebrow>
          <h1 className="font-serif text-3xl text-[var(--text)] font-normal">
            Sign in to ClubOS
          </h1>
          <p className="text-xs text-[var(--muted)]">Access your digital passport, tickets, and organizer tools.</p>
        </div>

        {/* DEMO 1-CLICK BUTTONS */}
        <Card className="flex flex-col gap-3 p-5 bg-[var(--accent-soft)] border-[var(--accent)]/40">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-medium">
            1-CLICK DEMO ACCESS FOR JUDGES
          </span>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleDemoLogin('participant')}
              isLoading={isLoading}
              className="w-full gap-2 text-xs"
            >
              <User size={14} />
              <span>Continue as Demo Participant (Tanvir Hossain)</span>
            </Button>
            <Button
              onClick={() => handleDemoLogin('organizer')}
              isLoading={isLoading}
              variant="secondary"
              className="w-full gap-2 text-xs bg-[var(--surface)]"
            >
              <Shield size={14} />
              <span>Continue as Demo Organizer (DRMC Lead)</span>
            </Button>
          </div>
        </Card>

        {/* Standard Form */}
        <Card className="flex flex-col gap-5 p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDemoLogin('participant');
            }}
            className="flex flex-col gap-4"
          >
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <div className="text-center font-mono text-xs text-[var(--muted)] border-t border-[var(--border)] pt-4">
            Don't have a passport yet?{' '}
            <Link href="/signup" className="text-[var(--accent)] hover:underline">
              Create Passport
            </Link>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
