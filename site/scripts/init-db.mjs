import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqekafdcxzipxmbybxmn.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required to run init-db');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function init() {
  console.log('--- Initializing ClubOS Database via Supabase Client ---');

  // 1. Insert Badges
  const badges = [
    { id: 'first_stamp', name: 'First Stamp', description: 'Earned your very first event stamp.', icon: 'stamp', rings: 1, xp_reward: 25 },
    { id: 'collector', name: 'Collector', description: 'Earned 5 event stamps across any fest.', icon: 'layers', rings: 2, xp_reward: 50 },
    { id: 'regular', name: 'Regular', description: 'Earned 15 event stamps.', icon: 'award', rings: 3, xp_reward: 100 },
    { id: 'fest_finisher', name: 'Fest Finisher', description: 'Attended all registered events in a single fest.', icon: 'check-circle-2', rings: 2, xp_reward: 75 },
    { id: 'multi_fest', name: 'Multi-Fest Explorer', description: 'Earned stamps in 3 different fests.', icon: 'compass', rings: 3, xp_reward: 75 },
    { id: 'early_bird', name: 'Early Bird', description: 'Registered within 1 hour of registration opening.', icon: 'zap', rings: 1, xp_reward: 20 },
    { id: 'night_owl', name: 'Night Owl', description: 'Checked in after 8:00 PM.', icon: 'moon', rings: 1, xp_reward: 20 },
    { id: 'social_butterfly', name: 'Social Butterfly', description: 'Connected with 5 other participants.', icon: 'users', rings: 2, xp_reward: 50 },
    { id: 'connector', name: 'Connector', description: 'Connected with 20 other participants.', icon: 'share-2', rings: 3, xp_reward: 150 },
    { id: 'reviewer', name: 'Reviewer', description: 'Submitted feedback for 3 events.', icon: 'message-square', rings: 1, xp_reward: 40 },
    { id: 'champion', name: 'Champion', description: 'Awarded to contest winners.', icon: 'trophy', rings: 4, xp_reward: 200 }
  ];

  const { error: badgeErr } = await supabase.from('badges').upsert(badges);
  if (badgeErr) console.log('Badge insert notice:', badgeErr.message);
  else console.log('✓ Badges ready');

  // 2. Insert Organization
  const org = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'DRMC IT Club',
    slug: 'drmc-it-club',
    description: 'Dhaka Residential Model College IT Club — premier student technology club organizing international carnivals, hackathons, and technology summits.',
    logo_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80'
  };
  const { error: orgErr } = await supabase.from('organizations').upsert([org]);
  if (orgErr) console.log('Org insert notice:', orgErr.message);
  else console.log('✓ Organization DRMC IT Club ready');

  console.log('--- Supabase Data Verification Complete ---');
}

init();
