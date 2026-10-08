'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImageCropUpload } from '@/components/ui/ImageCropUpload';
import {
  Loader2, Save, Trash2, Plus, AlertCircle, Pencil, Users, Compass,
} from 'lucide-react';

type PaymentMethod = 'bkash_send_money' | 'bkash_pay_bill' | 'nagad_send_money' | 'nagad_pay_bill';

interface SegmentData {
  id: string; // db id for existing, tmp id for new
  title: string;
  description: string;
  segment_type: string;
  max_participants: string;
  is_free: boolean;
  price: string;
  payment_method: PaymentMethod;
  payment_info: string;
  instructions: string;
  isNew?: boolean;
}

interface CategoryTag {
  id: string;
  name: string;
}

export default function EditEventPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOrganizer, setIsOrganizer] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prizes, setPrizes] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [venue, setVenue] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [registrationOpensAt, setRegistrationOpensAt] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<CategoryTag[]>([]);

  const EVENT_CATEGORIES = [
    'science_technology', 'music_art', 'sports', 'business', 'health', 'food',
    'competition', 'workshop', 'seminar', 'gaming', 'robotics', 'quiz', 'social', 'other',
  ];

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return createClient();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!supabase || !eventId) return;

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

      // RLS "Organizers can manage own events" blocks non-owners here.
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .select('*, event_tags(tag_id)')
        .or(`id.eq.${eventId},slug.eq.${eventId}`)
        .maybeSingle();

      if (eventErr || !event) {
        setError('Event not found or you do not have access to it.');
        setLoading(false);
        return;
      }

      setTitle(event.title ?? '');
      setCategory(event.category ?? 'other');
      setDescription(event.description ?? '');
      setRules(event.rules ?? '');
      setPrizes(event.prizes ?? '');
      setCoverUrl(event.cover_url ?? null);
      setThumbnailUrl(event.thumbnail_url ?? null);
      setStartsAt(event.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : '');
      setEndsAt(event.ends_at ? new Date(event.ends_at).toISOString().slice(0, 16) : '');
      setVenue(event.venue ?? '');
      setGoogleMapsUrl(event.google_maps_url ?? '');
      setRegistrationOpensAt(
        event.registration_opens_at ? new Date(event.registration_opens_at).toISOString().slice(0, 16) : ''
      );
      setRegistrationDeadline(
        event.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : ''
      );
      setCapacity(event.capacity != null ? String(event.capacity) : '');
      setIsPublished(Boolean(event.is_published));
      setSelectedTags((event.event_tags ?? []).map((t: { tag_id: string }) => t.tag_id));

      const { data: segs } = await supabase
        .from('segments')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });

      setSegments(
        (segs ?? []).map((s: Record<string, unknown>) => ({
          id: String(s.id),
          title: String(s.title ?? ''),
          description: String(s.description ?? ''),
          segment_type: String(s.segment_type ?? 'competition'),
          max_participants: s.max_participants != null ? String(s.max_participants) : '',
          is_free: Boolean(s.is_free),
          price: String(s.price ?? '0'),
          payment_method: (s.payment_method as PaymentMethod) ?? 'bkash_send_money',
          payment_info: String(s.payment_info ?? ''),
          instructions: String(s.instructions ?? ''),
        }))
      );

      const { data: tagRows } = await supabase.from('category_tags').select('id, name').order('name');
      if (tagRows) setAllTags(tagRows);

      setLoading(false);
    };

    init();
  }, [supabase, router, eventId]);

  const updateSegment = (id: string, field: keyof SegmentData, value: string | boolean) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const addSegment = () => {
    setSegments((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        title: '',
        description: '',
        segment_type: 'competition',
        max_participants: '',
        is_free: true,
        price: '0',
        payment_method: 'bkash_send_money',
        payment_info: '',
        instructions: '',
        isNew: true,
      },
    ]);
  };

  const removeSegment = async (seg: SegmentData) => {
    if (!supabase) return;
    if (!seg.isNew) {
      const { error: delErr } = await supabase.from('segments').delete().eq('id', seg.id);
      if (delErr) {
        setError(delErr.message);
        return;
      }
    }
    setSegments((prev) => prev.filter((s) => s.id !== seg.id));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Event title is required.');
      return;
    }
    if (!startsAt || !registrationOpensAt || !registrationDeadline) {
      setError('Event start, registration open and deadline dates are required.');
      return;
    }

    setSaving(true);
    try {
      const { error: updateErr } = await supabase
        .from('events')
        .update({
          title: title.trim(),
          category,
          description,
          rules,
          prizes,
          cover_url: coverUrl,
          thumbnail_url: thumbnailUrl,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          venue,
          google_maps_url: googleMapsUrl,
          registration_opens_at: new Date(registrationOpensAt).toISOString(),
          registration_deadline: new Date(registrationDeadline).toISOString(),
          capacity: capacity ? parseInt(capacity) : null,
          is_published: isPublished,
        })
        .eq('id', eventId);

      if (updateErr) {
        setError(updateErr.message);
        return;
      }

      // Sync tags
      await supabase.from('event_tags').delete().eq('event_id', eventId);
      if (selectedTags.length > 0) {
        await supabase
          .from('event_tags')
          .insert(selectedTags.map((tagId) => ({ event_id: eventId, tag_id: tagId })));
      }

      // Sync segments: update existing, insert new
      for (const seg of segments) {
        const payload = {
          event_id: eventId,
          title: seg.title.trim() || 'Untitled segment',
          description: seg.description,
          segment_type: seg.segment_type,
          max_participants: seg.max_participants ? parseInt(seg.max_participants) : null,
          is_free: seg.is_free,
          price: seg.is_free ? 0 : parseFloat(seg.price) || 0,
          payment_method: seg.payment_method,
          payment_info: seg.payment_info,
          instructions: seg.instructions,
        };
        if (seg.isNew) {
          const { error: insErr } = await supabase.from('segments').insert(payload);
          if (insErr) {
            setError(`Segment "${payload.title}": ${insErr.message}`);
            return;
          }
        } else {
          const { error: updErr } = await supabase.from('segments').update(payload).eq('id', seg.id);
          if (updErr) {
            setError(`Segment "${payload.title}": ${updErr.message}`);
            return;
          }
        }
      }

      setSuccess('Event and segments updated successfully.');
      // Mark new segments as persisted so a second save updates instead of duplicating.
      setSegments((prev) => prev.map((s) => ({ ...s, isNew: false })));
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

  const inputCls =
    'w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="max-w-3xl mx-auto w-full px-4 py-12 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Pencil size={24} className="text-[var(--accent)]" />
          <div>
            <h1 className="font-serif text-3xl">Edit Event</h1>
            <p className="text-sm text-[var(--muted)]">Update details, images, schedule, segments and payment info</p>
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
              <label className="block text-sm font-medium mb-1.5">Event Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Rules</label>
              <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Prizes</label>
              <textarea value={prizes} onChange={(e) => setPrizes(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
            </div>

            <ImageCropUpload
              label="Event Cover (Optional)"
              helperText="Crop to 16:9 — drag to pan, slider to zoom"
              aspect={16 / 9}
              outputWidth={1200}
              bucket="covers"
              pathPrefix="event-cover"
              value={coverUrl}
              onChange={setCoverUrl}
              supabase={supabase}
            />

            <ImageCropUpload
              label="Thumbnail (Optional)"
              helperText="Square crop works best"
              aspect={1}
              outputWidth={512}
              bucket="covers"
              pathPrefix="event-thumb"
              value={thumbnailUrl}
              onChange={setThumbnailUrl}
              supabase={supabase}
            />
          </Card>

          <Card className="p-6 flex flex-col gap-4">
            <h2 className="font-medium text-lg">Schedule & Venue</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Event Start</label>
                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Event End</label>
                <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Registration Opens</label>
                <input type="datetime-local" value={registrationOpensAt} onChange={(e) => setRegistrationOpensAt(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Registration Deadline</label>
                <input type="datetime-local" value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} className={inputCls} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Venue</label>
              <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Google Maps Link</label>
              <input type="url" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Capacity (Optional)</label>
              <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputCls} />
            </div>
          </Card>

          <Card className="p-6 flex flex-col gap-3">
            <h2 className="font-medium text-lg">Segments & Payment Configuration</h2>
            <p className="text-xs text-[var(--muted)]">
              Each segment can be free or paid. Paid segments need provider (bKash/Nagad), type (Send Money / Pay Bill),
              the payment number, and instructions for participants.
            </p>

            {segments.map((seg) => (
              <div key={seg.id} className="p-4 border border-[var(--border)] rounded-lg flex flex-col gap-3 bg-[var(--bg)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{seg.isNew ? 'New Segment' : 'Segment'}</span>
                  <button
                    type="button"
                    onClick={() => removeSegment(seg)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 transition-colors"
                    aria-label="Delete segment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <input
                  type="text"
                  value={seg.title}
                  onChange={(e) => updateSegment(seg.id, 'title', e.target.value)}
                  placeholder="Segment title (e.g. AI Hackathon)"
                  className={inputCls}
                />
                <textarea
                  value={seg.description}
                  onChange={(e) => updateSegment(seg.id, 'description', e.target.value)}
                  placeholder="Segment description (optional)"
                  rows={2}
                  className={`${inputCls} resize-none`}
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={seg.segment_type}
                    onChange={(e) => updateSegment(seg.id, 'segment_type', e.target.value)}
                    className={inputCls}
                  >
                    {['workshop', 'competition', 'seminar', 'gaming', 'social', 'other'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={seg.max_participants}
                    onChange={(e) => updateSegment(seg.id, 'max_participants', e.target.value)}
                    placeholder="Max participants (optional)"
                    className={inputCls}
                  />
                </div>

                <div className="flex items-center gap-4 p-3 bg-[var(--surface-2)] rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      checked={seg.is_free}
                      onChange={() => updateSegment(seg.id, 'is_free', true)}
                    />
                    Free
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      checked={!seg.is_free}
                      onChange={() => updateSegment(seg.id, 'is_free', false)}
                    />
                    Paid
                  </label>
                  {!seg.is_free && (
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={seg.price}
                      onChange={(e) => updateSegment(seg.id, 'price', e.target.value)}
                      placeholder="Price (BDT)"
                      className={`${inputCls} max-w-[160px]`}
                    />
                  )}
                </div>

                {!seg.is_free && (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={seg.payment_method.startsWith('bkash') ? 'bkash' : 'nagad'}
                        onChange={(e) =>
                          updateSegment(seg.id, 'payment_method', `${e.target.value}_${seg.payment_method.split('_')[1]}` as PaymentMethod)
                        }
                        className={inputCls}
                      >
                        <option value="bkash">bKash</option>
                        <option value="nagad">Nagad</option>
                      </select>
                      <select
                        value={seg.payment_method.split('_')[1]}
                        onChange={(e) =>
                          updateSegment(seg.id, 'payment_method', `${seg.payment_method.split('_')[0]}_${e.target.value}` as PaymentMethod)
                        }
                        className={inputCls}
                      >
                        <option value="send_money">Send Money</option>
                        <option value="pay_bill">Pay Bill</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={seg.payment_info}
                      onChange={(e) => updateSegment(seg.id, 'payment_info', e.target.value)}
                      placeholder="Payment number (e.g. 01700-000000)"
                      className={inputCls}
                    />
                    <textarea
                      value={seg.instructions}
                      onChange={(e) => updateSegment(seg.id, 'instructions', e.target.value)}
                      placeholder="Payment instructions for participants"
                      rows={2}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                )}
              </div>
            ))}

            <Button type="button" variant="secondary" onClick={addSegment} className="gap-1.5 self-start">
              <Plus size={14} /> Add Segment
            </Button>
          </Card>

          <Card className="p-6 flex flex-col gap-3">
            <h2 className="font-medium text-lg">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(t.id)
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
              <p className="text-xs text-[var(--muted)]">Draft events are hidden from participants.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              <span className="text-sm">{isPublished ? 'Published' : 'Draft'}</span>
            </label>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
              Back
            </Button>
            <Link href={`/organizer/events/${eventId}/participants`} className="flex-1">
              <Button type="button" variant="secondary" className="w-full gap-1.5">
                <Users size={14} /> Participants
              </Button>
            </Link>
            <Link href={`/events/${eventId}`} className="flex-1">
              <Button type="button" variant="secondary" className="w-full gap-1.5">
                <Compass size={14} /> View Page
              </Button>
            </Link>
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
