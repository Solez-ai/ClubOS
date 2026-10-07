#!/usr/bin/env node
/**
 * Quick smoke test for the ClubOS Resend integration.
 * Sends a branded test email to the address in RESEND_TEST_TO.
 * Uses the same resend SDK + environment as the deployed app.
 *
 * Usage (from ClubOS/site):
 *   RESEND_TEST_TO=yeasrsamin20@gmail.com node scripts/send-test-email.mjs
 */

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const to = process.env.RESEND_TEST_TO;

if (!apiKey) {
  console.error('RESEND_API_KEY is not set.');
  process.exit(1);
}

if (!to || !to.includes('@')) {
  console.error('RESEND_TEST_TO must be a valid email address.');
  process.exit(1);
}

const resend = new Resend(apiKey);

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'ClubOS <onboarding@resend.dev>';
const subject = 'ClubOS test email — if you see this, Resend is wired up';

const bodyHtml = `
  <div class="animate-in delay-1">
    <div class="eyebrow">It works</div>
    <h1>Your first ClubOS email is live</h1>
    <p class="lead">
      This is a branded test email. Resend is now configured, so real registration,
      payment verification, and decline emails will start going out with the ClubOS look and motion.
    </p>
  </div>

  <div class="animate-in delay-2">
    <div class="panel">
      <div class="panel-row">
        <span class="panel-label">To</span>
        <span class="panel-value">${to}</span>
      </div>
      <div class="panel-row">
        <span class="panel-label">From</span>
        <span class="panel-value">${FROM_ADDRESS}</span>
      </div>
      <div class="panel-row">
        <span class="panel-label">Sent from</span>
        <span class="panel-value">local run of scripts/send-test-email.mjs</span>
      </div>
    </div>
  </div>
`;

const shell = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
  <style>
    :root { --accent:#C9A96E; --bg:#0D0C0A; --surface:#1A1917; --text:#F6F3EC; --muted:#A8A29E; --border:rgba(201,169,110,0.18); }
    * { box-sizing:border-box; margin:0; padding:0; }
    html, body { background:var(--bg); color:var(--text); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
    .wrapper { max-width:600px; margin:0 auto; padding:28px 20px 40px; }
    .card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:32px 28px; position:relative; overflow:hidden; }
    .accent-bar { height:3px; width:46px; background:linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 70%,#fff)); border-radius:3px; margin-bottom:22px; }
    .brand { display:inline-flex; align-items:center; gap:10px; font-size:15px; letter-spacing:0.3px; color:var(--text); font-weight:600; }
    .brand-mark { width:22px; height:22px; border-radius:6px; background:var(--accent); display:inline-block; position:relative; }
    .brand-mark::after { content:""; position:absolute; inset:5px; border-radius:2px; background:var(--bg); }
    .eyebrow { font-size:11px; letter-spacing:1.6px; text-transform:uppercase; color:var(--accent); font-weight:600; margin-bottom:10px; }
    h1 { font-size:24px; line-height:1.25; font-weight:600; margin-bottom:14px; letter-spacing:-0.2px; }
    .lead { color:var(--muted); font-size:15px; line-height:1.6; margin-bottom:22px; }
    .panel { background:color-mix(in srgb,var(--bg) 30%, transparent); border:1px solid var(--border); border-radius:10px; padding:14px 14px 14px 16px; margin-bottom:12px; }
    .panel-row { display:flex; justify-content:space-between; gap:12px; padding:5px 0; font-size:14px; }
    .panel-label { color:var(--muted); text-transform:uppercase; letter-spacing:0.6px; font-size:11px; font-weight:600; }
    .panel-value { color:var(--text); font-weight:500; text-align:right; word-break:break-word; }
    .footer { margin-top:26px; padding-top:18px; border-top:1px solid var(--border); color:var(--muted); font-size:12px; line-height:1.6; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; }
    .footer strong { color:var(--text); }
    .animate-in { animation:fadeSlide 0.5s cubic-bezier(0.2,0.8,0.2,1) both; }
    @keyframes fadeSlide { 0% { opacity:0; transform:translateY(8px); } 100% { opacity:1; transform:translateY(0); } }
    .delay-1 { animation-delay:0.08s; }
    .delay-2 { animation-delay:0.16s; }
    @media (prefers-reduced-motion:reduce) { .animate-in { animation:none; opacity:1; transform:none; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card animate-in">
      <div class="accent-bar"></div>
      <div class="brand"><span class="brand-mark" aria-hidden="true"></span><span>ClubOS</span></div>
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

try {
  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    subject,
    text: 'ClubOS test email — Resend is wired up.',
    html: shell,
  });

  if (error) {
    console.error('Resend error:', error.message, error.data);
    process.exit(1);
  }

  console.log('Sent.');
  console.log('Email ID:', data?.id);
  console.log('To:', to);
  console.log('Subject:', subject);
} catch (err) {
  console.error('Unexpected error:', err);
  process.exit(1);
}
