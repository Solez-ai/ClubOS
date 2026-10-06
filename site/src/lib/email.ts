// ClubOS transactional email layer.
// Sends via the Resend REST API (no SDK dependency) when RESEND_API_KEY is configured.
// Every send is also recorded in the `email_notifications` table for the organizer audit trail.

import { createClient } from '@supabase/supabase-js';

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'ClubOS <onboarding@resend.dev>';

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

interface Template {
  subject: string;
  text: string;
}

function renderRegistrationConfirmation(data: RegistrationEmailData): Template {
  const segmentsList = data.segments.length
    ? data.segments
        .map((s) => `  • ${s.title} — ${s.isFree ? 'Free' : `BDT ${s.price.toLocaleString()}`}`)
        .join('\n')
    : '  • (none)';

  const paymentSection =
    data.totalPrice > 0
      ? `Payment Required: BDT ${data.totalPrice.toLocaleString()}
Payment Method: ${data.paymentMethod || 'N/A'}

Please complete your payment to confirm your registration.`
      : `This registration is free. No payment required.`;

  return {
    subject: `Registration Confirmed: ${data.eventTitle}${data.festTitle ? ` at ${data.festTitle}` : ''}`,
    text: `Welcome to ClubOS!

Your registration for the event has been received. Here are your registration details:

Event: ${data.eventTitle}
Fest: ${data.festTitle || 'N/A'}
Organization: ${data.organizationName || 'N/A'}

Your Ticket ID: ${data.ticketCode}
Registration Date: ${data.registrationDate}

Segments You Registered For:
${segmentsList}

${paymentSection}

What's Next?
1. If payment is required, complete the payment using the method provided on the event page.
2. Wait for organizer verification (for paid events).
3. Check your email for the final confirmation.

Need Help?
Contact the event organizer or visit the event page for more information.

Thank you for registering!
ClubOS Team`,
  };
}

function renderPaymentVerified(data: VerifyEmailData): Template {
  return {
    subject: `Payment Verified: ${data.eventTitle}`,
    text: `Great news! Your payment has been verified and your registration is confirmed.

Event: ${data.eventTitle}
Fest: ${data.festTitle || 'N/A'}

Your Ticket ID: ${data.ticketCode}

You're all set! Make sure to bring your ticket (digital or printed) to the event.

Event Details:
Date: ${data.eventDate}
Venue: ${data.venue}
Time: ${data.eventTime}

We look forward to seeing you there!

ClubOS Team`,
  };
}

function renderPaymentDeclined(data: DeclineEmailData): Template {
  return {
    subject: `Registration Declined: ${data.eventTitle}`,
    text: `We're sorry to inform you that your registration for the event has been declined.

Event: ${data.eventTitle}

Reason for Decline:
${data.declineReason}

If you believe this was a mistake, please contact the event organizer for clarification.

Your Ticket ID: ${data.ticketCode}

You can register again for future events on ClubOS.

ClubOS Team`,
  };
}

/**
 * Low-level sender. Uses Resend when RESEND_API_KEY is present;
 * otherwise falls back to console logging (useful in local dev / preview).
 */
export async function sendEmail(
  to: string | undefined,
  subject: string | undefined,
  body: string | undefined
): Promise<boolean> {
  if (!to || !subject || !body) return false;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(`[EMAIL] RESEND_API_KEY not set — email not sent. To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[EMAIL] Resend API error ${res.status}: ${errText}`);
      return false;
    }

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
    await admin.from('email_notifications').insert({
      user_id: params.userId ?? null,
      event_id: params.eventId ?? null,
      registration_id: params.registrationId ?? null,
      email_type: params.emailType,
      subject: params.subject,
      body: params.body,
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
  const { subject, text } = renderRegistrationConfirmation(data);
  const sent = await sendEmail(email, subject, text);
  await recordEmailLog({ emailType: 'registration_confirmation', subject, body: text, sent });
  return sent;
}

export async function sendPaymentVerified(
  email: string,
  data: VerifyEmailData
): Promise<boolean> {
  const { subject, text } = renderPaymentVerified(data);
  const sent = await sendEmail(email, subject, text);
  await recordEmailLog({ emailType: 'payment_verified', subject, body: text, sent });
  return sent;
}

export async function sendPaymentDecline(
  email: string,
  data: DeclineEmailData
): Promise<boolean> {
  const { subject, text } = renderPaymentDeclined(data);
  const sent = await sendEmail(email, subject, text);
  await recordEmailLog({ emailType: 'payment_declined', subject, body: text, sent });
  return sent;
}
