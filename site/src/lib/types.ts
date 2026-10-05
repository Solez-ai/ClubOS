export type UserRole = 'participant' | 'organizer' | 'admin';
export type RegStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled' | 'rejected' | 'checked_in';
export type EventCategory = 'competition' | 'workshop' | 'seminar' | 'gaming' | 'robotics' | 'quiz' | 'social' | 'other';

export interface Profile {
  id: string;
  handle: string;
  full_name: string;
  email: string;
  phone?: string | null;
  institution?: string | null;
  student_id?: string | null;
  bio?: string | null;
  interests?: string[];
  avatar_url?: string | null;
  passport_no: string;
  passport_public: boolean;
  xp: number;
  role: UserRole;
  onboarded: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  created_at: string;
}

export interface Fest {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  cover_url?: string | null;
  start_date: string;
  end_date: string;
  venue?: string | null;
  checkin_token: string;
  is_published: boolean;
  created_at: string;
  org?: Organization;
}

export interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multi-select' | 'checkbox' | 'number' | 'date';
  required?: boolean;
  options?: string[];
  help_text?: string;
}

export interface Event {
  id: string;
  fest_id: string;
  title: string;
  slug: string;
  category: EventCategory;
  description?: string | null;
  rules?: string | null;
  prizes?: string | null;
  cover_url?: string | null;
  starts_at: string;
  ends_at?: string | null;
  venue?: string | null;
  registration_opens_at: string;
  registration_deadline: string;
  capacity?: number | null;
  waitlist_enabled: boolean;
  requires_approval: boolean;
  is_team_event: boolean;
  team_min: number;
  team_max: number;
  fee_amount: number;
  xp_reward: number;
  checkin_token: string;
  custom_fields: CustomField[];
  tags: string[];
  is_published: boolean;
  created_at: string;
  
  // Computed fields from event_with_counts
  registered_count?: number;
  confirmed_count?: number;
  waitlist_count?: number;
  checked_in_count?: number;
  spots_left?: number | null;
  is_open?: boolean;
  is_full?: boolean;
  closing_soon?: boolean;
  fest?: Fest;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: RegStatus;
  team_name?: string | null;
  team_members?: any[];
  answers?: Record<string, any>;
  ticket_code: string;
  checked_in_at?: string | null;
  checkin_method?: string | null;
  waitlist_position?: number | null;
  organizer_note?: string | null;
  created_at: string;
  
  event?: Event;
  profile?: Profile;
}

export interface Stamp {
  id: string;
  user_id: string;
  kind: 'event' | 'fest';
  event_id?: string | null;
  fest_id?: string | null;
  earned_at: string;
  event?: Event;
  fest?: Fest;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rings: number;
  xp_reward: number;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  fest_id?: string | null;
  earned_at: string;
  featured: boolean;
  badge?: Badge;
}

export interface Connection {
  user_a: string;
  user_b: string;
  fest_id?: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  fest_id?: string | null;
  event_id?: string | null;
  title: string;
  body: string;
  created_by?: string | null;
  created_at: string;
  author?: Profile;
}

export interface Feedback {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  event_id?: string | null;
  actor_id?: string | null;
  action: string;
  meta: Record<string, any>;
  created_at: string;
  actor?: Profile;
  event?: Event;
}
