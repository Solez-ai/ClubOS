-- ============================================
-- ClubOS 03_passport.sql
-- Passport layer: stamps, badges, connections, XP ledger, feedback, org_members.
-- Run AFTER 01_schema.sql and 02_functions.sql (02 depends on these tables).
-- All statements are idempotent — safe to re-run on an existing database.
-- ============================================

-- 0. Columns referenced by 02_functions.sql that older installs may miss
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.fests ADD COLUMN IF NOT EXISTS checkin_token TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- 1. Stamps (event check-ins and fest entry stamps)
CREATE TABLE IF NOT EXISTS public.stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('event', 'fest')),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  fest_id UUID REFERENCES public.fests(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_stamps_user ON public.stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_stamps_fest ON public.stamps(fest_id);
-- Lets ON CONFLICT DO NOTHING dedupe fest stamps too (NULLs are distinct, so
-- this never blocks multiple event stamps per user).
CREATE UNIQUE INDEX IF NOT EXISTS idx_stamps_user_fest ON public.stamps(user_id, fest_id);

-- 2. XP ledger (audit trail for every XP grant)
CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_user ON public.xp_ledger(user_id, created_at DESC);

-- 3. Badge catalog + earned badges
CREATE TABLE IF NOT EXISTS public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'award',
  rings INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  fest_id UUID REFERENCES public.fests(id) ON DELETE SET NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- Seed badge catalog (matches award_badges() in 02_functions.sql)
INSERT INTO public.badges (id, name, description, icon, rings, xp_reward) VALUES
  ('first_stamp', 'First Stamp', 'Checked in to your very first event.', 'stamp', 1, 25),
  ('collector', 'Collector', 'Collected 5 event stamps.', 'layers', 2, 50),
  ('regular', 'Regular', 'Collected 15 event stamps.', 'calendar-check', 3, 100),
  ('multi_fest', 'Multi-Fest Explorer', 'Participated in 3 different fests.', 'compass', 2, 75),
  ('social_butterfly', 'Social Butterfly', 'Connected with 5 people via passport.', 'users', 2, 50),
  ('connector', 'Connector', 'Connected with 20 people via passport.', 'network', 3, 150),
  ('reviewer', 'Reviewer', 'Left feedback on 3 events.', 'message-circle', 1, 40)
ON CONFLICT (id) DO NOTHING;

-- 4. Passport connections
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fest_id UUID REFERENCES public.fests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b),
  CHECK (user_a <> user_b)
);
CREATE INDEX IF NOT EXISTS idx_connections_a ON public.connections(user_a);
CREATE INDEX IF NOT EXISTS idx_connections_b ON public.connections(user_b);

-- 5. Event feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_feedback_event ON public.feedback(event_id);

-- 6. org_members — 02_functions.sql checks this table; 01 defines organization_members.
--     If org_members already exists in your database (e.g. created as a table by an
--     earlier schema), leave it as-is; otherwise create a compatible view.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_members'
  ) THEN
    RAISE NOTICE 'org_members already exists (table or view) — skipping';
  ELSE
    EXECUTE 'CREATE VIEW public.org_members AS
      SELECT om.id, om.org_id, om.user_id, om.role, om.joined_at
      FROM public.organization_members om';
  END IF;
END $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;


-- Stamps may also be shown on public passports; owner's passport_public flag
-- decides visibility via this tiny SECURITY DEFINER helper.
CREATE OR REPLACE FUNCTION public.stamp_owner_public(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT passport_public FROM public.profiles WHERE id = p_user_id), false);
$$;

DROP POLICY IF EXISTS "stamps select own" ON public.stamps;
CREATE POLICY "stamps select own" ON public.stamps
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.stamp_owner_public(user_id)
  );

DROP POLICY IF EXISTS "xp ledger select own" ON public.xp_ledger;
CREATE POLICY "xp ledger select own" ON public.xp_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "badges are viewable" ON public.badges;
CREATE POLICY "badges are viewable" ON public.badges
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "user badges select own" ON public.user_badges;
CREATE POLICY "user badges select own" ON public.user_badges
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.stamp_owner_public(user_id)
  );

DROP POLICY IF EXISTS "connections select own" ON public.connections;
CREATE POLICY "connections select own" ON public.connections
  FOR SELECT TO authenticated USING (user_a = auth.uid() OR user_b = auth.uid());

DROP POLICY IF EXISTS "feedback insert own" ON public.feedback;
CREATE POLICY "feedback insert own" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "feedback select own" ON public.feedback;
CREATE POLICY "feedback select own" ON public.feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================
-- VERIFY
-- ============================================
-- After running, confirm with:
--   select count(*) from public.badges;         -- expect 7
--   select * from public.org_members limit 1;   -- table or view resolves
