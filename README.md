# ClubOS

## 1. Project Name

ClubOS — Smart Club Operations Ecosystem. One passport for every fest.

## 2. Project Description

ClubOS is a full-stack event and festival management platform built for campus clubs and fest organizers in Bangladesh. Unlike a plain registration form, ClubOS gives every participant a digital Participant Passport: a collectible ID card that gathers ink stamps, XP, and rarity badges as they attend events across multiple fests. Organizers get a complete operations portal: publish fests and events with paid (bKash/Nagad) or free registration, verify mobile-wallet payments from a dashboard, manage waitlists, run live check-in with rotating projector QR codes, and export attendee data.

The platform solves a real problem: student fests in Bangladesh collect payments through bKash/Nagad Send Money and Pay Bill screenshots and then track participants in scattered spreadsheets. ClubOS moves the entire flow — discovery, registration, payment submission, verification, check-in, and recognition — into one system.

## 3. Features

- Participant Passport: collectible ID card with stamps, XP levels, rarity medallions, and a public QR profile.
- Multi-fest directory: browse ongoing, upcoming, and past fests with capacity meters, deadline countdowns, category tags, and shareable URL filters.
- Events of many varieties: competitions, workshops, seminars, gaming, robotics, cultural, sports, and food events; solo or team registration; capacity and waitlist per event.
- Flexible ticketing with segments: each event can sell multiple entry types (for example Team Entry plus a free Spectator Pass) with individual pricing.
- Mobile wallet payments: bKash and Nagad, both Send Money and Pay Bill, with per-segment payment instructions, transaction ID submission, and organizer-side verification (verify or decline with a reason).
- Waitlist engine: atomic seat allocation; when a seat is released the lowest waitlisted participant is auto-promoted and notified.
- Organizer portal: KPI dashboard with registration trends, fest and event creation with image crop-upload covers, tag pickers, publish toggles, and full edit pages for fests and events.
- Live check-in: fullscreen projector mode with HMAC-signed rotating venue QR codes (refreshes every 30 seconds) and a camera ticket scanner with visual confirmation.
- In-app notifications: organizers are notified on new registrations; participants on confirmation, payment verification or decline, and waitlist promotion. Optional real email delivery through Resend.
- CSV export: UTF-8 BOM participant tables for Excel.
- Role-based routing: one signup flow, two experiences; organizers and participants land in role-appropriate dashboards.

## 4. Tech Stack

- Framework: Next.js 16 (App Router, React 19, TypeScript, Server Actions)
- Database and Auth: Supabase (PostgreSQL with Row Level Security, Supabase Auth, Storage buckets for avatars and covers)
- Styling: Tailwind CSS v4 with a custom "quiet luxury" design token system (CSS variables, serif display type)
- Motion and icons: Framer Motion, lucide-react
- QR engine: qrcode.react plus crypto HMAC SHA-256 rotating check-in codes
- Image handling: client-side canvas crop-upload component (drag pan, zoom, JPEG 0.9 output) writing to Supabase Storage
- Email: Resend HTTP API, sent server-side only
- Hosting: Vercel

