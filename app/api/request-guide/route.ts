import { NextRequest } from 'next/server';
import { getMailTransport, BOOKING_RECIPIENT, customerEmailShell } from '@/lib/mail';
import { checkRateLimit, clip, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';

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

  const name = body.name?.trim() ? clip(body.name.trim(), 120) : undefined;
  const email = body.email?.trim();
  const phone = body.phone?.trim() ? clip(body.phone.trim(), 40) : undefined;
  const guideType = body.guideType?.trim() ? clip(body.guideType.trim(), 60) : undefined;
  const otherDescription = body.otherDescription?.trim() ? clip(body.otherDescription.trim(), 500) : undefined;

  if (!name || !email || !guideType) {
    return Response.json({ error: 'Name, email, and type of guide are all required.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }
  if (guideType === 'Other' && !otherDescription) {
    return Response.json({ error: 'Please describe the kind of guide you need.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`request-guide:ip:${ip}`, 600, 5))) {
    return Response.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
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
            <tr><td style="padding: 8px 0; color: #888;">Name</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Phone / WhatsApp</td><td style="padding: 8px 0;">${escapeHtml(phone || '—')}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Type of Guide</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(guideDescription)}</td></tr>
          </table>
        </div>
      `,
    });
    // Customer-facing confirmation — sent immediately, right after the team
    // notification above, so whoever just asked for a guide isn't left
    // wondering whether it went through. Own try/catch: a failure here
    // shouldn't fail the request itself, since the team was already notified.
    try {
      await transport.sendMail({
        from: `"EscapePod Kenya" <${process.env.SMTP_USER}>`,
        to: email,
        replyTo: BOOKING_RECIPIENT,
        subject: `Private Guide Request Received`,
        text: [
          `Hi ${name},`,
          ``,
          `We've received your private guide request (${guideDescription}).`,
          ``,
          `Someone from our team will follow up by email or WhatsApp shortly to confirm availability.`,
          ``,
          `Warmly,`,
          `The EscapePod Kenya Team`,
        ].join('\n'),
        html: customerEmailShell(
          'Private Guide Request Received',
          `
            <p style="margin: 0 0 16px;">Hi ${escapeHtml(name)}, we've received your private guide request.</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #888;">Type of Guide</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(guideDescription)}</td></tr>
            </table>
            <p style="margin: 16px 0 0;">Someone from our team will follow up by email or WhatsApp shortly to confirm availability.</p>
          `
        ),
      });
    } catch (err) {
      console.error('[request-guide] failed to send customer confirmation email', err);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[request-guide]', err);
    return Response.json({ error: 'Something went wrong sending your request. Please try again.' }, { status: 500 });
  }
}
