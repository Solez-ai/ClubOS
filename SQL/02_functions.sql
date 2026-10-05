-- ClubOS Database RPC Functions & Triggers
-- All functions run as SECURITY DEFINER with search_path set for strict safety

-- 1. Grant XP helper
CREATE OR REPLACE FUNCTION public.grant_xp(
  p_user_id UUID,
  p_amount INT,
  p_reason TEXT,
  p_ref_id UUID DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_xp INT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.xp_ledger (user_id, amount, reason, ref_id)
  VALUES (p_user_id, p_amount, p_reason, p_ref_id);

  UPDATE public.profiles
  SET xp = xp + p_amount
  WHERE id = p_user_id
  RETURNING xp INTO v_new_xp;

  RETURN v_new_xp;
END;
$$;

-- 2. Award Badges (Idempotent evaluation)
CREATE OR REPLACE FUNCTION public.award_badges(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stamp_count INT;
  v_fest_count INT;
  v_conn_count INT;
  v_feedback_count INT;
  v_awarded JSONB := '[]'::jsonb;
  v_badge RECORD;
  v_fest_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_stamp_count FROM public.stamps WHERE user_id = p_user_id AND kind = 'event';
  SELECT COUNT(DISTINCT fest_id) INTO v_fest_count FROM public.stamps WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_conn_count FROM public.connections WHERE user_a = p_user_id OR user_b = p_user_id;
  SELECT COUNT(*) INTO v_feedback_count FROM public.feedback WHERE user_id = p_user_id;

  -- 1. First Stamp
  IF v_stamp_count >= 1 THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = 'first_stamp') THEN
      INSERT INTO public.user_badges(user_id, badge_id, fest_id) VALUES (p_user_id, 'first_stamp', NULL) ON CONFLICT DO NOTHING;
      PERFORM public.grant_xp(p_user_id, 25, 'Earned badge: First Stamp', NULL);
      v_awarded := v_awarded || jsonb_build_object('badge_id', 'first_stamp', 'name', 'First Stamp', 'xp', 25);
    END IF;
  END IF;

  -- 2. Collector (5 stamps)
  IF v_stamp_count >= 5 THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = 'collector') THEN
      INSERT INTO public.user_badges(user_id, badge_id, fest_id) VALUES (p_user_id, 'collector', NULL) ON CONFLICT DO NOTHING;
      PERFORM public.grant_xp(p_user_id, 50, 'Earned badge: Collector', NULL);
      v_awarded := v_awarded || jsonb_build_object('badge_id', 'collector', 'name', 'Collector', 'xp', 50);
    END IF;
  END IF;

  -- 3. Regular (15 stamps)
  IF v_stamp_count >= 15 THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = 'regular') THEN
      INSERT INTO public.user_badges(user_id, badge_id, fest_id) VALUES (p_user_id, 'regular', NULL) ON CONFLICT DO NOTHING;
      PERFORM public.grant_xp(p_user_id, 100, 'Earned badge: Regular', NULL);
      v_awarded := v_awarded || jsonb_build_object('badge_id', 'regular', 'name', 'Regular', 'xp', 100);
    END IF;
  END IF;

  -- 4. Multi-Fest Explorer (3 fests)
  IF v_fest_count >= 3 THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = 'multi_fest') THEN
      INSERT INTO public.user_badges(user_id, badge_id, fest_id) VALUES (p_user_id, 'multi_fest', NULL) ON CONFLICT DO NOTHING;
      PERFORM public.grant_xp(p_user_id, 75, 'Earned badge: Multi-Fest Explorer', NULL);
      v_awarded := v_awarded || jsonb_build_object('badge_id', 'multi_fest', 'name', 'Multi-Fest Explorer', 'xp', 75);
    END IF;
  END IF;

  -- 5. Social Butterfly (5 connections)
  IF v_conn_count >= 5 THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = 'social_butterfly') THEN
      INSERT INTO public.user_badges(user_id, badge_id, fest_id) VALUES (p_user_id, 'social_butterfly', NULL) ON CONFLICT DO NOTHING;
      PERFORM public.grant_xp(p_user_id, 50, 'Earned badge: Social Butterfly', NULL);
      v_awarded := v_awarded || jsonb_build_object('badge_id', 'social_butterfly', 'name', 'Social Butterfly', 'xp', 50);
    END IF;
  END IF;

  -- 6. Connector (20 connections)
  IF v_conn_count >= 20 THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = 'connector') THEN
      INSERT INTO public.user_badges(user_id, badge_id, fest_id) VALUES (p_user_id, 'connector', NULL) ON CONFLICT DO NOTHING;
      PERFORM public.grant_xp(p_user_id, 150, 'Earned badge: Connector', NULL);
      v_awarded := v_awarded || jsonb_build_object('badge_id', 'connector', 'name', 'Connector', 'xp', 150);
    END IF;
  END IF;

  -- 7. Reviewer (3 feedback submissions)
  IF v_feedback_count >= 3 THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_id = 'reviewer') THEN
      INSERT INTO public.user_badges(user_id, badge_id, fest_id) VALUES (p_user_id, 'reviewer', NULL) ON CONFLICT DO NOTHING;
      PERFORM public.grant_xp(p_user_id, 40, 'Earned badge: Reviewer', NULL);
      v_awarded := v_awarded || jsonb_build_object('badge_id', 'reviewer', 'name', 'Reviewer', 'xp', 40);
    END IF;
  END IF;

  RETURN v_awarded;
