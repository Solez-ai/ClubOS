/**
 * Captures README screenshots of the deployed site using the seeded demo
 * accounts, alternating dark/light themes page by page (sequential pattern).
 *
 * Output: ../docs/screenshots/*.jpg (repo root docs folder, referenced by README).
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs
 *   BASE_URL=http://localhost:3000 node scripts/capture-screenshots.mjs
 */

import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const readEnv = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return m ? m[1].trim() : '';
};

const BASE = process.env.BASE_URL || 'https://site-weld-mu-16.vercel.app';
const SUPA = readEnv('NEXT_PUBLIC_SUPABASE_URL');
const SKEY = readEnv('SUPABASE_SERVICE_ROLE_KEY');
const OUT = fileURLToPath(new URL('../../docs/screenshots/', import.meta.url));
mkdirSync(OUT, { recursive: true });

if (!SUPA || !SKEY) {
  console.error('Missing Supabase env vars in site/.env.local');
  process.exit(1);
}

async function restJson(query) {
  // Service key: RLS allows public reads only for authenticated users, and
  // this lookup happens before any login. Key never leaves this machine.
  const res = await fetch(`${SUPA}/rest/v1/${query}`, {
    headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}` },
  });
  if (!res.ok) throw new Error(`REST ${query} -> ${res.status}`);
  return res.json();
}

async function main() {
  console.log(`Capturing screenshots from ${BASE} -> ${OUT}`);

  const [fests, events] = await Promise.all([
    restJson('fests?select=id,slug,title&is_published=eq.true&order=start_date.asc'),
    restJson('events?select=id,slug,title&is_published=eq.true&order=created_at.asc'),
  ]);
  const techCarnival = fests.find((f) => f.title.includes('Aurora Tech Carnival')) ?? fests[0];
  const aiEvent = events.find((e) => e.title === 'AI Model Showdown') ?? events[0];
  console.log(`fest=${techCarnival.slug} event=${aiEvent.slug}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.25,
  });
  const page = await ctx.newPage();

  async function shot(name, url, theme, { fullPage = true, timeout = 45000 } = {}) {
    if (url) await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout });
    await page.evaluate((t) => {
      localStorage.setItem('theme', t);
      document.documentElement.setAttribute('data-theme', t);
    }, theme);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}${name}.jpg`, fullPage, type: 'jpeg', quality: 85 });
    console.log(`  ${name}.jpg (${theme})`);
  }

  async function loginAs(demoLabel) {
    // Drop any previous demo session: /login auto-redirects signed-in users.
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await ctx.clearCookies();
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: demoLabel }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
    await page.waitForLoadState('networkidle');
  }

  // --- Public pages (logged out) ---
  await shot('01-landing-dark', '/', 'dark');
  await shot('02-login-demo-mode-dark', '/login', 'dark', { fullPage: false });
  await shot('03-signup-light', '/signup', 'light');

  // --- Participant journey (demo participant) ---
  await loginAs('Participant Demo');
  await shot('04-fests-directory-light', '/fests', 'light');
  await shot('05-fest-detail-dark', `/fests/${techCarnival.slug}`, 'dark');
  await shot('06-events-directory-light', '/events', 'light');
  await shot('07-event-detail-dark', `/events/${aiEvent.slug}`, 'dark');
  await shot('08-registration-payment-light', `/events/${aiEvent.slug}/register`, 'light');
  await shot('09-participant-dashboard-dark', '/dashboard', 'dark');
  await shot('10-passport-light', '/passport', 'light');
  await shot('11-notifications-dark', '/notifications', 'dark', { fullPage: false });
  await shot('12-leaderboard-light', '/leaderboard', 'light');

  // --- Organizer control room (demo organizer) ---
  await loginAs('Organizer Demo');
  await shot('13-organizer-dashboard-dark', '/organizer', 'dark');
  await shot('14-manage-overview-light', '/manage', 'light');
  await shot('15-fest-management-dark', `/manage/fest/${techCarnival.id}`, 'dark');
  await shot('16-fest-edit-light', `/manage/fest/${techCarnival.id}/edit`, 'light');
  await shot('17-event-edit-segments-dark', `/manage/event/${aiEvent.id}/edit`, 'dark');
  await shot('18-participants-payments-light', `/organizer/events/${aiEvent.id}/participants`, 'light');
  await shot('19-venue-qr-projector-dark', `/organizer/events/${aiEvent.id}/qr`, 'dark', { fullPage: false });
  await shot('20-check-in-light', '/organizer/check-in', 'light', { fullPage: false });
  await shot('21-ticket-scanner-dark', '/scan', 'dark', { fullPage: false });
  await shot('22-account-light', '/account', 'light');

  await browser.close();
  console.log('Done.');
}

main().catch((e) => {
  console.error('Capture failed:', e.message, '\n', e.stack);
  process.exit(1);
});
