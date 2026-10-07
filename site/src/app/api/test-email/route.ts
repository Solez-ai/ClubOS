import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { shell, esc } from '@/lib/email';

export async function POST(request: NextRequest) {
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
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'RESEND_API_KEY is not configured on this deployment.' },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);
    const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'ClubOS <onboarding@resend.dev>';
    const subject = 'ClubOS test email — if you see this, Resend is wired up';
    const preheader = 'ClubOS test email — Resend is wired up.';

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

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      text: 'ClubOS test email — Resend is wired up.',
      html: shell({ subject, bodyHtml, preheader }),
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || 'Resend send failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('[email-test-standalone] failed:', err);
    return NextResponse.json({ error: 'Test email failed' }, { status: 500 });
  }
}
