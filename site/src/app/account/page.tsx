'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { User, Save, Loader2, Camera, Building2, Mail, Phone } from 'lucide-react';

export default function AccountPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  // Load current user profile
  useEffect(() => {
    if (!supabase) return;

    const loadProfile = async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    loadProfile();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !supabase) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          institution: profile.institution,
          phone: profile.phone,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
        })
        .eq('id', profile.id);

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Profile updated successfully!');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    }

    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !profile) return;

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${profile.id}_avatar.${fileExt}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadErr) {
      setError(uploadErr.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    setProfile(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
          <span className="text-sm text-[var(--muted)]">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile || !supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <p className="text-[var(--muted)]">Profile not found</p>
          <Button onClick={() => router.push('/')} className="mt-4">Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-2xl mx-auto w-full px-4 py-12 flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl mb-2">Account Settings</h1>
          <p className="text-sm text-[var(--muted)]">Manage your profile information</p>
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

        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border)]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                  <User size={32} className="text-[var(--muted)]" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h2 className="font-medium text-lg">{profile.full_name || 'Your Name'}</h2>
              <p className="text-sm text-[var(--muted)] font-mono">@{profile.handle}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                profile.role === 'organizer' ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'
              }`}>
                {profile.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4">
              <Input
                label="Full Name"
                value={profile.full_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />

              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm"
                />
              </div>

              {profile.role === 'participant' && (
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+880 1XXX-XXXXXX"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              )}

              {profile.role === 'organizer' && (
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={profile.institution || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => ({ ...prev, institution: e.target.value }))}
                    placeholder="Your organization or club name"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">Bio</label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={saving}
              className="w-full gap-2"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>

        {/* Account Info */}
        <Card className="p-6">
          <h3 className="font-medium mb-4">Account Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted)]">User ID</span>
              <span className="font-mono text-[var(--text)]">{profile.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted)]">Passport No</span>
              <span className="font-mono text-[var(--text)]">{profile.passport_no}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted)]">Member Since</span>
              <span className="text-[var(--text)]">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[var(--muted)]">XP Points</span>
              <span className="font-mono text-[var(--accent)]">{profile.xp} XP</span>
            </div>
          </div>
        </Card>

        {/* Sign Out */}
        <Card className="p-6 border-red-500/30">
          <h3 className="font-medium text-red-500 mb-2">Sign Out</h3>
          <p className="text-sm text-[var(--muted)] mb-4">Sign out of your account on this device.</p>
          <Button
            variant="secondary"
            onClick={async () => {
              if (supabase) {
                await supabase.auth.signOut();
                router.push('/');
                router.refresh();
              }
            }}
            className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10"
          >
            Sign Out
          </Button>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
