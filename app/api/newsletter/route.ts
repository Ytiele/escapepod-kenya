import { NextRequest } from 'next/server';
import { getMailTransport, BOOKING_RECIPIENT } from '@/lib/mail';
import { checkRateLimit, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';

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
      text: `New "Inner Circle" newsletter signup from the homepage.\n\nEmail: ${email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
          <h2 style="color: #0A1F3C;">New Newsletter Signup</h2>
          <p style="color: #333;">A visitor joined the Inner Circle dispatch from the homepage.</p>
          <p style="margin-top: 12px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        </div>
      `,
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[newsletter]', err);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
