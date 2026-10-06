'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Loader2, Compass, Calendar, MapPin, Image, Globe, ArrowRight, AlertCircle } from 'lucide-react';

export default function CreateFestPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId');
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fest details
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [venueLat, setVenueLat] = useState('');
  const [venueLng, setVenueLng] = useState('');

  // Organization data
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState(orgId || '');
  const [user, setUser] = useState<any>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!supabase) return;

      // Check auth
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login');
        return;
      }

      setUser(authData.user);

      // Check if user is organizer
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profile?.role !== 'organizer') {
        router.push('/');
        return;
      }

      setIsOrganizer(true);

      // Get user's organizations
      const { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', authData.user.id)
        .order('created_at', { ascending: false });

      if (orgs) {
        setOrganizations(orgs);
        if (orgs.length > 0 && !orgId) {
          setSelectedOrgId(orgs[0].id);
        }
      }
    };

    init();
  }, [supabase, router, orgId]);

  const handleExtractCoords = (url: string) => {
    if (!url) return;

    const match = url.match(/@([-\d.]+),([-\d.]+)/);
    if (match) {
      setVenueLat(match[1]);
      setVenueLng(match[2]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedOrgId) {
      setError('Please select an organization');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const slug = title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 50);

      const { data: fest, error: festErr } = await supabase
        .from('fests')
        .insert({
          org_id: selectedOrgId,
          title,
          slug: `${slug}-${Date.now()}`,
          tagline,
          description,
          cover_url: coverUrl,
          logo_url: logoUrl,
          start_date: new Date(startDate),
          end_date: new Date(endDate),
          venue,
          google_maps_url: googleMapsUrl,
          venue_latitude: venueLat ? parseFloat(venueLat) : null,
          venue_longitude: venueLng ? parseFloat(venueLng) : null,
          is_published: true,
          is_featured: false,
          created_by: user?.id,
        })
        .select()
        .single();

      if (festErr) {
        setError(festErr.message);
        setLoading(false);
        return;
      }

      setSuccess('Fest created successfully!');
      setTimeout(() => {
        router.push('/organizer');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create fest');
      setLoading(false);
    }
  };

  if (!supabase || !isOrganizer) {
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

      <main className="max-w-3xl mx-auto w-full px-4 py-12 flex flex-col gap-8">
        <div className="flex items-center gap-3 mb-2">
          <Compass size={24} className="text-[var(--accent)]" />
          <div>
            <h1 className="font-serif text-3xl">Create Fest</h1>
            <p className="text-sm text-[var(--muted)]">Organize an event carnival or festival</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm flex items-center gap-2">
            <Check size={16} />
            {success}
          </div>
        )}

        {/* Organization Selection */}
        {organizations.length > 1 && (
          <Card className="p-4">
            <label className="block text-sm font-medium mb-2">Select Organization</label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </Card>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    step >= s ? 'bg-[var(--accent)]' : 'bg-[var(--surface-2)]'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-medium text-lg flex items-center gap-2">
                  <Compass size={20} className="text-[var(--accent)]" />
                  Basic Information
                </h2>

                <Input
                  label="Fest Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="9th DRMC International Tech Carnival 2026"
                  required
                />

                <div>
                  <label className="block text-sm font-medium mb-1.5">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="One Passport, Infinite Possibilities"
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    A short catchy phrase for your fest
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your fest, what participants can expect, and why they should attend..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Images */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-medium text-lg flex items-center gap-2">
                  <Image size={20} className="text-[var(--accent)]" />
                  Images & Branding
                </h2>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Cover Image URL</label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  {coverUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden h-40 bg-[var(--surface-2)]">
                      <img
                        src={coverUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Recommended: 1200x600px or larger
                  </p>
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
                    Your organization or fest logo
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Dates, Venue & Maps */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-medium text-lg flex items-center gap-2">
                  <Calendar size={20} className="text-[var(--accent)]" />
                  Dates & Time
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      required
                    />
                  </div>
                </div>

                <h2 className="font-medium text-lg flex items-center gap-2 mt-6">
                  <MapPin size={20} className="text-[var(--accent)]" />
                  Venue & Location
                </h2>

                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="DRMC Campus, Main Grounds"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Venue name or address
                  </p>
                </div>

                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => {
                      setGoogleMapsUrl(e.target.value);
                      handleExtractCoords(e.target.value);
                    }}
                    placeholder="https://maps.google.com/?q=DRMC+Campus"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Google Maps link (recommended) - coordinates auto-extracted
                  </p>
                </div>

                {(venueLat || venueLng) && (
                  <div className="p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg text-sm">
                    <p className="text-[var(--accent)] font-medium mb-1">Location Detected</p>
                    <p className="text-[var(--muted)] font-mono text-xs">
                      Lat: {venueLat || '—'} | Lng: {venueLng || '—'}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                  <h4 className="font-medium text-sm mb-2">Google Maps Tips</h4>
                  <ul className="text-xs text-[var(--muted)] space-y-1">
                    <li>Copy the URL from your browser when viewing the location on Google Maps</li>
                    <li>Or search for the location and share the link</li>
                    <li>Coordinates will be auto-extracted for precise location</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-6">
              {step > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 gap-2"
                >
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !title}
                  className="flex-1 gap-2"
                >
                  Next
                  <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={!title || !startDate || !endDate}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Fest
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

function Check({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
