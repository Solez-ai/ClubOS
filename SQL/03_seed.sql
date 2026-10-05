-- ClubOS Seed Data
-- Idempotent setup for badges, organizations, fests, events, demo accounts, and participant activity

-- 1. Insert Badges
INSERT INTO public.badges (id, name, description, icon, rings, xp_reward) VALUES
  ('first_stamp', 'First Stamp', 'Earned your very first event stamp.', 'stamp', 1, 25),
  ('collector', 'Collector', 'Earned 5 event stamps across any fest.', 'layers', 2, 50),
  ('regular', 'Regular', 'Earned 15 event stamps.', 'award', 3, 100),
  ('fest_finisher', 'Fest Finisher', 'Attended all registered events in a single fest.', 'check-circle-2', 2, 75),
  ('multi_fest', 'Multi-Fest Explorer', 'Earned stamps in 3 different fests.', 'compass', 3, 75),
  ('early_bird', 'Early Bird', 'Registered within 1 hour of registration opening.', 'zap', 1, 20),
  ('night_owl', 'Night Owl', 'Checked in after 8:00 PM.', 'moon', 1, 20),
  ('social_butterfly', 'Social Butterfly', 'Connected with 5 other participants.', 'users', 2, 50),
  ('connector', 'Connector', 'Connected with 20 other participants.', 'share-2', 3, 150),
  ('reviewer', 'Reviewer', 'Submitted feedback for 3 events.', 'message-square', 1, 40),
  ('champion', 'Champion', 'Awarded to contest winners.', 'trophy', 4, 200)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rings = EXCLUDED.rings,
  xp_reward = EXCLUDED.xp_reward;

-- 2. Organization: DRMC IT Club
INSERT INTO public.organizations (id, name, slug, description, logo_url) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'DRMC IT Club',
    'drmc-it-club',
    'Dhaka Residential Model College IT Club — premier student technology club organizing international carnivals, hackathons, and technology summits since 2010.',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 3. Fests: Tech Carnival 2026, Winter Tech Fest 2026, Freshers Tech Fest 2027
INSERT INTO public.fests (id, org_id, title, slug, tagline, description, cover_url, start_date, end_date, venue, checkin_token, is_published) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '9th DRMC International Tech Carnival 2026',
    'tech-carnival-2026',
    'The premier global student technology summit and contest',
    'Join over 3,000 top student developers, roboticists, and gamers from 150+ institutions at the largest tech carnival in South Asia.',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    now() - INTERVAL '1 day',
    now() + INTERVAL '4 days',
    'DRMC Auditorium & Tech Complex, Dhaka',
    'token_tech_carnival_2026',
    true
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Winter Tech Fest 2026',
    'winter-tech-fest-2026',
    'Innovate through the winter chill',
    'A 48-hour intensive winter celebration of software engineering, robotics workshops, and algorithmic puzzle solving.',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    now() + INTERVAL '30 days',
    now() + INTERVAL '32 days',
    'DRMC Campus Center',
    'token_winter_fest_2026',
    true
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Freshers Tech Fest 2027',
    'freshers-tech-fest-2027',
    'Welcome to the future of technology',
    'An onboarding tech fest designed specifically to introduce newly admitted students to competitive coding, open-source, and web engineering.',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    now() + INTERVAL '90 days',
    now() + INTERVAL '91 days',
    'DRMC Science Lab 3',
    'token_freshers_fest_2027',
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description;

