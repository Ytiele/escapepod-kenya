import { NextRequest } from 'next/server';
import { getMailTransport, BOOKING_RECIPIENT, BRAND, customerEmailShell, getLogoAttachment } from '@/lib/mail';
import { checkRateLimit, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';

// Two sequential SMTP sends can push past Vercel's default 10s (Hobby)
// function timeout, which would otherwise surface as a raw 504. 60s is
// Hobby's ceiling.
export const maxDuration = 60;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return Response.json({ error: 'Please enter your email address.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`newsletter:ip:${ip}`, 3600, 5))) {
    return Response.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  const transport = getMailTransport();
  if (!transport) {
    console.error('[newsletter] SMTP is not configured');
    return Response.json(
      { error: 'Signup is temporarily unavailable. Please email sales@escapepodkenya.com directly.' },
      { status: 503 }
    );
  }

  try {
    await transport.sendMail({
      from: `"EscapePod Newsletter" <${process.env.SMTP_USER}>`,
      to: BOOKING_RECIPIENT,
      replyTo: email,
      subject: `New Newsletter Signup — ${email}`,
      attachments: [getLogoAttachment()],
      text: `New "Inner Circle" newsletter signup from the homepage.\n\nEmail: ${email}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 420px; margin: 0 auto; color: ${BRAND.charcoal};">
          <h2 style="color: ${BRAND.navy};">New Newsletter Signup</h2>
          <p style="color: #333;">A visitor joined the Inner Circle dispatch from the homepage.</p>
          <p style="margin-top: 12px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        </div>
      `,
    });

    // Customer-facing acknowledgment — own try/catch: a failure here
    // shouldn't fail the signup itself, since the team was already
    // notified above.
    try {
      await transport.sendMail({
        from: `"EscapePod Kenya" <${process.env.SMTP_USER}>`,
        to: email,
        replyTo: BOOKING_RECIPIENT,
        subject: `You're on the list`,
        attachments: [getLogoAttachment()],
        text: [
          `Hi there,`,
          ``,
          `You're on the list — welcome to the EscapePod Inner Circle.`,
          ``,
          `Expect something worth reading, never noise: journal entries, new pre-planned journeys, and the occasional note from the team.`,
          ``,
          `Warmly,`,
          `The EscapePod Kenya Team`,
        ].join('\n'),
        html: customerEmailShell(
          "You're on the list",
          `
            <p style="margin: 0 0 16px;">Hi there,</p>
            <p style="margin: 0 0 16px;">You're on the list — welcome to the EscapePod Inner Circle.</p>
            <p style="margin: 0;">Expect something worth reading, never noise: journal entries, new pre-planned journeys, and the occasional note from the team.</p>
          `
        ),
      });
    } catch (err) {
      console.error('[newsletter] failed to send subscriber confirmation', err);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[newsletter]', err);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
