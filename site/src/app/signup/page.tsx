'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { User, Building2, Camera, Check, Sparkles } from 'lucide-react';

const FRIENDLY_AUTH_ERRORS: Record<string, string> = {
  'User already registered': 'An account with this email already exists. Try signing in instead.',
  'Email address is invalid': 'That email address looks invalid. Please check and try again.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  'Email rate limit exceeded': 'Too many attempts. Please wait a minute and try again.',
};

function friendlyAuthError(message: string): string {
  return FRIENDLY_AUTH_ERRORS[message] || message;
}

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

const inputCls =
  'w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors';

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<'participant' | 'organizer'>('participant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Revoke the previous object URL whenever it changes (and on unmount).
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for your profile picture.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Profile picture must be under 3 MB.');
      return;
    }
    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(supabase: SupabaseClient, userId: string): Promise<string | null> {
    if (!avatarFile) return null;
    const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: avatarFile.type,
    });
    if (uploadErr) {
      // A failed upload must not block signup — the user can add a photo later in Settings.
      console.error('Avatar upload failed:', uploadErr.message);
      return null;
    }
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (role === 'organizer' && !institution.trim()) {
      setError('Please enter your organization name.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // signUp() fires the handle_new_user() DB trigger, which creates the
      // profiles row (and, for organizers, the organization + owner membership)
      // server-side. Client INSERT is blocked by RLS by design, so we UPDATE
      // the trigger's row instead of inserting a new one.
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName.trim(),
            institution: institution.trim() || null,
            phone: phone.trim() || null,
          },
        },
      });

      if (authErr) {
        setError(friendlyAuthError(authErr.message));
        setLoading(false);
        return;
      }
      if (!data?.user) {
        setError('Sign up failed. Please try again.');
        setLoading(false);
        return;
      }

      // If email confirmation is enabled in Supabase, there is no session yet.
      // The profile/org were still created by the trigger — send them to login
      // with a clear notice instead of failing below on signInWithPassword.
      if (!data.session) {
        router.replace(
          `/login?notice=${encodeURIComponent(
            'Account created! Check your inbox to confirm your email, then sign in.'
          )}`
        );
        return;
      }

      const avatarUrl = await uploadAvatar(supabase, data.user.id);

      // Build a unique handle for the insert path (email prefix, suffix on collision).
      const baseHandle =
        email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24) || 'user';
      let handle = baseHandle;
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('handle', handle)
          .maybeSingle();
        if (!existing) break;
        handle = `${baseHandle}${Math.floor(Math.random() * 9000 + 1000)}`;
      }

      // Upsert, not update: the handle_new_user() trigger normally created the
      // row during signUp(), but if the trigger is missing on the DB the UPDATE
      // would silently match 0 rows and the user would land on the participant
      // dashboard. Upsert heals a missing row AND stamps the chosen role so
      // /organizer's role check always passes for organizers.
      const { error: upsertErr } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          handle,
          full_name: fullName.trim(),
          email,
          role,
          phone: phone.trim() || null,
          institution: institution.trim() || null,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          onboarded: true,
        },
        { onConflict: 'id' }
      );

      if (upsertErr) {
        setError(upsertErr.message);
        setLoading(false);
        return;
      }

      // Route by the role actually stored in the DB (source of truth), so the
      // dashboard redirect can never disagree with what we saved.
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      router.push(prof?.role === 'organizer' ? '/organizer' : '/events');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  const roleCard = (value: 'participant' | 'organizer') => {
    const isParticipant = value === 'participant';
    return (
      <button
        key={value}
        type="button"
        onClick={() => setRole(value)}
        aria-pressed={role === value}
        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
          role === value
            ? 'border-[var(--accent)] bg-[var(--accent)]/10'
            : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              role === value
                ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                : 'bg-[var(--surface-2)] text-[var(--muted)]'
            }`}
          >
            {isParticipant ? <User size={20} /> : <Building2 size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium">{isParticipant ? 'Participant' : 'Organizer'}</h3>
            <p className="text-sm text-[var(--muted)]">
              {isParticipant
                ? 'Register for events, collect stamps, earn XP.'
                : 'Create events, verify payments, manage your club.'}
            </p>
          </div>
          {role === value && (
            <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0">
              <Check size={12} className="text-[var(--accent-fg)]" />
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="font-serif text-3xl">ClubOS</span>
            <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
            <span className="text-sm text-[var(--muted)]">Smart Club Operations</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: the whole signup on one page */}
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-serif">Create your account</h1>
              <p className="text-[var(--muted)]">
                Pick your role, fill in your details, done — one page, one click.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Role cards */}
              <div className="grid grid-cols-2 gap-3">
                {roleCard('participant')}
                {roleCard('organizer')}
              </div>

              {/* Profile picture */}
              <div className="flex items-center gap-4">
                <label className="relative cursor-pointer group shrink-0">
                  <input type="file" accept="image/*" className="sr-only" onChange={pickAvatar} />
                  {avatarPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] border-2 border-dashed border-[var(--border-strong)] flex items-center justify-center text-[var(--muted)] group-hover:border-[var(--accent)] transition-colors">
                      <Camera size={22} />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center border-2 border-[var(--bg)]">
                    <Camera size={12} className="text-[var(--accent-fg)]" />
                  </div>
                </label>
                <div>
                  <p className="text-sm font-medium">Profile picture (optional)</p>
                  <p className="text-xs text-[var(--muted)]">
                    JPG or PNG, up to 3 MB. You can change it later in Settings.
                  </p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                  required
                />
              </div>

              {/* Organizer-only: org name */}
              {role === 'organizer' && (
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium mb-1.5">
                    Organization Name
                  </label>
                  <input
                    id="organization"
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Your club or organization"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputCls}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  className={inputCls}
                />
              </div>

              {/* Passwords */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={inputCls}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={inputCls}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !fullName.trim() || !email || !password}
                className="w-full py-3.5 px-4 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Create Account
                  </>
                )}
              </button>

              <p className="text-sm text-[var(--muted)] text-center">
                Already have an account?{' '}
                <a href="/login" className="text-[var(--accent)] hover:underline font-medium">
                  Sign in
                </a>
              </p>
            </form>
          </div>

          {/* Right: info panel */}
          <div className="hidden lg:flex flex-col gap-6 lg:pt-16">
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <Sparkles size={20} className="text-[var(--accent-fg)]" />
                </div>
                <div>
                  <h3 className="font-medium">Why join ClubOS?</h3>
                  <div className="text-sm text-[var(--muted)]">Everything you need in one platform</div>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Check size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <span>Discover exciting events near you</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <span>Collect stamps and earn XP</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <span>Build your digital passport</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <span>Compete and win prizes</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-transparent border border-[var(--accent)]/30">
              <p className="text-sm text-[var(--muted)]">
                Already have an account?{' '}
                <a href="/login" className="text-[var(--accent)] hover:underline font-medium">
                  Sign in instead
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
