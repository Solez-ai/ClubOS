-- ============================================
-- ClubOS 04_notifications.sql
-- Notification + email infrastructure.
-- Run AFTER 01_schema.sql and 02_functions.sql.
-- All statements are idempotent — safe to re-run on an existing database.
-- ============================================

-- 1. In-app notifications table (in case 01_schema.sql was older without it)
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 2. Email audit table (written by the server with the service-role key)
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent'
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_reg ON public.email_notifications(registration_id);

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
-- No client policies: the service role bypasses RLS. Clients read history
-- through organizer-scoped queries in the app, not directly.

-- 3. Registration columns the app uses (idempotent backfill for older installs)
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS total_price NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS transaction_mobile TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS declined_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS decline_reason TEXT;

UPDATE public.registrations SET payment_status = 'pending' WHERE payment_status IS NULL;

-- registration_segments join (if missing from an older schema)
CREATE TABLE IF NOT EXISTS public.registration_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  price_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (registration_id, segment_id)
);
ALTER TABLE public.registration_segments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own registration segments" ON public.registration_segments;
CREATE POLICY "Users can view own registration segments" ON public.registration_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      WHERE r.id = registration_segments.registration_id AND r.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Users can manage own registration segments" ON public.registration_segments;
CREATE POLICY "Users can manage own registration segments" ON public.registration_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      WHERE r.id = registration_segments.registration_id AND r.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Organizers view registration segments for their events" ON public.registration_segments;
CREATE POLICY "Organizers view registration segments for their events" ON public.registration_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.registrations r
      JOIN public.events e ON e.id = r.event_id
      JOIN public.fests f ON f.id = e.fest_id
      JOIN public.org_members om ON om.org_id = f.org_id
      WHERE r.id = registration_segments.registration_id AND om.user_id = auth.uid()
    )
  );

-- 4. Trigger: notify the participant in-app when the organizer verifies their payment
CREATE OR REPLACE FUNCTION public.notify_on_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'registration_verified',
      'Registration confirmed 🎉',
      'Your payment for ' || COALESCE((SELECT title FROM public.events WHERE id = NEW.event_id), 'the event') || ' has been verified. See you there!',
      '/manage'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_verification ON public.registrations;
CREATE TRIGGER trg_notify_on_verification
  AFTER UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_verification();

-- 5. Trigger: notify the participant in-app when their registration is declined
CREATE OR REPLACE FUNCTION public.notify_on_decline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'registration_declined',
      'Registration declined',
      'Your registration for ' || COALESCE((SELECT title FROM public.events WHERE id = NEW.event_id), 'the event') || ' was declined. Reason: ' || COALESCE(NEW.decline_reason, 'Contact the organizer for details.'),
      '/manage'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_decline ON public.registrations;
CREATE TRIGGER trg_notify_on_decline
  AFTER UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_decline();

-- 6. Trigger: notify the fest organizer when someone new registers for their event
CREATE OR REPLACE FUNCTION public.notify_organizer_on_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fest_creator UUID;
  v_event_title TEXT;
  v_participant_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT f.created_by INTO v_fest_creator
    FROM public.events e
    JOIN public.fests f ON f.id = e.fest_id
    WHERE e.id = NEW.event_id;

    SELECT title INTO v_event_title FROM public.events WHERE id = NEW.event_id;
    SELECT full_name INTO v_participant_name FROM public.profiles WHERE id = NEW.user_id;

    IF v_fest_creator IS NOT NULL AND v_fest_creator <> NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        v_fest_creator,
        'new_registration',
        'New registration',
        v_participant_name || ' registered for ' || COALESCE(v_event_title, 'your event') || '.',
        '/organizer'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_organizer_registration ON public.registrations;
CREATE TRIGGER trg_notify_organizer_registration
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_organizer_on_registration();

-- 7. Storage: payments bucket for payment screenshots (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payments', 'payments', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view payment screenshots (organizers verify them); authenticated users upload.
-- (Policies are idempotent via DROP + CREATE.)
DROP POLICY IF EXISTS "Payment screenshots are publicly readable" ON storage.objects;
CREATE POLICY "Payment screenshots are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'payments');

DROP POLICY IF EXISTS "Authenticated users can upload payment screenshots" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment screenshots" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payments');
