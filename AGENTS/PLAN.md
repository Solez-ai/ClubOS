# PLAN.md — "ClubOS": Smart Club Operations Ecosystem

> **Mission:** Win the 9th DRMC International Tech Carnival 2026 — AI Web Development Contest (theme: Smart Club Operations).
> **Deadline:** Oct 9, 2026, 11:59 PM (Asia/Dhaka). Deploy early, keep production healthy, never leave submission to the last hour.
> **Stack:** Next.js (App Router, TypeScript) + Supabase (Postgres, Auth, Realtime, Storage) + Vercel + GitHub.
> **Read first:** `DESIGN.md` is the single source of truth for all visuals ("Quiet Luxury": warm black/ivory, brass accent, serif headings, hairlines, slow motion). **Never use purple/gradients/glow/glass.** If this file and DESIGN.md disagree on visuals, DESIGN.md wins.

You are Claude Code. Read PLAN.md and DESIGN.md fully before writing code. Work in the order of §13. Commit after every working feature. **A working, deployed, seeded app beats a half-built ambitious one.** If time runs short, cut from §7 extras, never from §5 (core) or §6 (passport ecosystem).

---

## 0. How we win

Judging is 120 pts + 30 bonus.

| Section | Pts | What judges check | Specs |
|---|---|---|---|
| Fest Directory | 30 | upcoming fests, useful cards, search, categories/filters, event page with deadline/capacity, UX/responsive | §5.1–5.2 |
| Registration | 30 | register, form works, confirmation, limits/deadlines, view/manage registration | §5.3–5.6 |
| Organizer | 30 | dashboard, view participants, search/filter, manage status, stats/tools | §5.7–5.13 |
| Bonus | 30 | creativity | §6 Passport ecosystem + §7 extras |

**Our differentiator: the Participant Passport.** Participants own a digital passport, scan QR codes at venues to collect stamps, earn XP and badges, manage every fest from one place. Competitors will have forms; we have an ecosystem.

Hard requirements (disqualification risk): public GitHub repo, **MIT LICENSE**, live deployment URL, pre-seeded sample data, fully responsive, README with required sections, development AI tools disclosed. **No AI features inside the app.**

---

## 1. Concept and hierarchy

`Organization → Fest → Event → Registration` and, on the participant side, `Participant → Passport → Stamps / Badges / XP / Connections`.

Seed organization: **DRMC IT Club** with fests "Tech Carnival 2026" (AI Web Development Contest, Programming Contest, Robotics Challenge, Gaming Tournament), "Winter Tech Fest 2026" (Hackathon, Workshop, Tech Quiz), "Freshers Tech Fest 2027" (Coding Challenge, AI Workshop), exactly as in the rulebook example, plus a few extra events for variety.

Tagline: *"One passport for every fest."* Voice: short, confident, understated (see DESIGN.md §12).

## 2. Roles and permissions

| Capability | Visitor | Participant | Organizer | Admin |
|---|---|---|---|---|
| Browse fests/events/orgs, leaderboard, public passports | ✔ | ✔ | ✔ | ✔ |
| Register, cancel, bookmark, scan, connect, edit own passport | ✖ | ✔ | ✔ | ✔ |
| Create/edit fests & events of own org | ✖ | ✖ | ✔ | ✔ |
| View/manage participants of own org's events | ✖ | ✖ | ✔ | ✔ |
| Post announcements, award badges, show venue QR | ✖ | ✖ | ✔ | ✔ |
| Manage orgs and members | ✖ | ✖ | ✖ | ✔ |

An organizer is a user with `profiles.role in ('organizer','admin')` AND a row in `org_members` for the org. Organizers also have a passport and can use participant features.

## 3. Tech and libraries

Next.js 15 App Router, TypeScript strict, Server Components + Server Actions, route handlers for exports. Tailwind + restyled **shadcn/ui** (Radix) per DESIGN.md. `lucide-react`, `motion`, `@supabase/ssr` + `supabase-js`, `zod`, `react-hook-form`, `sonner`, `cmdk`, `recharts`, `qrcode.react`, `html5-qrcode` (or `@yudiel/react-qr-scanner`), `date-fns` + `date-fns-tz` (always render Asia/Dhaka), `ics`, `next-themes`, `html-to-image`, `@react-pdf/renderer` (certificates). Resend email optional; never block core flows on it.

Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `NEXT_PUBLIC_SITE_URL`, `CHECKIN_HMAC_SECRET`, optional `RESEND_API_KEY`. Commit `.env.example`, never `.env.local`.

---

## 4. Registration status model (used everywhere)

