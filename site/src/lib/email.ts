import { createClient } from '@supabase/supabase-js';

// Create admin client for server-side operations
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqekafdcxzipxmbybxmn.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not configured - email sending disabled');
    return null;
  }

  return createClient(supabaseUrl, serviceKey);
}

// Email templates
const EMAILS = {
  registrationConfirmation: {
    subject: (eventTitle: string, festTitle: string) =>
      `Registration Confirmed: ${eventTitle}${festTitle ? ` at ${festTitle}` : ''}`,
    body: (data: RegistrationEmailData) => `
Welcome to ClubOS!

Your registration for the event has been received. Here are your registration details:

Event: ${data.eventTitle}
Fest: ${data.festTitle || 'N/A'}
Organization: ${data.organizationName || 'N/A'}

Your Ticket ID: ${data.ticketCode}
Registration Date: ${data.registrationDate}

Segments You Registered For:
${data.segments.map((s: SegmentData) => `
  • ${s.title} - ${s.isFree ? 'Free' : `BDT ${s.price.toLocaleString()}`}
`).join('\n')}

${data.totalPrice > 0 ? `
Payment Required: BDT ${data.totalPrice.toLocaleString()}
Payment Method: ${data.paymentMethod}

Please complete your payment to confirm your registration.
` : `
This is a free event. No payment required.
`}

What's Next?
1. If payment is required, complete the payment using the method provided
2. Wait for organizer verification (for paid events)
3. Check your email for final confirmation

Need Help?
Contact the event organizer or visit the event page for more information.

Thank you for registering!
ClubOS Team
    `,
  },

  paymentDeclined: {
    subject: (eventTitle: string) =>
      `Registration Declined: ${eventTitle}`,
    body: (data: DeclineEmailData) => `
We're sorry to inform you that your registration for the event has been declined.

Event: ${data.eventTitle}

Reason for Decline:
${data.declineReason}

If you believe this was a mistake, please contact the event organizer for clarification.

Your Ticket ID: ${data.ticketCode}

You can view the event details at our website or contact the organizer directly.

Thank you for your interest in ClubOS events.
    `,
  },

  paymentVerified: {
    subject: (eventTitle: string) =>
      `Payment Verified: ${eventTitle}`,
    body: (data: VerifyEmailData) => `
Great news! Your payment has been verified and your registration is confirmed.

Event: ${data.eventTitle}
Fest: ${data.festTitle || 'N/A'}

Your Ticket ID: ${data.ticketCode}

You're all set! Make sure to bring your ticket (digital or printed) to the event.

Event Details:
Date: ${data.eventDate}
Venue: ${data.venue}
Time: ${data.eventTime}

We look forward to seeing you there!

ClubOS Team
    `,
  },
};

interface RegistrationEmailData {
  eventTitle: string;
  festTitle?: string;
  organizationName?: string;
  ticketCode: string;
  registrationDate: string;
  segments: SegmentData[];
  totalPrice: number;
  paymentMethod?: string;
}

interface SegmentData {
  title: string;
  isFree: boolean;
  price: number;
}

interface DeclineEmailData {
  eventTitle: string;
  ticketCode: string;
  declineReason: string;
}

interface VerifyEmailData {
  eventTitle: string;
  festTitle?: string;
  ticketCode: string;
  eventDate: string;
  venue: string;
  eventTime: string;
}

// Send email using Supabase Edge Function or external service
export async function sendEmail(to: string | undefined, subject: string | undefined, body: string | undefined): Promise<boolean> {
  if (!to || !subject || !body) return false;
  
  // Log for development/demo purposes
  console.log(`[EMAIL] To: ${to}`);
  console.log(`[EMAIL] Subject: ${subject}`);
  console.log(`[EMAIL] Body:\n${body}`);

  // Return success for demo
  return true;
}

// Send registration confirmation email
export async function sendRegistrationConfirmation(
  email: string,
  data: RegistrationEmailData
): Promise<boolean> {
  const subject = EMAILS.registrationConfirmation.subject(data.eventTitle, data.festTitle);
  const body = EMAILS.registrationConfirmation.body(data);
  return sendEmail(email, subject, body);
}

// Send payment decline notification
export async function sendPaymentDecline(
  email: string,
  data: DeclineEmailData
): Promise<boolean> {
  const subject = EMAILS.paymentDeclined.subject(data.eventTitle);
  const body = EMAILS.paymentDeclined.body(data);
  return sendEmail(email, subject, body);
}

// Send payment verified notification
export async function sendPaymentVerified(
  email: string,
  data: VerifyEmailData
): Promise<boolean> {
  const subject = EMAILS.paymentVerified.subject(data.eventTitle);
  const body = EMAILS.paymentVerified.body(data);
  return sendEmail(email, subject, body);
}

// Send email when a registration is created (called from the registration page)
export async function notifyRegistrationCreated(registration: any, event: any, profile: any): Promise<void> {
  if (!profile?.email) return;

  const segments = registration.registration_segments || [];

  const emailData: RegistrationEmailData = {
    eventTitle: event.title,
    festTitle: event.fest?.title,
    organizationName: event.fest?.org?.name,
    ticketCode: registration.ticket_code,
    registrationDate: new Date().toLocaleString('en-BD'),
    segments: segments.map((s: any) => ({
      title: s.segment?.title || 'Segment',
      isFree: s.segment?.is_free ?? true,
      price: s.segment?.price || 0,
    })),
    totalPrice: registration.total_price || 0,
    paymentMethod: registration.payment_method,
  };

  await sendRegistrationConfirmation(profile.email, emailData);

  // Also record the email in the database
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = getAdminClient();
    if (supabase) {
      await supabase.from('email_notifications').insert({
        user_id: profile.id,
        event_id: event.id,
        registration_id: registration.id,
        email_type: 'registration_confirmation',
        subject,
        body,
        sent_at: new Date().toISOString(),
        status: 'sent',
      });
    }
  }
}

// Send email when payment is declined
export async function notifyPaymentDeclined(registration: any, event: any, profile: any, reason: string): Promise<void> {
  if (!profile?.email) return;

  const emailData: DeclineEmailData = {
    eventTitle: event.title,
    ticketCode: registration.ticket_code,
    declineReason: reason,
  };

  await sendPaymentDecline(profile.email, emailData);

  // Record in database
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = getAdminClient();
    if (supabase) {
      await supabase.from('email_notifications').insert({
        user_id: profile.id,
        event_id: event.id,
        registration_id: registration.id,
        email_type: 'payment_declined',
        subject,
        body,
        sent_at: new Date().toISOString(),
        status: 'sent',
      });
    }
  }
}

// Send email when payment is verified
export async function notifyPaymentVerified(registration: any, event: any, profile: any): Promise<void> {
  if (!profile?.email) return;

  const emailData: VerifyEmailData = {
    eventTitle: event.title,
    festTitle: event.fest?.title,
    ticketCode: registration.ticket_code,
    eventDate: event.starts_at ? new Date(event.starts_at).toLocaleDateString('en-BD') : 'TBA',
    venue: event.venue || 'TBA',
    eventTime: event.starts_at ? new Date(event.starts_at).toLocaleTimeString('en-BD') : 'TBA',
  };

  await sendPaymentVerified(profile.email, emailData);

  // Record in database
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = getAdminClient();
    if (supabase) {
      await supabase.from('email_notifications').insert({
        user_id: profile.id,
        event_id: event.id,
        registration_id: registration.id,
        email_type: 'payment_verified',
        subject,
        body,
        sent_at: new Date().toISOString(),
        status: 'sent',
      });
    }
  }
}
