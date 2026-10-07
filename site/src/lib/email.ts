// ClubOS transactional email layer.
// Sends via Resend using the official SDK when RESEND_API_KEY is configured.
// Every send is also recorded in the `email_notifications` table for the organizer audit trail.

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

let resend: InstanceType<typeof Resend> | null = null;

function getResend(): InstanceType<typeof Resend> {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'ClubOS <onboarding@resend.dev>';

const BRAND_ACCENT = '#C9A96E';
const BRAND_BG = '#0D0C0A';
const BRAND_SURFACE = '#1A1917';
const BRAND_TEXT = '#F6F3EC';
const BRAND_MUTED = '#A8A29E';
const BRAND_BORDER = 'rgba(201,169,110,0.18)';

function emailId(): string {
  return `cl${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Shared fancy email shell. Keeps the ClubOS "quiet luxury" look in inboxes that
 * support HTML/CSS. Falls back gracefully in plain clients.
 */
export function shell({ subject, bodyHtml, preheader }: { subject: string; bodyHtml: string; preheader?: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="x-apple-fill-color" content="#0D0C0A" />
  <meta name="x-apple-page-name" content="ClubOS" />
  <title>${subject}</title>
  <style>
    :root {
      --accent: ${BRAND_ACCENT};
      --bg: ${BRAND_BG};
      --surface: ${BRAND_SURFACE};
      --text: ${BRAND_TEXT};
      --muted: ${BRAND_MUTED};
      --border: ${BRAND_BORDER};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    /* Animated ambient grain, only where CSS animations are supported. */
    @keyframes grain {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-2%, -3%); }
      20% { transform: translate(3%, 1%); }
      30% { transform: translate(-1%, 2%); }
      40% { transform: translate(2%, -2%); }
      50% { transform: translate(-3%, 3%); }
      60% { transform: translate(1%, -1%); }
      70% { transform: translate(-2%, 2%); }
      80% { transform: translate(3%, -3%); }
      90% { transform: translate(-1%, 1%); }
    }
    .grain {
      position: fixed;
      inset: -50%;
      width: 200%;
      height: 200%;
      pointer-events: none;
      opacity: 0.06;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      animation: grain 0.8s steps(4) infinite;
      z-index: 2;
    }
    @media (prefers-reduced-motion: reduce) {
      .grain { animation: none; opacity: 0.05; }
    }
    .wrapper {
      position: relative;
      z-index: 1;
      max-width: 600px;
      margin: 0 auto;
      padding: 28px 20px 40px;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 32px 28px;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 14px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 30px -10px rgba(0,0,0,0.6);
      pointer-events: none;
    }
    .accent-bar {
      height: 3px;
      width: 46px;
      background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #fff));
      border-radius: 3px;
      margin-bottom: 22px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      letter-spacing: 0.3px;
      color: var(--text);
      font-weight: 600;
    }
    .brand-mark {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: var(--accent);
      display: inline-block;
      position: relative;
    }
    .brand-mark::after {
      content: "";
      position: absolute;
      inset: 5px;
      border-radius: 2px;
      background: var(--bg);
    }
    .eyebrow {
      font-size: 11px;
      letter-spacing: 1.6px;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 24px;
      line-height: 1.25;
      font-weight: 600;
      margin-bottom: 14px;
      letter-spacing: -0.2px;
    }
    .lead {
      color: var(--muted);
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 22px;
    }
    .pill {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--accent) 14%, transparent);
      color: var(--accent);
      border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .panel {
      background: color-mix(in srgb, var(--bg) 30%, transparent);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 14px 14px 16px;
      margin-bottom: 12px;
    }
    .panel-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 5px 0;
      font-size: 14px;
    }
    .panel-label {
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-size: 11px;
      font-weight: 600;
    }
    .panel-value {
      color: var(--text);
      font-weight: 500;
      text-align: right;
      word-break: break-word;
    }
    .code {
      font-family: "SF Mono", Menlo, Consolas, monospace;
      letter-spacing: 1px;
      background: color-mix(in srgb, var(--bg) 50%, transparent);
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px dashed color-mix(in srgb, var(--accent) 35%, transparent);
      color: var(--accent);
      font-size: 13px;
    }
    .seg-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px dashed color-mix(in srgb, var(--border) 70%, transparent);
      font-size: 14px;
    }
    .seg-item:last-child { border-bottom: 0; }
    .seg-name { color: var(--text); }
    .seg-price { color: var(--accent); font-weight: 600; }
    .seg-free { color: var(--muted); }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-block;
      padding: 11px 18px;
      border-radius: 10px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    .btn-primary {
      background: var(--accent);
      color: var(--bg);
      box-shadow: 0 10px 20px -10px color-mix(in srgb, var(--accent) 60%, transparent);
    }
    .btn-primary:hover { transform: translateY(-1px); }
    .btn-ghost {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
    .footer {
      margin-top: 26px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 12px;
      line-height: 1.6;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
    .footer strong { color: var(--text); }
    .animate-in {
      animation: fadeSlide 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    @keyframes fadeSlide {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .delay-1 { animation-delay: 0.08s; }
    .delay-2 { animation-delay: 0.16s; }
    .delay-3 { animation-delay: 0.24s; }
    @media (prefers-reduced-motion: reduce) {
      .animate-in { animation: none; opacity: 1; transform: none; }
    }
    @media only screen and (max-width: 520px) {
      .wrapper { padding: 16px 12px 32px; }
      .card { padding: 22px 16px; }
      .panel-row { flex-direction: column; gap: 2px; }
      .panel-value { text-align: left; }
      .footer { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="grain" aria-hidden="true"></div>
  <div class="wrapper">
    <div class="card animate-in">
      <div class="accent-bar"></div>
      <div class="brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>ClubOS</span>
      </div>
      ${bodyHtml}
    </div>
    <div class="footer">
      <div><strong>ClubOS</strong> — Smart Club Operations</div>
      <div>${subject}</div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Plain-text fallback stripped of HTML chrome. Kept short and scannable.
 */
export function plainText(blocks: string[]): string {
  return blocks.join('\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export interface SegmentData {
  title: string;
  isFree: boolean;
  price: number;
}

export interface RegistrationEmailData {
  eventTitle: string;
  festTitle?: string;
  organizationName?: string;
  ticketCode: string;
  registrationDate: string;
  segments: SegmentData[];
  totalPrice: number;
  paymentMethod?: string;
}

export interface DeclineEmailData {
  eventTitle: string;
  ticketCode: string;
  declineReason: string;
}

export interface VerifyEmailData {
  eventTitle: string;
  festTitle?: string;
  ticketCode: string;
  eventDate: string;
  venue: string;
  eventTime: string;
}

interface RegistrationBlocks {
  subject: string;
  preheader: string;
  bodyHtml: string;
}

export function esc(s: string | undefined | null): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function siteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const normalized = base.replace(/\/+$/, '');
  return `${normalized}${path}`;
}

function segRow(s: SegmentData): string {
  const priceCell = s.isFree
    ? `<span class="seg-free">Free</span>`
    : `BDT ${s.price.toLocaleString()}`;
  return `
      <div class="seg-item">
        <span class="seg-name">${esc(s.title)}</span>
        <span class="seg-price">${priceCell}</span>
      </div>`;
}

function renderRegistrationConfirmation(data: RegistrationEmailData): RegistrationBlocks {
  const segmentsHtml =
    data.segments.length
      ? data.segments.map(segRow).join('')
      : `
      <div class="seg-item">
        <span class="seg-name">No segments selected</span>
      </div>`;

  const paymentNote =
    data.totalPrice > 0
      ? `
      <div class="panel">
        <div class="panel-row">
          <span class="panel-label">Total Due</span>
          <span class="panel-value">BDT ${data.totalPrice.toLocaleString()}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Method</span>
          <span class="panel-value">${esc(data.paymentMethod || 'N/A')}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Status</span>
          <span class="panel-value"><span class="pill">Awaiting Payment</span></span>
        </div>
      </div>`
      : `
      <div class="panel">
        <div class="panel-row">
          <span class="panel-label">Total Due</span>
          <span class="panel-value"><span class="pill">Free</span></span>
        </div>
      </div>`;

  const bodyHtml = `
    <div class="animate-in delay-1">
      <div class="eyebrow">Registration Received</div>
      <h1>See you at ${esc(data.eventTitle)}</h1>
      <p class="lead">
        Your spot is saved.${data.festTitle ? ` This event is part of <strong>${esc(data.festTitle)}</strong>.` : ''}
        ${data.totalPrice > 0 ? ' Please complete your payment to confirm.' : ' This event is free, so you are all set.'}
      </p>
    </div>

    <div class="animate-in delay-2">
      <div class="panel">
        <div class="panel-row">
          <span class="panel-label">Event</span>
          <span class="panel-value">${esc(data.eventTitle)}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Fest</span>
          <span class="panel-value">${esc(data.festTitle || 'N/A')}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Organization</span>
          <span class="panel-value">${esc(data.organizationName || 'N/A')}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Ticket ID</span>
          <span class="panel-value"><span class="code">${esc(data.ticketCode)}</span></span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Registered On</span>
          <span class="panel-value">${esc(data.registrationDate)}</span>
        </div>
      </div>
    </div>

    <div class="animate-in delay-2">
      <div class="eyebrow" style="margin-top:18px;margin-bottom:10px">Segments</div>
      ${segmentsHtml}
    </div>

    <div class="animate-in delay-3">
      ${paymentNote}
    </div>

    <div class="actions animate-in delay-3" style="margin-top:18px">
      <a class="btn btn-primary" href="${siteUrl('/passport')}">Open Passport</a>
      <a class="btn btn-ghost" href="${siteUrl('/events')}">Browse Events</a>
    </div>
  `;

  return {
    subject: `Registration Confirmed: ${data.eventTitle}${data.festTitle ? ` at ${data.festTitle}` : ''}`,
    preheader: `Your ticket ID is ${data.ticketCode}. See you at ${data.eventTitle}.`,
    bodyHtml,
  };
}

function renderPaymentVerified(data: VerifyEmailData): RegistrationBlocks {
  const bodyHtml = `
    <div class="animate-in delay-1">
      <div class="eyebrow">Payment Verified</div>
      <h1 style="color:var(--accent)">You're all set, ${esc(data.eventTitle)}</h1>
      <p class="lead">
        Your payment has been confirmed and your registration is official. Bring this ticket with you to the venue.
      </p>
    </div>

    <div class="animate-in delay-2">
      <div class="panel">
        <div class="panel-row">
          <span class="panel-label">Event</span>
          <span class="panel-value">${esc(data.eventTitle)}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Fest</span>
          <span class="panel-value">${esc(data.festTitle || 'N/A')}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Ticket ID</span>
          <span class="panel-value"><span class="code">${esc(data.ticketCode)}</span></span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Date</span>
          <span class="panel-value">${esc(data.eventDate)}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Venue</span>
          <span class="panel-value">${esc(data.venue)}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Time</span>
          <span class="panel-value">${esc(data.eventTime)}</span>
        </div>
      </div>
    </div>

    <div class="actions animate-in delay-3" style="margin-top:18px">
      <a class="btn btn-primary" href="${siteUrl('/passport')}">Open Passport</a>
      <a class="btn btn-ghost" href="${siteUrl('/passport/fests')}">My Fests</a>
    </div>
  `;

  return {
    subject: `Payment Verified: ${data.eventTitle}`,
    preheader: `Your ticket ${data.ticketCode} is confirmed. See you there!`,
    bodyHtml,
  };
}

function renderPaymentDeclined(data: DeclineEmailData): RegistrationBlocks {
  const bodyHtml = `
    <div class="animate-in delay-1">
      <div class="eyebrow">Registration Update</div>
      <h1 style="color:#F87171">Registration Declined</h1>
      <p class="lead">
        We're sorry, but your registration for <strong>${esc(data.eventTitle)}</strong> was not approved.
        ${data.declineReason ? ` The organizer noted: <em>${esc(data.declineReason)}</em>` : ''}
      </p>
    </div>

    <div class="animate-in delay-2">
      <div class="panel">
        <div class="panel-row">
          <span class="panel-label">Event</span>
          <span class="panel-value">${esc(data.eventTitle)}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Ticket ID</span>
          <span class="panel-value"><span class="code">${esc(data.ticketCode)}</span></span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Reason</span>
          <span class="panel-value">${esc(data.declineReason || 'Not provided')}</span>
        </div>
      </div>
    </div>

    <div class="actions animate-in delay-3" style="margin-top:18px">
      <a class="btn btn-ghost" href="${siteUrl('/events')}">Find Another Event</a>
    </div>
  `;

  return {
    subject: `Registration Declined: ${data.eventTitle}`,
    preheader: `Your registration for ${data.eventTitle} was declined.`,
    bodyHtml,
  };
}

/**
 * Low-level sender. Uses the Resend SDK when RESEND_API_KEY is present;
 * otherwise falls back to console logging (useful in local dev / preview).
 */
export async function sendEmail(
  to: string | undefined,
  subject: string | undefined,
  body: string | undefined,
  html?: string
): Promise<boolean> {
  if (!to || !subject || !body) return false;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(`[EMAIL] RESEND_API_KEY not set — email not sent. To: ${to} | Subject: ${subject}`);
    return false;
  }

  const textBody = html ? plainText([body]) : body;

  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      text: textBody,
      html: html ? shell({ subject, bodyHtml: html, preheader: body }) : undefined,
    });

    if (error) {
      console.error('[EMAIL] Resend SDK error:', error);
      return false;
    }

    console.info(`[EMAIL] sent id=${data?.id} to=${to} subject=${subject}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] send failed:', err);
    return false;
  }
}

