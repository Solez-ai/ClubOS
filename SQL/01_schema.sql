-- ClubOS Database Schema (Supabase Postgres)
-- Heavy-load optimized with proper indexes, constraints, and RLS

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('participant', 'organizer', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE reg_status AS ENUM ('pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected', 'checked_in');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE event_category AS ENUM ('competition', 'workshop', 'seminar', 'gaming', 'robotics', 'quiz', 'social', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  institution TEXT,
  student_id TEXT,
  bio TEXT,
  interests TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  passport_no TEXT UNIQUE NOT NULL,
  passport_public BOOLEAN DEFAULT true,
  xp INT NOT NULL DEFAULT 0,
  role user_role NOT NULL DEFAULT 'participant',
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Org Members
CREATE TABLE IF NOT EXISTS public.org_members (
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'organizer',
  PRIMARY KEY (org_id, user_id)
);

-- 4. Org Follows
CREATE TABLE IF NOT EXISTS public.org_follows (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, org_id)
);

-- 5. Fests
CREATE TABLE IF NOT EXISTS public.fests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT,
  cover_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  checkin_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fest_id UUID NOT NULL REFERENCES public.fests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category event_category NOT NULL DEFAULT 'other',
  description TEXT,
  rules TEXT,
  prizes TEXT,
  cover_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  venue TEXT,
  registration_opens_at TIMESTAMPTZ DEFAULT now(),
  registration_deadline TIMESTAMPTZ NOT NULL,
  capacity INT,
  waitlist_enabled BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  is_team_event BOOLEAN DEFAULT false,
  team_min INT DEFAULT 1,
  team_max INT DEFAULT 1,
  fee_amount INT DEFAULT 0,
  xp_reward INT DEFAULT 100,
  checkin_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  custom_fields JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Registrations
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status reg_status NOT NULL DEFAULT 'confirmed',
  team_name TEXT,
  team_members JSONB DEFAULT '[]',
  answers JSONB DEFAULT '{}',
  ticket_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  checked_in_at TIMESTAMPTZ,
  checkin_method TEXT,
  waitlist_position INT,
  organizer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- 8. Stamps
CREATE TABLE IF NOT EXISTS public.stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('event', 'fest')),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  fest_id UUID REFERENCES public.fests(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT stamp_target_check CHECK (
    (kind = 'event' AND event_id IS NOT NULL) OR
    (kind = 'fest' AND fest_id IS NOT NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stamps_event ON public.stamps(user_id, event_id) WHERE kind = 'event';
CREATE UNIQUE INDEX IF NOT EXISTS idx_stamps_fest ON public.stamps(user_id, fest_id) WHERE kind = 'fest';

-- 9. Badges
CREATE TABLE IF NOT EXISTS public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rings INT DEFAULT 1,
  xp_reward INT DEFAULT 0
);

-- 10. User Badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE,
  fest_id UUID REFERENCES public.fests(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  featured BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, badge_id, fest_id)
);

-- 11. XP Ledger
CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT,
  ref_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Connections
CREATE TABLE IF NOT EXISTS public.connections (
  user_a UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  fest_id UUID REFERENCES public.fests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fest_id UUID REFERENCES public.fests(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, event_id)
);

-- 16. Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- 17. Activity Log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for Heavy Load
CREATE INDEX IF NOT EXISTS idx_events_fest ON public.events(fest_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_dates ON public.events(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_events_deadline ON public.events(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(is_published);

CREATE INDEX IF NOT EXISTS idx_reg_event_status ON public.registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_reg_user ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_reg_ticket ON public.registrations(ticket_code);
CREATE INDEX IF NOT EXISTS idx_reg_waitlist ON public.registrations(event_id, waitlist_position) WHERE status = 'waitlisted';

CREATE INDEX IF NOT EXISTS idx_xp_ledger_user ON public.xp_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_activity_event ON public.activity_log(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);

-- View: Event with counts
CREATE OR REPLACE VIEW public.event_with_counts AS
SELECT 
  e.*,
  COALESCE(r.registered_count, 0)::INT as registered_count,
  COALESCE(r.confirmed_count, 0)::INT as confirmed_count,
  COALESCE(r.waitlist_count, 0)::INT as waitlist_count,
  COALESCE(r.checked_in_count, 0)::INT as checked_in_count,
  CASE 
    WHEN e.capacity IS NULL THEN NULL 
    ELSE GREATEST(0, e.capacity - COALESCE(r.active_count, 0))::INT 
  END as spots_left,
  (
    e.is_published = true AND 
    now() >= e.registration_opens_at AND 
    now() <= e.registration_deadline AND 
    (e.capacity IS NULL OR COALESCE(r.active_count, 0) < e.capacity OR e.waitlist_enabled = true)
  ) as is_open,
  (
    e.capacity IS NOT NULL AND COALESCE(r.active_count, 0) >= e.capacity
  ) as is_full,
  (
    e.registration_deadline - now() <= INTERVAL '48 hours' AND e.registration_deadline > now()
  ) as closing_soon
FROM public.events e
LEFT JOIN (
  SELECT 
    event_id,
    COUNT(*) FILTER (WHERE status IN ('confirmed', 'checked_in', 'pending')) as active_count,
    COUNT(*) FILTER (WHERE status IN ('confirmed', 'checked_in', 'pending', 'waitlisted')) as registered_count,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
    COUNT(*) FILTER (WHERE status = 'waitlisted') as waitlist_count,
    COUNT(*) FILTER (WHERE status = 'checked_in') as checked_in_count
  FROM public.registrations
  GROUP BY event_id
) r ON e.id = r.event_id;

-- View: Public Passports (Privacy aware)
CREATE OR REPLACE VIEW public.public_passports AS
SELECT 
  id,
  handle,
  CASE WHEN passport_public THEN full_name ELSE 'Anonymous Participant' END as full_name,
  CASE WHEN passport_public THEN avatar_url ELSE NULL END as avatar_url,
  CASE WHEN passport_public THEN institution ELSE 'Private Institution' END as institution,
  CASE WHEN passport_public THEN bio ELSE NULL END as bio,
  passport_no,
  passport_public,
  xp,
  FLOOR(SQRT(xp::numeric / 50.0)) + 1 as level,
  created_at
FROM public.profiles;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Base RLS Policies
-- Profiles: read public, update own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations: read public, org members write
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations FOR SELECT USING (true);

-- Fests: read published fests, org members manage
CREATE POLICY "Published fests are viewable by everyone" ON public.fests FOR SELECT USING (is_published = true OR auth.uid() IN (SELECT user_id FROM public.org_members WHERE org_id = fests.org_id));

-- Events: read published events, org members manage
CREATE POLICY "Published events are viewable by everyone" ON public.events FOR SELECT USING (is_published = true OR auth.uid() IN (SELECT user_id FROM public.org_members WHERE org_id IN (SELECT org_id FROM public.fests WHERE id = events.fest_id)));

-- Registrations: participants view own, org members view event registrations
CREATE POLICY "Users view own registrations" ON public.registrations FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT om.user_id FROM public.org_members om 
  JOIN public.fests f ON f.org_id = om.org_id 
  JOIN public.events e ON e.fest_id = f.id 
  WHERE e.id = registrations.event_id
));

-- Stamps: view own
CREATE POLICY "Users view own stamps" ON public.stamps FOR SELECT USING (auth.uid() = user_id);

-- Badges & User Badges: view public
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (true);
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges FOR SELECT USING (true);

-- XP Ledger: view own
CREATE POLICY "Users view own xp ledger" ON public.xp_ledger FOR SELECT USING (auth.uid() = user_id);

-- Connections: view own
CREATE POLICY "Users view own connections" ON public.connections FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Notifications: view & update own
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Announcements: view for published fests/events
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements FOR SELECT USING (true);

-- Bookmarks: manage own
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

-- Feedback: view for event, create own
CREATE POLICY "Feedback is viewable by everyone" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Users create own feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity Log: view by org members
CREATE POLICY "Activity log viewable by event organizers" ON public.activity_log FOR SELECT USING (auth.uid() IN (
  SELECT om.user_id FROM public.org_members om 
  JOIN public.fests f ON f.org_id = om.org_id 
  JOIN public.events e ON e.fest_id = f.id 
  WHERE e.id = activity_log.event_id
));
