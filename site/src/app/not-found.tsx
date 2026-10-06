import Link from 'next/link';
import { Compass, CalendarDays } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className="font-mono text-[var(--accent)] text-sm tracking-widest uppercase mb-4">
            Error 404
          </p>
          <h1 className="font-serif text-5xl mb-4">Page not found</h1>
          <p className="text-[var(--muted)] mb-8">
            The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you
            back on track.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Compass size={15} />
              Back home
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
            >
              <CalendarDays size={15} />
              Browse events
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
