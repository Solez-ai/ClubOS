'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  Loader2, Calendar, Clock, MapPin, Tag, Plus, Trash2, ArrowRight,
  AlertCircle, Shield, Users, DollarSign, Check, Image, Layers, Globe
} from 'lucide-react';

// Payment method types
type PaymentMethod = 'bkash_send_money' | 'bkash_pay_bill' | 'nagad_send_money' | 'nagad_pay_bill';

interface SegmentData {
  id: string;
  title: string;
  description: string;
  segmentType: string;
  maxParticipants: string;
  isFree: boolean;
  price: string;
  paymentMethod: PaymentMethod;
  paymentInfo: string;
  instructions: string;
  startTime: string;
  endTime: string;
}

const EVENT_CATEGORIES = [
  { value: 'science_technology', label: 'Science & Technology', color: '#6366F1' },
  { value: 'music_art', label: 'Music & Art', color: '#F43F5E' },
  { value: 'sports', label: 'Sports & Fitness', color: '#22C55E' },
  { value: 'business', label: 'Business & Career', color: '#F97316' },
  { value: 'health', label: 'Health & Wellness', color: '#84CC16' },
  { value: 'food', label: 'Food & Culinary', color: '#EAB308' },
  { value: 'competition', label: 'Competition', color: '#EC4899' },
  { value: 'workshop', label: 'Workshop', color: '#3B82F6' },
  { value: 'seminar', label: 'Seminar', color: '#8B5CF6' },
  { value: 'gaming', label: 'Gaming', color: '#06B6D4' },
  { value: 'robotics', label: 'Robotics', color: '#8B5CF6' },
  { value: 'quiz', label: 'Quiz', color: '#10B981' },
  { value: 'social', label: 'Social', color: '#FB923C' },
  { value: 'other', label: 'Other', color: '#64748B' },
];

const SEGMENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'competition', label: 'Competition' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'bkash_send_money', label: 'BKash - Send Money', color: '#F74C3C', bgColor: 'bg-pink-500' },
  { value: 'bkash_pay_bill', label: 'BKash - Pay Bill', color: '#F74C3C', bgColor: 'bg-pink-500' },
  { value: 'nagad_send_money', label: 'Nagad - Send Money', color: '#F59E0B', bgColor: 'bg-orange-400' },
  { value: 'nagad_pay_bill', label: 'Nagad - Pay Bill', color: '#F59E0B', bgColor: 'bg-orange-400' },
];