States: `pending`, `confirmed`, `waitlisted`, `checked_in`, `cancelled`, `rejected`.

| From | To | Triggered by | Side effects |
|---|---|---|---|
| (new) | `confirmed` | participant registers, seat available, no approval needed | notify, +10 XP, activity log |
| (new) | `pending` | participant registers, event `requires_approval` | notify organizer feed |
| (new) | `waitlisted` | event full and waitlist enabled | assign `waitlist_position` |
| `pending` | `confirmed` / `rejected` | organizer approves / rejects | notify participant |
| `waitlisted` | `confirmed` | auto-promotion when a seat frees (lowest position first) | notify participant (realtime toast) |
| `confirmed` | `checked_in` | scan (self or organizer) or manual | stamp + XP (see §6.4) |
| `confirmed`/`pending`/`waitlisted` | `cancelled` | participant cancels before event start, or organizer cancels | frees seat → promotion |
| any active | `rejected` | organizer | frees seat → promotion |
| `cancelled` | any new state | participant re-registers | **reuse the same row** (unique on event+user) and re-run the registration rules |

Active seats = `confirmed`, `pending`, `checked_in`. Waitlisted and cancelled/rejected do not consume seats.

---

## 5. Core features — what each does and how it behaves

### 5.1 Fest Directory — `/fests`, `/fests/[slug]`, `/orgs/[slug]`
**Purpose:** let anyone discover what an organization is running.
- **Fest list:** cards grouped into *Ongoing*, *Upcoming*, *Past* (computed from start/end dates). Each card shows cover, title, date range, venue, number of events, number of participants, and a status pill ("Registration open" if any event is open).
- **Fest page:** cover banner, tagline, description, schedule timeline (events ordered by start), event list with the same filters as §5.2 scoped to the fest, live countdown to start, announcements feed, mini leaderboard (top 5 XP in this fest), and a "Your progress" strip if the viewer is logged in and has registrations (links to their Fest Pass).
- **Org page:** logo, description, its fests, **Follow** button. Following creates a row in `org_follows`; new fests from followed orgs generate a notification.
- **Edge cases:** unpublished fests are hidden from the public; fest with zero events shows an empty state; past fests show "Ended" and disable registration buttons.
- **Acceptance:** all seeded fests appear in the right sections; opening a fest shows its events.

### 5.2 Event Directory and Event Page — `/events`, `/events/[slug]`
**Directory behavior:**
- **Search:** debounced 300ms, matches title, description, tags, fest name (Postgres `ilike` or `tsvector`).
- **Filters:** category chips (multi-select), fest, status (Open / Closing soon <48h / Full / Closed), date range, free vs paid, solo vs team. **Sort:** Soonest, Deadline, Most popular (registered_count), Newest. All filter state lives in URL query params so results are shareable and survive refresh.
- **Layout:** sticky left filter column on desktop, bottom-sheet on mobile, result count in mono, skeleton while loading, empty state with a "Clear filters" link.
- **Event card shows:** cover, category, fest name, title, date/time, venue, deadline ("Closes in 2d 4h"), capacity meter ("34 / 50 · 16 left"), status pill, XP reward, bookmark toggle.

**Event page shows:** treated cover, title, fest link, description, rules, prizes, date/time, venue (with map link), registration info (opens at, deadline with live countdown, capacity ring, fee, team size rules, requires approval note), organizer, related events (same fest or category), **Add to calendar** (`/api/ics/[eventId]` + Google Calendar link), share (copy link / native share).
**Registration card (sticky):** the primary button changes with state:
- Logged out → "Sign in to register".
- Open → "Register".
- Already registered → shows status pill and "Manage in passport".
- Full + waitlist → "Join waitlist".
- Full, no waitlist → disabled "Event full".
- Before opening → disabled "Opens {date}".
- After deadline or event ended → disabled "Registration closed".
Capacity and counts update live via Realtime (or 15s polling fallback).
**Acceptance:** each state above renders correctly for seeded events (open, closing soon, full+waitlist, past).

### 5.3 Authentication and Onboarding — `/login`, `/signup`, `/onboarding`
- **Sign up:** email + password (+ Google OAuth if time). A database trigger creates `profiles` with a generated unique `handle` (from name/email) and `passport_no` (`CL-2026-000123`).
- **Login:** email + password; demo buttons "Continue as demo participant" and "Continue as demo organizer" fill and submit seeded credentials. Return-to-page support (`?next=`).
- **Onboarding wizard (3 steps):** (1) full name + handle (live availability check), (2) institution, student ID, phone, (3) interests (multi-chip) + avatar upload. Finish → "Your passport is ready" reveal (passport card prints in, number counts up, +50 XP welcome stamp). `onboarded=true` set at the end; unfinished users are redirected back to `/onboarding` from protected pages.
- **Edge cases:** duplicate email, weak password, handle collision, expired session → friendly inline errors and toasts.

