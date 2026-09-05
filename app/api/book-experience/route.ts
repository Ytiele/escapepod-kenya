import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveSession, setSessionCookies } from '@/lib/session';
import { getMailTransport, BOOKING_RECIPIENT } from '@/lib/mail';
import { checkRateLimit, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';
import { addDays, generateBookingReference } from '@/lib/bookings';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// The "Book This Journey" CTA. Always re-fetches the traveler's profile and
// the experience straight from Supabase using the authenticated session —
// never trusts client-submitted profile data for the record we send out.
//
// This creates the actual `bookings` row (the traveler's durable, comeback-
// able record — see app/bookings/[reference]/page.tsx) and only then
// best-effort notifies the team by email; a mail hiccup never loses the
// booking itself. Price/dates here are an initial estimate — a travel
// designer confirms everything within 24 hours and the record gets
// updated from there (see scripts/bookings-schema.sql for how, until
// there's an admin UI for it).
export async function POST(request: NextRequest) {
  const { user, refreshed } = await resolveSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to book a journey.' }, { status: 401 });
  }

  let body: { experienceId?: string; numTravelers?: number; startDate?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.experienceId) {
    return NextResponse.json({ error: 'Missing experienceId.' }, { status: 400 });
  }

  const numTravelers = Number.isInteger(body.numTravelers) && (body.numTravelers as number) >= 1 && (body.numTravelers as number) <= 20
    ? (body.numTravelers as number)
    : 1;

  const startDate = typeof body.startDate === 'string' && DATE_RE.test(body.startDate) && !Number.isNaN(Date.parse(body.startDate))
    ? body.startDate
    : null;

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`book-experience:ip:${ip}`, 600, 10))) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  const { data: experience } = await supabaseAdmin
    .from('experiences')
    .select('*')
    .eq('id', body.experienceId)
    .single();

  if (!experience) {
    return NextResponse.json({ error: 'That experience could not be found.' }, { status: 404 });
  }

  const { data: traveler } = await supabaseAdmin
    .from('travelers')
    .select('profile, persona')
    .eq('id', user.id)
    .single();

  const perPersonPrice = experience.price_usd_pp_min ?? experience.price_usd_pp_max ?? 0;
  const totalPriceUsd = perPersonPrice * numTravelers;
  const endDate = startDate && experience.duration_days ? addDays(startDate, experience.duration_days - 1) : null;

  // Retry on the rare reference collision (unique_violation) rather than
  // failing the booking over it.
  let booking = null;
  let insertError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 5 && !booking; attempt++) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        reference: generateBookingReference(),
        traveler_id: user.id,
        experience_id: experience.id,
        package_name: experience.name,
        destination: experience.destination,
        duration_days: experience.duration_days,
        num_travelers: numTravelers,
        start_date: startDate,
        end_date: endDate,
        accommodation: experience.accommodation ?? [],
        included_activities: experience.key_activities ?? [],
        total_price_usd: totalPriceUsd,
      })
      .select()
      .single();
    if (data) { booking = data; break; }
    insertError = error;
    if (error?.code !== '23505') break; // anything but a reference collision — stop retrying
  }

  if (!booking) {
    console.error('[book-experience] could not create booking', JSON.stringify(insertError));
    return NextResponse.json({ error: 'Something went wrong creating your booking. Please try again.' }, { status: 500 });
  }

  const priceRange = experience.price_usd_pp_min && experience.price_usd_pp_max && experience.price_usd_pp_min !== experience.price_usd_pp_max
    ? `$${experience.price_usd_pp_min.toLocaleString()}–$${experience.price_usd_pp_max.toLocaleString()} pp`
    : experience.price_usd_pp_min
      ? `$${experience.price_usd_pp_min.toLocaleString()} pp`
      : 'Price on request';

  const transport = getMailTransport();
  if (transport) {
    transport
      .sendMail({
        from: `"EscapePod Curation Engine" <${process.env.SMTP_USER}>`,
        to: BOOKING_RECIPIENT,
        replyTo: user.email,
        subject: `Booking Request ${booking.reference} — ${experience.name} — ${user.name}`,
        text: [
          `New booking request from the Curation Engine.`,
          ``,
          `Booking reference: ${booking.reference}`,
          `Traveler: ${user.name} <${user.email}>`,
          `Persona: ${traveler?.persona ?? 'unknown'}`,
          `Profile: ${JSON.stringify(traveler?.profile ?? {}, null, 2)}`,
          ``,
          `Experience: ${experience.name} (${experience.id})`,
          `Destination: ${experience.destination}`,
          `Duration: ${experience.duration_days ?? '—'} days`,
          `Travelers: ${numTravelers}`,
          `Requested start date: ${startDate ?? 'not specified'}`,
          `Price: ${priceRange}`,
          `Accommodation: ${(experience.accommodation ?? []).join(', ') || '—'}`,
          `Key activities: ${(experience.key_activities ?? []).join(', ') || '—'}`,
        ].join('\n'),
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #0A1F3C;">New Booking Request — ${escapeHtml(booking.reference)}</h2>
            <h3 style="color: #0A1F3C; margin-bottom: 4px;">Traveler</h3>
            <p style="margin: 0 0 4px;"><strong>${escapeHtml(user.name)}</strong> — ${escapeHtml(user.email)}</p>
            <p style="margin: 0 0 12px; color: #666;">Persona: ${escapeHtml(traveler?.persona ?? 'unknown')}</p>
            <pre style="background: #f4f4f4; padding: 12px; border-radius: 8px; font-size: 12px; white-space: pre-wrap;">${escapeHtml(JSON.stringify(traveler?.profile ?? {}, null, 2))}</pre>

            <h3 style="color: #0A1F3C; margin-top: 20px;">Experience Booked</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #888;">Name</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(experience.name)}</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Destination</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(experience.destination)}</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Duration</td><td style="padding: 6px 0; font-weight: 600;">${experience.duration_days ?? '—'} days</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Travelers</td><td style="padding: 6px 0; font-weight: 600;">${numTravelers}</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Requested start date</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(startDate ?? 'not specified')}</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Price</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(priceRange)}</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Accommodation</td><td style="padding: 6px 0;">${escapeHtml((experience.accommodation ?? []).join(', ') || '—')}</td></tr>
              <tr><td style="padding: 6px 0; color: #888;">Key Activities</td><td style="padding: 6px 0;">${escapeHtml((experience.key_activities ?? []).join(', ') || '—')}</td></tr>
            </table>
          </div>
        `,
      })
      .catch((err) => console.error('[book-experience] failed to send notification email', err));
  } else {
    console.error('[book-experience] SMTP is not configured — skipping notification email');
  }

  const response = NextResponse.json({ ok: true, reference: booking.reference });
  if (refreshed) setSessionCookies(response, refreshed);
  return response;
}
