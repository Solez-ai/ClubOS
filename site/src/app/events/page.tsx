'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { EventCard } from '@/components/cards/EventCard';
import { createClient } from '@/lib/supabase/client';
import { Search, Filter, SlidersHorizontal, X, Calendar, Tag } from 'lucide-react';

// All available category tags for filtering
const ALL_CATEGORIES = [
  // Science & Technology
  { value: 'science_technology', label: 'Science & Tech', icon: '🔬', color: '#6366F1' },
  { value: 'music_art', label: 'Music & Art', icon: '🎨', color: '#F43F5E' },
  { value: 'sports', label: 'Sports', icon: '⚽', color: '#22C55E' },
  { value: 'business', label: 'Business', icon: '💼', color: '#F97316' },
  { value: 'health', label: 'Health', icon: '💚', color: '#84CC16' },
  { value: 'food', label: 'Food', icon: '🍕', color: '#EAB308' },
  { value: 'competition', label: 'Competition', icon: '🏆', color: '#EC4899' },
  { value: 'workshop', label: 'Workshop', icon: '🔧', color: '#3B82F6' },
  { value: 'seminar', label: 'Seminar', icon: '📚', color: '#8B5CF6' },
  { value: 'gaming', label: 'Gaming', icon: '🎮', color: '#06B6D4' },
  { value: 'robotics', label: 'Robotics', icon: '🤖', color: '#8B5CF6' },
  { value: 'quiz', label: 'Quiz', icon: '❓', color: '#10B981' },
  { value: 'social', label: 'Social', icon: '🤝', color: '#FB923C' },
  { value: 'other', label: 'Other', icon: '📌', color: '#64748B' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = React.useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;

      // Check auth
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) setUser(authData.user);

      // Fetch events with fest and segments
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          fest:fest_id(*),
          segments(*),
          tags_data:search:public.category_tags(*),
          event_tags(tag_id)
        `)
        .order('starts_at', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      } else {
        setEvents(eventsData || []);
      }

      // Fetch category tags
      const { data: tagsData } = await supabase
        .from('category_tags')
        .select('*')
        .order('name');

      if (tagsData) setTags(tagsData);

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  // Compute status for each event
  const eventsWithStatus = useMemo(() => {
    const now = new Date();
    return events.map(e => {
      const startsAt = new Date(e.starts_at);
      const deadline = new Date(e.registration_deadline);
      const hasCapacity = e.capacity ? e.capacity > 0 : true;
      const confirmed = typeof e.confirmed_count === 'number' ? e.confirmed_count : 0;
      const spotsLeft = e.capacity ? (e.capacity - confirmed) : null;

      return {
        ...e,
        is_open: now >= startsAt && now <= deadline && hasCapacity,
        is_full: spotsLeft !== null && spotsLeft <= 0,
        closing_soon: (deadline.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000 && deadline > now,
        spots_left: spotsLeft,
        tags_list: e.event_tags?.map((et: any) => et.tag_id) || [],
      };
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    const now = new Date();

    return eventsWithStatus.filter((e: any) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          e.title?.toLowerCase().includes(searchLower) ||
          e.description?.toLowerCase().includes(searchLower) ||
          e.tags?.some((t: string) => t.toLowerCase().includes(searchLower)) ||
          (e.tags_data || []).some((t: any) => t.name?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) {
        return false;
      }

      // Tag filters
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some(tagId =>
          e.tags_list?.includes(tagId) ||
          (e.tags_data || []).some((t: any) => t.id === tagId)
        );
        if (!hasTag) return false;
      }

      // Status filter
      if (statusFilter === 'open' && !e.is_open) return false;
      if (statusFilter === 'closing_soon' && !e.closing_soon) return false;
      if (statusFilter === 'full' && !e.is_full) return false;
      if (statusFilter === 'upcoming' && new Date(e.starts_at) <= now) return false;
      if (statusFilter === 'past' && new Date(e.starts_at) > now) return false;

      // Date range filter
      if (dateFrom && new Date(e.starts_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.starts_at) > new Date(dateTo)) return false;

      return true;
    });
  }, [eventsWithStatus, search, selectedCategory, selectedTags, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedTags([]);
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const activeFilterCount = [
    selectedCategory !== 'all',
    selectedTags.length > 0,
    statusFilter !== 'all',
    dateFrom || dateTo,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--muted)]">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-8">
          <Eyebrow>EXPLORE</Eyebrow>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">
            Event Directory
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-2xl">
            Discover hackathons, workshops, competitions, cultural events, and more.
            {user && <span className="text-[var(--accent)]"> {eventsWithStatus.length} events available</span>}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)]">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events by name, description, or tags..."
                className="w-full h-12 pl-10 pr-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                activeFilterCount > 0
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)]'
              }`}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] space-y-6">
              {/* Status Filter */}
              <div className="flex flex-wrap gap-2">
                {['all', 'open', 'upcoming', 'closing_soon', 'full', 'past'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      statusFilter === status
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                        : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Tag size={14} className="text-[var(--muted)]" />
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                        : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    All Categories
                  </button>
                  {ALL_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(selectedCategory === cat.value ? 'all' : cat.value)}
                      style={{
                        backgroundColor: selectedCategory === cat.value ? cat.color : undefined,
                        color: selectedCategory === cat.value ? '#fff' : undefined,
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-transparent hover:border-[var(--border)]"
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Tag size={14} className="text-[var(--muted)]" />
                  Tags (select multiple)
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag.id)
                            ? prev.filter(t => t !== tag.id)
                            : [...prev, tag.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                          : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="mt-2 text-xs text-[var(--accent)] hover:underline"
                  >
                    Clear tag filters ({selectedTags.length})
                  </button>
                )}
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">From</span>
                </div>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">To</span>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                >
                  <X size={14} />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Metadata */}
        <div className="flex items-center justify-between font-mono text-xs text-[var(--muted)]">
          <span>{filteredEvents.length} events found</span>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-[var(--accent)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} festName={ev.fest?.title} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
              <Search size={24} className="text-[var(--muted)]" />
            </div>
            <h3 className="font-serif text-2xl">No events match your filters</h3>
            <p className="text-sm text-[var(--muted)] max-w-sm">
              Try adjusting your search terms or clearing some filters to see more events.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
