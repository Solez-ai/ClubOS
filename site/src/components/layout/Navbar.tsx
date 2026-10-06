'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Compass, QrCode, User, Home, Bell, Search, Sun, Moon, Menu, X, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { useTheme } from '@/lib/theme';
import { createClient } from '@/lib/supabase/client';

type ProfileLite = { role: 'participant' | 'organizer'; full_name: string } | null;

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<'loading' | 'signed_in' | 'signed_out'>('loading');
  const [profile, setProfile] = useState<ProfileLite>(null);
  const [signingOut, setSigningOut] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user ?? null;
      if (!user) {
        setAuthState('signed_out');
        return;
      }
      supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()
        .then(({ data: prof }) => {
          setProfile(prof ?? null);
          setAuthState('signed_in');
        });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setAuthState('signed_out');
        setProfile(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const isOrganizer = profile?.role === 'organizer';

  const navLinks = [
    { href: '/fests', label: 'Fests' },
    { href: '/events', label: 'Events' },
    { href: '/passport', label: 'Passport' },
    ...(isOrganizer ? [{ href: '/organizer', label: 'Organizer' }] : []),
  ];

  const renderAuthArea = () => {
    if (authState === 'loading') {
      return <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] animate-pulse" />;
    }

    if (authState === 'signed_out') {
      return (
        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/login"
            className="h-9 px-4 flex items-center text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="h-9 px-4 flex items-center bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 rounded-lg text-sm font-medium transition-opacity"
          >
            Sign Up
          </Link>
        </div>
      );
    }

    return (
      <div className="relative hidden lg:block group">
        <button
          className="flex items-center gap-2 h-9 px-2 pr-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          aria-label="Account menu"
        >
          <span className="w-7 h-7 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center text-xs font-medium">
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium text-[var(--text)] max-w-[120px] truncate">
            {profile?.full_name || 'Account'}
          </span>
        </button>
        {/* Dropdown */}
        <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all">
          <div className="w-52 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
            <Link href="/passport" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors">
              <User size={15} className="text-[var(--muted)]" /> My Passport
            </Link>
            <Link href="/manage" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors">
              <LayoutDashboard size={15} className="text-[var(--muted)]" /> Manage
            </Link>
            {isOrganizer && (
              <Link href="/organizer" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors">
                <Compass size={15} className="text-[var(--muted)]" /> Organizer Portal
              </Link>
            )}
            <Link href="/account" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors">
              <Settings size={15} className="text-[var(--muted)]" /> Account Settings
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-[var(--surface-2)] transition-colors border-t border-[var(--border)] disabled:opacity-50"
            >
              <LogOut size={15} /> {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    );
  };

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

            {/* Notifications (signed in) */}
            {authState === 'signed_in' && (
              <Link
                href="/notifications"
                className="hidden sm:flex p-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors relative"
                title="Notifications"
              >
                <Bell size={18} strokeWidth={1.5} />
              </Link>
            )}

            {/* Scan QR (signed in) */}
            {authState === 'signed_in' && (
              <Link
                href="/scan"
                className="hidden sm:flex items-center gap-2 h-9 px-3.5 bg-transparent border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-lg text-xs font-medium transition-colors"
              >
                <QrCode size={15} />
                <span>Scan</span>
              </Link>
            )}

            {/* Auth area (desktop) */}
            {renderAuthArea()}

            {/* Passport quick link on tablet/mobile desktop row */}
            {authState === 'signed_in' && (
              <Link
                href="/passport"
                className="lg:hidden flex items-center gap-2 h-9 px-3.5 bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 rounded-lg text-xs font-medium transition-opacity shrink-0"
              >
                <User size={15} />
                <span className="hidden sm:inline">Passport</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-[var(--muted)] hover:text-[var(--text)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md max-h-[calc(100vh-72px)] overflow-y-auto">
            <nav className="max-w-[1400px] mx-auto px-4 py-4 space-y-1">
              {authState === 'loading' && (
                <div className="py-3 px-4 text-sm text-[var(--muted)]">Loading…</div>
              )}

              {authState === 'signed_out' ? (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block w-full py-3 px-4 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-3">
                    <Link
                      href="/login"
                      className="flex items-center justify-center py-3 px-4 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="flex items-center justify-center py-3 px-4 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg text-sm font-medium hover:opacity-90"
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
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
                  {authState === 'signed_in' && (
                    <>
                      <Link
                        href="/manage"
                        className="block w-full py-3 px-4 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                      >
                        Manage
                      </Link>
                      <Link
                        href="/account"
                        className="block w-full py-3 px-4 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                      >
                        Account Settings
                      </Link>
                      <Link
                        href="/notifications"
                        className="block w-full py-3 px-4 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                      >
                        Notifications
                      </Link>
                    </>
                  )}
                  <div className="pt-3 border-t border-[var(--border)]">
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-red-500 hover:bg-[var(--surface-2)] disabled:opacity-50"
                    >
                      <LogOut size={16} />
                      {signingOut ? 'Signing out…' : 'Sign Out'}
                    </button>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      {authState === 'signed_in' && (
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
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
};