export function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey);
}

async function recordEmailLog(params: {
  userId?: string;
  eventId?: string;
  registrationId?: string;
  emailType: string;
  subject: string;
  body: string;
  sent: boolean;
}) {
  const admin = getAdminClient();
  if (!admin) return; // table/log audit is best-effort

  try {
    await admin
    .from('email_notifications')
    .insert({
      user_id: params.userId ?? null,
      event_id: params.eventId ?? null,          registration_id: params.registrationId ?? null,
          email_type: params.emailType,
          subject: params.subject ?? '',
          body: params.body ?? '',
          sent_at: new Date().toISOString(),
          status: params.sent ? 'sent' : 'skipped',
        });

  } catch (err) {
    // Best-effort audit log; never break the main flow because of it.
    console.warn('[EMAIL] failed to record email_notifications row:', err);
  }
}

// ─── Public helpers ────────────────────────────────────────────────────────────

export async function sendRegistrationConfirmation(
  email: string,
  data: RegistrationEmailData
): Promise<boolean> {
  const { subject, preheader, bodyHtml } = renderRegistrationConfirmation(data);
  const sent = await sendEmail(email, subject, preheader, bodyHtml);
  await recordEmailLog({ emailType: 'registration_confirmation', subject, body: preheader, sent });
  return sent;
}

export async function sendPaymentVerified(
  email: string,
  data: VerifyEmailData
): Promise<boolean> {
  const { subject, preheader, bodyHtml } = renderPaymentVerified(data);
  const sent = await sendEmail(email, subject, preheader, bodyHtml);
  await recordEmailLog({ emailType: 'payment_verified', subject, body: preheader, sent });
  return sent;
}

export async function sendPaymentDecline(
  email: string,
  data: DeclineEmailData
): Promise<boolean> {
  const { subject, preheader, bodyHtml } = renderPaymentDeclined(data);
  const sent = await sendEmail(email, subject, preheader, bodyHtml);
  await recordEmailLog({ emailType: 'payment_declined', subject, body: preheader, sent });
  return sent;
}
