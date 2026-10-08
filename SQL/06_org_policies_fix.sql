-- ============================================
-- ClubOS 06_org_policies_fix.sql
-- Fixes "infinite recursion detected in policy for relation organization_members"
-- and adds the covers storage bucket for fest/event image uploads.
-- Run AFTER 01/02/03/04/05. Idempotent — safe to re-run.
-- ============================================

-- 1. RLS-safe membership helper.
-- Policies that SELECT from organization_members re-trigger the table's own
-- SELECT policy → infinite recursion. A SECURITY DEFINER function bypasses
-- RLS, breaking the cycle while keeping the same access rules.
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.org_id = p_org_id
      AND om.user_id = auth.uid()
      AND (p_roles IS NULL OR om.role = ANY (p_roles))
  );
$$;

-- 2. organization_members: use the helper instead of self-referencing.
DROP POLICY IF EXISTS "Members visible to org members" ON organization_members;
CREATE POLICY "Members visible to org members" ON organization_members
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS "Users can join organizations" ON organization_members;
CREATE POLICY "Users can join organizations" ON organization_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can update own membership" ON organization_members;
CREATE POLICY "Members can update own membership" ON organization_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. fests: helper instead of subquery on organization_members.
DROP POLICY IF EXISTS "Organizers can manage own fests" ON fests;
CREATE POLICY "Organizers can manage own fests" ON fests
  FOR ALL TO authenticated USING (
    created_by = auth.uid()
    OR public.is_org_member(org_id, ARRAY['owner', 'admin'])
  );

-- 4. events: helper instead of JOIN on organization_members.
DROP POLICY IF EXISTS "Organizers can manage own events" ON events;
CREATE POLICY "Organizers can manage own events" ON events
  FOR ALL TO authenticated USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM fests f
      WHERE f.id = events.fest_id
        AND public.is_org_member(f.org_id, ARRAY['owner', 'admin'])
    )
  );

-- 5. registration_segments: organizer visibility without touching
--    organization_members through RLS.
DROP POLICY IF EXISTS "Organizers view registration segments for their events" ON registration_segments;
CREATE POLICY "Organizers view registration segments for their events" ON registration_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.registrations r
      JOIN public.events e ON e.id = r.event_id
      JOIN public.fests f ON f.id = e.fest_id
      WHERE r.id = registration_segments.registration_id
        AND (e.created_by = auth.uid() OR public.is_org_member(f.org_id, ARRAY['owner', 'admin']))
    )
  );

-- 6. Fest categories: organizers pick category tags when creating/editing fests.
ALTER TABLE public.fests ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- 7. Covers bucket for fest/event cover images + org logos
--    (public read; any authenticated user can upload — the pages enforce
--    organizer-only access in the UI).
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Covers are publicly readable" ON storage.objects;
CREATE POLICY "Covers are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
CREATE POLICY "Authenticated users can upload covers" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');

DROP POLICY IF EXISTS "Users can update own covers" ON storage.objects;
CREATE POLICY "Users can update own covers" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own covers" ON storage.objects;
CREATE POLICY "Users can delete own covers" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
