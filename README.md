# ClubOS — Smart Club Operations Ecosystem

> **Mission:** Win the 9th DRMC International Tech Carnival 2026 — AI Web Development Contest.
> **Tagline:** *"One passport for every fest."*
> **License:** Open Source under the [MIT License](LICENSE).

---

## 1. Project Overview

**ClubOS** is a smart club operations ecosystem designed for campus organizations, technology carnivals, hackathons, and science summits. Unlike basic registration forms, ClubOS introduces the **Participant Passport** — a digital credentials card (`CL-2026-XXXXXX`) that students use across every fest to collect monochrome ink stamps, earn concentric rarity badges, accumulate XP, auto-promote through event waitlists, and issue verified PDF certificates.

---

## 2. Differentiating Features

### 🏆 Participant Passport Ecosystem
- **Guilloche Passport Card:** 3D flip card (front/back with personal QR) featuring optical serif typography, Roman numeral levels (`IV · Veteran`), and tactile SVG grain overlays.
- **Digital Ink Stamps:** Event & Fest entry stamps with randomized ink displacement filters and timestamped verification.
- **Rarity Medallions:** Concentric brass ring badges (`First Stamp`, `Collector`, `Regular`, `Multi-Fest Explorer`, `Social Butterfly`, `Champion`).
- **Waitlist Auto-Promotion Engine:** Row-locking atomic seat allocation; when a seat is released, the lowest position waitlisted participant is automatically promoted and notified.

### 🎪 Fest & Event Directory
- **Multi-Fest Hub:** Grouped into *Ongoing*, *Upcoming*, and *Past* events for DRMC IT Club ("9th DRMC International Tech Carnival 2026", "Winter Tech Fest 2026", "Freshers Tech Fest 2027").
- **Live Capacity & Deadline Countdowns:** Real-time capacity meters and relative deadline countdowns ("Closes in 2d 4h").
- **Shareable URL Filters:** Search queries, category chips, status filters, and sorting params live directly in the URL for instant sharing.

### 🛡️ Organizer Portal & Venue Tools
- **Organizer Dashboard:** KPI stats, registration trend charts, waitlist management, and live activity feeds.
- **Live Projector Venue QR:** Fullscreen projector mode displaying HMAC-signed rotating QR codes (refreshes every 30s to prevent code sharing) with live attendee check-in counts.
- **Attendee Ticket Scanner:** Camera scanner for participant ticket codes with audio-free visual confirmation cards.
- **CSV Data Export:** UTF-8 BOM exported participant tables for Excel compatibility.

---

## 3. Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database & Auth:** Supabase (Postgres, RLS, Storage, Server Actions)
- **Design System:** "Quiet Luxury" tokens, Tailwind CSS v4, custom CSS properties
- **Icons & Motion:** `lucide-react`, `motion` (Framer Motion)
- **QR Engine:** `qrcode.react`, crypto HMAC SHA-256

---

## 4. Setup Instructions

1. **Clone Repository:**
   ```bash
   git clone https://github.com/your-username/ClubOS.git
   cd ClubOS/site
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xqekafdcxzipxmbybxmn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_QYtvpGKBDs8ErSi3dY-FgA_4lyH3Bkj
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   CHECKIN_HMAC_SECRET=clubos_super_secret_hmac_key_2026_drmc
   ```

4. **Execute Database Setup SQL:**
   Open your Supabase SQL Editor and run the files in the top-level `/SQL` folder in order:
   - `SQL/01_schema.sql` (Tables, Indexes, Views & RLS)
   - `SQL/02_functions.sql` (RPC Functions & Triggers)
   - `SQL/03_seed.sql` (Pre-seeded Sample Data)
   - `SQL/04_notifications.sql` (In-app notifications, email audit table, payment columns, storage bucket)

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## 5. Trying ClubOS

The platform runs entirely on real accounts — sign up through the **Sign Up** page and choose a role:

- **Participant** — browse fests and events, register (free or paid via BKash/Nagad), collect stamps, earn XP, and build your passport.
- **Organizer** — create your organization, fests, and events; manage participants; verify or decline payments; and run live check-in with rotating venue QR codes.

**Judges / reviewers:** after signing up as an organizer, create a fest and an event with segments to see the full registration → payment → verification workflow end to end. A demo dataset (DRMC IT Club with three fests and sample events) is available when you run `SQL/03_seed.sql`.

> Note: the seed file creates profile/organization rows but does not create Supabase Auth users. After seeding, sign up normally with any real email to use the platform.

---

## 6. Vercel Deployment Settings

When deploying to Vercel, add the environment variables from `.env.local` in Project Settings -> Environment Variables.

### Optional: Real email delivery (Resend)

By default, registration/verification emails are recorded but not delivered. To enable real delivery:

1. Create an API key at [resend.com/api-keys](https://resend.com/api-keys).
2. Add `RESEND_API_KEY=re_xxx` to your environment (Vercel Project Settings or `.env.local`).
3. Optionally set `EMAIL_FROM_ADDRESS` (e.g. `ClubOS <noreply@yourdomain.com>`) once your domain is verified in Resend. The default uses Resend's `onboarding@resend.dev` test sender.

Emails are sent server-side through `/api/notifications/email`; nothing is exposed to the browser.

---

## 7. Disclosure of AI Tools Used

AI development tools (such as Google Antigravity & Claude Code) were utilized solely for code generation, architectural planning, and refactoring during development. **No AI APIs or model calls are used inside the production web app.**

---

## 8. License

This project is open-source under the [MIT License](LICENSE).
