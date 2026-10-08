/**
 * ClubOS demo data seeder.
 *
 * Creates two REAL, fully functional demo accounts for contest judges:
 *   - demo.organizer@clubos.app     (organizer: 5 fests, 6-20 events each, segments, tags)
 *   - demo.participant@clubos.app   (participant: registered to events in 3 of those fests)
 *
 * Idempotent: safe to re-run. Existing demo users are reused (password reset to the
 * documented credentials) and demo fests/registrations are rebuilt from scratch.
 *
 * Usage:  node scripts/seed-demo.mjs
 */

import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const readEnv = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return m ? m[1].trim() : '';
};

const SUPA = readEnv('NEXT_PUBLIC_SUPABASE_URL');
const KEY = readEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPA || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in site/.env.local');
  process.exit(1);
}

const DEMO_ORG = {
  email: 'demo.organizer@clubos.app',
  password: 'AuroraDemo2026!',
  full_name: 'Farhan Rahman',
  handle: 'farhan.rahman.demo',
  phone: '+8801712000045',
  institution: 'Aurora Campus Council',
  org: {
    name: 'Aurora Campus Council',
    slug: 'aurora-campus-council-demo',
    description:
      'A student-run collective that organizes inter-university tech, cultural and sports festivals across Dhaka. ClubOS demo organization for contest judges.',
    contact_email: 'hello@auroracampus.org',
    contact_phone: '+8801712000045',
  },
};

const DEMO_PARTICIPANT = {
  email: 'demo.participant@clubos.app',
  password: 'PassportDemo2026!',
  full_name: 'Nusrat Jahan',
  handle: 'nusrat.jahan.demo',
  phone: '+8801819000093',
  institution: 'Dhaka Residential Model College',
};

const PAY_CYCLE = ['bkash_send_money', 'bkash_pay_bill', 'nagad_send_money', 'nagad_pay_bill'];
const MERCHANT_NUMBERS = {
  bkash_send_money: '01712-345678',
  bkash_pay_bill: '01819-876543',
  nagad_send_money: '01611-223344',
  nagad_pay_bill: '01515-667788',
};