END;
$$;

-- 3. Register for Event (Atomic row locking under heavy load)
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id UUID,
  p_answers JSONB DEFAULT '{}',
  p_team_name TEXT DEFAULT NULL,
  p_team_members JSONB DEFAULT '[]',
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_event RECORD;
  v_active_count INT;
  v_existing_reg RECORD;
  v_target_status reg_status;
  v_waitlist_pos INT := NULL;
  v_reg_id UUID;
  v_ticket_code TEXT;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'unauthorized', 'message', 'Sign in to register');
  END IF;

  -- Lock event row for heavy load concurrency check
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND OR v_event.is_published = false THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'not_found', 'message', 'Event not found or unpublished');
  END IF;

  IF now() < v_event.registration_opens_at THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'not_open_yet', 'message', 'Registration is not open yet');
  END IF;

  IF now() > v_event.registration_deadline THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'deadline_passed', 'message', 'Registration deadline has passed');
  END IF;

  -- Existing registration check
  SELECT * INTO v_existing_reg FROM public.registrations WHERE event_id = p_event_id AND user_id = v_user_id;
  IF FOUND AND v_existing_reg.status IN ('confirmed', 'pending', 'checked_in', 'waitlisted') THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'already_registered', 'message', 'You are already registered for this event');
  END IF;

  -- Count active seats
  SELECT COUNT(*) INTO v_active_count FROM public.registrations
  WHERE event_id = p_event_id AND status IN ('confirmed', 'pending', 'checked_in');

  -- Determine target status
  IF v_event.capacity IS NOT NULL AND v_active_count >= v_event.capacity THEN
    IF v_event.waitlist_enabled = true THEN
      v_target_status := 'waitlisted';
      SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_pos
      FROM public.registrations WHERE event_id = p_event_id AND status = 'waitlisted';
    ELSE
      RETURN jsonb_build_object('ok', false, 'error_code', 'event_full', 'message', 'Event is full');
    END IF;
  ELSIF v_event.requires_approval = true THEN
    v_target_status := 'pending';
  ELSE
    v_target_status := 'confirmed';
  END IF;

  IF FOUND AND v_existing_reg.status IN ('cancelled', 'rejected') THEN
    -- Reuse existing row
    UPDATE public.registrations
    SET status = v_target_status,
        answers = p_answers,
        team_name = p_team_name,
        team_members = p_team_members,
        waitlist_position = v_waitlist_pos,
        created_at = now()
    WHERE id = v_existing_reg.id
    RETURNING id, ticket_code INTO v_reg_id, v_ticket_code;
  ELSE
    -- Insert new registration
    INSERT INTO public.registrations (
      event_id, user_id, status, answers, team_name, team_members, waitlist_position
    ) VALUES (
      p_event_id, v_user_id, v_target_status, p_answers, p_team_name, p_team_members, v_waitlist_pos
    )
    RETURNING id, ticket_code INTO v_reg_id, v_ticket_code;
  END IF;

  -- Activity log & notification
  INSERT INTO public.activity_log (event_id, actor_id, action, meta)
  VALUES (p_event_id, v_user_id, 'registered', jsonb_build_object('status', v_target_status, 'reg_id', v_reg_id));

  IF v_target_status = 'confirmed' THEN
    PERFORM public.grant_xp(v_user_id, 10, 'Registered for event: ' || v_event.title, v_reg_id);
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (v_user_id, 'registration_confirmed', 'Registration Confirmed', 'You are confirmed for ' || v_event.title, '/passport');
  ELSIF v_target_status = 'waitlisted' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (v_user_id, 'registration_waitlisted', 'Joined Waitlist', 'You are position #' || v_waitlist_pos || ' on the waitlist for ' || v_event.title, '/passport');
  ELSE
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (v_user_id, 'registration_pending', 'Registration Pending', 'Your registration for ' || v_event.title || ' is pending approval.', '/passport');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'status', v_target_status,
    'reg_id', v_reg_id,
    'ticket_code', v_ticket_code,
    'waitlist_position', v_waitlist_pos,
    'message', CASE 
      WHEN v_target_status = 'confirmed' THEN 'Registration confirmed!'
      WHEN v_target_status = 'waitlisted' THEN 'You are #' || v_waitlist_pos || ' on the waitlist.'
      ELSE 'Registration submitted for approval.'
    END
  );
