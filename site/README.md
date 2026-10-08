# ClubOS Site — Technical Documentation

Technical overview of the Next.js application in this directory: architecture, routing, data model, backend functions (Postgres RPCs and triggers), security model, and the demo dataset seeder. For the high-level project story, see the root [README](../README.md).

## 1. Stack and Runtime

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16, App Router, React 19, TypeScript (strict) |
| Data / Auth / Storage | Supabase (PostgreSQL + RLS, GoTrue auth, Storage) |
| Styling | Tailwind CSS v4, CSS custom-property design tokens (`src/app/globals.css`) |
| Client state | React hooks only; no global store |
| Email | Resend HTTP API, server-side only (`src/app/api/notifications/email/route.ts`) |
| QR / check-in | `qrcode.react`, HMAC SHA-256 rotating codes (`src/lib/qr.ts`) |

There is no custom Node server: every page is either a client component talking to Supabase directly through `@supabase/ssr` browser clients, or a server component reading via the SSR client. The only server-side endpoints are the two API routes under `src/app/api/`.

## 2. Directory Map

```
site/
  SQL/                    Postgres schema, functions, triggers, policies (run order: 01 -> 06)
  scripts/seed-demo.mjs   Demo account + dataset seeder (service-role key, idempotent)
  src/
    app/                  App Router pages and API routes (see section 3)
    components/
      layout/             Navbar (role-aware nav links, mobile menu, bottom tabs), Footer
      ui/                 Button, Card, Input, Badge, Eyebrow, ImageCropUpload, ...
    lib/
      supabase/           Browser + server Supabase clients
      profile.ts          ensureProfile() self-heal for missing profile rows
      qr.ts               HMAC check-in code generation/verification
      xp.ts, dates.ts     XP helpers, relative-time formatting
      email.ts            Server-side Resend sender + email audit insert
      types.ts            Generated-shaped DB types (profiles, fests, events, segments, ...)
```

## 3. Routes

### Public

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/fests`, `/fests/[slug]` | Fest directory (Ongoing / Upcoming / Past groups, URL-shared filters) and fest detail |
| `/events`, `/events/[slug]` | Event directory and event detail with segment pricing and payment instructions |
| `/events/[slug]/register` | Registration: segment selection, team fields, free submit or bKash/Nagad transaction submission |
| `/login`, `/signup` | Auth pages. Login includes the Demo Mode one-click buttons (`DEMO_ACCOUNTS`) |
| `/leaderboard` | XP leaderboard |
| `/u/[handle]` | Public participant profile |

### Participant (auth)

| Route | Purpose |
| --- | --- |
| `/passport` | Passport card, stamps, XP, badges |
| `/passport/fests/[slug]` | Per-fest progress |
| `/dashboard`, `/notifications`, `/account` | Registrations, in-app notifications, profile editing |

### Organizer (auth, role-gated client-side + RLS server-side)

| Route | Purpose |
| --- | --- |
| `/organizer` | KPI dashboard, registration trends, recent activity |
| `/manage` | Organization + fest list |
| `/manage/organization/create` | Create organization |
| `/manage/fest/create`, `/manage/fest/[id]`, `/manage/fest/[id]/edit` | Fest create/manage/edit (cover crop-upload, tags, publish toggle) |
| `/manage/event/create`, `/manage/event/[id]/edit` | Event create/edit with segment builder (price, `payment_method` bKash/Nagad Send Money/Pay Bill, payment info) |
| `/organizer/events/[id]/participants` | Registrations table: verify/decline payments, waitlist promote, CSV export |
| `/organizer/events/[id]/qr` | Fullscreen projector mode, HMAC rotating QR |
| `/organizer/check-in`, `/scan` | Check-in desk and camera ticket scanner |

### API routes

| Route | Purpose |
| --- | --- |
| `POST /api/notifications/email` | Server-side Resend send; writes to `email_notifications` audit table. `RESEND_API_KEY` never reaches the browser |
| `GET/POST /api/test-email` | Dev-only email smoke test |

## 4. Data Model

Full definitions in `SQL/01_schema.sql`. Core chain:

```
profiles (id = auth.users.id, handle UNIQUE, role participant|organizer|admin)
organizations (slug UNIQUE, created_by)
organization_members (org_id, user_id, role owner|admin|member)
category_tags (name, slug, category_type)
fests (org_id, slug UNIQUE, start_date, end_date, tags TEXT[], is_published)
events (fest_id, slug UNIQUE, category event_category, starts_at,
        registration_opens_at, registration_deadline, capacity,
        is_team_event team_min/team_max, is_published, checkin_token)
event_tags (event_id, tag_id)
segments (event_id, segment_type, price, is_free,
          payment_method bkash|nagad x send_money|pay_bill, payment_info JSON)
registrations (event_id, user_id, UNIQUE(event_id, user_id),
               status pending|confirmed|waitlisted|cancelled|rejected|checked_in,
               total_price, payment_status, payment_method,
               transaction_id, transaction_mobile, is_verified, verified_by)
