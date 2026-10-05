<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ClubOS — Smart Club Operations Ecosystem (Agent Architecture & Operational Guide)

> **Mission:** Win the 9th DRMC International Tech Carnival 2026 — AI Web Development Contest.
> **Theme:** Smart Club Operations.
> **Stack:** Next.js 16 (App Router, TypeScript) + Supabase (Postgres, RLS, Storage) + Vercel.

---

## 1. Executive Summary & Design System

ClubOS is a digital operations platform designed for campus clubs, technology carnivals, hackathons, and science summits. The differentiator is the **Participant Passport Ecosystem** — every student developer receives a digital passport (`CL-2026-XXXXXX`), collects monochrome ink stamps by scanning venue QR codes, levels up XP, earns concentric rarity badges, and manages event agendas in one place.

### Visual Authority ("Quiet Luxury")
- **Palette:** Warm black background (`#0D0C0A`), warm paper light background (`#F6F3EC`), brass accent (`#C9A96E`), hairline borders (`rgba(243,239,230,.10)`).
- **Typography:** Display serif (`Fraunces`), body sans (`Geist`), mono numerals (`Geist Mono`).
- **Tactile Grain:** SVG fractal noise overlay at 3.5% opacity.
- **Strict Bans:** No text gradients, no purple/violet/cyan neon, no box glows, no glassmorphism backdrop blur cards, no spring/bounce animations. Restraint is luxury.

---

## 2. Database Architecture & SQL Directory

All SQL migrations and RPC functions are located in the top-level `/SQL` folder:
- `SQL/01_schema.sql`: Postgres types (`user_role`, `reg_status`, `event_category`), 17 tables, performance indexes for heavy load, RLS policies, views (`event_with_counts`, `public_passports`).
- `SQL/02_functions.sql`: Row-locking RPC functions (`register_for_event`, `cancel_registration`, `promote_from_waitlist`, `organizer_set_status`, `check_in_with_token`, `organizer_check_in`, `connect_with_passport`, `award_badges`, `grant_xp`, `handle_new_user`).
- `SQL/03_seed.sql`: Rich pre-seeded data including DRMC IT Club, 3 fests (Carnival 2026, Winter Fest, Freshers Fest), 4 events (including a LIVE event for venue QR testing, a waitlist event, and a past event), demo organizer and participant accounts.

---

## 3. Deployment & Vercel Environment Setup

When deploying to **Vercel**, ensure the following environment variables are configured under Project Settings -> Environment Variables:

| Variable Name | Description | Example Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project REST Endpoint | `https://xqekafdcxzipxmbybxmn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon API Key | `sb_publishable_QYtvpGKBDs8ErSi3dY-FgA_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Service Role Secret | `your_supabase_secret_key` |
| `NEXT_PUBLIC_SITE_URL` | Application Base URL | `https://your-clubos.vercel.app` |
| `CHECKIN_HMAC_SECRET` | HMAC Secret for Rotating Venue QR | `clubos_super_secret_hmac_key_2026_drmc` |

*Note: `.env.local` is present locally and strictly ignored via `.gitignore` to prevent secret leaks.*

---

## 4. Key Agent Guidelines

1. **State Transitions:** Always adhere to legal registration state transitions (`pending` -> `confirmed` -> `checked_in`, `waitlisted` -> `confirmed`, `confirmed` -> `cancelled`).
2. **Concurrency Safety:** `register_for_event` locks event rows using `FOR UPDATE` to prevent overbooking under heavy load.
3. **Auditability:** All XP changes are logged in `xp_ledger`.
4. **MIT License:** MIT License file (`LICENSE`) is included in the project repository.

## 5. Local Development & Build

- **Node.js**: Version >= 18 (LTS).
- **Package Manager**: npm (as `package-lock.json` is present).
- **Install dependencies**: `npm install`.
- **Run development server**: `npm run dev`.
- **Build for production**: `npm run build`. Ensure the build succeeds before deploying.
- **Run tests** (if added): `npm test`.

### Database Initialization

When setting up a new Supabase project, execute the SQL migration files in order:

1. `SQL/01_schema.sql`
2. `SQL/02_functions.sql`
3. `SQL/03_seed.sql`

These scripts create the required tables, functions, and seed demo data.

### Secret Management

- Never commit `SUPABASE_SERVICE_ROLE_KEY`. It should only exist in `.env.local`, which is ignored via `.gitignore`.
- Store `CHECKIN_HMAC_SECRET` securely and do not expose it publicly.