END;
$$;

-- 4. Promote from Waitlist (Auto-promotion helper)
CREATE OR REPLACE FUNCTION public.promote_from_waitlist(
  p_event_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_active_count INT;
  v_promoted_count INT := 0;
  v_next_waitlisted RECORD;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND OR v_event.capacity IS NULL THEN
    RETURN 0;
  END IF;

  LOOP
    SELECT COUNT(*) INTO v_active_count FROM public.registrations
    WHERE event_id = p_event_id AND status IN ('confirmed', 'pending', 'checked_in');

    EXIT WHEN v_active_count >= v_event.capacity;

    SELECT * INTO v_next_waitlisted FROM public.registrations
    WHERE event_id = p_event_id AND status = 'waitlisted'
    ORDER BY waitlist_position ASC NULLS LAST, created_at ASC
    LIMIT 1;

    EXIT WHEN NOT FOUND;

    UPDATE public.registrations
    SET status = 'confirmed', waitlist_position = NULL
    WHERE id = v_next_waitlisted.id;

    v_promoted_count := v_promoted_count + 1;

    PERFORM public.grant_xp(v_next_waitlisted.user_id, 10, 'Promoted from waitlist: ' || v_event.title, v_next_waitlisted.id);
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (v_next_waitlisted.user_id, 'waitlist_promoted', 'Promoted from Waitlist!', 'A seat opened up for ' || v_event.title || '. Your registration is now confirmed!', '/passport');
  END LOOP;

  -- Renumber remaining waitlist positions
  WITH renumbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY waitlist_position ASC NULLS LAST, created_at ASC) as new_pos
    FROM public.registrations
    WHERE event_id = p_event_id AND status = 'waitlisted'
  )
  UPDATE public.registrations r
  SET waitlist_position = renumbered.new_pos
  FROM renumbered WHERE r.id = renumbered.id;

  RETURN v_promoted_count;
END;
$$;

