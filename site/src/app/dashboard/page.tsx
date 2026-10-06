'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/**
 * /dashboard – shows organizations owned by the logged‑in user and shortcuts to create fests / events.
 */
export default function DashboardPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = React.useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const loadOrgs = async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        router.push('/login');
        return;
      }
      // Get organizations where user is an organizer (org_members.role = 'organizer')
      const { data, error } = await supabase
        .from('org_members')
        .select('organizations(id, name, slug)')
        .eq('user_id', user.id)
        .eq('role', 'organizer');
      if (error) {
        setError(error.message);
        return;
      }
      // data is an array of objects with .organizations field
      const owned = data.map((row: any) => row.organizations).filter(Boolean);
      setOrgs(owned);
    };
    loadOrgs();
  }, [supabase, router]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-12">
        <Card className="p-6">
          <h2 className="font-serif text-2xl mb-4">My Dashboard</h2>
          {error && <p className="text-red-600 mb-2">{error}</p>}
          {orgs.length === 0 ? (
            <p>You don't own any organizations yet.</p>
          ) : (
            <ul className="space-y-4">
              {orgs.map((org) => (
                <li key={org.id} className="border-b pb-2">
                  <h3 className="text-lg font-medium">{org.name}</h3>
                  <div className="flex gap-4 mt-2">
                    <Link href={`/manage/fest/create?orgId=${org.id}`}>
                      <Button variant="secondary">Create Fest</Button>
                    </Link>
                    <Link href={`/manage/event/create?orgId=${org.id}`}>
                      <Button variant="secondary">Create Event</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
}
