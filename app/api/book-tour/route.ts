import { NextRequest } from 'next/server';
import { getMailTransport, BOOKING_RECIPIENT, BRAND, customerEmailShell, brandedRow, brandedTable, brandedButton, getLogoAttachment } from '@/lib/mail';
import { checkRateLimit, clip, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';
import { getTourBySlug } from '@/data/tours';
import { formatUsd } from '@/lib/bookings';

// Two sequential SMTP sends can push past Vercel's default 10s (Hobby)
// function timeout, which would otherwise surface as a raw 504. 60s is
// Hobby's ceiling.
export const maxDuration = 60;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// "Book This Tour" on a pre-planned journey card/detail page (see
// data/tours.ts, components/tours/BookTourDialog.tsx). These are fixed,
// hand-authored itineraries with no `experiences` row and no traveler
// account required — like book-time/request-guide/request-transport,
// this only ever forwards a request to the team by email; no `bookings`
// row is created and no dates are actually held.
export async function POST(request: NextRequest) {
  let body: {
    tourSlug?: string;
    name?: string;
    email?: string;
    phone?: string;
    numTravelers?: number;
    startDate?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // The tour's name/price/duration/destination are always read from our
  // own data, never trusted from the client — the request body only
  // selects which one by slug.
  const tour = typeof body.tourSlug === 'string' ? getTourBySlug(body.tourSlug) : undefined;
  if (!tour) {
    return Response.json({ error: 'That tour could not be found.' }, { status: 404 });
  }

  const name = body.name?.trim() ? clip(body.name.trim(), 120) : undefined;
  const email = body.email?.trim();
  const phone = body.phone?.trim() ? clip(body.phone.trim(), 40) : undefined;
  const numTravelers = Number.isInteger(body.numTravelers) && (body.numTravelers as number) >= 1 && (body.numTravelers as number) <= 20
    ? (body.numTravelers as number)
    : 1;
  const startDate = typeof body.startDate === 'string' && DATE_RE.test(body.startDate) && !Number.isNaN(Date.parse(body.startDate))
    ? body.startDate
    : null;

  if (!name || !email) {
    return Response.json({ error: 'Name and email are required.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`book-tour:ip:${ip}`, 600, 10))) {
    return Response.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  const transport = getMailTransport();
  if (!transport) {
    console.error('[book-tour] SMTP is not configured');
    return Response.json(
      { error: 'Booking is temporarily unavailable. Please email sales@escapepodkenya.com directly.' },
      { status: 503 }
    );
  }

  try {
    await transport.sendMail({
      from: `"EscapePod Tour Requests" <${process.env.SMTP_USER}>`,
      to: BOOKING_RECIPIENT,
      replyTo: email,
      subject: `Pre-Planned Tour Request — ${tour.name} — ${name}`,
      attachments: [getLogoAttachment()],
      text: [
        `New pre-planned tour booking request from the website.`,
        ``,
        `Tour: ${tour.name}`,
        `Destination: ${tour.destination}`,
        `Duration: ${tour.durationDays} days`,
        `Price: ${formatUsd(tour.priceUsdPerPerson)} pp`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone / WhatsApp: ${phone || '—'}`,
        `Travelers: ${numTravelers}`,
        `Requested start date: ${startDate ?? 'not specified'}`,
      ].join('\n'),
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: ${BRAND.charcoal};">
          <h2 style="color: ${BRAND.navy};">New Pre-Planned Tour Request</h2>
          <p style="margin: 0 0 4px;"><strong>${escapeHtml(name)}</strong> — ${escapeHtml(email)}</p>
          <p style="margin: 0 0 12px; color: #666;">Phone / WhatsApp: ${escapeHtml(phone || '—')}</p>
          ${brandedTable([
            brandedRow('Tour', escapeHtml(tour.name)),
            brandedRow('Destination', escapeHtml(tour.destination)),
            brandedRow('Duration', `${tour.durationDays} days`),
            brandedRow('Price', escapeHtml(`${formatUsd(tour.priceUsdPerPerson)} pp`)),
            brandedRow('Travelers', String(numTravelers)),
            brandedRow('Requested start date', escapeHtml(startDate ?? 'not specified')),
          ].join(''))}
        </div>
      `,
    });

    // Customer-facing confirmation — own try/catch: a failure here
    // shouldn't fail the request itself, since the team was already
    // notified above.
    try {
      const origin = request.headers.get('origin') ?? new URL(request.url).origin;
      await transport.sendMail({
        from: `"EscapePod Kenya" <${process.env.SMTP_USER}>`,
        to: email,
        replyTo: BOOKING_RECIPIENT,
        subject: `Request Received — ${tour.name}`,
        attachments: [getLogoAttachment()],
        text: [
          `Hi ${name},`,
          ``,
          `We've received your booking request for ${tour.name} — thank you for choosing EscapePod Kenya.`,
          ``,
          `Destination: ${tour.destination}`,
          `Duration: ${tour.durationDays} days`,
          `Estimated price: ${formatUsd(tour.priceUsdPerPerson)} pp`,
          `Travelers: ${numTravelers}`,
          `Requested start date: ${startDate ?? 'not specified'}`,
          ``,
          `A travel designer will confirm availability, pricing, and every detail within 24 hours. No payment has been taken yet.`,
          ``,
          `See the full itinerary: ${origin}/tours/${tour.slug}`,
          ``,
          `Warmly,`,
          `The EscapePod Kenya Team`,
        ].join('\n'),
        html: customerEmailShell(
          'Request Received',
          `
            <p style="margin: 0 0 20px;">Hi ${escapeHtml(name)}, we've received your booking request for <strong>${escapeHtml(tour.name)}</strong> — thank you for choosing EscapePod Kenya.</p>
            ${brandedTable([
              brandedRow('Destination', escapeHtml(tour.destination)),
              brandedRow('Duration', `${tour.durationDays} days`),
              brandedRow('Estimated price', escapeHtml(`${formatUsd(tour.priceUsdPerPerson)} pp`)),
              brandedRow('Travelers', String(numTravelers)),
              brandedRow('Requested start date', escapeHtml(startDate ?? 'not specified')),
            ].join(''))}
            <p style="margin: 20px 0 0;">A travel designer will confirm availability, pricing, and every detail within 24 hours. No payment has been taken yet.</p>
            <p style="margin: 22px 0 0;">
              ${brandedButton(`${origin}/tours/${tour.slug}`, 'View Full Itinerary')}
            </p>
          `
        ),
      });
    } catch (err) {
      console.error('[book-tour] failed to send customer confirmation email', err);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[book-tour]', err);
    return Response.json({ error: 'Something went wrong sending your request. Please try again.' }, { status: 500 });
  }
}