-- 5. Cancel Registration
CREATE OR REPLACE FUNCTION public.cancel_registration(
  p_reg_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_reg RECORD;
  v_event RECORD;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  SELECT r.* INTO v_reg FROM public.registrations r WHERE r.id = p_reg_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Registration not found');
  END IF;

  IF v_reg.user_id != v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Unauthorized');
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = v_reg.event_id;
  IF now() >= v_event.starts_at THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Cannot cancel after event start');
  END IF;

  UPDATE public.registrations SET status = 'cancelled', waitlist_position = NULL WHERE id = p_reg_id;

  INSERT INTO public.activity_log (event_id, actor_id, action, meta)
  VALUES (v_reg.event_id, v_user_id, 'cancelled', jsonb_build_object('reg_id', p_reg_id));

  -- Promote waitlisted user if seat freed
  PERFORM public.promote_from_waitlist(v_reg.event_id);

  RETURN jsonb_build_object('ok', true, 'message', 'Registration cancelled');
END;
$$;

-- 6. Organizer Set Status (Bulk Safe)
CREATE OR REPLACE FUNCTION public.organizer_set_status(
  p_reg_ids UUID[],
  p_new_status reg_status,
  p_note TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_reg_id UUID;
  v_reg RECORD;
  v_event RECORD;
  v_count INT := 0;
BEGIN
  v_actor_id := COALESCE(p_actor_id, auth.uid());

  FOREACH v_reg_id IN ARRAY p_reg_ids LOOP
    SELECT r.*, e.fest_id, f.org_id INTO v_reg
    FROM public.registrations r
    JOIN public.events e ON e.id = r.event_id
    JOIN public.fests f ON f.id = e.fest_id
    WHERE r.id = v_reg_id;

    IF FOUND THEN
      -- Check organizer rights
      IF EXISTS (SELECT 1 FROM public.org_members WHERE org_id = v_reg.org_id AND user_id = v_actor_id)
         OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_actor_id AND role = 'admin') THEN
        
        UPDATE public.registrations
        SET status = p_new_status, organizer_note = COALESCE(p_note, organizer_note)
        WHERE id = v_reg_id;

        v_count := v_count + 1;

        INSERT INTO public.notifications (user_id, type, title, body, link)
        VALUES (v_reg.user_id, 'status_updated', 'Registration Status Updated', 'Your status for event registration has been updated to ' || p_new_status::text, '/passport');

        PERFORM public.promote_from_waitlist(v_reg.event_id);
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'updated_count', v_count);
END;
$$;

