import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--bg)] border-t border-[var(--border)] mt-auto pt-16 pb-24 md:pb-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-12">
        {/* Sign-off Line */}
        <div className="flex flex-col gap-2 max-w-xl">
          <h2 className="font-serif text-3xl sm:text-4xl text-[var(--text)] font-light tracking-tight">
            One passport for every fest.
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Empowering participants, organizers, and campus clubs with digital identity, verification, and event orchestration.
          </p>
        </div>

        {/* 3 Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-[var(--border)]">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-widest">
              DIRECTORY
            </span>
            <Link href="/fests" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              All Fests
            </Link>
            <Link href="/events" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              Explore Events
            </Link>
            <Link href="/leaderboard" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              Global Leaderboard
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-widest">
              ECOSYSTEM
            </span>
            <Link href="/passport" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              Digital Passport
            </Link>
            <Link href="/scan" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              QR Scanner
            </Link>
            <Link href="/login" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              Participant Sign In
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-widest">
              ORGANIZERS
            </span>
            <Link href="/organizer" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              Organizer Portal
            </Link>
            <Link href="/organizer/fests/new" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              Create Fest
            </Link>
            <Link href="/organizer/check-in" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              Attendee Scanner
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-widest">
              ORGANIZATION
            </span>
            <Link href="/orgs/drmc-it-club" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              DRMC IT Club
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>

        {/* Legal Mono Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[var(--muted)]">
          <span>© 2026 ClubOS. Open Source under MIT License.</span>
          <span>9th DRMC International Tech Carnival 2026</span>
        </div>
      </div>
    </footer>
  );
};