const FESTS = [
  {
    title: 'Aurora Tech Carnival 2026',
    tagline: 'Three-plus days of code, circuits and bright ideas',
    description:
      'The flagship tech festival of Aurora Campus Council. Hackathons, robotics arenas, cybersecurity CTFs and hands-on workshops spread across the DRMC campus, open to school, college and university students from all over Bangladesh.',
    venue: 'Dhaka Residential Model College Ground, Mohammadpur, Dhaka',
    startOffsetDays: -2,
    durationDays: 6,
    tags: ['hackathon', 'ai', 'robotics', 'cybersecurity'],
    events: [
      { t: 'HackAurora 24-Hour Hackathon', c: 'competition', v: 'Main Auditorium', day: 0, hour: 9, price: 300, team: true, cap: 40, tags: ['hackathon', 'ai'], seg2: 'Spectator Pass' },
      { t: 'Prompt Engineering Workshop', c: 'workshop', v: 'Computer Lab 3', day: 0, hour: 11, price: 0, cap: 60, tags: ['ai'] },
      { t: 'AI Model Showdown', c: 'competition', v: 'Computer Lab 1 & 2', day: 1, hour: 10, price: 200, cap: 50, tags: ['ai', 'data-science'] },
      { t: 'Line Follower Robot Race', c: 'robotics', v: 'Tech Arena (Basketball Court)', day: 1, hour: 13, price: 250, cap: 36, tags: ['robotics', 'arduino'] },
      { t: 'Robo Soccer', c: 'robotics', v: 'Tech Arena (Basketball Court)', day: 2, hour: 10, price: 300, team: true, cap: 24, tags: ['robotics'] },
      { t: 'CTF: Breach Point', c: 'competition', v: 'Computer Lab 4', day: 2, hour: 9, price: 150, team: true, cap: 30, tags: ['cybersecurity'] },
      { t: 'Inter-University Programming Contest', c: 'competition', v: 'Computer Lab 1 & 2', day: 3, hour: 9, price: 200, team: true, cap: 45, tags: ['app-dev', 'web-dev'] },
      { t: 'Web Wizards: Frontend Sprint', c: 'competition', v: 'Computer Lab 3', day: 3, hour: 14, price: 0, cap: 40, tags: ['web-dev'] },
      { t: 'Startup Elevator Pitch', c: 'business', v: 'Seminar Hall B', day: 4, hour: 10, price: 250, cap: 30, tags: ['business-plan'] },
      { t: 'Data Storytelling with Python', c: 'workshop', v: 'Computer Lab 2', day: 4, hour: 12, price: 100, cap: 35, tags: ['data-science'] },
      { t: 'Cloud & DevOps Bootcamp', c: 'workshop', v: 'Computer Lab 4', day: 4, hour: 15, price: 120, cap: 30, tags: ['cloud'] },
      { t: 'Game Jam: 12-Hour Build', c: 'gaming', v: 'Computer Lab 1', day: 5, hour: 9, price: 150, team: true, cap: 32, tags: ['game-dev'] },
      { t: 'Tech Quiz Bowl', c: 'quiz', v: 'Main Auditorium', day: 5, hour: 11, price: 0, cap: 80, tags: ['quiz'] },
      { t: 'Drone Obstacle Time Trial', c: 'robotics', v: 'School Field', day: 5, hour: 14, price: 350, cap: 20, tags: ['drone-racing', 'robotics'] },
      { t: 'Git Going: Open Source 101', c: 'workshop', v: 'Computer Lab 3', day: 1, hour: 15, price: 0, cap: 50, tags: ['web-dev'] },
      { t: 'E-Sports: Valorant Clash', c: 'gaming', v: 'Gaming Zone (Library Annex)', day: 2, hour: 16, price: 400, team: true, cap: 24, tags: ['game-dev'] },
      { t: 'Science Project Exhibition', c: 'science_technology', v: 'Science Building Corridor', day: 3, hour: 10, price: 0, cap: 100, tags: ['iot', 'arduino'] },
      { t: 'Career Compass Seminar', c: 'seminar', v: 'Seminar Hall A', day: 4, hour: 16, price: 0, cap: 120, tags: [] },
      { t: 'Digital Art Duel', c: 'music_art', v: 'Art Room', day: 5, hour: 10, price: 100, cap: 30, tags: ['digital-art'] },
      { t: 'Paper Presentation: AI for Bangladesh', c: 'seminar', v: 'Seminar Hall B', day: 5, hour: 13, price: 100, cap: 25, tags: ['ai', 'data-science'] },
    ],
  },
  {
    title: 'RoboRumble Bangladesh 2026',
    tagline: 'The loudest robotics battleground in the country',
    description:
      'A dedicated robotics and hardware festival. Heavyweight robot wars, micromouse mazes, drone grand prix and an Arduino bootcamp for first-time builders. Bring your bots, or build one on site.',
    venue: 'DRMC Indoor Gymnasium & School Field',
    startOffsetDays: 16,
    durationDays: 3,
    tags: ['robotics', 'arduino', 'drone-racing', 'iot'],
    events: [
      { t: 'Robot Wars: Heavyweight Bout', c: 'robotics', v: 'Battle Cage (Gymnasium)', day: 0, hour: 10, price: 500, team: true, cap: 16, seg2: 'Spectator Pass' },
      { t: 'Maze Solver Challenge', c: 'robotics', v: 'Gymnasium Floor B', day: 0, hour: 13, price: 250, cap: 30, tags: ['arduino'] },
      { t: 'Sumo Bot Showdown', c: 'robotics', v: 'Battle Cage (Gymnasium)', day: 1, hour: 10, price: 300, team: true, cap: 24, tags: ['robotics'] },
      { t: 'Line Follower Sprint (School Tier)', c: 'robotics', v: 'Gymnasium Floor A', day: 1, hour: 14, price: 150, cap: 40, tags: ['arduino'] },
      { t: 'MicroMouse Bangladesh', c: 'robotics', v: 'Gymnasium Floor B', day: 2, hour: 9, price: 300, cap: 20, tags: ['arduino', 'iot'] },
      { t: 'Drone Racing Grand Prix', c: 'robotics', v: 'School Field', day: 2, hour: 11, price: 400, cap: 18, tags: ['drone-racing'] },
      { t: 'Build-a-Bot: Arduino Bootcamp', c: 'workshop', v: 'Physics Lab 2', day: 0, hour: 15, price: 200, cap: 30, tags: ['arduino', 'iot'] },
      { t: 'IoT Smart Home Hack', c: 'competition', v: 'Physics Lab 1', day: 1, hour: 9, price: 250, team: true, cap: 24, tags: ['iot'] },
      { t: 'Robo Soccer Junior (Under-16)', c: 'robotics', v: 'Gymnasium Floor A', day: 1, hour: 16, price: 150, cap: 20, tags: ['robotics'] },
      { t: '3D Printing Live Challenge', c: 'competition', v: 'Maker Corner', day: 2, hour: 13, price: 200, cap: 20, tags: ['3d-printing'] },
      { t: 'Automation Idea Pitch', c: 'business', v: 'Seminar Hall A', day: 2, hour: 15, price: 150, cap: 25, tags: ['business-plan'] },
      { t: 'Robot Arm Precision Trial', c: 'robotics', v: 'Maker Corner', day: 0, hour: 11, price: 250, cap: 16, tags: ['robotics', 'arduino'] },
      { t: 'Sensors & Circuits Quiz', c: 'quiz', v: 'Seminar Hall B', day: 1, hour: 11, price: 0, cap: 60, tags: ['quiz'] },
      { t: 'Robotics Career Seminar', c: 'seminar', v: 'Seminar Hall A', day: 2, hour: 16, price: 0, cap: 100, tags: [] },
    ],
  },
  {
    title: 'Shondhani Cultural Utsob 2026',
    tagline: 'An evening-lit celebration of music, stage and canvas',
    description:
      'Our annual cultural festival. Solo and band music battles, group dance, one-act plays, recitation, photography walks and a runway show under the lights of the college quad. Open to participants from every institution.',
    venue: 'College Quad & Auditorium, DRMC',
    startOffsetDays: 29,
    durationDays: 3,
    tags: ['music', 'dance', 'photography', 'theatre'],
    events: [
      { t: 'Gaan Battle: Solo Singing', c: 'music_art', v: 'Main Auditorium', day: 0, hour: 15, price: 150, cap: 40, tags: ['music'] },
      { t: 'Nritya Utsob: Group Dance', c: 'dance', v: 'College Quad Stage', day: 0, hour: 17, price: 300, team: true, cap: 16, tags: ['dance'] },
      { t: 'Abritti: Recitation', c: 'literature', v: 'Seminar Hall B', day: 1, hour: 10, price: 100, cap: 35, tags: ['writing'] },
      { t: 'Open Mic: Poetry & Storytelling', c: 'literature', v: 'Library Lawn', day: 1, hour: 16, price: 0, cap: 50, tags: ['writing'] },
      { t: 'Natok: One-Act Play', c: 'theatre', v: 'Main Auditorium', day: 2, hour: 15, price: 400, team: true, cap: 12, tags: ['theatre'] },
      { t: 'Photography Walk & Contest', c: 'photography', v: 'Campus Grounds (Start: Main Gate)', day: 0, hour: 9, price: 150, cap: 40, tags: ['photography'] },
      { t: 'Short Film Marathon', c: 'film', v: 'Auditorium Media Room', day: 1, hour: 12, price: 300, team: true, cap: 15, tags: ['photography'] },
      { t: 'Live Sketch Duel', c: 'music_art', v: 'Art Room', day: 1, hour: 14, price: 100, cap: 30, tags: ['painting'] },
      { t: 'Fashion Fusion Runway', c: 'fashion', v: 'College Quad Stage', day: 2, hour: 17, price: 250, cap: 24, tags: ['fashion'] },
      { t: 'Band Clash', c: 'music_art', v: 'College Quad Stage', day: 2, hour: 18, price: 500, team: true, cap: 14, tags: ['music'] },
      { t: 'Cosplay Parade', c: 'social', v: 'College Quad', day: 0, hour: 13, price: 0, cap: 60, tags: ['fashion'] },
      { t: 'Food Stall Carnival', c: 'food', v: 'Cafeteria Lane', day: 0, hour: 11, price: 0, cap: 200, tags: ['food-stalls'] },
    ],
  },
  {
    title: 'BizNova Startup Fest 2026',
    tagline: 'From napkin sketch to pitch deck in one weekend',
    description:
      'A business and entrepreneurship festival for student founders. A 48-hour startup sprint, live case competitions, an investor panel and practical workshops on freelancing and personal branding.',
    venue: 'DRMC Seminar Complex',
    startOffsetDays: 43,
    durationDays: 3,
    tags: ['business-plan', 'case-comp', 'hackathon'],
    events: [
      { t: '48-Hour Startup Sprint', c: 'business', v: 'Seminar Hall A', day: 0, hour: 9, price: 400, team: true, cap: 30, tags: ['business-plan', 'hackathon'], seg2: 'Spectator Pass' },
      { t: 'Case Crack: Business Case Competition', c: 'business', v: 'Seminar Hall B', day: 1, hour: 10, price: 200, team: true, cap: 28, tags: ['case-comp'] },
      { t: 'Investor Panel: Meet the Angels', c: 'seminar', v: 'Main Auditorium', day: 1, hour: 15, price: 0, cap: 150, tags: [] },
      { t: 'B-Plan Bootcamp', c: 'workshop', v: 'Seminar Hall B', day: 0, hour: 14, price: 150, cap: 40, tags: ['business-plan'] },
      { t: 'Marketing Maverick Quiz', c: 'quiz', v: 'Seminar Hall A', day: 2, hour: 10, price: 0, cap: 70, tags: ['quiz'] },
      { t: 'Product Demo Arena', c: 'business', v: 'Exhibition Tent', day: 2, hour: 12, price: 250, cap: 20, tags: ['business-plan'] },
      { t: 'Personal Branding Workshop', c: 'workshop', v: 'Seminar Hall B', day: 1, hour: 11, price: 100, cap: 45, tags: [] },
      { t: 'Freelancing 360 Seminar', c: 'seminar', v: 'Main Auditorium', day: 2, hour: 15, price: 0, cap: 120, tags: [] },
    ],
  },
  {
    title: 'Ucchash Sports Mania 2026',
    tagline: 'One campus, every sport, zero excuses',
    description:
      'The inter-department sports carnival of Aurora Campus Council. Football, streetball, badminton, table tennis, chess and the legendary tug of war, held across three packed days.',
    venue: 'DRMC Sports Complex',
    startOffsetDays: -20,
    durationDays: 3,
    tags: ['football', 'basketball', 'badminton', 'chess'],
    events: [
      { t: 'Inter-Department Football Cup', c: 'sports', v: 'School Field', day: 0, hour: 9, price: 0, team: true, cap: 16, tags: ['football'] },
      { t: 'Basketball 3v3 Streetball', c: 'sports', v: 'Basketball Court', day: 1, hour: 10, price: 200, team: true, cap: 20, tags: ['basketball'] },
      { t: 'Badminton Singles & Doubles', c: 'sports', v: 'Indoor Gymnasium', day: 1, hour: 14, price: 150, cap: 32, tags: ['badminton'] },
      { t: 'Table Tennis Open', c: 'sports', v: 'Indoor Gymnasium', day: 2, hour: 10, price: 100, cap: 24, tags: [] },
      { t: 'Chess Masters Open', c: 'competition', v: 'Library Hall', day: 0, hour: 13, price: 100, cap: 40, tags: ['chess'] },
      { t: 'Tug of War Showdown', c: 'sports', v: 'School Field', day: 2, hour: 15, price: 0, team: true, cap: 20, tags: ['fitness'] },
    ],
  },
];

