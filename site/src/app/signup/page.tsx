'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Building2, Check, Sparkles } from 'lucide-react';

const FRIENDLY_AUTH_ERRORS: Record<string, string> = {
  'User already registered': 'An account with this email already exists. Try signing in instead.',
  'Email address is invalid': 'That email address looks invalid. Please check and try again.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  'Email rate limit exceeded': 'Too many attempts. Please wait a minute and try again.',
};

function friendlyAuthError(message: string): string {
  return FRIENDLY_AUTH_ERRORS[message] || message;
}

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'participant' | 'organizer' | null>(null);
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!role) {
      setError('Please select a role');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Sign up with Supabase Auth
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
            institution,
            phone,
          },
        },
      });

      if (authErr) {
        setError(friendlyAuthError(authErr.message));
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Build a unique handle: email prefix, with a numeric suffix on collision
        const baseHandle = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24) || 'user';
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

        const { error: profileErr } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            handle,
            full_name: fullName,
            email,
            phone,
            institution,
            role,
            onboarded: true,
          })
          .select()
          .single();

        if (profileErr) {
          setError(profileErr.message);
          setLoading(false);
          return;
        }

        // If organizer, create default organization
        if (role === 'organizer') {
          const orgSlug = fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || handle;

          await supabase.from('organizations').insert({
            name: fullName || 'My Organization',
            slug: `${orgSlug}-${data.user.id.slice(0, 8)}`,
            description: '',
            created_by: data.user.id,
          });

          // Add user as organizer to their organization
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('created_by', data.user.id)
            .single();

          if (org) {
            await supabase.from('organization_members').insert({
              org_id: org.id,
              user_id: data.user.id,
              role: 'owner',
            });
          }
        }

        // Sign in after signup
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          setError(friendlyAuthError(signInErr.message));
          setLoading(false);
          return;
        }

        // Route to the appropriate screen based on role
        router.push(role === 'organizer' ? '/organizer' : '/events');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="w-full max-w-md">
      <h2 className="text-2xl font-serif mb-2">Create Your Account</h2>
      <p className="text-sm text-[var(--muted)] mb-8">Choose your role to get started</p>

      {/* Role Selection */}
      <div className="space-y-4 mb-8">
        <button
          onClick={() => setRole('participant')}
          className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
            role === 'participant'
              ? 'border-[var(--accent)] bg-[var(--accent)]/10'
              : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)]'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              role === 'participant' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'
            }`}>
              <User size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg mb-1">Participant</h3>
              <p className="text-sm text-[var(--muted)]">
                Browse and register for events, collect stamps, earn XP, and build your passport.
              </p>
            </div>
            {role === 'participant' && (
              <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <Check size={14} className="text-[var(--accent-fg)]" />
              </div>
            )}
          </div>
        </button>

        <button
          onClick={() => setRole('organizer')}
          className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
            role === 'organizer'
              ? 'border-[var(--accent)] bg-[var(--accent)]/10'
              : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)]'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              role === 'organizer' ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'
            }`}>
              <Building2 size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg mb-1">Organizer</h3>
              <p className="text-sm text-[var(--muted)]">
                Create and manage events, track registrations, verify payments, and grow your community.
              </p>
            </div>
            {role === 'organizer' && (
              <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <Check size={14} className="text-[var(--accent-fg)]" />
              </div>
            )}
          </div>
        </button>
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!role}
        className="w-full py-3 px-4 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        Continue
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="w-full max-w-md space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <span className="text-[var(--accent-fg)] text-sm font-medium">1</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
            <span className="text-[var(--muted)] text-sm font-medium">2</span>
          </div>
        </div>
        <span className="text-sm text-[var(--muted)]">Account Details</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              required
            />
          </div>

          {role === 'organizer' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Organization Name</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Your organization or club name"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              required
            />
          </div>

          {role === 'participant' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone Number (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
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

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 py-3 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] font-medium hover:bg-[var(--surface-2)] transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !email || !password || !fullName || (role === 'organizer' && !institution)}
            className="flex-1 py-3 px-4 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={16} />
                Create Account
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-serif text-3xl">ClubOS</span>
            <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
            <span className="text-sm text-[var(--muted)]">Smart Club Operations</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Form */}
          <div className="flex flex-col gap-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-serif">
                {step === 1 ? 'Join the Community' : 'Set Up Your Account'}
              </h1>
              <p className="text-[var(--muted)]">
                {step === 1
                  ? 'Choose your role and start your journey'
                  : 'Fill in your details to create your account'}
              </p>
            </div>

            {step === 1 ? renderStep1() : renderStep2()}
          </div>

          {/* Right: Visual / Info */}
          <div className="hidden lg:flex flex-col gap-6">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                      <Sparkles size={20} className="text-[var(--accent-fg)]" />
                    </div>
                    <div>
                      <h3 className="font-medium">Why join ClubOS?</h3>
                      <p className="text-sm text-[var(--muted)]">Everything you need in one platform</p>
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <Check size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                      <span className="text-[var(--text)]">Discover exciting events near you</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                      <span className="text-[var(--text)]">Collect stamps and earn XP</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                      <span className="text-[var(--text)]">Build your digital passport</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
                      <span className="text-[var(--text)]">Compete and win prizes</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-transparent border border-[var(--accent)]/30">
                  <p className="text-sm text-[var(--muted)]">
                    Already have an account?{' '}
                    <a href="/login" className="text-[var(--accent)] hover:underline font-medium">
                      Sign in
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                <h3 className="font-medium mb-2">What happens next?</h3>
                <p className="text-sm text-[var(--muted)] mb-4">
                  After creating your account, you&apos;ll be able to:
                </p>
                <div className="space-y-3 text-sm">
                  {role === 'participant' ? (
                    <>
                      <p>🎉 Browse and register for exciting events</p>
                      <p>🏆 Compete in competitions and win prizes</p>
                      <p>📱 Collect stamps and build your passport</p>
                    </>
                  ) : (
                    <>
                      <p>🎪 Create and manage your own events</p>
                      <p>👥 Track registrations and participants</p>
                      <p>💰 Handle payments seamlessly</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