-- 7. Check In With Token (Venue scanner / Participant scanner)
CREATE OR REPLACE FUNCTION public.check_in_with_token(
  p_token TEXT,
  p_code TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_event RECORD;
  v_fest RECORD;
  v_reg RECORD;
  v_xp_gained INT := 0;
  v_new_badges JSONB := '[]'::jsonb;
  v_level_before INT;
  v_level_after INT;
  v_user_xp INT;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'not_logged_in', 'message', 'Sign in to check in');
  END IF;

  SELECT xp INTO v_user_xp FROM public.profiles WHERE id = v_user_id;
  v_level_before := FLOOR(SQRT(v_user_xp::numeric / 50.0)) + 1;

  -- 1. Event check-in match
  SELECT * INTO v_event FROM public.events WHERE checkin_token = p_token OR slug = p_token;
  IF FOUND THEN
    SELECT * INTO v_reg FROM public.registrations WHERE event_id = v_event.id AND user_id = v_user_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error_code', 'not_registered', 'message', 'You are not registered for ' || v_event.title);
    END IF;

    IF v_reg.status = 'checked_in' THEN
      RETURN jsonb_build_object('ok', false, 'error_code', 'already_checked_in', 'message', 'You are already checked in!');
    END IF;

    IF v_reg.status NOT IN ('confirmed', 'pending') THEN
      RETURN jsonb_build_object('ok', false, 'error_code', 'status_not_valid', 'message', 'Your registration status is ' || v_reg.status::text);
    END IF;

    -- Update registration
    UPDATE public.registrations
    SET status = 'checked_in', checked_in_at = now(), checkin_method = 'token_scan'
    WHERE id = v_reg.id;

    -- Award Event Stamp
    INSERT INTO public.stamps(user_id, kind, event_id) VALUES (v_user_id, 'event', v_event.id) ON CONFLICT DO NOTHING;

    -- Grant XP
    v_xp_gained := COALESCE(v_event.xp_reward, 100);
    PERFORM public.grant_xp(v_user_id, v_xp_gained, 'Checked in to: ' || v_event.title, v_reg.id);

    -- Award Badges
    v_new_badges := public.award_badges(v_user_id);

    SELECT xp INTO v_user_xp FROM public.profiles WHERE id = v_user_id;
    v_level_after := FLOOR(SQRT(v_user_xp::numeric / 50.0)) + 1;

    RETURN jsonb_build_object(
      'ok', true,
      'kind', 'event',
      'title', v_event.title,
      'xp_gained', v_xp_gained,
      'new_badges', v_new_badges,
      'level_before', v_level_before,
      'level_after', v_level_after,
      'message', 'Checked in! +' || v_xp_gained || ' XP earned'
    );
  END IF;

  -- 2. Fest entry stamp match
  SELECT * INTO v_fest FROM public.fests WHERE checkin_token = p_token OR slug = p_token;
  IF FOUND THEN
    INSERT INTO public.stamps(user_id, kind, fest_id) VALUES (v_user_id, 'fest', v_fest.id) ON CONFLICT DO NOTHING;
    v_xp_gained := 25;
    PERFORM public.grant_xp(v_user_id, v_xp_gained, 'Fest Entry Stamp: ' || v_fest.title, v_fest.id);
    v_new_badges := public.award_badges(v_user_id);

    RETURN jsonb_build_object(
      'ok', true,
      'kind', 'fest',
      'title', v_fest.title,
      'xp_gained', v_xp_gained,
      'message', 'Fest Entry Stamp earned! +25 XP'
    );
  END IF;

  RETURN jsonb_build_object('ok', false, 'error_code', 'invalid_token', 'message', 'Invalid QR code or token');
END;
$$;

-- 8. Organizer Check In by Ticket Code
CREATE OR REPLACE FUNCTION public.organizer_check_in(
  p_ticket_code TEXT,
  p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_reg RECORD;
  v_event RECORD;
  v_profile RECORD;
  v_xp_gained INT;
BEGIN
  v_actor_id := COALESCE(p_actor_id, auth.uid());

  SELECT r.*, e.fest_id, f.org_id INTO v_reg
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  JOIN public.fests f ON f.id = e.fest_id
  WHERE UPPER(r.ticket_code) = UPPER(p_ticket_code);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Ticket code not found');
  END IF;

  -- Verify organizer authority
  IF NOT (EXISTS (SELECT 1 FROM public.org_members WHERE org_id = v_reg.org_id AND user_id = v_actor_id)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_actor_id AND role = 'admin')) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Unauthorized to check in for this event');
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = v_reg.event_id;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_reg.user_id;

  IF v_reg.status = 'checked_in' THEN
    RETURN jsonb_build_object('ok', true, 'already_checked_in', true, 'participant', v_profile.full_name, 'event', v_event.title, 'message', 'Participant is already checked in');
  END IF;

  UPDATE public.registrations
  SET status = 'checked_in', checked_in_at = now(), checkin_method = 'organizer_scan'
  WHERE id = v_reg.id;

  INSERT INTO public.stamps(user_id, kind, event_id) VALUES (v_reg.user_id, 'event', v_event.id) ON CONFLICT DO NOTHING;

  v_xp_gained := COALESCE(v_event.xp_reward, 100);
  PERFORM public.grant_xp(v_reg.user_id, v_xp_gained, 'Checked in by organizer to: ' || v_event.title, v_reg.id);
  PERFORM public.award_badges(v_reg.user_id);

  RETURN jsonb_build_object(
    'ok', true,
    'participant', v_profile.full_name,
    'handle', v_profile.handle,
    'event', v_event.title,
    'ticket_code', v_reg.ticket_code,
    'message', 'Checked in successfully!'
  );