export default function CreateEventPage() {
  const searchParams = useSearchParams();
  const festId = searchParams.get('festId');
  const orgId = searchParams.get('orgId');
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Event details
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prizes, setPrizes] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [venue, setVenue] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [registrationOpensAt, setRegistrationOpensAt] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isTeamEvent, setIsTeamEvent] = useState(false);
  const [teamMin, setTeamMin] = useState('1');
  const [teamMax, setTeamMax] = useState('1');
  const [xpReward, setXpReward] = useState('100');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Segments
  const [segments, setSegments] = useState<SegmentData[]>([
    { id: '1', title: '', description: '', segmentType: 'competition', maxParticipants: '', isFree: true, price: '0', paymentMethod: 'bkash_send_money', paymentInfo: '', instructions: '', startTime: '', endTime: '' }
  ]);

  // Data
  const [festIdSelected, setFestIdSelected] = useState(festId || '');
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [fests, setFests] = useState<{ id: string; title: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);

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

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login');
        return;
      }

      setUser(authData.user);

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

      // Get user's fests
      let userOrgId = orgId;
      if (!userOrgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('created_by', authData.user.id)
          .single();
        userOrgId = org?.id;
      }

      if (userOrgId) {
        const { data: userFests } = await supabase
          .from('fests')
          .select('*, org:organizations(*)')
          .eq('org_id', userOrgId)
          .order('created_at', { ascending: false });
        setFests(userFests || []);
        if (userFests && userFests.length > 0 && !festId) {
          setFestIdSelected(userFests[0].id);
        }
      }

      // Get all tags
      const { data: allTags } = await supabase.from('category_tags').select('*').order('name');
      if (allTags) setTags(allTags);
    };

    init();
  }, [supabase, router, festId, orgId]);

  const addSegment = () => {
    setSegments([...segments, {
      id: Date.now().toString(),
      title: '',
      description: '',
      segmentType: 'competition',
      maxParticipants: '',
      isFree: true,
      price: '0',
      paymentMethod: 'bkash_send_money',
      paymentInfo: '',
      instructions: '',
      startTime: '',
      endTime: '',
    }]);
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const updateSegment = (id: string, field: keyof SegmentData, value: string | number | boolean) => {
    setSegments(segments.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !festIdSelected) {
      setError('Please select a fest');
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

      // Create event
      const { data: event, error: eventErr } = await supabase
        .from('events')
        .insert({
          fest_id: festIdSelected,
          title,
          slug: `${slug}-${Date.now()}`,
          category,
          description,
          rules,
          prizes,
          cover_url: coverUrl,
          thumbnail_url: thumbnailUrl,
          starts_at: new Date(startsAt),
          ends_at: endsAt ? new Date(endsAt) : null,
          venue,
          google_maps_url: googleMapsUrl,
          registration_opens_at: new Date(registrationOpensAt),
          registration_deadline: new Date(registrationDeadline),
          capacity: capacity ? parseInt(capacity) : null,
          is_team_event: isTeamEvent,
          team_min: parseInt(teamMin) || 1,
          team_max: parseInt(teamMax) || 1,
          xp_reward: parseInt(xpReward) || 0,
          is_published: true,
          is_featured: false,
          created_by:    user?.id,
        })
        .select()
        .single()
        .then((created) => {
          if (!created) {
            throw new Error('Event insert returned no row');
          }
          return created;
        });

      if (eventErr) {
        setError(eventErr.message);
        setLoading(false);
        return;
      }

      if (!event) {
        setError('Failed to create event (no row returned)');
        setLoading(false);
        return;
      }

      // Add tags
      if (selectedTags.length > 0) {
        const tagLinks = selectedTags.map(tagId => ({
          event_id: event.id,
          tag_id: tagId,
        }));
        await supabase.from('event_tags').insert(tagLinks);
      }

      // Add segments
      for (const seg of segments) {
        if (seg.title) {
          const { error: segErr } = await supabase.from('segments').insert({
            event_id: event.id,
            title: seg.title,
            description: seg.description,
            segment_type: seg.segmentType,
            max_participants: seg.maxParticipants ? parseInt(seg.maxParticipants) : null,
            price: parseFloat(seg.price) || 0,
            is_free: seg.isFree,
            payment_method: seg.paymentMethod,
            payment_info: seg.paymentInfo,
            instructions: seg.instructions,
            start_time: seg.startTime ? new Date(seg.startTime) : null,
            end_time: seg.endTime ? new Date(seg.endTime) : null,
            is_active: true,
            created_by: user?.id,
          });
          if (segErr) {
            console.error('Segment insert failed for segment', seg.title, segErr);
          }
        }
      }

      setSuccess('Event created successfully!');
      setTimeout(() => {
        router.push(`/events/${event.slug}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
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

      <main className="max-w-4xl mx-auto w-full px-4 py-12 flex flex-col gap-8">
        <div className="flex items-center gap-3 mb-2">
          <Layers size={24} className="text-[var(--accent)]" />
          <div>
            <h1 className="font-serif text-3xl">Create Event</h1>
            <p className="text-sm text-[var(--muted)]">Add a new event with segments, pricing, and details</p>
          </div>
        </div>

        {/* Fest Selection */}
        {fests.length > 0 && (
          <Card className="p-4">
            <label className="block text-sm font-medium mb-2">Select Fest</label>
            <select
              value={festIdSelected}
              onChange={(e) => setFestIdSelected(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            >
              {fests.map(f => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </Card>
        )}

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

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3, 4].map(s => (
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
              <div className="space-y-6">
                <h2 className="font-medium text-lg flex items-center gap-2">
                  <Calendar size={20} className="text-[var(--accent)]" />
                  Basic Information
                </h2>

                <div className="grid gap-4">
                  <Input
                    label="Event Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="AI Hackathon 2026"
                    required
                  />

                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] appearance-none cursor-pointer"
                    >
                      {EVENT_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value} style={{ color: cat.color }}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <Tag size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your event - what it's about, who should attend, what to expect..."
                      rows={4}
                      className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Rules</label>
                    <textarea
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      placeholder="Registration rules, participant requirements, competition rules..."
                      rows={3}
                      className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Prizes</label>
                    <textarea
                      value={prizes}
                      onChange={(e) => setPrizes(e.target.value)}
                      placeholder="1st: 50,000 BDT + Trophy&#10;2nd: 30,000 BDT&#10;3rd: 15,000 BDT"
                      rows={3}
                      className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-[var(--surface)] rounded-lg">
                    <input
                      type="checkbox"
                      id="isTeamEvent"
                      checked={isTeamEvent}
                      onChange={(e) => setIsTeamEvent(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <label htmlFor="isTeamEvent" className="text-sm cursor-pointer">
                      This is a team event
                    </label>
                  </div>

                  {isTeamEvent && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Min Team Size"
                        type="number"
                        value={teamMin}
                        onChange={(e) => setTeamMin(e.target.value)}
                        min={1}
                      />
                      <Input
                        label="Max Team Size"
                        type="number"
                        value={teamMax}
                        onChange={(e) => setTeamMax(e.target.value)}
                        min={1}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Dates, Time & Venue */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-medium text-lg flex items-center gap-2">
                  <Clock size={20} className="text-[var(--accent)]" />
                  Schedule
                </h2>

                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        required
                      />
                      <span className="block text-xs text-[var(--muted)] mt-1">Event Start</span>
                    </div>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      />
                      <span className="block text-xs text-[var(--muted)] mt-1">Event End (Optional)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="datetime-local"
                        value={registrationOpensAt}
                        onChange={(e) => setRegistrationOpensAt(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        required
                      />
                      <span className="block text-xs text-[var(--muted)] mt-1">Registration Opens</span>
                    </div>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="datetime-local"
                        value={registrationDeadline}
                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                        required
                      />
                      <span className="block text-xs text-[var(--muted)] mt-1">Registration Deadline</span>
                    </div>
                  </div>
                </div>

                <h2 className="font-medium text-lg flex items-center gap-2 mt-6">
                  <MapPin size={20} className="text-[var(--accent)]" />
                  Location
                </h2>

                <div className="space-y-4">
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="DRMC Computer Lab 3"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="url"
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/?q=Location"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Google Maps link (paste the URL from your browser)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Capacity & Settings */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-medium text-lg flex items-center gap-2">
                  <Users size={20} className="text-[var(--accent)]" />
                  Capacity & Settings
                </h2>

                <div className="grid gap-4">
                  <Input
                    label="Capacity (Optional)"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    min={1}
                  />
                  <p className="text-xs text-[var(--muted)]">
                    Maximum number of participants. Leave empty for unlimited spots.
                  </p>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">XP Reward</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="number"
                        value={xpReward}
                        onChange={(e) => setXpReward(e.target.value)}
                        min={0}
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">XP</span>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      XP points participants earn for registering
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Segments */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-lg flex items-center gap-2">
                    <Layers size={20} className="text-[var(--accent)]" />
                    Segments
                  </h2>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addSegment}
                    className="gap-1.5 text-xs"
                  >
                    <Plus size={14} />
                    Add Segment
                  </Button>
                </div>

                <p className="text-sm text-[var(--muted)]">
                  Segments are different categories or activities within your event.
                  Each segment can have its own price and payment method.
                </p>

                <div className="flex flex-col gap-4">
                  {segments.map((seg, idx) => (
                    <Card key={seg.id} className="p-4 border-[var(--border)]">
                      <div className="flex items-start justify-between mb-4">
                        <span className="font-medium text-sm">Segment {idx + 1}</span>
                        {segments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSegment(seg.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <Input
                          label="Segment Title"
                          value={seg.title}
                          onChange={(e) => updateSegment(seg.id, 'title', e.target.value)}
                          placeholder="AI Hackathon - Advanced Track"
                        />

                        <Input
                          label="Description (Optional)"
                          value={seg.description}
                          onChange={(e) => updateSegment(seg.id, 'description', e.target.value)}
                          placeholder="Description of this segment..."
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <select
                            value={seg.segmentType}
                            onChange={(e) => updateSegment(seg.id, 'segmentType', e.target.value)}
                            className="px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                          >
                            {SEGMENT_TYPES.map(st => (
                              <option key={st.value} value={st.value}>{st.label}</option>
                            ))}
                          </select>
                          <Input
                            label="Max Participants"
                            type="number"
                            value={seg.maxParticipants}
                            onChange={(e) => updateSegment(seg.id, 'maxParticipants', e.target.value)}
                            placeholder="100"
                            min={1}
                          />
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-[var(--surface-2)] rounded-lg">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={seg.isFree}
                              onChange={(e) => updateSegment(seg.id, 'isFree', e.target.checked)}
                              className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                            />
                            <span className="text-sm">Free Segment</span>
                          </label>
                        </div>

                        {!seg.isFree && (
                          <div className="grid gap-3 p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
                            <h4 className="text-sm font-medium mb-3">Pricing & Payment</h4>

                            <div className="relative">
                              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                              <input
                                type="number"
                                value={seg.price}
                                onChange={(e) => updateSegment(seg.id, 'price', e.target.value)}
                                min={0}
                                step={0.01}
                                className="w-full pl-8 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--accent)] text-sm"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">BDT</span>
                            </div>

                            <div>
                              <label className="block text-xs font-medium mb-1.5 text-[var(--muted)]">Payment Method</label>
                              <div className="grid grid-cols-2 gap-2">
                                {PAYMENT_METHODS.map(pm => (
                                  <button
                                    key={pm.value}
                                    type="button"
                                    onClick={() => updateSegment(seg.id, 'paymentMethod', pm.value as PaymentMethod)}
                                    className={`p-2 rounded-lg border-2 text-xs font-medium transition-colors ${
                                      seg.paymentMethod === pm.value
                                        ? `${pm.bgColor} border-transparent text-white`
                                        : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)]'
                                    }`}
                                  >
                                    {pm.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium mb-1.5 text-[var(--muted)]">Payment Info</label>
                              <input
                                type="text"
                                value={seg.paymentInfo}
                                onChange={(e) => updateSegment(seg.id, 'paymentInfo', e.target.value)}
                                placeholder='{"number": "01700000000", "type": "send_money", "display": "Send money to 01700000000"}'
                                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] text-xs font-mono focus:outline-none focus:border-[var(--accent)]"
                                disabled={!seg.price || parseFloat(seg.price) === 0}
                              />
                              <p className="text-xs text-[var(--muted)] mt-1">
                                JSON with payment details shown to participants
                              </p>
                            </div>

                            <Input
                              label="Instructions (Optional)"
                              value={seg.instructions}
                              onChange={(e) => updateSegment(seg.id, 'instructions', e.target.value)}
                              placeholder="Special instructions for this segment..."
                              className="text-sm"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                            <input
                              type="datetime-local"
                              value={seg.startTime}
                              onChange={(e) => updateSegment(seg.id, 'startTime', e.target.value)}
                              className="w-full pl-8 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]"
                            />
                            <span className="block text-xs text-[var(--muted)] mt-1">Start Time</span>
                          </div>
                          <div className="relative">
                            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                            <input
                              type="datetime-local"
                              value={seg.endTime}
                              onChange={(e) => updateSegment(seg.id, 'endTime', e.target.value)}
                              className="w-full pl-8 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]"
                            />
                            <span className="block text-xs text-[var(--muted)] mt-1">End Time</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
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
              {step < 4 ? (
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
                  disabled={!title || !startsAt || !registrationOpensAt || !registrationDeadline}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Event
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
