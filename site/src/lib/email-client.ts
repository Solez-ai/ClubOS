"use client";

// Thin client helper for triggering transactional emails through the
// /api/notifications/email route. The route fetches all dynamic content
// server-side with the service role — clients only pass IDs and a type.

export type NotificationEmailType =
  | 'registration_confirmation'
  | 'payment_verified'
  | 'payment_declined';

export async function notifyRegistrationEmail(
  type: NotificationEmailType,
  registrationId: string,
  extra?: Record<string, unknown>
): Promise<boolean> {
  if (!registrationId) return false;

  try {
    // Uses a relative URL so it works on both localhost and Vercel.
    const res = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, registrationId, ...extra }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`[email-client] request failed (${res.status}): ${body}`);
      return false;
    }

    const data = (await res.json().catch(() => ({ success: false }))) as { success?: boolean } | null;
    return Boolean(data?.success);
  } catch (err) {
    console.warn('[email-client] request error:', err);
    return false;
  }
}
