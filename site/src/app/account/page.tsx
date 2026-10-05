import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

/**
 * /account – displays the logged‑in user's profile and lets them update basic fields.
 */
export default function AccountPage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Load current user profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } , error: userErr } = await supabase.auth.getUser();
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
        return;
      }
      setProfile(data);
      setFullName(data.full_name ?? '');
      setInstitution(data.institution ?? '');
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, institution })
      .eq('id', profile.id);
    if (error) {
      setError(error.message);
    } else {
      router.refresh();
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <Navbar />
        <p>Loading profile...</p>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="max-w-xl mx-auto w-full px-4 py-12">
        <Card className="p-6">
          <h2 className="font-serif text-2xl mb-4">Account Settings</h2>
          {error && <p className="text-red-600 mb-2">{error}</p>}
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Institution"
              placeholder="Institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
            <Button type="submit" className="w-full bg-blue-600 text-white">
              Save Changes
            </Button>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
