'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error in the console for debugging; production users see a friendly page.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--danger)]/10 border border-[var(--danger)]/30 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={28} className="text-[var(--danger)]" />
          </div>
          <h1 className="font-serif text-3xl mb-3">Something went wrong</h1>
          <p className="text-[var(--muted)] mb-8">
            An unexpected error occurred while loading this page. Your data is safe — please try again.
            {error.digest && (
              <span className="block mt-2 text-xs font-mono text-[var(--text-subtle)]">
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={15} />
              Try again
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
