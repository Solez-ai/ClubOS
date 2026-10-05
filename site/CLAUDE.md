@AGENTS.md

# ClubOS Developer Quick Reference

## Commands
- `npm run dev` — Launch development server
- `npm run build` — Build production bundle
- `npm run lint` — Run ESLint check
- `node site/scripts/init-db.mjs` — Initialize Supabase seed data

## Database SQL Files
- `SQL/01_schema.sql` — Schema & Tables
- `SQL/02_functions.sql` — RPC Functions & RLS
- `SQL/03_seed.sql` — Pre-seeded Sample Data

## Key Credentials & Env
Stored in `site/.env.local` (ignored by git).
Required in Vercel Deployment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CHECKIN_HMAC_SECRET`
