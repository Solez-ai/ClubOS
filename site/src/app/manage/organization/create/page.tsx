'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

/**
 * Page: /manage/organization/create
 * Allows an authenticated user to create a new organization.
 * The creator becomes the first organizer (inserted into org_members).
 */
export default function CreateOrganizationPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = React.useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  const slugify = (text: string) =>
    text
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^a-z0-9-]/g, ''); // Remove non‑alphanumeric chars

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!supabase) {
      setError('Supabase not configured');
      return;
    }
    const user = supabase.auth.getUser();
    const { data: userData, error: userErr } = await user;
    if (userErr || !userData?.user) {
      setError('Unable to get authenticated user');
      return;
    }
    const orgSlug = slugify(name);
    // Insert organization
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name, slug: orgSlug, description })
      .select()
      .single();
    if (orgErr) {
      setError(orgErr.message);
      return;
    }
    // Insert org member as organizer
    const { error: memberErr } = await supabase.from('org_members').insert({
      org_id: org.id,
      user_id: userData.user.id,
      role: 'organizer',
    });
    if (memberErr) {
      setError(memberErr.message);
      return;
    }
    // Redirect to dashboard or organization page
    router.push(`/dashboard`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="max-w-xl mx-auto w-full px-4 py-12">
        <Card className="p-6">
          <h2 className="font-serif text-2xl mb-4">Create Organization</h2>
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              placeholder="Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded resize-none h-32"
            />
            <Button type="submit" className="w-full bg-blue-600 text-white">
              Create Organization
            </Button>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
