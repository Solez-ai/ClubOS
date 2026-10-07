'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Pickup notice passed from signup (e.g. "confirm your email first").
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get('notice');
    if (!n) return;
    const t = setTimeout(() => {
      setNotice(n);
      window.history.replaceState(null, '', window.location.pathname);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const supabase = React.useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return createClient();
  }, []);

  const redirectToRoleHome = async (userId: string) => {
    if (!supabase) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role === 'organizer') {
      router.push('/organizer');
    } else {
      router.push('/events');
    }
  };

  // If already logged in, redirect based on role
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        void redirectToRoleHome(data.user.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured. Please add your credentials in environment settings.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
        setError(
          /not confirmed/i.test(authErr.message)
            ? 'Please confirm your email first — check your inbox for the confirmation link.'
            : authErr.message
        );
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        await redirectToRoleHome(data.user.id);
      }
      setIsLoading(false);
    } catch {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
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
          <p className="text-xs text-[var(--muted)]">
            Participants and organizers use the same sign-in — we&apos;ll take you to the right place.
          </p>
        </div>

        <Card className="flex flex-col gap-5 p-6">
          {notice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm">
              {notice}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <div className="text-center font-mono text-xs text-[var(--muted)] border-t border-[var(--border)] pt-4">
            Don&apos;t have an account yet?{' '}
            <Link href="/signup" className="text-[var(--accent)] hover:underline">
              Create Account
            </Link>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
