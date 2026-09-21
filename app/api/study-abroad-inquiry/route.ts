import { NextRequest } from 'next/server';
import { getMailTransport, BOOKING_RECIPIENT, BRAND, customerEmailShell, brandedRow, brandedTable, getLogoAttachment } from '@/lib/mail';
import { checkRateLimit, clip, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';

// Two sequential SMTP sends can push past Vercel's default 10s (Hobby)
// function timeout, which would otherwise surface as a raw 504. 60s is
// Hobby's ceiling.
export const maxDuration = 60;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// The dedicated inquiry form on /study-abroad (both of that page's CTAs
// scroll to it rather than routing to /contact) — an institutional
// program lead, not an individual traveler booking. Forwards to the team
// by email only, same "no instant booking" pattern as book-time/
// request-guide/request-transport/book-tour: no account, no payment, no
// row created anywhere, just a notification + a confirmation to the
// person who submitted it.
export async function POST(request: NextRequest) {
  let body: {
    institution?: string;
    name?: string;
    email?: string;
    phone?: string;
    country?: string;
    groupSize?: string | number;
    timing?: string;
    message?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const institution = body.institution?.trim() ? clip(body.institution.trim(), 200) : undefined;
  const name = body.name?.trim() ? clip(body.name.trim(), 120) : undefined;
  const email = body.email?.trim();
  const phone = body.phone?.trim() ? clip(String(body.phone).trim(), 40) : undefined;
  const country = body.country?.trim() ? clip(body.country.trim(), 60) : undefined;
  const groupSize = body.groupSize !== undefined && body.groupSize !== '' ? clip(String(body.groupSize).trim(), 20) : undefined;
  const timing = body.timing?.trim() ? clip(body.timing.trim(), 120) : undefined;
  const message = body.message?.trim() ? clip(body.message.trim(), 2000) : undefined;

  if (!institution || !name || !email) {
    return Response.json({ error: 'Institution, name, and email are all required.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`study-abroad-inquiry:ip:${ip}`, 600, 5))) {
    return Response.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  const transport = getMailTransport();
  if (!transport) {
    console.error('[study-abroad-inquiry] SMTP is not configured');
    return Response.json(
      { error: 'This form is temporarily unavailable. Please email sales@escapepodkenya.com directly.' },
      { status: 503 }
    );
  }

  try {
    await transport.sendMail({
      from: `"EscapePod Study Abroad" <${process.env.SMTP_USER}>`,
      to: BOOKING_RECIPIENT,
      replyTo: email,
      subject: `Study Abroad Program Inquiry — ${institution}`,
      attachments: [getLogoAttachment()],
      text: [
        `New study abroad / faculty-led program inquiry from the website.`,
        ``,
        `Institution: ${institution}`,
        `Contact: ${name} <${email}>`,
        `Phone: ${phone || '—'}`,
        `Country of interest: ${country || 'not specified'}`,
        `Group size: ${groupSize || 'not specified'}`,
        `Preferred timing: ${timing || 'not specified'}`,
        ``,
        `Program goals:`,
        message || '—',
      ].join('\n'),
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: ${BRAND.charcoal};">
          <h2 style="color: ${BRAND.navy};">New Study Abroad Program Inquiry</h2>
          <p style="margin: 0 0 4px;"><strong>${escapeHtml(name)}</strong> — ${escapeHtml(email)}</p>
          ${brandedTable([
            brandedRow('Institution', escapeHtml(institution)),
            brandedRow('Phone', escapeHtml(phone || '—')),
            brandedRow('Country of interest', escapeHtml(country || 'not specified')),
            brandedRow('Group size', escapeHtml(groupSize || 'not specified')),
            brandedRow('Preferred timing', escapeHtml(timing || 'not specified')),
          ].join(''))}
          ${message ? `
          <h3 style="color: ${BRAND.navy}; margin-top: 20px;">Program Goals</h3>
          <p style="margin: 0; color: #333; white-space: pre-wrap;">${escapeHtml(message)}</p>
          ` : ''}
        </div>
      `,
    });

    // Customer-facing confirmation — own try/catch: a failure here
    // shouldn't fail the inquiry itself, since the team was already
    // notified above.
    try {
      await transport.sendMail({
        from: `"EscapePod Kenya" <${process.env.SMTP_USER}>`,
        to: email,
        replyTo: BOOKING_RECIPIENT,
        subject: `We've Received Your Study Abroad Inquiry`,
        attachments: [getLogoAttachment()],
        text: [
          `Hi ${name},`,
          ``,
          `Thanks for reaching out about a faculty-led study abroad program with EscapePod — we've received your inquiry on behalf of ${institution}.`,
          ``,
          `Our team will follow up by email within 1–2 business days to talk through your goals and next steps.`,
          ``,
          `Warmly,`,
          `The EscapePod Kenya Team`,
        ].join('\n'),
        html: customerEmailShell(
          'Inquiry Received',
          `
            <p style="margin: 0 0 20px;">Hi ${escapeHtml(name)}, thanks for reaching out about a faculty-led study abroad program with EscapePod — we've received your inquiry on behalf of <strong>${escapeHtml(institution)}</strong>.</p>
            <p style="margin: 0;">Our team will follow up by email within 1–2 business days to talk through your goals and next steps.</p>
          `
        ),
      });
    } catch (err) {
      console.error('[study-abroad-inquiry] failed to send customer confirmation email', err);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[study-abroad-inquiry]', err);
    return Response.json({ error: 'Something went wrong sending your inquiry. Please try again.' }, { status: 500 });
  }
}
