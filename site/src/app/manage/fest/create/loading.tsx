import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-[var(--accent)] mx-auto mb-4" />
        <p className="text-[var(--muted)]">Loading...</p>
      </div>
    </div>
  );
}
