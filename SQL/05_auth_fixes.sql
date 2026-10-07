-- ============================================
-- ClubOS 05_auth_fixes.sql
-- Signup/auth hardening: race-safe handle generation + avatars storage bucket.
-- Run AFTER 01_schema.sql, 02_functions.sql, 04_notifications.sql (and 03_passport.sql).
-- All statements are idempotent — safe to re-run.
-- ============================================

-- 1. Race-safe handle generation in the signup trigger.
-- The old version used the raw email prefix as the handle. handles is UNIQUE,
-- so two people signing up with the same prefix (john@gmail.com / john@yahoo.com)
-- — or concurrent signups — crashed the SECOND signup. At thousands of users
-- that is guaranteed to happen. This version uniquifies on collision.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_base TEXT;
  v_handle TEXT;
  v_suffix INT := 0;
  v_role public.user_role;
  v_org_name TEXT;
  v_org_slug TEXT;
  v_org_id UUID;
BEGIN
  v_base := left(
    regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '_', 'g'),
    24
  );
  IF v_base = '' OR v_base IS NULL THEN
    v_base := 'user';
  END IF;

  v_handle := v_base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = v_handle) LOOP
    v_suffix := v_suffix + 1;
    IF v_suffix <= 20 THEN
      v_handle := v_base || v_suffix::text;
    ELSE
      v_handle := left(v_base, 18) || floor(random() * 9000 + 1000)::int::text;
    END IF;
  END LOOP;

  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'participant')::public.user_role;

  INSERT INTO public.profiles (id, handle, full_name, email, role, phone, institution, avatar_url, onboarded)
  VALUES (
    NEW.id,
    v_handle,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    v_role,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'institution', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    true
  );

  -- Organizers get their organization + owner membership created atomically
  -- here, so it works whether email confirmation is on or off.
  IF v_role = 'organizer' THEN
    v_org_name := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'institution', ''),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'My Organization')
    );
    v_org_slug := TRIM(BOTH '-' FROM lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g')));
    IF v_org_slug = '' THEN
      v_org_slug := 'org';
    END IF;
    v_org_slug := left(v_org_slug, 40) || '-' || substr(md5(random()::text), 1, 6);

    INSERT INTO public.organizations (name, slug, description, created_by)
    VALUES (v_org_name, v_org_slug, '', NEW.id)
    RETURNING id INTO v_org_id;

    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (v_org_id, NEW.id, 'owner');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Avatars bucket for profile pictures (public read; users write their own folder).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  3145728, -- 3 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Anyone (including logged-out pages) can view avatars.
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Logged-in users can upload into their OWN folder only: avatars/<auth.uid>/...
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can replace / remove their own avatar.
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Sanity backfill: normalize payment_status so organizer filters work consistently.
UPDATE public.registrations SET payment_status = 'pending' WHERE payment_status IS NULL;
