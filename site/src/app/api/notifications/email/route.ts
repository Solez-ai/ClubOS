import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminClient,
  sendRegistrationConfirmation,
  sendPaymentVerified,
  sendPaymentDecline,
  shell,
  esc,
} from '@/lib/email';

import { Resend } from 'resend';

// Quick self-test endpoint: POST /api/notifications/email/test
// Sends a branded sample email to the address in the JSON body.
// Use it once after deploying to confirm RESEND_API_KEY works in Vercel.
async function sendTestEmail(to: string, apiKey: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY is not configured on this deployment.' };
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
          <span class="panel-value">${esc(to)}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">From</span>
          <span class="panel-value">${esc(FROM_ADDRESS)}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">Sent from</span>
          <span class="panel-value">Vercel deployment</span>
        </div>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      text: 'ClubOS test email — Resend is wired up.',
      html: shell({
        subject,
        bodyHtml,
        preheader: 'ClubOS test email — Resend is wired up.',
      }),
    });

    if (error) {
      return { ok: false, error: error.message || 'Resend send failed' };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error sending test email' };
  }
}

// In-memory replay guard: only one email per (type, registration) per server instance.
// Serverless instances are ephemeral, so this is best-effort — but it stops casual abuse.
const sentKeys = new Set<string>();

export async function POST(request: Request) {
  // Dedicated test endpoint
  if (request.url.endsWith('/test')) {
    try {
      const body = await request.json().catch(() => null);
      const to = body?.to as string | undefined;

      if (!to || !to.includes('@')) {
        return NextResponse.json(
          { error: 'Missing or invalid field: to (email address required)' },
          { status: 400 }
        );
      }

      const apiKey = process.env.RESEND_API_KEY;
      const result = await sendTestEmail(to, apiKey || '');

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: result.error?.includes('not configured') ? 503 : 400 }
        );
      }    return NextResponse.json({ ok: true, id: result.id });
  } catch (err) {
      console.error('[email-test] failed:', err);
      return NextResponse.json({ error: 'Test email failed' }, { status: 500 });
    }
  }

  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Email service not configured (missing SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY)' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const type = body?.type as string | undefined;
    const registrationId = body?.registrationId as string | undefined;

    if (!type || !registrationId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, registrationId' },
        { status: 400 }
      );
    }

    if (!['registration_confirmation', 'payment_verified', 'payment_declined'].includes(type)) {
      return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    const key = `${type}:${registrationId}`;
    if (sentKeys.has(key)) {
      return NextResponse.json({ success: true, deduped: true });
    }

    // Fetch the real registration server-side — the client never supplies email content.
    const { data: reg, error } = await admin
      .from('registrations')
      .select(
        `
        *,
        profile:profiles!registrations_user_id_fkey(id, email, full_name),
        event:events(id, title, starts_at, venue, fest:fest_id(title, org:organizations(name))),
        registration_segments(segments(title, price, is_free))
      `
      )
      .eq('id', registrationId)
      .single();

    if (error || !reg || !reg.profile) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const to = reg.profile?.email;
    if (!to) {
      return NextResponse.json({ error: 'Registration has no participant email' }, { status: 400 });
    }

    const event = reg.event ?? {};
    const fest = event.fest ?? {};
    const eventTitle = event.title ?? 'Event';
    const festTitle = fest.title ?? undefined;
    const organizationName = fest.org?.name ?? undefined;

    let sent = false;

    if (type === 'registration_confirmation') {
      sent = await sendRegistrationConfirmation(to, {
        eventTitle,
        festTitle,
        organizationName,
        ticketCode: reg.ticket_code || '',
        registrationDate: new Date(reg.created_at || Date.now()).toLocaleString('en-BD'),
        segments: (reg.registration_segments ?? []).map((rs: { segments?: { title?: string; price?: number; is_free?: boolean } | null }) => ({
          title: rs.segments?.title ?? 'Segment',
          isFree: rs.segments?.is_free ?? true,
          price: rs.segments?.price ?? 0,
        })),
        totalPrice: reg.total_price || 0,
        paymentMethod: reg.payment_method,
      });
    } else if (type === 'payment_verified') {
      sent = await sendPaymentVerified(to, {
        eventTitle,
        festTitle,
        ticketCode: reg.ticket_code || '',
        eventDate: event.starts_at ? new Date(event.starts_at).toLocaleDateString('en-BD') : 'TBA',
        venue: event.venue || 'TBA',
        eventTime: event.starts_at ? new Date(event.starts_at).toLocaleTimeString('en-BD') : 'TBA',
      });
    } else if (type === 'payment_declined') {
      sent = await sendPaymentDecline(to, {
        eventTitle,
        ticketCode: reg.ticket_code || '',
        declineReason: body?.declineReason || 'Contact the event organizer for details.',
      });
    }

    sentKeys.add(key);
    return NextResponse.json({ success: sent });
  } catch (err) {
    console.error('[email-route] failed:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