### 5.4 Registration — `/events/[slug]/register`
**Flow:** click Register → form (drawer on mobile, page on desktop) → submit → confirmation page.
- **Form content:** prefilled profile fields (name, email, phone, institution, student ID — editable), dynamic **custom fields** defined by the organizer (text, textarea, select, multi-select, checkbox, number, date), team block if team event (team name, members by handle/email, min/max enforced, leader = registrant), terms checkbox.
- **Validation:** zod schema generated from `custom_fields` + base fields; inline errors; submit disabled while pending; double-submit prevented.
- **Server rules (inside `register_for_event`, §9):** published, window open, not already active-registered, capacity/waitlist logic under a row lock so two people can never take the last seat.
- **Outcomes:** `confirmed`, `pending`, or `waitlisted #N`; each has its own confirmation wording. Errors (`event_full`, `deadline_passed`, `not_open_yet`, `already_registered`) show clear messages.
- **Confirmation page:** brass check draws itself, ticket slides up with QR (encodes ticket code), event details, buttons: Add to calendar, Download ticket (PNG), View in passport. Waitlisted/pending tickets show a muted "Not yet valid" state with no scannable QR.

### 5.5 Limits and deadlines
- Enforced in **both** UI (disabled states, countdowns) and DB function (authoritative).
- Deadline countdown ticks live; at expiry the UI flips to "Registration closed" without reload.
- Capacity meter turns warning color at ≥ 85% full; "Closing soon" pill when deadline < 48h.

### 5.6 View and manage registrations (inside the Passport, §6.3)
- Tabs: Upcoming, Waitlisted, Past, Cancelled; plus Bookmarks.
- Per registration: status pill, ticket QR modal, **Cancel** (confirmation dialog explaining the seat is released; only before event start), **Edit answers** (only before deadline), add to calendar, link to the event.
- **Clash detection:** if two active registrations overlap in time, show a warning banner on both with a link to compare.
- Cancelling triggers waitlist promotion for that event.

### 5.7 Organizer Dashboard — `/organizer`
- KPI strip with count-up: total registrations, confirmed, waitlisted, pending approvals, check-in rate, average fill rate.
- Charts: registrations over time (line, last 14 days), status split (donut), fill rate per event (horizontal bars), category split.
- **Live activity feed** (Realtime on `activity_log`): "Rahim registered for Hackathon · 2s ago", check-ins, cancellations, promotions.
- Panels: closing deadlines (next 7 days), events needing approval (pending count with quick link), recent announcements, quick actions (New event, New fest, Open scanner, Show venue QR).
- Filter by fest via a dropdown at the top.

### 5.8 Fest and Event management (CRUD)
- **Fest form:** title, slug (auto, editable), tagline, description, dates, venue, cover upload (Supabase Storage, 5MB, jpg/png/webp), publish toggle. Delete requires typing the title; deleting cascades.
- **Event form:** all event fields, including category, rules, prizes, start/end, registration open + deadline (validated: opens < deadline ≤ start), capacity (blank = unlimited), waitlist toggle, approval toggle, team settings, fee (display only), XP reward, tags, cover upload, publish toggle.
- **Custom field builder:** add/reorder (drag) fields of types text, textarea, select, multi-select, checkbox, number, date; set label, key, required, options, help text. Live preview of the participant form beside the builder.
- **Live card preview:** the event card re-renders as the organizer types.
- **Duplicate event:** copies everything except registrations; resets dates/tokens.
- **Safety:** editing capacity below current active count is blocked with an explanation; unpublishing keeps registrations; changing deadline notifies registered users.

### 5.9 Participant management — `/organizer/events/[id]/participants`
- **Table columns:** avatar + name, handle, institution, student ID, contact, status pill, registered at, ticket code, passport level, team name, check-in time.
- **Search:** name, email, handle, student ID, institution, ticket code (debounced). **Filters:** status (multi), checked-in yes/no, institution, registered date range. **Sort** by any column. Pagination (25/50/100). Column visibility toggle. Saved in URL params.
- **Row actions:** change status (only legal transitions from §4), add organizer note, open **side drawer** with all answers, team members, history timeline, and contact buttons.
- **Bulk actions** (select rows or "select all matching filter"): Approve, Reject, Confirm, Move to waitlist, Cancel, Mark checked-in, Send announcement to selected. Each shows a confirmation dialog with count; partial failures are reported per row.
- Every status change writes `activity_log`, triggers waitlist promotion if a seat frees, and sends the participant a notification.

