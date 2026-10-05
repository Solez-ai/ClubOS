'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, QrCode, User, Home, Bell, Search, Trophy, Calendar, Sparkles } from 'lucide-react';
import { CommandPalette } from './CommandPalette';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { href: '/fests', label: 'Fests' },
    { href: '/events', label: 'Events' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/account', label: 'Account' },
    { href: '/demo', label: 'Demo' },
  ];

  return (
    <>
      {/* DESKTOP NAVBAR */}
      <header
        className={`sticky top-0 z-40 w-full bg-[var(--bg)] transition-colors duration-200 ${
          scrolled ? 'border-b border-[var(--border)] shadow-sm' : ''
        }`}
      >
        <div className="max-w-[1200px] mx-auto h-[72px] px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group cursor-pointer">
            <span className="font-serif text-2xl font-normal text-[var(--text)] tracking-tight">
              ClubOS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] group-hover:scale-125 transition-transform" />
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors relative py-1 ${
                    isActive ? 'text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[var(--accent)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] text-xs text-[var(--muted)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              <Search size={14} />
              <span>Search...</span>
              <kbd className="font-mono text-[10px] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                ⌘K
              </kbd>
            </button>

            <Link
              href="/notifications"
              className="p-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors relative"
              title="Notifications"
            >
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent)]" />
            </Link>

            <Link
              href="/scan"
              className="hidden sm:flex items-center gap-2 h-9 px-3.5 bg-transparent border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-[6px] text-xs font-medium transition-colors"
            >
              <QrCode size={15} />
              <span>Scan QR</span>
            </Link>

            <Link
              href="/passport"
              className="flex items-center gap-2 h-9 px-3.5 bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 rounded-[6px] text-xs font-medium transition-opacity"
            >
              <User size={15} />
              <span className="hidden xs:inline">Passport</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg)]/95 border-t border-[var(--border)] px-4 py-2 safe-area-pb backdrop-blur-md">
        <div className="flex items-center justify-around">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 ${
              pathname === '/' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
            }`}
          >
            <Home size={18} strokeWidth={1.5} />
            <span className="text-[10px] font-mono">Home</span>
          </Link>

          <Link
            href="/fests"
            className={`flex flex-col items-center gap-1 ${
              pathname.startsWith('/fests') ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
            }`}
          >
            <Compass size={18} strokeWidth={1.5} />
            <span className="text-[10px] font-mono">Fests</span>
          </Link>

          {/* Center Scan Button with Brass Ring */}
          <Link
            href="/scan"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] shadow-lg -mt-5 border-4 border-[var(--bg)] transition-transform active:scale-95"
            title="Scan QR Code"
          >
            <QrCode size={22} />
          </Link>

          <Link
            href="/passport"
            className={`flex flex-col items-center gap-1 ${
              pathname.startsWith('/passport') ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
            }`}
          >
            <User size={18} strokeWidth={1.5} />
            <span className="text-[10px] font-mono">Passport</span>
          </Link>

          <button
            onClick={() => setPaletteOpen(true)}
            className="flex flex-col items-center gap-1 text-[var(--muted)] cursor-pointer"
          >
            <Search size={18} strokeWidth={1.5} />
            <span className="text-[10px] font-mono">Search</span>
          </button>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
};