-- 4. Events across Fests
INSERT INTO public.events (
  id, fest_id, title, slug, category, description, rules, prizes, cover_url,
  starts_at, ends_at, venue, registration_opens_at, registration_deadline,
  capacity, waitlist_enabled, requires_approval, is_team_event, team_min, team_max,
  fee_amount, xp_reward, checkin_token, custom_fields, tags, is_published
) VALUES
  -- 1. LIVE NOW event for scanner testing!
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'AI Web Development Contest',
    'ai-web-dev-contest',
    'competition',
    'Build full-stack web applications using AI tools and Next.js within a 6-hour hackathon timeframe.',
    '1. Web app must be deployed live.\n2. Must use Next.js and Supabase.\n3. Pre-seeded sample data required.\n4. MIT License must be included.',
    '1st Place: BDT 50,000 + Gold Trophy\n2nd Place: BDT 30,000 + Silver Medal\n3rd Place: BDT 15,000 + Bronze Medal',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
    now() - INTERVAL '1 hour',
    now() + INTERVAL '5 hours',
    'Computer Lab 1 & 2',
    now() - INTERVAL '10 days',
    now() - INTERVAL '2 hours',
    50, true, false, true, 1, 3, 0, 150,
    'token_ai_web_dev_live',
    '[{"key":"github_url","label":"GitHub Repository URL","type":"text","required":true},{"key":"stack","label":"Preferred Tech Stack","type":"select","options":["Next.js","Vue/Nuxt","React/Node"],"required":true}]'::jsonb,
    ARRAY['web', 'ai', 'nextjs', 'fullstack'],
    true
  ),
  -- 2. Closing within 24h event
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Competitive Programming Contest',
    'competitive-programming-contest',
    'competition',
    'Individual algorithm contest testing data structures, dynamic programming, and graph theory problems.',
    'Standard ICPC rules apply. Memory limit: 512MB. Time limit per problem: 1.0s to 3.0s.',
    'Champion: BDT 40,000\nRunner Up: BDT 25,000\nTop 10: Swag Box & Certificate of Excellence',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1000&q=80',
    now() + INTERVAL '1 day',
    now() + INTERVAL '1 day 5 hours',
    'DRMC Main Auditorium',
    now() - INTERVAL '7 days',
    now() + INTERVAL '12 hours',
    100, true, false, false, 1, 1, 0, 120,
    'token_cp_contest',
    '[{"key":"codeforces_handle","label":"Codeforces Handle","type":"text","required":false},{"key":"tshirt_size","label":"T-Shirt Size","type":"select","options":["S","M","L","XL","XXL"],"required":true}]'::jsonb,
    ARRAY['cp', 'algorithms', 'c++', 'python'],
    true
  ),
  -- 3. Full event with Waitlist active
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Robotics Challenge: Line Follower & Sumo',
    'robotics-challenge-2026',
    'robotics',
    'High-speed autonomous line follower robots and sumo wrestling bot battles on custom rings.',
    'Bot dimensions must not exceed 20cm x 20cm x 20cm. Weight limit: 1.0 kg.',
    'Robotics Champion: BDT 35,000 + Custom Trophy\nBest Hardware Innovation Award: BDT 15,000',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80',
    now() + INTERVAL '2 days',
    now() + INTERVAL '2 days 6 hours',
    'Indoor Sports Complex',
    now() - INTERVAL '14 days',
    now() + INTERVAL '1 day',
    10, true, false, true, 2, 4, 0, 140,
    'token_robotics_challenge',
    '[{"key":"bot_name","label":"Robot Name","type":"text","required":true}]'::jsonb,
    ARRAY['robotics', 'hardware', 'arduino', 'sensors'],
    true
  ),
  -- 4. Pending Approval Event
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Valorant Gaming Tournament',
    'gaming-tournament-2026',
    'gaming',
    '5v5 tactical shooter esports tournament broadcasted live on stage with spectator screens.',
    'Double elimination bracket. All players must bring their own peripherals.',
    '1st Place Team: BDT 60,000\nMVP Award: Gaming Headset',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
    now() + INTERVAL '3 days',
    now() + INTERVAL '3 days 8 hours',
    'Gaming Zone Studio B',
    now() - INTERVAL '5 days',
    now() + INTERVAL '2 days',
    32, true, true, true, 5, 5, 0, 100,
    'token_gaming_valorant',
    '[{"key":"riot_id","label":"Riot ID with Tag","type":"text","required":true}]'::jsonb,
    ARRAY['gaming', 'esports', 'valorant'],
    true
  ),
  -- 5. Past event for certificates and completed stamps
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    'Keynote: The Era of Autonomous AI Agents',
    'ai-agents-keynote',
    'seminar',
    'Inspiring opening keynote address by industry leaders on foundation models, AI agents, and futuristic engineering.',
    'Open to all registered carnival attendees.',
    'Digital Certificate of Participation for all verified attendees.',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=80',
    now() - INTERVAL '2 days',
    now() - INTERVAL '2 days 2 hours',
    'Grand Hall A',
    now() - INTERVAL '20 days',
    now() - INTERVAL '2 days 4 hours',
    200, false, false, false, 1, 1, 0, 80,
    'token_keynote_past',
    '[]'::jsonb,
    ARRAY['keynote', 'ai', 'inspiration'],
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  capacity = EXCLUDED.capacity;

