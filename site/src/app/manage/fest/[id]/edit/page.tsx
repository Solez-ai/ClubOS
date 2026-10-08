'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImageCropUpload } from '@/components/ui/ImageCropUpload';
import { Loader2, Save, AlertCircle, Calendar } from 'lucide-react';

interface CategoryTag {
  id: string;
  name: string;
}

export default function EditFestPage() {
  const params = useParams();
  const festId = params?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOrganizer, setIsOrganizer] = useState(false);

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [allTags, setAllTags] = useState<CategoryTag[]>([]);

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!supabase || !festId) return;

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login');
        return;
      }

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

      // RLS "Organizers can manage own fests" blocks non-owners here.
      const { data: fest, error: festErr } = await supabase
        .from('fests')
        .select('*')
        .or(`id.eq.${festId},slug.eq.${festId}`)
        .maybeSingle();

      if (festErr || !fest) {
        setError('Fest not found or you do not have access to it.');
        setLoading(false);
        return;
      }

      setTitle(fest.title ?? '');
      setTagline(fest.tagline ?? '');
      setDescription(fest.description ?? '');
      setCoverUrl(fest.cover_url ?? null);
      setLogoUrl(fest.logo_url ?? null);
      setStartDate(fest.start_date ? new Date(fest.start_date).toISOString().slice(0, 16) : '');
      setEndDate(fest.end_date ? new Date(fest.end_date).toISOString().slice(0, 16) : '');
      setVenue(fest.venue ?? '');
      setGoogleMapsUrl(fest.google_maps_url ?? '');
      setTags(Array.isArray(fest.tags) ? fest.tags : []);
      setIsPublished(Boolean(fest.is_published));

      const { data: tagRows } = await supabase.from('category_tags').select('id, name').order('name');
      if (tagRows) setAllTags(tagRows);

      setLoading(false);
    };

    init();
  }, [supabase, router, festId]);

  const toggleTag = (name: string) => {
    setTags((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Fest title is required.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please pick both a start and end date.');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateErr } = await supabase
        .from('fests')
        .update({
          title: title.trim(),
          tagline,
          description,
          cover_url: coverUrl,
          logo_url: logoUrl,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          venue,
          google_maps_url: googleMapsUrl,
          tags,
          is_published: isPublished,
        })
        .eq('id', festId);

      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      setSuccess('Fest updated successfully.');
    } finally {
      setSaving(false);
    }
  };

  if (!supabase || !isOrganizer || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="max-w-3xl mx-auto w-full px-4 py-12 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-[var(--accent)]" />
          <div>
            <h1 className="font-serif text-3xl">Edit Fest</h1>
            <p className="text-sm text-[var(--muted)]">Update details, images, dates and categories</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Fest Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            <ImageCropUpload
              label="Cover Image"
              helperText="Crop to a 2:1 banner — drag to pan, slider to zoom"
              aspect={2}
              outputWidth={1200}
              bucket="covers"
              pathPrefix="fest-cover"
              value={coverUrl}
              onChange={setCoverUrl}
              supabase={supabase}
            />

            <ImageCropUpload
              label="Logo (Optional)"
              helperText="Square crop works best"
              aspect={1}
              outputWidth={512}
              bucket="covers"
              pathPrefix="fest-logo"
              value={logoUrl}
              onChange={setLogoUrl}
              supabase={supabase}
            />
          </Card>

          <Card className="p-6 flex flex-col gap-4">
            <h2 className="font-medium text-lg">Dates & Venue</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Starts</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Ends</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="DRMC Campus, Main Grounds"
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Google Maps Link</label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </Card>

          <Card className="p-6 flex flex-col gap-3">
            <h2 className="font-medium text-lg">Categories</h2>
            <p className="text-xs text-[var(--muted)]">Pick every category that applies — participants filter by these.</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    tags.includes(t.name)
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 flex items-center justify-between">
            <div>
              <h2 className="font-medium">Published</h2>
              <p className="text-xs text-[var(--muted)]">Draft fests are hidden from participants.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              <span className="text-sm">{isPublished ? 'Published' : 'Draft'}</span>
            </label>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push(`/manage/fest/${festId}`)} className="flex-1">
              Back
            </Button>
            <Button type="submit" isLoading={saving} className="flex-1 gap-2">
              <Save size={15} /> Save Changes
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