// ---------- tiny REST helpers ----------

const baseHeaders = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

async function req(path, method = 'GET', body, extra = {}) {
  const res = await fetch(`${SUPA}${path}`, {
    method,
    headers: { ...baseHeaders, ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`);
  }
  return json;
}

const select = (table, query) => req(`/rest/v1/${table}?${query}`);
const insert = (table, rows, prefer = 'return=representation') =>
  req(`/rest/v1/${table}`, 'POST', rows, { Prefer: prefer });
const upsert = (table, rows, onConflict) =>
  req(`/rest/v1/${table}${onConflict ? `?on_conflict=${onConflict}` : ''}`, 'POST', rows, { Prefer: 'resolution=merge-duplicates,return=representation' });
const del = (table, query) => req(`/rest/v1/${table}?${query}`, 'DELETE', undefined, { Prefer: 'return=representation' });

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
const suffix = () => Math.random().toString(36).slice(2, 8);

// ---------- auth helpers ----------

async function findAuthUserByEmail(email) {
  const data = await req(`/auth/v1/admin/users?per_page=1000`);
  const users = data?.users ?? [];
  return users.find((u) => (u.email || '').toLowerCase() === email) ?? null;
}

async function ensureAuthUser({ email, password, full_name, role, handle, phone, institution }) {
  const meta = { full_name, role, handle, phone, institution };
  try {
    const created = await req('/auth/v1/admin/users', 'POST', {
      email,
      password,
      email_confirm: true,
      user_metadata: meta,
    });
    console.log(`  created auth user ${email} (${created.id})`);
    return created;
  } catch (e) {
    if (!/already been registered|already exists|422/.test(String(e.message))) throw e;
    const existing = await findAuthUserByEmail(email);
    if (!existing) throw e;
    // Reset the password so the documented demo credentials always work.
    await req(`/auth/v1/admin/users/${existing.id}`, 'PUT', {
      password,
      email_confirm: true,
      user_metadata: meta,
    });
    console.log(`  reused auth user ${email} (${existing.id}), password reset`);
    return existing;
  }
}

// ---------- profile helper ----------

async function uniqueHandle(base, userId) {
  let candidate = base;
  for (let i = 0; i < 5; i++) {
    const hit = await select('profiles', `handle=eq.${encodeURIComponent(candidate)}&select=id&limit=1`);
    if (!hit.length || hit[0].id === userId) return candidate;
    candidate = `${base}-${suffix()}`;
  }
  return `${base}-${Date.now()}`;
}

async function ensureProfile(userId, { full_name, email, phone, role, institution }, handleBase, xp = 0) {
  const handle = await uniqueHandle(handleBase, userId);
  const rows = await upsert('profiles', [{
    id: userId,
    handle,
    full_name,
    email,
    phone,
    role,
    institution,
    onboarded: true,
    xp,
  }]);
  console.log(`  upserted profile ${rows[0].handle} (role=${role})`);
  return rows[0];
}

// ---------- main ----------

async function main() {
  console.log('Seeding ClubOS demo accounts...');

  // 1. Demo organizer
  console.log(`[1/3] Organizer: ${DEMO_ORG.email} / ${DEMO_ORG.password}`);
  const orgUser = await ensureAuthUser({
    email: DEMO_ORG.email,
    password: DEMO_ORG.password,
    full_name: DEMO_ORG.full_name,
    role: 'organizer',
    handle: DEMO_ORG.handle,
    phone: DEMO_ORG.phone,
    institution: DEMO_ORG.institution,
  });
  const orgProfile = await ensureProfile(
    orgUser.id,
    { full_name: DEMO_ORG.full_name, email: DEMO_ORG.email, phone: DEMO_ORG.phone, role: 'organizer', institution: DEMO_ORG.institution },
    DEMO_ORG.handle
  );

  // Organization (upsert by slug via delete-and-recreate is destructive; reuse if present)
  let org = (await select('organizations', `slug=eq.${DEMO_ORG.org.slug}&select=id,name,slug&limit=1`))[0];
  if (!org) {
    org = (await insert('organizations', [{ ...DEMO_ORG.org, created_by: orgProfile.id, is_verified: true }]))[0];
    console.log(`  created organization "${org.name}" (${org.id})`);
  } else {
    console.log(`  reused organization "${org.name}" (${org.id})`);
  }
  await upsert('organization_members', [{ org_id: org.id, user_id: orgProfile.id, role: 'owner' }], 'org_id,user_id');
  console.log('  ensured owner membership');

  // 2. Rebuild demo fests + events + segments
  console.log('[2/3] Fests, events, segments...');
  // Clear previous demo fests (events/segments/registrations cascade via FK).
  const oldFests = await select('fests', `org_id=eq.${org.id}&select=id`);
  if (oldFests.length) {
    await del('fests', `org_id=eq.${org.id}`);
    console.log(`  removed ${oldFests.length} previous demo fest(s)`);
  }

  const allTags = await select('category_tags', 'select=id,slug,name');
  const tagBySlug = Object.fromEntries(allTags.map((t) => [t.slug, t.id]));

  const festIds = [];
  let payIndex = 0;
  const now = Date.now();

  for (const fest of FESTS) {
    const startDate = new Date(now + fest.startOffsetDays * 86400000);
    startDate.setUTCHours(4, 0, 0, 0); // 10:00 AM local (UTC+6)
    const endDate = new Date(startDate.getTime() + fest.durationDays * 86400000 - 3600000);

    const festRow = (
      await insert('fests', [{
        org_id: org.id,
        title: fest.title,
        slug: `${slugify(fest.title)}-${suffix()}`,
        tagline: fest.tagline,
        description: fest.description,
        venue: fest.venue,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        tags: fest.tags,
        is_published: true,
        is_featured: fest === FESTS[0],
        created_by: orgProfile.id,
      }])
    )[0];
    festIds.push(festRow.id);
    console.log(`  fest "${fest.title}" (${fest.events.length} events)`);

    for (const [i, ev] of fest.events.entries()) {
      const evStart = new Date(startDate.getTime() + ev.day * 86400000);
      evStart.setUTCHours(((ev.hour + 6) % 24), 0, 0, 0); // local hour -> UTC (UTC+6)
      const evEnd = new Date(evStart.getTime() + (ev.c === 'competition' || ev.c === 'workshop' ? 4 : 2) * 3600000);
      const opens = new Date(now - 21 * 86400000);
      const deadline = new Date(Math.min(evStart.getTime() - 6 * 3600000, now + 2 * 86400000));

      const segType =
        ev.c === 'workshop' ? 'workshop'
        : ev.c === 'seminar' ? 'seminar'
        : ev.c === 'gaming' ? 'gaming'
        : ev.c === 'social' || ev.c === 'food' ? 'social'
        : 'competition';

      const evRow = (
        await insert('events', [{
          fest_id: festRow.id,
          title: ev.t,
          slug: `${slugify(ev.t)}-${suffix()}`,
          category: ev.c,
          description: `${ev.t} at ${fest.title}. ${ev.team ? 'Team event — register as a team of 2 to 4. ' : 'Individual participation. '}Report to ${ev.v} at least 30 minutes before the scheduled time. Bring your college or university ID card and the registration confirmation.`,
          rules: ev.team
            ? '1. Teams of 2 to 4 members.\n2. All members must be currently enrolled students.\n3. Carry student ID for verification.\n4. Judges decisions are final.'
            : '1. Individual participation only.\n2. Carry your student ID for verification.\n3. Report 30 minutes before start time.\n4. Judges decisions are final.',
          prizes:
            ev.price > 0
              ? 'Champion: BDT 5,000 + crests\nRunners-up: BDT 3,000 + crests\nAll participants get digital certificates.'
              : 'Top performers get crests and digital certificates.',
          venue: `${ev.v}, ${fest.venue}`,
          starts_at: evStart.toISOString(),
          ends_at: evEnd.toISOString(),
          registration_opens_at: opens.toISOString(),
          registration_deadline: deadline.toISOString(),
          capacity: ev.cap,
          waitlist_enabled: true,
          is_team_event: !!ev.team,
          team_min: ev.team ? 2 : 1,
          team_max: ev.team ? 4 : 1,
          is_published: true,
          is_featured: ev.price >= 300,
          xp_reward: ev.price > 0 ? 50 : 25,
          created_by: orgProfile.id,
        }])
      )[0];

      const segRows = [{
        event_id: evRow.id,
        title: ev.team ? 'Team Entry' : 'General Entry',
        description: ev.team ? 'Register your full team under one submission.' : 'Standard participant entry.',
        segment_type: segType,
        max_participants: ev.cap,
        price: ev.price,
        is_free: ev.price === 0,
        instructions:
          ev.price === 0
            ? 'Free entry. Just show your ticket QR at the venue gate.'
            : `Complete the payment using ${PAY_CYCLE[payIndex % PAY_CYCLE.length].startsWith('bkash') ? 'bKash' : 'Nagad'} and submit the transaction ID on the registration page. Payment is verified by the organizers within 24 hours.`,
        is_active: true,
        created_by: orgProfile.id,
      }];
      if (ev.seg2) {
        segRows.push({
          event_id: evRow.id,
          title: ev.seg2,
          description: 'Watch from the stands. No participation rights.',
          segment_type: 'social',
          max_participants: 100,
          price: 0,
          is_free: true,
          instructions: 'Free spectator entry with any event ticket.',
          is_active: true,
          created_by: orgProfile.id,
        });
      }
      const insertedSegs = await insert('segments', segRows);
      const mainSeg = insertedSegs[0];

      // Payment config on paid segments
      if (ev.price > 0) {
        const method = PAY_CYCLE[payIndex % PAY_CYCLE.length];
        payIndex++;
        const number = MERCHANT_NUMBERS[method];
        const label = method.startsWith('bkash') ? 'bKash' : 'Nagad';
        const kind = method.endsWith('send_money') ? 'Send Money' : 'Pay Bill';
        const info = method.endsWith('send_money')
          ? JSON.stringify({ number, type: kind, wallet: label, reference: `AUR-${String(i + 1).padStart(3, '0')}`, note: `${label} ${kind} to ${number} (Personal). Use reference AUR-${String(i + 1).padStart(3, '0')} and keep the transaction ID.` })
          : JSON.stringify({ number, type: kind, wallet: label, merchant: DEMO_ORG.org.name, note: `${label} ${kind} to merchant ${number} (${DEMO_ORG.org.name}). Keep the transaction ID.` });
        await req(`/rest/v1/segments?id=eq.${mainSeg.id}`, 'PATCH', { payment_method: method, payment_info: info });
      }

      // event_tags
      const tagIds = (ev.tags ?? []).map((s) => tagBySlug[s]).filter(Boolean);
      if (tagIds.length) {
        await insert('event_tags', tagIds.map((tag_id) => ({ event_id: evRow.id, tag_id })), 'return=minimal');
      }
    }
  }

  const [f1, f2, f3] = festIds;
  const f1Events = await select('events', `fest_id=eq.${f1}&select=id,title,slug&order=created_at.asc`);
  const f2Events = await select('events', `fest_id=eq.${f2}&select=id,title,slug&order=created_at.asc`);
  const f3Events = await select('events', `fest_id=eq.${f3}&select=id,title,slug&order=created_at.asc`);

  // 3. Demo participant + registrations across 3 of the organizer's fests
  console.log(`[3/3] Participant: ${DEMO_PARTICIPANT.email} / ${DEMO_PARTICIPANT.password}`);
  const partUser = await ensureAuthUser({
    email: DEMO_PARTICIPANT.email,
    password: DEMO_PARTICIPANT.password,
    full_name: DEMO_PARTICIPANT.full_name,
    role: 'participant',
    handle: DEMO_PARTICIPANT.handle,
    phone: DEMO_PARTICIPANT.phone,
    institution: DEMO_PARTICIPANT.institution,
  });
  const partProfile = await ensureProfile(
    partUser.id,
    { full_name: DEMO_PARTICIPANT.full_name, email: DEMO_PARTICIPANT.email, phone: DEMO_PARTICIPANT.phone, role: 'participant', institution: DEMO_PARTICIPANT.institution },
    DEMO_PARTICIPANT.handle,
    120
  );

  // Clear the participant's previous demo registrations
  await del('registrations', `user_id=eq.${partProfile.id}`);

  async function register({ eventId, segIndex = 0, status, payment = null, teamName = null }) {
    const segs = await select('segments', `event_id=eq.${eventId}&select=id,title,price,is_free,payment_method,payment_info&order=created_at.asc`);
    const seg = segs[segIndex];
    const regRow = (
      await insert('registrations', [{
        event_id: eventId,
        user_id: partProfile.id,
        status,
        team_name: teamName,
        total_price: seg.price,
        payment_status: payment ? payment.payment_status : (seg.is_free ? null : 'pending'),
        payment_method: payment?.payment_method ?? null,
        transaction_id: payment?.transaction_id ?? null,
        transaction_mobile: payment?.transaction_mobile ?? null,
        is_verified: payment?.is_verified ?? false,
        verified_at: payment?.is_verified ? new Date(now - 2 * 86400000).toISOString() : null,
        verified_by: payment?.is_verified ? orgProfile.id : null,
      }])
    )[0];
    await insert('registration_segments', [{
      registration_id: regRow.id,
      segment_id: seg.id,
      price_paid: seg.price,
      status: payment?.is_verified ? 'paid' : payment ? 'pending' : 'selected',
    }], 'return=minimal');
    console.log(`  registered "${seg.title}" -> status=${status}${payment ? ', payment=' + payment.payment_status : ''}`);
    return regRow;
  }

  // Fest 1: free workshop (confirmed) + paid AI contest (paid, awaiting organizer verification)
  const freeWorkshop = f1Events.find((e) => e.title === 'Prompt Engineering Workshop') ?? f1Events[1];
  const paidAi = f1Events.find((e) => e.title === 'AI Model Showdown') ?? f1Events[2];
  await register({ eventId: freeWorkshop.id, status: 'confirmed' });
  await register({
    eventId: paidAi.id,
    status: 'pending',
    payment: {
      payment_status: 'paid',
      payment_method: 'bkash_send_money',
      transaction_id: 'TRX8H2K9Q1P4',
      transaction_mobile: '01855-401237',
      is_verified: false,
    },
  });

  // Fest 2: paid Arduino bootcamp (verified by organizer -> confirmed)
  const arduino = f2Events.find((e) => e.title === 'Build-a-Bot: Arduino Bootcamp') ?? f2Events[0];
  await register({
    eventId: arduino.id,
    status: 'confirmed',
    payment: {
      payment_status: 'verified',
      payment_method: 'nagad_send_money',
      transaction_id: 'NAG7X1M4Z8Q2',
      transaction_mobile: '01855-401237',
      is_verified: true,
    },
  });

  // Fest 3: free open mic (pending)
  const openMic = f3Events.find((e) => e.title === 'Open Mic: Poetry & Storytelling') ?? f3Events[0];
  await register({ eventId: openMic.id, status: 'pending' });

  // Summary
  const festCount = (await select('fests', `org_id=eq.${org.id}&select=id`)).length;
  const evCount = (await select('events', `fest_id=in.(${festIds.join(',')})&select=id`)).length;
  console.log('\nDone. Demo data summary:');
  console.log(`  organizer : ${DEMO_ORG.email} / ${DEMO_ORG.password}  (org: ${org.name})`);
  console.log(`  participant: ${DEMO_PARTICIPANT.email} / ${DEMO_PARTICIPANT.password}`);
  console.log(`  fests: ${festCount}, events: ${evCount}, registrations: 4 (across 3 fests)`);
}

main().catch((e) => {
  console.error('\nSeed failed:', e.message, '\n', e.stack);
  process.exit(1);
});
