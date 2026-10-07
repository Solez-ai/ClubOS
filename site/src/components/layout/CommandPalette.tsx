'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, Compass, Calendar, Trophy, User, QrCode, LayoutDashboard } from 'lucide-react';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const router = useRouter();
  const [search, setSearch] = useState('');

  if (!open) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-[var(--surface)] border border-[var(--border-strong)] rounded-[10px] shadow-2xl overflow-hidden z-10">
        <Command className="w-full">
          <div className="flex items-center border-b border-[var(--border)] px-4">
            <Search size={18} className="text-[var(--muted)] mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search fests, events, passports..."
              className="w-full h-12 bg-transparent text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
            />
            <kbd className="font-mono text-[10px] text-[var(--muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)]">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[320px] overflow-y-auto p-2 scrollbar-none">
            <Command.Empty className="p-4 text-center text-xs text-[var(--muted)] font-mono">
              No results found for &ldquo;{search}&rdquo;.
            </Command.Empty>

            <Command.Group heading="QUICK NAVIGATION" className="text-[10px] font-mono uppercase text-[var(--muted)] px-3 py-1.5 tracking-wider">
              <Command.Item
                onSelect={() => navigateTo('/fests')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                <Compass size={16} className="text-[var(--accent)]" />
                <span>Explore All Fests</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('/events')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                <Calendar size={16} className="text-[var(--accent)]" />
                <span>Event Directory</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('/passport')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                <User size={16} className="text-[var(--accent)]" />
                <span>My Passport & Tickets</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('/scan')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                <QrCode size={16} className="text-[var(--accent)]" />
                <span>Camera QR Scanner</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('/leaderboard')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                <Trophy size={16} className="text-[var(--accent)]" />
                <span>Global Leaderboard</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('/organizer')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
              >
                <LayoutDashboard size={16} className="text-[var(--accent)]" />
                <span>Organizer Dashboard</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