registration_segments (registration_id, segment_id, price_paid, status)
notifications, email_notifications, activity_log, announcements
stamps, xp_ledger, badges, user_badges, connections, feedback   -- passport (03_passport.sql)
```

### Enums (Postgres)

- `user_role`: participant, organizer, admin
- `reg_status`: pending, confirmed, waitlisted, cancelled, rejected, checked_in
- `event_category`: competition, workshop, seminar, gaming, robotics, quiz, social, science_technology, music_art, literature, sports, business, health, fashion, photography, film, theatre, dance, food, other
- `payment_method`: bkash_send_money, bkash_pay_bill, nagad_send_money, nagad_pay_bill
- `payment_status`: pending, paid, verified, declined, refunded
- `segment_type`: workshop, competition, seminar, gaming, social, other

## 5. Backend Functions (Postgres)

`SQL/02_functions.sql` and `03_passport.sql` define the server-side logic. These run inside Postgres, triggered by data changes or called as RPCs from the app:

| Function / trigger | What it does |
| --- | --- |
| `handle_new_user()` (05) | Trigger on `auth.users` insert: creates the matching `profiles` row with race-safe unique handle generation from user metadata |
| Waitlist auto-promotion | On confirmed-count decrease (cancellation/decline), atomically promotes the lowest `waitlist_position` registration to `confirmed` and inserts a notification. Uses row locking so two concurrent promotions cannot double-allocate a seat |
| `award_badges()` (03) | Recomputes badge eligibility (First Stamp, Collector, Regular, Multi-Fest Explorer, Social Butterfly, Connector, Reviewer) from stamps/connections and writes `user_badges` |
| XP ledger (03) | Every XP grant is an append to `xp_ledger`; profile `xp` totals it. Stamps awarded on check-in (event + first fest stamp) |
| Check-in RPC | Verifies ticket code / HMAC check-in token and flips registration to `checked_in`, records `checked_in_at`, grants XP + stamp |
| `is_org_member(org_id)` (06) | `SECURITY DEFINER` helper that lets RLS policies on `fests`/`events`/`organization_members` check membership without infinite recursion on the policies themselves |
| Notification triggers (04) | Insert into `notifications` on: new registration (to organizers), payment verified/declined, waitlist promotion, new fest published (to followers) |

## 6. Security Model

- Row Level Security is enabled on every table. Published fests/events are readable by `anon`; writes are gated by org membership through `is_org_member()`.
- Participants can read/write only their own registrations; organizers can read all registrations for events their org owns and update payment verification fields.
- Storage buckets: `avatars` (policies in 05) and `covers` (policies in 06), both path-scoped to `userId/*` so users can only upload into their own folder.
- The service role key is used only in `scripts/seed-demo.mjs` and server-side API routes; the browser uses the anon key exclusively.
- Check-in QR codes are HMAC-signed with `CHECKIN_HMAC_SECRET` and rotate every 30 seconds to prevent screenshot sharing.

## 7. Auth Flow and Profile Self-Heal

1. `/signup` is a single-page form: role cards, full name, email, phone, avatar crop-upload, password, one Create Account action. Profile row is upserted with the chosen role immediately after `signUp` succeeds (no confirmation step required).
2. If email confirmation is enabled server-side and no session is returned, the user is redirected to `/login?notice=...` with instructions.
3. `/login` signs in via `signInWithPassword`, then calls `ensureProfile()` (`src/lib/profile.ts`) before routing. `ensureProfile` recreates a missing `profiles` row from auth metadata — this self-heals accounts whose trigger insert failed on older/broken setups — and returns a typed result distinguishing real errors from the `DB_SETUP_HINT` (schema not yet run).
4. After sign-in, routing is role-based: organizers go to `/organizer`, participants to `/events`. `ensureProfile` is also called from `/organizer` and `/passport` entry points.
5. Login page additionally exposes `DEMO_ACCOUNTS`: one-click sign-in as the seeded demo organizer or demo participant.

## 8. Demo Dataset Seeder

`scripts/seed-demo.mjs` provisions the judge-facing demo using the service role key (reads `site/.env.local`; never prints key values):

- Creates (or reuses and password-resets) two real Supabase auth users:
  - `demo.organizer@clubos.app` / `AuroraDemo2026!` — organizer profile, organization "Aurora Campus Council", owner membership.
  - `demo.participant@clubos.app` / `PassportDemo2026!` — participant profile with starter XP.
- Builds 5 published fests with 6 to 20 published events each (60 total): Aurora Tech Carnival (20), RoboRumble Bangladesh (14), Shondhani Cultural Utsob (12), BizNova Startup Fest (8), Ucchash Sports Mania (6). Dates are computed relative to the current date so there is always an ongoing, upcoming, and past fest.
- Every event has segments; paid segments cycle through all four payment methods (bKash/Nagad, Send Money/Pay Bill) with realistic wallet numbers and instructions; several events also carry a free Spectator Pass segment. Events and fests get category tags from `category_tags`.
- Registers the demo participant in 4 events across 3 of the organizer's fests: free confirmed, paid pending (bKash transaction submitted, awaiting organizer verification), paid verified (Nagad, confirmed by organizer), free pending.
- Idempotent: re-running reuses the auth users and org, deletes only the demo org's fests (events/segments/registrations cascade via FK) and the demo participant's registrations, then rebuilds. It never touches data owned by other users.

Run: `node scripts/seed-demo.mjs` (from `site/`).

## 9. Local Development and Verification

```
npm install
npm run dev        # http://localhost:3000
npx tsc --noEmit   # typecheck
npx eslint src     # lint
npm run build      # production build
npx playwright test --project=chromium   # e2e (needs dev server on :3000)
```

Signup e2e specs live in `playwright/signup.spec.ts`; they cover the single-page signup with role selection, validation errors, and advancing to profile completion.

## 10. Deployment

Deployed on Vercel: https://club-os-solez.vercel.app. Environment variables required in Vercel Project Settings: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `CHECKIN_HMAC_SECRET`, and optionally `RESEND_API_KEY` + `EMAIL_FROM_ADDRESS`.