## 5. Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/Solez-ai/ClubOS.git
   cd ClubOS/site
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create `.env.local` in `ClubOS/site` with the following variables (a `.env.example` is provided):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   CHECKIN_HMAC_SECRET=any_long_random_string
   RESEND_API_KEY=re_xxx            (optional, enables real email delivery)
   EMAIL_FROM_ADDRESS=ClubOS <noreply@yourdomain.com>   (optional)
   ```
4. In your Supabase project, open the SQL Editor and run the files in the top-level `SQL` folder in order:
   - `SQL/01_schema.sql` — tables, indexes, RLS policies, category tag seed
   - `SQL/02_functions.sql` — RPC functions and triggers (waitlist promotion, badges, check-in)
   - `SQL/03_passport.sql` — passport stamps, XP ledger, badge catalog
   - `SQL/04_notifications.sql` — in-app notifications, email audit, payment columns
   - `SQL/05_auth_fixes.sql` — profile creation trigger, avatars bucket and policies
   - `SQL/06_org_policies_fix.sql` — org membership policy helper, covers bucket, fest tags
5. (Optional) Seed the demo dataset used by the demo credentials:
   ```
   node scripts/seed-demo.mjs
   ```
6. Start the dev server:
   ```
   npm run dev
   ```
   Open http://localhost:3000.

To deploy to Vercel, import the repository, add the environment variables above in Project Settings, and run `vercel --prod` from the `site` directory.

## 6. Deployment URL

Live production deployment: https://site-weld-mu-16.vercel.app

Source repository: https://github.com/Solez-ai/ClubOS (branch: main)

## 7. Demo Credentials

The login page has a Demo Mode section with one-click buttons that sign you straight in. The accounts are real and fully editable: everything the demo organizer owns can be edited, and everything the demo participant is registered to can be managed.

| Role | Email | Password | What you will find |
| --- | --- | --- | --- |
| Organizer | demo.organizer@clubos.app | AuroraDemo2026! | Organization "Aurora Campus Council" with 5 published fests and 60 published events of many varieties (free and paid, bKash/Nagad, Send Money and Pay Bill), live registrations including one paid registration awaiting payment verification |
| Participant | demo.participant@clubos.app | PassportDemo2026! | Registered to 4 events across 3 of the organizer's fests: a free confirmed registration, a paid registration pending payment verification, a paid verified registration, and a free pending registration |

Notes for judges:

- Sign in as the participant first to browse fests, view tickets, and see the passport; then sign in as the organizer to verify the pending payment in the organizer dashboard, manage waitlists, and try live check-in.
- The demo organizer account also works for the full creation flow: create a new fest or event, edit any of the 5 pre-made fests, add segments with bKash/Nagad payment details, and publish.
- You can also sign up as a brand-new user through the normal signup flow to test it end to end.

## 8. Third-Party Services/APIs

- Supabase — PostgreSQL database, authentication, Row Level Security, file storage. Required.
- Vercel — hosting and CI/CD for the Next.js app. Required.
- Resend — transactional email delivery (registration confirmation, payment verification, payment decline). Optional; without an API key, emails are recorded in the database but not delivered.
- bKash / Nagad — payment instructions only. The app does not call wallet APIs; organizers share their wallet numbers and participants submit transaction IDs, which organizers verify. This matches how student fests in Bangladesh actually collect money.

No other third-party APIs are called at runtime.

## 9. AI Tools/Features Used (Disclosure)

AI development tools were used to build this project:

- Claude (Claude Code) — code generation, architectural planning, debugging, refactoring, SQL schema and policy authoring, test writing, and this documentation.
- Google Antigravity — code generation assistance and iterative development.
- ChatGPT — supplementary research and code review during development.

All AI assistance was in the development toolchain only. No AI APIs or model calls are used inside the production web application; all runtime features are deterministic application code.

## 10. Screenshots

Key screens (viewable live at https://site-weld-mu-16.vercel.app):

1. Login page with the Demo Mode one-click entry buttons.
2. Signup page with role cards, avatar upload with crop preview, and a single Create Account action.
3. Fests directory with ongoing/upcoming/past grouping, capacity meters, and category tag filters.
4. Fest detail page and event detail page with segment pricing and bKash/Nagad payment instructions.
5. Registration flow with segment selection and transaction ID submission.
6. Participant Passport: collectible card, ink stamps, XP, and rarity medallions.
7. Organizer dashboard: KPI stats, registration trend chart, and activity feed.
8. Organizer payment verification table showing the pending paid registration from the demo participant.
9. Event management: fest and event edit pages with image crop-upload, tags, and segment configuration.
10. Live check-in: rotating projector QR code and the camera ticket scanner.

## 11. Known Limitations

- Payments are instruction-based, not gateway-integrated. bKash/Nagad verification is manual by design (organizers check the transaction ID); there is no automatic wallet API confirmation.
- Email delivery requires a RESEND_API_KEY and a verified sending domain; otherwise emails are recorded but not sent.
- Judges must have email confirmation disabled or confirmed accounts; on fresh Supabase projects, disable "Confirm email" in Auth settings for the smoothest demo experience.
- The rotating venue QR check-in is intended for on-site use on a projector; remote check-in by ticket code alone is possible through the scanner but is not cryptographically rate-limited.
- Image storage uses Supabase Storage public buckets; there is no CDN-level image resizing.
- The demo dataset is regenerated by `scripts/seed-demo.mjs`; re-running it replaces the demo organizer's fests and the demo participant's registrations (it never touches real user data).
- Browser support targets modern evergreen browsers; the camera scanner requires HTTPS and camera permissions.

## 12. License

This project is released under the MIT License. See the [LICENSE](LICENSE) file in the repository root.

## 13. Organizing Authority

The organizing authority reserves the right to make the final decision regarding rule interpretation, eligibility, judging, scoring, and any matters not explicitly covered in these guidelines. All decisions made by the judging panel and organizing authority shall be final.