### 5.10 Statistics and tools
- **Stats page** per event and per fest: registrations per day, status breakdown, fill rate, check-in timeline (per 10 minutes), institution distribution, no-show rate, answer breakdowns for select/multi-select fields (e.g. T-shirt sizes), team vs solo.
- **CSV export** (`/api/export/[eventId]`): respects current filters, includes custom field answers as columns, UTF-8 BOM so Excel opens Bangla names correctly.
- **Print-ready attendee list** (clean print stylesheet, signature column).
- **Announcements:** organizer writes title + body, targets a fest or event (all registered users, or filtered by status). Appears on the page and creates a notification for each recipient.

### 5.11 Venue tools (organizer)
- **Live venue QR — `/organizer/events/[id]/qr`:** fullscreen projector mode with the event title, a big QR that **rotates every 30s** (HMAC-signed, valid ~60s) and a live "checked in: 42 / 87" counter that updates in real time. Toggle to **Printable poster** with a static QR for the entrance.
- **Attendee ticket scanner — `/organizer/check-in`:** camera scanner for participants' ticket QR codes (fallback for people without the app flow), manual code entry, result card (name, status, team), one-tap override for edge cases, running check-in counter. Audible-free, visual feedback only (see DESIGN.md).

### 5.12 Notifications — bell in navbar + `/notifications`
Realtime list with unread badge and "mark all read". Triggers: registration confirmed/pending/waitlisted, approved/rejected, **promoted from waitlist**, event deadline changed, new announcement, new fest from followed org, check-in success, badge earned, level up, new connection, certificate available, 24h and 1h event reminders (via scheduled Supabase cron / Vercel cron route).

### 5.13 Discovery and utility
- **Command palette (Ctrl/Cmd+K):** search fests, events, people (public passports), jump to pages, toggle theme.
- **Bookmarks:** heart/bookmark on cards, listed in passport.
- **Theme toggle** (dark default, light supported), remembered per device.

---

## 6. Participant Passport Ecosystem (the differentiator)

### 6.1 Identity — what the passport is
Every user has: `passport_no`, `handle`, photo, institution, interests, `xp`, derived **level** and **title**, a personal **passport QR** (encodes a short code that resolves to the handle), a privacy toggle (`passport_public`), and a public page `/u/[handle]`.
**Levels:** `level = floor(sqrt(xp / 50)) + 1` → Level II at 50 XP, III at 200, IV at 450, V at 800, VI at 1,250. **Titles:** I–II Newcomer, III–IV Explorer, V–VI Regular, VII–IX Veteran, X+ Legend. Level displays as a Roman numeral (DESIGN.md §10).

### 6.2 XP rules (single table, enforced in DB functions)
| Action | XP | Limits |
|---|---|---|
| Finish onboarding | +50 | once |
| Register for an event | +10 | once per event; revoked if cancelled |
| Check in to an event (scan or organizer) | + `event.xp_reward` (default 100) | once per event |
| Fest entry stamp | +25 | once per fest |
| New connection | +15 | max 5 connection-XP awards per day; no self-connect |
| Submit event feedback | +20 | once per attended event |
| Earn a badge | + badge `xp_reward` | once per badge |
All grants are recorded in `xp_ledger` (reason + reference) so totals can be audited and recomputed.

### 6.3 Passport home — `/passport`
- **Header:** the passport card (flip front/back, see DESIGN.md §10), XP progress to next level, buttons: Share (copy link / native share), Download as image, Edit profile, privacy toggle.
- **Tab: My Fests** — every fest in which the user has ≥ 1 active registration. Card shows cover, title, progress ("3 of 5 events attended" with a thin brass bar), next upcoming event with countdown, status summary. Click → Fest Pass.
- **Tab: Stamps** — grid grouped by fest; earned stamps inked, unearned dashed slots with event names. Tapping a stamp opens details (event, date, XP).
- **Tab: Badges** — all badges; earned vs locked with "how to earn"; earned date; featured badge picker (3 shown on public passport).
- **Tab: Tickets & Registrations** — §5.6.
- **Tab: Certificates** — one per attended event (and one per completed fest); download PDF; each has a unique code and a public verify page.
- **Tab: Connections** — people met, with where/when, link to their public passport; remove option.
- **Tab: Activity** — reverse-chronological timeline (registered, promoted, checked in, stamp earned, badge, level up, connection).