-- 5. Demo Profiles (Will be linked to auth users when created, or initialized directly)
-- Organizer Account Profile
INSERT INTO public.profiles (
  id, handle, full_name, email, phone, institution, student_id, bio, passport_no, role, onboarded, xp
) VALUES (
  '90000000-0000-0000-0000-000000000001',
  'organizer_demo',
  'DRMC IT Lead Organizer',
  'organizer@demo.clubos.dev',
  '+880 1711 000001',
  'Dhaka Residential Model College',
  '2026-ORG-01',
  'Head of Operations for Tech Carnival 2026.',
  'CL-2026-000001',
  'organizer',
  true,
  1250
) ON CONFLICT (handle) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- Link organizer profile to DRMC IT Club
INSERT INTO public.org_members (org_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'admin')
ON CONFLICT DO NOTHING;

-- Participant Account Profile
INSERT INTO public.profiles (
  id, handle, full_name, email, phone, institution, student_id, bio, passport_no, role, onboarded, xp, interests
) VALUES (
  '90000000-0000-0000-0000-000000000002',
  'tanvir_hossain',
  'Tanvir Hossain',
  'participant@demo.clubos.dev',
  '+880 1819 000002',
  'Dhaka Residential Model College',
  '2026-ST-402',
  'Web developer and competitive programmer building next-gen apps.',
  'CL-2026-000002',
  'participant',
  true,
  480,
  ARRAY['web', 'ai', 'cp']
) ON CONFLICT (handle) DO UPDATE SET full_name = EXCLUDED.full_name, xp = EXCLUDED.xp;

-- 6. Demo Participant Registrations
-- Live event confirmed & checked-in ready ticket!
INSERT INTO public.registrations (
  id, event_id, user_id, status, ticket_code, answers, created_at
) VALUES (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', -- AI Web Dev
  '90000000-0000-0000-0000-000000000002',
  'confirmed',
  'TC2026-WEB1',
  '{"github_url":"https://github.com/tanvir/clubos","stack":"Next.js"}'::jsonb,
  now() - INTERVAL '3 days'
) ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status;

-- Past event checked-in (with certificate and stamp!)
INSERT INTO public.registrations (
  id, event_id, user_id, status, ticket_code, checked_in_at, checkin_method, created_at
) VALUES (
  '30000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000005', -- Keynote
  '90000000-0000-0000-0000-000000000002',
  'checked_in',
  'TC2026-KEY1',
  now() - INTERVAL '2 days',
  'token_scan',
  now() - INTERVAL '5 days'
) ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status;

-- Stamp for past event
INSERT INTO public.stamps (user_id, kind, event_id, earned_at)
VALUES ('90000000-0000-0000-0000-000000000002', 'event', '20000000-0000-0000-0000-000000000005', now() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Fest entry stamp for Fest 1
INSERT INTO public.stamps (user_id, kind, fest_id, earned_at)
VALUES ('90000000-0000-0000-0000-000000000002', 'fest', '10000000-0000-0000-0000-000000000001', now() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- User Badges for Demo Participant
INSERT INTO public.user_badges (user_id, badge_id, fest_id, earned_at, featured)
VALUES
  ('90000000-0000-0000-0000-000000000002', 'first_stamp', NULL, now() - INTERVAL '2 days', true),
  ('90000000-0000-0000-0000-000000000002', 'early_bird', NULL, now() - INTERVAL '3 days', true)
ON CONFLICT DO NOTHING;

-- 7. Announcements
INSERT INTO public.announcements (fest_id, event_id, title, body, created_by) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Welcome to AI Web Development Contest!',
    'Please report to Computer Lab 1 & 2 by 10:00 AM. Ensure your GitHub repo is public and contains an MIT License file before submitting.',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    NULL,
    '9th DRMC International Tech Carnival Opening Ceremony',
    'The grand inauguration ceremony starts at 9:30 AM tomorrow in the Grand Auditorium. All participants must bring their digital Passport QR codes.',
    '90000000-0000-0000-0000-000000000001'
  );

-- 8. Feedback
INSERT INTO public.feedback (event_id, user_id, rating, comment) VALUES
  ('20000000-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000002', 5, 'Exceptional keynote! Loved the insights on AI agent architectures.')
ON CONFLICT DO NOTHING;
