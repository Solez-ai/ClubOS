'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: string | null;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not configured');
      return null;
    }
    return createClient();
  }, []);

  const loadNotifications = useCallback(
    async (userId: string) => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications(data || []);
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login?returnTo=/notifications');
        return;
      }
      setSignedIn(true);
      await loadNotifications(authData.user.id);
    };

    checkAuth();
  }, [supabase, router, loadNotifications]);

  const markAsRead = async (id: string) => {
    if (!supabase) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!supabase) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[var(--muted)]" size={32} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-[var(--muted)]" />
            </button>
            <div>
              <h1 className="text-2xl font-serif">Notifications</h1>
              <p className="text-sm text-[var(--muted)]">
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
            >
              <Check size={15} />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-[var(--muted)]" />
            </div>
            <h2 className="text-lg font-medium mb-2">No notifications yet</h2>
            <p className="text-sm text-[var(--muted)] mb-6">
              {signedIn
                ? 'Updates about your registrations and events will appear here.'
                : 'Sign in to see your notifications.'}
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg text-sm font-medium hover:opacity-90"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-colors ${
                  n.read
                    ? 'border-[var(--border)] bg-[var(--surface)]'
                    : 'border-[var(--accent)]/30 bg-[var(--accent)]/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      n.read ? 'bg-[var(--border-strong)]' : 'bg-[var(--accent)]'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm">{n.title}</h3>
                      <span className="text-xs text-[var(--muted)] shrink-0">
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="text-sm text-[var(--muted)] mt-1">{n.body}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => markAsRead(n.id)}
                          className="text-xs font-medium text-[var(--accent)] hover:underline"
                        >
                          View
                        </Link>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