### 6.4 Fest Pass — `/passport/fests/[slug]` (manage a fest you're in)
- Hero: fest cover, title, progress ring (attended / registered), rank on the fest leaderboard.
- **My agenda:** registered events in chronological order grouped by day, venue, time, status, clash warnings, quick actions (ticket QR, cancel, calendar).
- **Stamps in this fest** (slots for events I'm registered in) and fest-entry stamp.
- **Announcements** feed for this fest and its events.
- **Leaderboard** (fest-scoped XP) with my row pinned.
- **Discover more:** other open events in this fest with one-tap register.
- **Completion:** when attended all registered events (min 3), unlock "Fest Finisher" badge + fest certificate.

### 6.5 Participant QR Scanner — `/scan` (center button in mobile nav)
**Purpose:** collect stamps, check in, and connect with people using the phone camera inside the web app.
- **UI:** full-screen camera, corner brackets, torch toggle (if supported), "Enter code manually", permission-denied help screen (explains how to allow camera on iOS/Android), works over HTTPS only.
- **Three QR kinds** (payload is a URL `https://site/scan?t=<token>` or `https://site/u/<handle>`; parser detects the kind):
  1. **Event venue QR** → `check_in_with_token`. Success: stamp lands, "+100 XP", XP bar animates, any new badge/level-up shown, then event info. Registration becomes `checked_in`.
  2. **Fest entry QR** → fest stamp (+25 XP) if the user has ≥ 1 active registration in that fest.
  3. **Another participant's passport QR** → preview of their public passport + "Connect" button → `connect_with_passport` (+15 XP each, both notified).
- **Error screens (each with a clear action):** `not_logged_in` (login then return), `not_registered` (button: Register), `status_not_valid` (pending/waitlisted: explains), `too_early` / `too_late` (shows allowed window), `already_checked_in` (shows time), `code_expired` (rotating QR: "Ask the organizer to refresh"), `invalid_token`, `self_connect`.
- **Deep link:** scanning with the native camera opens `/scan?t=...`; if logged out, login then continue automatically.
- **Check-in window:** from `starts_at - 60min` to `ends_at` (or `starts_at + 6h` if no end).

### 6.6 Badges (defined in `badges` table, evaluated by `award_badges`)
| Badge | Rule | Rarity (rings) |
|---|---|---|
| First Stamp | first stamp earned | common (1) |
| Collector | 5 stamps | uncommon (2) |
| Regular | 15 stamps | rare (3) |
| Fest Finisher | attended all registered events in a fest (min 3) | uncommon (2) |
| Multi-Fest Explorer | stamps in 3 different fests | rare (3) |
| Early Bird | registered within 1 hour of registration opening | common (1) |
| Night Owl | checked in after 8 PM | common (1) |
| Social Butterfly | 5 connections | uncommon (2) |
| Connector | 20 connections | rare (3) |
| Reviewer | 3 feedback submissions | common (1) |
| Champion | awarded by organizer to winners | legendary (4) |
`award_badges` runs after every XP-affecting action and is idempotent.

### 6.7 Leaderboard — `/leaderboard`
Global and per-fest XP rankings (time filter: all time / this fest), top-3 podium, "You" row pinned, links to public passports (respecting privacy: private passports appear as "Anonymous participant").

### 6.8 Public passport — `/u/[handle]`
Shareable page: card, level/title, stamp count, featured badges, fests attended, member since, Connect button (if logged in). `passport_public=false` → page shows a minimal "This passport is private." Open Graph image via `next/og` renders the card.

### 6.9 Certificates
After an event ends and the participant is `checked_in`, a PDF certificate is available: name, event, fest, date, organization, unique code, QR to `/verify/[code]` (public page confirming validity). Generated on demand by `/api/certificate/[regId]`.

---

## 7. Extras (only after §5 and §6 are solid; in this order)
1. Week-view **My Schedule** with conflicts highlighted.
2. **Event feedback + ratings** (star + comment) after attendance; organizers see averages.
3. **Team workflow:** invite teammates by handle/email, accept/decline, team page in passport.
4. **Winners board:** organizer posts winners per event; podium on the event page; auto-award Champion badge.
5. **Bangla / English toggle** for core UI strings.
6. **PWA:** manifest, icons, offline cache of passport + tickets (QR must show without network at the venue).
7. **OG images** per event and fest.
Do not build payments, SMS, or anything requiring external approvals.

---

## 8. Database (Supabase Postgres)

Files: `supabase/migrations/0001_init.sql` (+ more as needed), `supabase/seed.sql`. RLS on every table.

```sql
create type user_role as enum ('participant','organizer','admin');
create type reg_status as enum ('pending','confirmed','waitlisted','cancelled','rejected','checked_in');
create type event_category as enum ('competition','workshop','seminar','gaming','robotics','quiz','social','other');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null,
  full_name text not null, email text not null,
  phone text, institution text, student_id text,
  bio text, interests text[] default '{}', avatar_url text,
  passport_no text unique not null,
  passport_public boolean default true,
  xp int not null default 0,
  role user_role not null default 'participant',
  onboarded boolean default false,
  created_at timestamptz default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null,
  description text, logo_url text, created_at timestamptz default now()
);
create table org_members (
  org_id uuid references organizations on delete cascade,
  user_id uuid references profiles on delete cascade,
  role text not null default 'organizer',
  primary key (org_id, user_id)
);
create table org_follows (
  user_id uuid references profiles on delete cascade,
  org_id uuid references organizations on delete cascade,
  primary key (user_id, org_id)
);

create table fests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations on delete cascade,
  title text not null, slug text unique not null,
  tagline text, description text, cover_url text,
  start_date timestamptz not null, end_date timestamptz not null,
  venue text,
  checkin_token text not null default encode(gen_random_bytes(12),'hex'),
  is_published boolean default true,
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  fest_id uuid not null references fests on delete cascade,
  title text not null, slug text unique not null,
  category event_category not null default 'other',
  description text, rules text, prizes text, cover_url text,
  starts_at timestamptz not null, ends_at timestamptz,
  venue text,
  registration_opens_at timestamptz default now(),
  registration_deadline timestamptz not null,
  capacity int,
  waitlist_enabled boolean default true,
  requires_approval boolean default false,
  is_team_event boolean default false,
  team_min int default 1, team_max int default 1,
  fee_amount int default 0,
  xp_reward int default 100,
  checkin_token text not null default encode(gen_random_bytes(12),'hex'),
  custom_fields jsonb default '[]',
  tags text[] default '{}',
  is_published boolean default true,
  created_at timestamptz default now()
);

create table registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  status reg_status not null default 'confirmed',
  team_name text, team_members jsonb default '[]',
  answers jsonb default '{}',
  ticket_code text unique not null default substr(md5(random()::text || clock_timestamp()::text),1,10),
  checked_in_at timestamptz, checkin_method text,
  waitlist_position int, organizer_note text,
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

create table stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  kind text not null check (kind in ('event','fest')),
  event_id uuid references events on delete cascade,
  fest_id uuid references fests on delete cascade,
  earned_at timestamptz default now(),
  unique (user_id, kind, event_id, fest_id)
);
create table badges (
  id text primary key, name text not null, description text,
  icon text, rings int default 1, xp_reward int default 0
);
create table user_badges (
  user_id uuid references profiles on delete cascade,
  badge_id text references badges,
  fest_id uuid references fests,
  earned_at timestamptz default now(),
  featured boolean default false,
  primary key (user_id, badge_id, fest_id)
);
create table xp_ledger (
  id bigserial primary key,
  user_id uuid references profiles on delete cascade,
  amount int not null, reason text, ref_id uuid,
  created_at timestamptz default now()
);
create table connections (
  user_a uuid references profiles on delete cascade,
  user_b uuid references profiles on delete cascade,
  fest_id uuid references fests,
  created_at timestamptz default now(),
  primary key (user_a, user_b), check (user_a < user_b)
);
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  type text, title text not null, body text, link text,
  read boolean default false, created_at timestamptz default now()
);
create table announcements (
  id uuid primary key default gen_random_uuid(),
  fest_id uuid references fests on delete cascade,
  event_id uuid references events on delete cascade,
  title text not null, body text not null,
  created_by uuid references profiles, created_at timestamptz default now()
);
create table bookmarks (
  user_id uuid references profiles on delete cascade,
  event_id uuid references events on delete cascade,
  primary key (user_id, event_id)
);
create table feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events on delete cascade,
  user_id uuid references profiles on delete cascade,
  rating int check (rating between 1 and 5), comment text,
  unique (event_id, user_id)
);
create table activity_log (
  id bigserial primary key,
  event_id uuid references events on delete cascade,
  actor_id uuid, action text, meta jsonb, created_at timestamptz default now()
);
```

Helper view `event_with_counts`: all event columns plus `registered_count`, `waitlist_count`, `spots_left`, `is_open` (published, within window, not full or waitlist enabled), `is_full`, `closing_soon`.

## 9. Backend functions (Postgres, `security definer`, set `search_path`)

Each returns structured JSON `{ ok, data | error_code, message }` so the UI can render precise messages.

1. **`register_for_event(event_id, answers, team_name, team_members)`** — lock event row (`for update`); validate window/publish/duplicate; count active seats; set status per §4; reuse a cancelled row if present; set `waitlist_position`; log activity; notify; grant +10 XP. Errors: `not_found`, `not_open_yet`, `deadline_passed`, `already_registered`, `event_full`, `team_size_invalid`, `invalid_answers`.
2. **`cancel_registration(reg_id)`** — owner only, before `starts_at`; set `cancelled`; revoke registration XP; call `promote_from_waitlist`.
3. **`promote_from_waitlist(event_id)`** — while free seats > 0 and waitlist non-empty: promote lowest position to `confirmed`, renumber, notify.
4. **`organizer_set_status(reg_ids[], new_status, note)`** — verifies org membership and legal transitions (§4); bulk-safe; returns per-row results; triggers promotion; logs activity.
5. **`check_in_with_token(token, code)`** — resolves event/fest token; validates caller registration + window + (for rotating codes) HMAC freshness; sets `checked_in`; inserts stamp (idempotent); grants XP; runs `award_badges`; returns `{event, stamp, xp_gained, new_badges, level_before, level_after}`. Errors: §6.5 list.
6. **`organizer_check_in(ticket_code)`** — organizer scans participant's ticket; same effects with `checkin_method='organizer_scan'`.
7. **`rotating_checkin_code(event_id)`** — server-side (Next.js server action) generates `HMAC(CHECKIN_HMAC_SECRET, event_token + floor(now/30s))`; validation accepts current and previous window.
8. **`connect_with_passport(handle_or_code)`** — creates a connection, rejects self-connect, applies daily XP cap, notifies both.
9. **`award_badges(user_id)`** — evaluates §6.6 rules; idempotent; grants badge XP.
10. **`grant_xp(user_id, amount, reason, ref_id)`** — inserts ledger row and updates `profiles.xp` atomically.
11. **`fest_leaderboard(fest_id, limit)`**, **`global_leaderboard(limit)`**, **`event_stats(event_id)`**, **`fest_stats(fest_id)`**, **`organizer_overview(org_id)`**.
12. **Triggers:** on `auth.users` insert → create profile (handle, passport_no); on registrations insert/update → `activity_log` + notifications; on events deadline change → notify registrants.
13. **Scheduled jobs** (Vercel cron → route handler using service role): 24h and 1h event reminders.

## 10. RLS summary
- Public read: published fests/events/orgs; public passports (limited columns via a `public_passports` view).
- `profiles`: own read/update; org members read profiles of people registered to their events.
- `registrations`: participants read own; **inserts/cancels only via RPC**; org members read/update for their org's events.
- `stamps`, `user_badges`, `xp_ledger`, `connections`, `notifications`: users read own; writes **only via security-definer functions**.
- Org members CRUD fests, events, announcements for their org only.
- Storage buckets: `covers` (public read, org-member write), `avatars` (public read, owner write).
- Service role key never reaches the client.
- Realtime enabled on `registrations`, `activity_log`, `notifications`, `stamps`.

## 11. Seed data (judges must not create anything)
- 1 org, 3 fests, 12–16 events across all categories with realistic descriptions, rules, prizes, covers. Variety: upcoming, one **closing within 24h**, one **full with waitlist**, one **live now (inside check-in window)** for the scanner demo, one pending-approval event, past events with stamps/certificates.
- ~120 participants (Bangladeshi names, institutions such as DRMC, DMC, other colleges), registrations in every status, stamps, badges, XP, connections, a populated leaderboard, notifications, announcements, feedback.
- **Demo accounts** (README + one-click buttons on login): organizer `organizer@demo.clubos.dev` / `Demo@12345`; participant `participant@demo.clubos.dev` / `Demo@12345`. The participant arrives with a populated passport: 4–5 stamps, 2 badges, mid-level XP, 2 connections, a confirmed ticket for the live-now event, one waitlisted registration, and a past event with certificate.
- `scripts/seed.ts` is idempotent (safe to re-run) and uses the service role to create auth users.

## 12. Routes and structure
```
/  /fests  /fests/[slug]  /events  /events/[slug]  /events/[slug]/register
/orgs/[slug]  /leaderboard  /u/[handle]  /verify/[code]
/login  /signup  /onboarding
/passport  /passport/fests/[slug]  /passport/edit  /scan  /notifications
/registrations/[id]/success
/organizer  /organizer/fests  /organizer/fests/new  /organizer/fests/[id]
/organizer/events/new  /organizer/events/[id]/edit
/organizer/events/[id]/participants  /organizer/events/[id]/stats  /organizer/events/[id]/qr
/organizer/check-in  /organizer/announcements
/api/export/[eventId]  /api/ics/[eventId]  /api/certificate/[regId]  /api/cron/reminders
```
Structure: `/app` (route groups `(public)`, `(auth)`, `(participant)`, `organizer`), `/components` (`ui/`, `cards/`, `forms/`, `charts/`, `passport/`, `scanner/`, `layout/`), `/lib` (`supabase/`, `xp.ts`, `qr.ts`, `dates.ts`, `validators/`), `/actions`, `/types` (generated DB types), `/supabase`, `/scripts`, `/public`. Strict TS, no `any`; zod on every action; every route has `loading.tsx`/`error.tsx`; global `not-found.tsx`; `middleware.ts` refreshes sessions and guards `/organizer`, `/passport`, `/scan`.

---

## 13. Build order (deploy after each step)
1. Repo, `create-next-app`, shadcn + libs, **MIT LICENSE**, push to public GitHub, connect Vercel, first deploy.
2. Supabase project: migrations, RLS, functions, triggers, generated types.
3. **Design foundation from DESIGN.md:** tokens, fonts, grain, `components/ui` primitives, navbar/bottom nav/footer, theme toggle. Review the look before building pages.
4. Auth, profile trigger, onboarding, demo-login buttons.
5. Seed script with rich data (§11).
6. Public pages: landing, fests, fest page, events explorer, event page, org page.
7. Registration flow: form, RPC, confirmation, cancel, waitlist promotion, notifications.
8. Passport: `/passport` tabs, Fest Pass, public passport, leaderboard.
9. Scanner: `/scan`, `check_in_with_token`, stamp/XP/badge animations; organizer venue QR page.
10. Organizer: dashboard, CRUD, participants table, stats, CSV, announcements, attendee scanner.
11. Extras (§7) in order.
12. Polish: motion pass, responsive pass (360/768/1280), accessibility ≥ 90 Lighthouse, run DESIGN.md §16 checklist.
13. Final QA on production (§14), re-seed production, README, submit.

After each step: `npm run build`, `npm run lint`, fix everything, commit, push.

## 14. QA checklist (production URL; logged out, participant, organizer)
- **Directory:** fests grouped correctly · cards show date/venue/deadline/capacity · search works · category/status filters work and persist in URL · event page shows deadline + capacity · mobile clean.
- **Registration:** validation errors · confirmation + QR · deadline blocks · full → waitlist · duplicate blocked · cancel promotes waitlisted user + notification · re-register after cancel works · clash warning shows.
- **Passport:** signup → onboarding → passport · flip works · stamps/badges/XP correct · Fest Pass agenda + progress · public page respects privacy · leaderboard loads.
- **Scanner:** live-event QR gives stamp + XP · second scan → already checked in · unregistered → not registered · too early/late handled · rotating QR expires · passport QR creates connection · camera-denied fallback on mobile Chrome and Safari.
- **Organizer:** dashboard stats · participant search/filter · single + bulk status change obeys legal transitions · CSV opens in Excel with correct names · new event appears publicly at once · venue QR page live count · non-organizers blocked from `/organizer`.
- **General:** no console errors · no horizontal scroll · dark + light polished · loading/empty/error states everywhere · demo logins work · no secrets in repo · DESIGN.md §16 passes.

## 15. README.md (required structure, in this order)
1. Project name 2. Description 3. Features (core, passport ecosystem, extras) 4. Tech stack 5. Setup instructions (clone, env vars, Supabase migrations, seed, `npm run dev`) 6. **Deployment URL** 7. **Demo credentials** (organizer + participant; scanner demo steps: log in as participant on phone, open the live event's venue QR from the organizer account on a second screen) 8. Third-party services/APIs (Supabase, Vercel, fonts, image sources, optional Resend) 9. **AI tools used** (Claude Code etc. for development; state the app has no AI features) 10. Screenshots (landing, directory, event page, confirmation, passport, stamps, scanner, organizer dashboard, participants table, venue QR) 11. Known limitations (no payment gateway, email optional, etc.) 12. License (MIT).

## 16. Rules for Claude Code
- Follow §13 order; after each step summarize done/next in 3 lines.
- Commit small and often (`feat:`, `fix:`, `chore:`); every push redeploys.
- Never hardcode secrets or commit `.env.local`; never expose the service role key.
- Stamps, XP, badges, connections, and registrations change **only** through the functions in §9.
- Ambiguity → choose a sensible default, record it in `DECISIONS.md`, keep moving.
- No scope beyond this file; drop unfinished extras.
- Visuals follow DESIGN.md exactly; run its §16 grep checklist before every release.

**Start with step 1.**
