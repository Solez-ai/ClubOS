-- ClubOS Complete Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOM TYPES
-- ============================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('participant', 'organizer', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE reg_status AS ENUM ('pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected', 'checked_in');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE event_category AS ENUM ('competition', 'workshop', 'seminar', 'gaming', 'robotics', 'quiz', 'social', 'other', 'science_technology', 'music_art', 'literature', 'sports', 'business', 'health', 'fashion', 'photography', 'film', 'theatre', 'dance', 'food');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('bkash_send_money', 'bkash_pay_bill', 'nagad_send_money', 'nagad_pay_bill');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'verified', 'declined', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE segment_type AS ENUM ('workshop', 'competition', 'seminar', 'gaming', 'social', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- TABLES
-- ============================================

-- Auth users (Supabase handles this, but we reference it)
-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  password TEXT, -- For custom auth if needed
  phone TEXT,
  institution TEXT,
  student_id TEXT,
  bio TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'participant',
  passport_no TEXT UNIQUE DEFAULT uuid_generate_v4()::text,
  passport_public BOOLEAN DEFAULT true,
  xp INTEGER DEFAULT 0,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  website TEXT,
  facebook TEXT,
  instagram TEXT,
  twitter TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- organization_members (organizers of an organization)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- category_tags (predefined event categories/tags)
CREATE TABLE IF NOT EXISTS category_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_type event_category NOT NULL,
  color TEXT DEFAULT '#C9A96E',
  icon TEXT DEFAULT 'tag',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- fests table
CREATE TABLE IF NOT EXISTS fests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT,
  cover_url TEXT,
  logo_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  venue_latitude DECIMAL(10, 8),
  venue_longitude DECIMAL(11, 8),
  google_maps_url TEXT,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fest_id UUID REFERENCES fests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category event_category NOT NULL DEFAULT 'other',
  description TEXT,
  rules TEXT,
  prizes TEXT,
  cover_url TEXT,
  thumbnail_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  venue TEXT,
  venue_latitude DECIMAL(10, 8),
  venue_longitude DECIMAL(11, 8),
  google_maps_url TEXT,
  registration_opens_at TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  capacity INTEGER,
  waitlist_enabled BOOLEAN DEFAULT true,
  is_team_event BOOLEAN DEFAULT false,
  team_min INTEGER DEFAULT 1,
  team_max INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  xp_reward INTEGER DEFAULT 0,
  checkin_token TEXT UNIQUE DEFAULT uuid_generate_v4()::text,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- event_tags (many-to-many relationship between events and category_tags)
CREATE TABLE IF NOT EXISTS event_tags (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES category_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

-- segments table (segments within an event - like different competition categories, workshops, etc.)
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  segment_type segment_type NOT NULL DEFAULT 'other',
  max_participants INTEGER,
  price DECIMAL(10, 2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  payment_method payment_method DEFAULT 'bkash_send_money',
  payment_info TEXT, -- JSON or text with payment details (number to send to, bill number, etc.)
  instructions TEXT,
  rules TEXT,
  prizes TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status reg_status NOT NULL DEFAULT 'pending',
  team_name TEXT,
  team_members JSONB, -- Array of member names/emails for team events
  answers JSONB, -- Custom field answers
  ticket_code TEXT UNIQUE DEFAULT uuid_generate_v4()::text,
  checked_in_at TIMESTAMPTZ,
  checkin_method TEXT,
  waitlist_position INTEGER,
  organizer_note TEXT,
  total_price DECIMAL(10, 2) DEFAULT 0,
  payment_status payment_status DEFAULT 'pending',
  payment_method payment_method,
  transaction_id TEXT,
  transaction_mobile TEXT,
  payment_screenshot_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decline_reason TEXT,
  declined_at TIMESTAMPTZ,
  declined_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- registration_segments (which segments a participant registered for)
CREATE TABLE IF NOT EXISTS registration_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
  price_paid DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'selected', 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(registration_id, segment_id)
);

-- notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- email_notifications (tracking sent emails)
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL, -- 'registration_confirmation', 'payment_declined', 'payment_verified', etc.
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' -- 'sent', 'failed', 'pending'
);

-- activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fest_id UUID REFERENCES fests(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEED DATA - Category Tags
-- ============================================

INSERT INTO category_tags (name, slug, category_type, color, icon, description) VALUES
-- Science & Technology
('Artificial Intelligence', 'ai', 'science_technology', '#6366F1', 'brain', 'AI, machine learning, and neural networks'),
('Robotics', 'robotics', 'science_technology', '#8B5CF6', 'cpu', 'Robotics, drones, and automation'),
('Web Development', 'web-dev', 'science_technology', '#3B82F6', 'code', 'HTML, CSS, JavaScript, frameworks'),
('App Development', 'app-dev', 'science_technology', '#06B6D4', 'smartphone', 'Mobile app development iOS/Android'),
('Cybersecurity', 'cybersecurity', 'science_technology', '#EF4444', 'shield', 'Security, ethical hacking, cryptography'),
('Data Science', 'data-science', 'science_technology', '#10B981', 'chart-bar', 'Data analysis, visualization, big data'),
('Blockchain', 'blockchain', 'science_technology', '#F59E0B', 'link', 'Crypto, Web3, smart contracts'),
('IoT', 'iot', 'science_technology', '#84CC16', 'wifi', 'Internet of Things, sensors, embedded systems'),
('Cloud Computing', 'cloud', 'science_technology', '#64748B', 'cloud', 'AWS, Azure, GCP, serverless'),
('Game Development', 'game-dev', 'science_technology', '#EC4899', 'gamepad-2', 'Game design, Unity, Unreal Engine'),

-- Music & Art
('Music', 'music', 'music_art', '#F43F5E', 'music', 'Singing, instruments, music production'),
('Dance', 'dance', 'music_art', '#FB923C', 'movements', 'Various dance forms and choreography'),
('Painting', 'painting', 'music_art', '#A855F7', 'paintbrush', 'Canvas, watercolor, oil painting'),
('Digital Art', 'digital-art', 'music_art', '#06B6D4', 'palette', 'Digital illustration, graphic design'),
('Photography', 'photography', 'music_art', '#EAB308', 'camera', 'Photo shoots, editing, cinematography'),
('Drama & Theatre', 'theatre', 'music_art', '#8B5CF6', 'theater', 'Acting, stage performances, plays'),
('Creative Writing', 'writing', 'music_art', '#3B82F6', 'pen-line', 'Poetry, storytelling, scripts'),
('Fashion', 'fashion', 'music_art', '#EC4899', 'shirt', 'Design, styling, textile arts'),

-- Sports & Fitness
('Football', 'football', 'sports', '#22C55E', 'football', 'Soccer competitions and matches'),
('Basketball', 'basketball', 'sports', '#16A34A', 'basketball', 'Basketball tournaments'),
('Cricket', 'cricket', 'sports', '#15803D', 'cricket', 'Cricket matches and tournaments'),
('Volleyball', 'volleyball', 'sports', '#4ADE80', 'volleyball', 'Volleyball competitions'),
('Badminton', 'badminton', 'sports', '#A3E635', 'target', 'Badminton tournaments'),
('Chess', 'chess', 'sports', '#FBBF24', 'chess-knight', 'Chess competitions'),
('Swimming', 'swimming', 'sports', '#0EA5E9', 'waves', 'Swimming competitions'),
('Martial Arts', 'martial-arts', 'sports', '#EF4444', 'fist', 'Karate, taekwondo, self-defense'),

-- Business & Entrepreneurship
('Business Plan', 'business-plan', 'business', '#F97316', 'briefcase', 'Startup pitch, business proposals'),
('Case Competition', 'case-comp', 'business', '#EA580C', 'clipboard-list', 'Case study analysis and solutions'),
('Hackathon', 'hackathon', 'business', '#8B5CF6', 'zap', 'Coding marathons, innovation challenges'),
('Debate', 'debate', 'business', '#3B82F6', 'mic', 'Debate competitions, public speaking'),
('Quiz', 'quiz', 'business', '#10B981', 'help-circle', 'General knowledge, trivia competitions'),

-- Health & Wellness
('Yoga', 'yoga', 'health', '#84CC16', 'lotus', 'Yoga sessions, meditation'),
('Fitness', 'fitness', 'health', '#EF4444', 'heart-pulse', 'Fitness challenges, bodybuilding'),
('Mental Health', 'mental-health', 'health', '#6366F1', 'brain-circuit', 'Awareness, counseling sessions'),

-- Food & Culinary
('Cooking', 'cooking', 'food', '#F97316', 'chef-hat', 'Cooking competitions, baking'),
('Food Stalls', 'food-stalls', 'food', '#EAB308', 'coffee', 'Food kiosks, culinary display'),

-- Technology Workshops
('3D Printing', '3d-printing', 'science_technology', '#64748B', 'box', '3D modeling and printing'),
('Arduino', 'arduino', 'science_technology', '#22C55E', 'cpu', 'Arduino projects and workshops'),
('Raspberry Pi', 'raspberry-pi', 'science_technology', '#DC2626', 'memory-stick', 'RPi projects and IoT'),
('Drone Racing', 'drone-racing', 'science_technology', '#A855F7', 'rocket', 'Drone assembly and racing'),
('VR/AR', 'vr-ar', 'science_technology', '#06B6D4', 'eye', 'Virtual and augmented reality experiences')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_fests_org_id ON fests(org_id);
CREATE INDEX IF NOT EXISTS idx_fests_slug ON fests(slug);
CREATE INDEX IF NOT EXISTS idx_fests_dates ON fests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_fest_id ON events(fest_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_registration ON events(registration_opens_at, registration_deadline);
CREATE INDEX IF NOT EXISTS idx_segments_event_id ON segments(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registration_segments_registration_id ON registration_segments(registration_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE fests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Organizations: Public read, organizers can manage
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON organizations;
CREATE POLICY "Organizations are viewable by everyone" ON organizations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Organizers can insert organizations" ON organizations;
CREATE POLICY "Organizers can insert organizations" ON organizations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Organizers can update own organizations" ON organizations;
CREATE POLICY "Organizers can update own organizations" ON organizations
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Organization Members
DROP POLICY IF EXISTS "Members visible to org members" ON organization_members;
CREATE POLICY "Members visible to org members" ON organization_members
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
      AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join organizations" ON organization_members;
CREATE POLICY "Users can join organizations" ON organization_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Category Tags: Public read
DROP POLICY IF EXISTS "Category tags are viewable by everyone" ON category_tags;
CREATE POLICY "Category tags are viewable by everyone" ON category_tags
  FOR SELECT TO authenticated USING (true);

-- Fests: Public read when published
DROP POLICY IF EXISTS "Published fests are viewable by everyone" ON fests;
CREATE POLICY "Published fests are viewable by everyone" ON fests
  FOR SELECT TO authenticated USING (is_published = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Organizers can manage own fests" ON fests;
CREATE POLICY "Organizers can manage own fests" ON fests
  FOR ALL TO authenticated USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = fests.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Events: Public read when published
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
CREATE POLICY "Published events are viewable by everyone" ON events
  FOR SELECT TO authenticated USING (
    is_published = true OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM fests f
      WHERE f.id = events.fest_id
      AND (f.is_published = true OR f.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organizers can manage own events" ON events;
CREATE POLICY "Organizers can manage own events" ON events
  FOR ALL TO authenticated USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM fests f
      JOIN organization_members om ON om.org_id = f.org_id
      WHERE f.id = events.fest_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- Segments: Visible to event participants
DROP POLICY IF EXISTS "Segments visible to event participants" ON segments;
CREATE POLICY "Segments visible to event participants" ON segments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = segments.event_id
      AND (e.is_published = true OR e.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organizers can manage segments" ON segments;
CREATE POLICY "Organizers can manage segments" ON segments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = segments.event_id
      AND e.created_by = auth.uid()
    )
  );

-- Registrations: Users can see own, organizers can see event registrations
DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;
CREATE POLICY "Users can view own registrations" ON registrations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Event organizers can view registrations" ON registrations;
CREATE POLICY "Event organizers can view registrations" ON registrations
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = registrations.event_id
      AND e.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create registrations" ON registrations;
CREATE POLICY "Users can create registrations" ON registrations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own registrations" ON registrations;
CREATE POLICY "Users can update own registrations" ON registrations
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Registration Segments
DROP POLICY IF EXISTS "Users can view own registration segments" ON registration_segments;
CREATE POLICY "Users can view own registration segments" ON registration_segments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_segments.registration_id
      AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own registration segments" ON registration_segments;
CREATE POLICY "Users can manage own registration segments" ON registration_segments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_segments.registration_id
      AND r.user_id = auth.uid()
    )
  );

-- Notifications: Users see own
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Activity Log: Public read for event activity
DROP POLICY IF EXISTS "Activity log viewable by authenticated" ON activity_log;
CREATE POLICY "Activity log viewable by authenticated" ON activity_log
  FOR SELECT TO authenticated USING (true);

-- Announcements: Public read when published
DROP POLICY IF EXISTS "Announcements viewable by authenticated" ON announcements;
CREATE POLICY "Announcements viewable by authenticated" ON announcements
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create profile on user signup.
-- The handle is made race-safe for scale: base it on the email prefix, then
-- resolve collisions with a deterministic-attempt + random fallback suffix so
-- concurrent signups with the same prefix (e.g. john@gmail.com / john@yahoo.com)
-- never violate the UNIQUE constraint.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_base TEXT;
  v_handle TEXT;
  v_suffix INT := 0;
BEGIN
  v_base := left(
    regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '_', 'g'),
    24
  );
  IF v_base = '' OR v_base IS NULL THEN
    v_base := 'user';
  END IF;

  v_handle := v_base;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE handle = v_handle) LOOP
    v_suffix := v_suffix + 1;
    IF v_suffix <= 20 THEN
      v_handle := v_base || v_suffix::text;
    ELSE
      v_handle := left(v_base, 18) || floor(random() * 9000 + 1000)::int::text;
    END IF;
  END LOOP;

  INSERT INTO profiles (id, handle, full_name, email, role, phone, institution, avatar_url, onboarded)
  VALUES (
    NEW.id,
    v_handle,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'participant')::user_role,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'institution', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Sample organization (will be created by organizers during signup)
-- Sample events, segments, etc. will be created by organizers
