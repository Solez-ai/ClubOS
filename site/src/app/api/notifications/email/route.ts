import { NextResponse } from 'next/server';
import {
  getAdminClient,
  sendRegistrationConfirmation,
  sendPaymentVerified,
  sendPaymentDecline,
} from '@/lib/email';

// In-memory replay guard: only one email per (type, registration) per server instance.
// Serverless instances are ephemeral, so this is best-effort — but it stops casual abuse.
const sentKeys = new Set<string>();

export async function POST(request: Request) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reg, error } = await (admin as any)
      .from('registrations')
      .select(
        `
        *,
        profile:profiles(id, email, full_name),
        event:events(id, title, starts_at, venue, fest:fest_id(title, org:organizations(name))),
        registration_segments(segments(title, price, is_free))
      `
      )
      .eq('id', registrationId)
      .single();

    if (error || !reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const to = reg.profile?.email;
    if (!to) {
      return NextResponse.json({ error: 'Registration has no participant email' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event: any = reg.event || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fest: any = event.fest || {};
    const eventTitle = event.title || 'Event';
    const festTitle = fest.title;
    const organizationName = fest.org?.name;

    let sent = false;

    if (type === 'registration_confirmation') {
      sent = await sendRegistrationConfirmation(to, {
        eventTitle,
        festTitle,
        organizationName,
        ticketCode: reg.ticket_code || '',
        registrationDate: new Date(reg.created_at || Date.now()).toLocaleString('en-BD'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        segments: (reg.registration_segments || []).map((rs: any) => ({
          title: rs.segments?.title || 'Segment',
          isFree: rs.segments?.is_free ?? true,
          price: rs.segments?.price || 0,
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
