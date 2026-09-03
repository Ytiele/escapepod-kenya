import { NextRequest } from 'next/server';
import { getMailTransport, BOOKING_RECIPIENT } from '@/lib/mail';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; phone?: string; guideType?: string; otherDescription?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const guideType = body.guideType?.trim();
  const otherDescription = body.otherDescription?.trim();

  if (!name || !email || !guideType) {
    return Response.json({ error: 'Name, email, and type of guide are all required.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }
  if (guideType === 'Other' && !otherDescription) {
    return Response.json({ error: 'Please describe the kind of guide you need.' }, { status: 400 });
  }

  const transport = getMailTransport();
  if (!transport) {
    console.error('[request-guide] SMTP is not configured');
    return Response.json(
      { error: 'This request is temporarily unavailable. Please email sales@escapepodkenya.com directly.' },
      { status: 503 }
    );
  }

  const guideDescription = guideType === 'Other' ? `Other — ${otherDescription}` : guideType;

  try {
    await transport.sendMail({
      from: `"EscapePod Guide Requests" <${process.env.SMTP_USER}>`,
      to: BOOKING_RECIPIENT,
      replyTo: email,
      subject: `Private Guide Request — ${name}`,
      text: [
        `New private guide request from the website.`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone / WhatsApp: ${phone || '—'}`,
        `Type of guide needed: ${guideDescription}`,
      ].join('\n'),
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0A1F3C;">New Private Guide Request</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            <tr><td style="padding: 8px 0; color: #888;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; font-weight: 600;">${email}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Phone / WhatsApp</td><td style="padding: 8px 0;">${phone || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Type of Guide</td><td style="padding: 8px 0; font-weight: 600;">${guideDescription}</td></tr>
          </table>
        </div>
      `,
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[request-guide]', err);
    return Response.json({ error: 'Something went wrong sending your request. Please try again.' }, { status: 500 });
  }
}
