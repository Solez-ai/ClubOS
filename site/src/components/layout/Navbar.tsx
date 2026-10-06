'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, QrCode, User, Home, Bell, Search, Trophy, Calendar, Sparkles, Sun, Moon, Menu, X } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { useTheme } from '@/lib/theme';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
    { href: '/manage', label: 'Manage' },
    { href: '/organizer', label: 'Organizer' },
    { href: '/account', label: 'Account' },
  ];

  return (
    <>
      {/* DESKTOP NAVBAR */}
      <header
        className={`sticky top-0 z-40 w-full bg-[var(--bg)]/90 backdrop-blur-md transition-colors duration-200 ${
          scrolled ? 'border-b border-[var(--border)] shadow-sm' : ''
        }`}
      >
        <div className="max-w-[1400px] mx-auto h-[72px] px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group cursor-pointer shrink-0">
            <span className="font-serif text-2xl font-normal text-[var(--text)] tracking-tight">
              ClubOS
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] group-hover:scale-125 transition-transform" />
          </Link>

          {/* Center Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors relative py-1 ${
                    isActive
                      ? 'text-[var(--text)]'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[var(--accent)] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={18} strokeWidth={1.5} />
              ) : (
                <Moon size={18} strokeWidth={1.5} />
              )}
            </button>

            {/* Search (Desktop) */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 h-9 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--muted)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
            >
              <Search size={14} />
              <span>Search...</span>
              <kbd className="font-mono text-[10px] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                ⌘K
              </kbd>
            </button>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="hidden sm:flex p-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors relative"
              title="Notifications"
            >
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent)]" />
            </Link>

            {/* Scan QR */}
            <Link
              href="/scan"
              className="hidden sm:flex items-center gap-2 h-9 px-3.5 bg-transparent border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-lg text-xs font-medium transition-colors"
            >
              <QrCode size={15} />
              <span>Scan</span>
            </Link>

            {/* Passport - Mobile CTA */}
            <Link
              href="/passport"
              className="flex items-center gap-2 h-9 px-3.5 bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 rounded-lg text-xs font-medium transition-opacity shrink-0"
            >
              <User size={15} />
              <span className="hidden lg:inline">Passport</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-[var(--muted)] hover:text-[var(--text)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md">
            <nav className="max-w-[1400px] mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-[var(--border)]">
                <Link
                  href="/scan"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg text-sm font-medium hover:opacity-90"
                >
                  <QrCode size={16} />
                  <span>Scan QR</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg)]/95 border-t border-[var(--border)] px-2 py-2 safe-area-pb backdrop-blur-md">
        <div className="flex items-center justify-around max-w-[600px] mx-auto">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 py-1 ${
              pathname === '/' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
            }`}
          >
            <Home size={20} strokeWidth={1.5} />
            <span className="text-[9px] font-mono uppercase tracking-wider">Home</span>
          </Link>

          <Link
            href="/fests"
            className={`flex flex-col items-center gap-1 py-1 ${
              pathname.startsWith('/fests') ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
            }`}
          >
            <Compass size={20} strokeWidth={1.5} />
            <span className="text-[9px] font-mono uppercase tracking-wider">Fests</span>
          </Link>

          {/* Center Scan Button */}
          <Link
            href="/scan"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] shadow-lg -mt-4 border-2 border-[var(--bg)] transition-transform active:scale-95"
            title="Scan QR Code"
          >
            <QrCode size={20} />
          </Link>

          <Link
            href="/passport"
            className={`flex flex-col items-center gap-1 py-1 ${
              pathname.startsWith('/passport') ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
            }`}
          >
            <User size={20} strokeWidth={1.5} />
            <span className="text-[9px] font-mono uppercase tracking-wider">Passport</span>
          </Link>

          <button
            onClick={() => setPaletteOpen(true)}
            className="flex flex-col items-center gap-1 py-1 text-[var(--muted)] cursor-pointer"
          >
            <Search size={20} strokeWidth={1.5} />
            <span className="text-[9px] font-mono uppercase tracking-wider">Search</span>
          </button>
        </div>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
};
