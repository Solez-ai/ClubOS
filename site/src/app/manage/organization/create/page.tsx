'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Loader2, Building2, ArrowRight, Mail, Phone } from 'lucide-react';

export default function CreateOrganizationPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login');
        return;
      }

      // Check if user is an organizer
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'organizer') {
        router.push('/');
        return;
      }
    };

    checkAuth();
  }, [supabase, router]);

  const slugify = (text: string) =>
    text
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase not configured');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get current user
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const orgSlug = slugify(name) || `${slugify(name)}-${user.id.slice(0, 8)}`;

      // Insert organization
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({
          name,
          slug: orgSlug,
          description,
          website,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          logo_url: logoUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (orgErr) {
        setError(orgErr.message);
        setLoading(false);
        return;
      }

      // Add user as owner of the organization
      const { error: memberErr } = await supabase.from('organization_members').insert({
        org_id: org.id,
        user_id: user.id,
        role: 'owner',
      });

      if (memberErr) {
        setError(memberErr.message);
        setLoading(false);
        return;
      }

      setSuccess('Organization created successfully!');
      setTimeout(() => {
        router.push('/organizer');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
      setLoading(false);
    }
  };

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[var(--accent)] mx-auto mb-4" />
          <p className="text-[var(--muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-2xl mx-auto w-full px-4 py-12 flex flex-col gap-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 size={24} className="text-[var(--accent)]" />
          <div>
            <h1 className="font-serif text-3xl">Create Organization</h1>
            <p className="text-sm text-[var(--muted)]">Set up your organization profile</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm">
            {success}
          </div>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <Input
                label="Organization Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="DRMC IT Club"
                required
              />

              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://your-org.com"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>

              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@your-org.com"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>

              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Logo URL (Optional)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  Provide a URL to your organization&apos;s logo
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your organization, its mission, and what you do..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              disabled={!name}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Organization
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
