'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EventCard } from '@/components/cards/EventCard';
import { MOCK_EVENTS } from '@/lib/mockData';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const categories = ['all', 'competition', 'workshop', 'seminar', 'robotics', 'gaming'];

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;

      let matchesStatus = true;
      if (statusFilter === 'open') matchesStatus = e.is_open === true;
      if (statusFilter === 'closing_soon') matchesStatus = e.closing_soon === true;
      if (statusFilter === 'full') matchesStatus = e.is_full === true;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, selectedCategory, statusFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-12 flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-8">
          <Eyebrow>EXPLORE</Eyebrow>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight text-[var(--text)]">
            Event Directory
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-xl">
            Search and filter hackathons, coding contests, robotics challenges, keynotes, and esports tournaments.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-[var(--surface)] p-4 rounded-[10px] border border-[var(--border)]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event title, rules, stack, tags..."
              className="w-full h-11 pl-10 pr-4 bg-[var(--bg)] border border-[var(--border)] rounded-[6px] text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-[6px] font-mono text-xs uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-medium'
                    : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Metadata */}
        <div className="flex items-center justify-between font-mono text-xs text-[var(--muted)]">
          <span>{filteredEvents.length} events found</span>
          {(search || selectedCategory !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setStatusFilter('all');
              }}
              className="text-[var(--accent)] hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} festName={ev.fest?.title} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-[var(--surface)] rounded-[10px] border border-[var(--border)]">
            <h3 className="font-serif text-2xl text-[var(--text)]">No events match yet.</h3>
            <p className="text-sm text-[var(--muted)]">Try adjusting your search criteria or category filter.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
            >
              Clear Search
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