END;
$$;

-- 9. Connect with Passport
CREATE OR REPLACE FUNCTION public.connect_with_passport(
  p_target_identifier TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_target_profile RECORD;
  v_user_a UUID;
  v_user_b UUID;
  v_today_conn_xp INT;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Sign in to connect');
  END IF;

  SELECT * INTO v_target_profile
  FROM public.profiles
  WHERE handle = p_target_identifier OR passport_no = p_target_identifier OR id::text = p_target_identifier;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Passport not found');
  END IF;

  IF v_target_profile.id = v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'message', 'You cannot connect with yourself');
  END IF;

  IF v_user_id < v_target_profile.id THEN
    v_user_a := v_user_id;
    v_user_b := v_target_profile.id;
  ELSE
    v_user_a := v_target_profile.id;
    v_user_b := v_user_id;
  END IF;

  INSERT INTO public.connections (user_a, user_b)
  VALUES (v_user_a, v_user_b)
  ON CONFLICT DO NOTHING;

  -- Limit daily connection XP to 5 awards (75 XP max per day)
  SELECT COUNT(*) INTO v_today_conn_xp
  FROM public.xp_ledger
  WHERE user_id = v_user_id AND reason LIKE 'New connection:%' AND created_at >= date_trunc('day', now());

  IF v_today_conn_xp < 5 THEN
    PERFORM public.grant_xp(v_user_id, 15, 'New connection: @' || v_target_profile.handle, v_target_profile.id);
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (v_target_profile.id, 'new_connection', 'New Passport Connection', 'You connected with @' || (SELECT handle FROM public.profiles WHERE id = v_user_id), '/passport');

  RETURN jsonb_build_object('ok', true, 'connected_with', v_target_profile.full_name, 'handle', v_target_profile.handle, 'message', 'Connected with @' || v_target_profile.handle);
END;
$$;

-- 10. Leaderboards
CREATE OR REPLACE FUNCTION public.global_leaderboard(
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  rank BIGINT,
  id UUID,
  handle TEXT,
  full_name TEXT,
  avatar_url TEXT,
  institution TEXT,
  passport_no TEXT,
  xp INT,
  level INT,
  stamps_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.created_at ASC) as rank,
    p.id,
    p.handle,
    CASE WHEN p.passport_public THEN p.full_name ELSE 'Anonymous Participant' END as full_name,
    CASE WHEN p.passport_public THEN p.avatar_url ELSE NULL END as avatar_url,
    CASE WHEN p.passport_public THEN p.institution ELSE 'Private' END as institution,
    p.passport_no,
    p.xp,
    (FLOOR(SQRT(p.xp::numeric / 50.0)) + 1)::INT as level,
    COALESCE(s.stamps_cnt, 0) as stamps_count
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) as stamps_cnt FROM public.stamps GROUP BY user_id
  ) s ON s.user_id = p.id
  ORDER BY p.xp DESC, p.created_at ASC
  LIMIT p_limit;
END;
$$;

-- 11. Auth user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_handle TEXT;
  v_passport_no TEXT;
  v_seq INT;
BEGIN
  -- Generate unique handle
  v_handle := COALESCE(NEW.raw_user_meta_data->>'handle', LOWER(SPLIT_PART(NEW.email, '@', 1)));
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = v_handle) LOOP
    v_handle := v_handle || FLOOR(random() * 10)::text;
  END LOOP;

  -- Generate unique passport number
  SELECT COALESCE(COUNT(*), 0) + 1 INTO v_seq FROM public.profiles;
  v_passport_no := 'CL-2026-' || LPAD(v_seq::text, 6, '0');

  INSERT INTO public.profiles (
    id, handle, full_name, email, passport_no, role, onboarded
  ) VALUES (
    NEW.id,
    v_handle,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    v_passport_no,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'participant'),
    false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
