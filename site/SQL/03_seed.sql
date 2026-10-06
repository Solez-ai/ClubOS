-- ClubOS Seed Data
-- Run this after 01_schema.sql and 02_functions.sql

-- ============================================
-- DEMO ORGANIZERS
-- Note: These are created via Supabase Auth first, then profiles are inserted
-- For demo purposes, we'll insert sample data assuming users exist

-- Create a demo organization
INSERT INTO organizations (name, slug, description, logo_url, website, contact_email, is_verified, created_by)
VALUES 
  ('DRMC IT Club', 'drmc-it-club', 'The official IT club of DRMC, organizing tech events and carnivals.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'https://drmc.edu.bd', 'itclub@drmc.edu.bd', true, NULL)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- CATEGORY TAGS (if not already seeded)
-- These are pre-defined tags for filtering events

-- Science & Technology
INSERT INTO category_tags (name, slug, category_type, color, icon, description) VALUES
('Artificial Intelligence', 'ai', 'science_technology', '#6366F1', 'brain', 'AI, machine learning, neural networks'),
('Robotics', 'robotics', 'science_technology', '#8B5CF6', 'cpu', 'Robotics, drones, automation'),
('Web Development', 'web-dev', 'science_technology', '#3B82F6', 'code', 'HTML, CSS, JS, frameworks'),
('App Development', 'app-dev', 'science_technology', '#06B6D4', 'smartphone', 'Mobile app development'),
('Cybersecurity', 'cybersecurity', 'science_technology', '#EF4444', 'shield', 'Security, ethical hacking'),
('Data Science', 'data-science', 'science_technology', '#10B981', 'chart-bar', 'Data analysis, visualization'),
('Blockchain', 'blockchain', 'science_technology', '#F59E0B', 'link', 'Crypto, Web3, smart contracts'),
('IoT', 'iot', 'science_technology', '#84CC16', 'wifi', 'Internet of Things, sensors'),
('Cloud Computing', 'cloud', 'science_technology', '#64748B', 'cloud', 'AWS, Azure, GCP'),
('Game Development', 'game-dev', 'science_technology', '#EC4899', 'gamepad-2', 'Game design, Unity, Unreal')
ON CONFLICT (slug) DO NOTHING;

-- Music & Art
INSERT INTO category_tags (name, slug, category_type, color, icon, description) VALUES
('Music', 'music', 'music_art', '#F43F5E', 'music', 'Singing, instruments'),
('Dance', 'dance', 'music_art', '#FB923C', 'movements', 'Various dance forms'),
('Painting', 'painting', 'music_art', '#A855F7', 'paintbrush', 'Canvas, watercolor'),
('Digital Art', 'digital-art', 'music_art', '#06B6D4', 'palette', 'Digital illustration'),
('Photography', 'photography', 'music_art', '#EAB308', 'camera', 'Photo shoots, editing'),
('Drama & Theatre', 'theatre', 'music_art', '#8B5CF6', 'theater', 'Acting, stage plays'),
('Creative Writing', 'writing', 'music_art', '#3B82F6', 'pen-line', 'Poetry, storytelling'),
('Fashion', 'fashion', 'music_art', '#EC4899', 'shirt', 'Design, styling')
ON CONFLICT (slug) DO NOTHING;

-- Sports
INSERT INTO category_tags (name, slug, category_type, color, icon, description) VALUES
('Football', 'football', 'sports', '#22C55E', 'football', 'Soccer competitions'),
('Basketball', 'basketball', 'sports', '#16A34A', 'basketball', 'Basketball tournaments'),
('Cricket', 'cricket', 'sports', '#15803D', 'cricket', 'Cricket matches'),
('Volleyball', 'volleyball', 'sports', '#4ADE80', 'volleyball', 'Volleyball competitions'),
('Badminton', 'badminton', 'sports', '#A3E635', 'target', 'Badminton tournaments'),
('Chess', 'chess', 'sports', '#FBBF24', 'chess-knight', 'Chess competitions'),
('Swimming', 'swimming', 'sports', '#0EA5E9', 'waves', 'Swimming competitions'),
('Martial Arts', 'martial-arts', 'sports', '#EF4444', 'fist', 'Karate, taekwondo')
ON CONFLICT (slug) DO NOTHING;

-- Business & Events
INSERT INTO category_tags (name, slug, category_type, color, icon, description) VALUES
('Business Plan', 'business-plan', 'business', '#F97316', 'briefcase', 'Startup pitch'),
('Case Competition', 'case-comp', 'business', '#EA580C', 'clipboard-list', 'Case study solutions'),
('Hackathon', 'hackathon', 'business', '#8B5CF6', 'zap', 'Coding marathons'),
('Debate', 'debate', 'business', '#3B82F6', 'mic', 'Public speaking'),
('Quiz', 'quiz', 'business', '#10B981', 'help-circle', 'General knowledge')
ON CONFLICT (slug) DO NOTHING;

-- Health & Food
INSERT INTO category_tags (name, slug, category_type, color, icon, description) VALUES
('Yoga', 'yoga', 'health', '#84CC16', 'lotus', 'Yoga and meditation'),
('Fitness', 'fitness', 'health', '#EF4444', 'heart-pulse', 'Fitness challenges'),
('Cooking', 'cooking', 'food', '#F97316', 'chef-hat', 'Cooking competitions'),
('Food Stalls', 'food-stalls', 'food', '#EAB308', 'coffee', 'Food kiosks')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SAMPLE FEST (for demonstration)
-- Note: In real usage, organizers create these through the UI

INSERT INTO fests (org_id, title, slug, tagline, description, cover_url, start_date, end_date, venue, google_maps_url, is_published, is_featured, created_by)
SELECT 
  o.id,
  '9th DRMC International Tech Carnival 2026',
  'drmc-tech-carnival-2026',
  'One Passport, Infinite Possibilities',
  'The biggest tech carnival of the year, featuring hackathons, workshops, competitions, and cultural events. Join us for 3 days of innovation and creativity!',
  'https://images.unsplash.com/photo-1540575467063-178a50c50767?w=1200',
  '2026-03-15 09:00:00+06',
  '2026-03-17 18:00:00+06',
  'DRMC Campus, Main Grounds',
  'https://maps.google.com/?q=DRMC+Campus+Bangladesh',
  true,
  true,
  NULL
FROM organizations o
WHERE o.slug = 'drmc-it-club'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SAMPLE EVENTS
-- Note: These are created by organizers through the UI in real usage

INSERT INTO events (fest_id, title, slug, category, description, rules, prizes, cover_url, starts_at, ends_at, venue, registration_opens_at, registration_deadline, capacity, is_team_event, team_min, team_max, is_published, is_featured, xp_reward, created_by)
SELECT 
  f.id,
  'AI Hackathon 2026',
  'ai-hackathon-2026',
  'science_technology',
  'Build innovative AI solutions in 24 hours! Teams will compete to create the most impactful AI-powered application addressing real-world problems.',
  '1. Teams of 2-4 members\n2. All code must be original\n3. Use of pre-trained models allowed\n4. Must submit a working prototype\n5. Presentation is mandatory',
  '1st: 50,000 BDT + Trophy\n2nd: 30,000 BDT\n3rd: 15,000 BDT',
  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800',
  '2026-03-15 10:00:00+06',
  '2026-03-16 10:00:00+06',
  'DRMC Computer Lab 3',
  '2026-02-01 00:00:00+06',
  '2026-03-14 23:59:59+06',
  50,
  true,
  2,
  4,
  true,
  true,
  500,
  NULL
FROM fests f WHERE f.slug = 'drmc-tech-carnival-2026'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (fest_id, title, slug, category, description, rules, prizes, cover_url, starts_at, ends_at, venue, registration_opens_at, registration_deadline, capacity, is_team_event, team_min, team_max, is_published, is_featured, xp_reward, created_by)
SELECT 
  f.id,
  'Robotics Challenge',
  'robotics-challenge',
  'science_technology',
  'Design, build, and program robots to complete autonomous missions. Test your engineering skills in this exciting hands-on competition.',
  '1. Teams of 3-5 members\n2. Robots must fit within 30x30x30cm\n3. No remote control during missions\n4. Pre-built robots allowed\n5. Safety gear mandatory',
  '1st: 40,000 BDT + Robot Kit\n2nd: 20,000 BDT\n3rd: 10,000 BDT',
  'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800',
  '2026-03-15 14:00:00+06',
  '2026-03-17 16:00:00+06',
  'DRMC Engineering Workshop',
  '2026-02-01 00:00:00+06',
  '2026-03-14 23:59:59+06',
  30,
  true,
  3,
  5,
  true,
  true,
  400,
  NULL
FROM fests f WHERE f.slug = 'drmc-tech-carnival-2026'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (fest_id, title, slug, category, description, rules, prizes, cover_url, starts_at, ends_at, venue, registration_opens_at, registration_deadline, capacity, is_team_event, team_min, team_max, is_published, is_featured, xp_reward, created_by)
SELECT 
  f.id,
  'Web Development Workshop',
  'web-dev-workshop',
  'science_technology',
  'Learn modern web development from industry experts. This hands-on workshop covers React, Next.js, and full-stack development.',
  '1. Bring your own laptop\n2. Basic programming knowledge required\n3. Active participation expected\n4. All materials provided',
  'Certificate of Completion',
  'https://images.unsplash.com/photo-1461749280887-83e6d3d14c66?w=800',
  '2026-03-15 10:00:00+06',
  '2026-03-15 17:00:00+06',
  'DRMC Seminar Hall A',
  '2026-02-01 00:00:00+06',
  '2026-03-14 23:59:59+06',
  100,
  false,
  1,
  1,
  true,
  false,
  100,
  NULL
FROM fests f WHERE f.slug = 'drmc-tech-carnival-2026'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO events (fest_id, title, slug, category, description, rules, prizes, cover_url, starts_at, ends_at, venue, registration_opens_at, registration_deadline, capacity, is_team_event, team_min, team_max, is_published, is_featured, xp_reward, created_by)
SELECT 
  f.id,
  'Music Night Concert',
  'music-night',
  'music_art',
  'Enjoy an electrifying night of live music performances by renowned artists and student bands. An unforgettable experience!',
  '1. Show respect to performers\n2. No professional cameras without permit\n3. Maintain venue cleanliness\n4. Follow security instructions',
  'N/A (Free Event)',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
  '2026-03-16 19:00:00+06',
  '2026-03-16 23:00:00+06',
  'DRMC Open Air Auditorium',
  '2026-02-01 00:00:00+06',
  '2026-03-15 23:59:59+06',
  500,
  false,
  1,
  1,
  true,
  true,
  50,
  NULL
FROM fests f WHERE f.slug = 'drmc-tech-carnival-2026'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SAMPLE SEGMENTS (for events that have segments)
-- Hackathon segments
INSERT INTO segments (event_id, title, description, segment_type, max_participants, price, is_free, payment_method, payment_info, instructions, prizes, start_time, end_time, is_active)
SELECT 
  e.id,
  'AI Hackathon - Beginner Track',
  'For participants new to hackathons. Build a simple AI-powered application.',
  'competition',
  20,
  0,
  true,
  'bkash_send_money',
  '{"number": "01700000000", "type": "send_money", "display": "Send money to 01700000000 (BKash)"}',
  'Register your team. You have 24 hours to build your project.',
  'Best Beginner Project: 5,000 BDT',
  '2026-03-15 10:00:00+06',
  '2026-03-16 10:00:00+06',
  true
FROM events e WHERE e.slug = 'ai-hackathon-2026'
ON CONFLICT DO NOTHING;

INSERT INTO segments (event_id, title, description, segment_type, max_participants, price, is_free, payment_method, payment_info, instructions, prizes, start_time, end_time, is_active)
SELECT 
  e.id,
  'AI Hackathon - Advanced Track',
  'For experienced developers. Build a complex AI solution with advanced features.',
  'competition',
  30,
  200,
  false,
  'bkash_pay_bill',
  '{"bill_no": "AI2026-###", "type": "pay_bill", "display": "Pay bill AI2026-### to BKash (Bill No will be provided after registration)"}',
  'Register your team. Advanced participants only.',
  'Best Overall Project: 50,000 BDT',
  '2026-03-15 10:00:00+06',
  '2026-03-16 10:00:00+06',
  true
FROM events e WHERE e.slug = 'ai-hackathon-2026'
ON CONFLICT DO NOTHING;

-- Robotics segments
INSERT INTO segments (event_id, title, description, segment_type, max_participants, price, is_free, payment_method, payment_info, instructions, prizes, start_time, end_time, is_active)
SELECT 
  e.id,
  'Line Follower Robot',
  'Build a robot that can autonomously follow a line track. Speed and accuracy matter!',
  'competition',
  15,
  500,
  false,
  'nagad_send_money',
  '{"number": "01800000000", "type": "send_money", "display": "Send money to 01800000000 (Nagad)"}',
  'Bring your robot. Testing will be done on-site.',
  'Fastest Robot: 10,000 BDT',
  '2026-03-15 14:00:00+06',
  '2026-03-17 16:00:00+06',
  true
FROM events e WHERE e.slug = 'robotics-challenge'
ON CONFLICT DO NOTHING;

INSERT INTO segments (event_id, title, description, segment_type, max_participants, price, is_free, payment_method, payment_info, instructions, prizes, start_time, end_time, is_active)
SELECT 
  e.id,
  'Sumo Robot Battle',
  'Design robots that can push each other out of the arena. Last robot standing wins!',
  'competition',
  15,
  500,
  false,
  'nagad_pay_bill',
  '{"bill_no": "SUMO2026-###", "type": "pay_bill", "display": "Pay bill SUMO2026-### to Nagad (Bill No will be provided after registration)"}',
  'Bring your sumo robot. Arena rules apply.',
  'Champion: 15,000 BDT',
  '2026-03-15 14:00:00+06',
  '2026-03-17 16:00:00+06',
  true
FROM events e WHERE e.slug = 'robotics-challenge'
ON CONFLICT DO NOTHING;

-- Event tags (associate tags with events)
INSERT INTO event_tags (event_id, tag_id)
SELECT e.id, ct.id
FROM events e
CROSS JOIN category_tags ct
WHERE e.slug = 'ai-hackathon-2026'
  AND ct.slug IN ('ai', 'hackathon', 'coding', 'innovation')
ON CONFLICT DO NOTHING;

INSERT INTO event_tags (event_id, tag_id)
SELECT e.id, ct.id
FROM events e
CROSS JOIN category_tags ct
WHERE e.slug = 'robotics-challenge'
  AND ct.slug IN ('robotics', 'engineering', 'competition')
ON CONFLICT DO NOTHING;

INSERT INTO event_tags (event_id, tag_id)
SELECT e.id, ct.id
FROM events e
CROSS JOIN category_tags ct
WHERE e.slug = 'web-dev-workshop'
  AND ct.slug IN ('web-dev', 'workshop', 'programming')
ON CONFLICT DO NOTHING;

INSERT INTO event_tags (event_id, tag_id)
SELECT e.id, ct.id
FROM events e
CROSS JOIN category_tags ct
WHERE e.slug = 'music-night'
  AND ct.slug IN ('music', 'concert', 'performance')
ON CONFLICT DO NOTHING;

-- ============================================
-- CLEANUP NOTES
-- ============================================
-- To reset the database, run:
-- DROP TABLE IF EXISTS registrations, registration_segments, segments, event_tags, events, fests, organization_members, organizations, profiles CASCADE;
-- Then re-run 01_schema.sql and this seed file
