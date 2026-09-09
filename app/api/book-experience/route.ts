import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveSession, setSessionCookies } from '@/lib/session';
import { getMailTransport, BOOKING_RECIPIENT, BRAND, customerEmailShell, brandedRow, brandedTable, brandedButton, getLogoAttachment } from '@/lib/mail';
import { checkRateLimit, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';
import { addDays, generateBookingReference } from '@/lib/bookings';
import { summarizeConversation } from '@/lib/curationSummary';
import { generateBookingPdf } from '@/lib/pdf/bookingPdf';
import { imageForDestination } from '@/lib/destinations';

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

  let body: { experienceId?: string; numTravelers?: number; startDate?: string; conversation?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.experienceId) {
    return NextResponse.json({ error: 'Missing experienceId.' }, { status: 400 });
  }

  // Best-effort — the engine chat history the traveler had leading up to
  // this booking, condensed into a short briefing note for whoever follows
  // up on it. Never blocks the booking itself: an invalid/missing/oversized
  // conversation (or a failed summarization call) just means the admin
  // email goes out without this section, same as before this existed.
  const conversationSummaryPromise = summarizeConversation(body.conversation);

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

  // Retry on the rare reference collision (unique_violation), and on
  // '42501' (row-level security violation) — empirically, that one has
  // shown up transiently a couple of times against this project's Supabase
  // instance even though supabaseAdmin uses the service key, which should
  // always bypass RLS; a short retry clears it, consistent with a
  // connection-pooler hiccup rather than a real permission problem. Any
  // other error is a genuine failure — stop immediately rather than
  // masking it with retries.
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
    if (error?.code !== '23505' && error?.code !== '42501') break;
    if (error.code === '42501') {
      console.error(`[book-experience] transient RLS error on attempt ${attempt + 1}, retrying`);
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
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

  // Both kicked off before the emails are composed, so they run
  // concurrently rather than adding their own latency in sequence. Both
  // fail open (empty string / null) — see their own files for why.
  const conversationSummary = await conversationSummaryPromise;
  const pdfBuffer = await generateBookingPdf(
    {
      reference: booking.reference,
      packageName: experience.name,
      destination: experience.destination,
      durationDays: experience.duration_days,
      numTravelers,
      startDate,
      priceLabel: priceRange,
      accommodation: experience.accommodation ?? [],
      keyActivities: experience.key_activities ?? [],
      travelerName: user.name,
    },
    imageForDestination(experience.destination)
  );
  const pdfAttachment = pdfBuffer
    ? [{ filename: `EscapePod-Booking-${booking.reference}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    : [];

  const transport = getMailTransport();
  if (transport) {
    // Awaited deliberately — on serverless hosting, a fire-and-forget send
    // here can get killed mid-flight the instant this response goes out.
    // The booking is already saved above regardless of whether this
    // notification succeeds.
    try {
      await transport.sendMail({
        from: `"EscapePod Curation Engine" <${process.env.SMTP_USER}>`,
        to: BOOKING_RECIPIENT,
        replyTo: user.email,
        subject: `Booking Request ${booking.reference} — ${experience.name} — ${user.name}`,
        attachments: [getLogoAttachment(), ...pdfAttachment],
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
          ...(conversationSummary ? ['', `Conversation summary:`, conversationSummary] : []),
        ].join('\n'),
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: ${BRAND.charcoal};">
            <h2 style="color: ${BRAND.navy};">New Booking Request — ${escapeHtml(booking.reference)}</h2>
            <h3 style="color: ${BRAND.navy}; margin-bottom: 4px;">Traveler</h3>
            <p style="margin: 0 0 4px;"><strong>${escapeHtml(user.name)}</strong> — ${escapeHtml(user.email)}</p>
            <p style="margin: 0 0 12px; color: #666;">Persona: ${escapeHtml(traveler?.persona ?? 'unknown')}</p>
            <pre style="background: #f4f4f4; padding: 12px; border-radius: 8px; font-size: 12px; white-space: pre-wrap;">${escapeHtml(JSON.stringify(traveler?.profile ?? {}, null, 2))}</pre>

            <h3 style="color: ${BRAND.navy}; margin-top: 20px;">Experience Booked</h3>
            ${brandedTable([
              brandedRow('Name', escapeHtml(experience.name)),
              brandedRow('Destination', escapeHtml(experience.destination)),
              brandedRow('Duration', `${experience.duration_days ?? '—'} days`),
              brandedRow('Travelers', String(numTravelers)),
              brandedRow('Requested start date', escapeHtml(startDate ?? 'not specified')),
              brandedRow('Price', escapeHtml(priceRange)),
              brandedRow('Accommodation', escapeHtml((experience.accommodation ?? []).join(', ') || '—')),
              brandedRow('Key Activities', escapeHtml((experience.key_activities ?? []).join(', ') || '—')),
            ].join(''))}
            ${conversationSummary ? `
            <h3 style="color: ${BRAND.navy}; margin-top: 20px;">Conversation Summary</h3>
            <p style="margin: 0; color: #333; white-space: pre-wrap;">${escapeHtml(conversationSummary)}</p>
            ` : ''}
            ${pdfAttachment.length > 0 ? `<p style="margin: 16px 0 0; color: #888; font-size: 12px;">A full itinerary PDF is attached.</p>` : ''}
          </div>
        `,
      });
    } catch (err) {
      console.error('[book-experience] failed to send notification email', err);
    }

    // Customer-facing confirmation — sent immediately, alongside the team
    // notification above, so the traveler isn't left wondering whether
    // their booking actually went through. Its own try/catch: a failure
    // here should never fail the booking itself, which is already saved.
    try {
      const origin = request.headers.get('origin') ?? new URL(request.url).origin;
      await transport.sendMail({
        from: `"EscapePod Kenya" <${process.env.SMTP_USER}>`,
        to: user.email,
        replyTo: BOOKING_RECIPIENT,
        subject: `Booking Received — ${booking.reference}`,
        attachments: [getLogoAttachment(), ...pdfAttachment],
        text: [
          `Hi ${user.name},`,
          ``,
          `We've received your booking request — thank you for choosing EscapePod Kenya.`,
          ``,
          `Booking reference: ${booking.reference}`,
          `Journey: ${experience.name}`,
          `Destination: ${experience.destination}`,
          `Duration: ${experience.duration_days ?? '—'} days`,
          `Travelers: ${numTravelers}`,
          `Requested start date: ${startDate ?? 'not specified'}`,
          `Estimated price: ${priceRange}`,
          ``,
          `A travel designer will confirm availability, pricing, and every detail within 24 hours. No payment has been taken yet.`,
          ``,
          `A PDF copy of this itinerary is attached.`,
          ``,
          `Track this booking anytime: ${origin}/bookings/${booking.reference}`,
          ``,
          `Warmly,`,
          `The EscapePod Kenya Team`,
        ].join('\n'),
        html: customerEmailShell(
          'Booking Received',
          `
            <p style="margin: 0 0 20px;">Hi ${escapeHtml(user.name)}, we've received your booking request — thank you for choosing EscapePod Kenya.</p>
            ${brandedTable([
              brandedRow('Booking reference', escapeHtml(booking.reference)),
              brandedRow('Journey', escapeHtml(experience.name)),
              brandedRow('Destination', escapeHtml(experience.destination)),
              brandedRow('Duration', `${experience.duration_days ?? '—'} days`),
              brandedRow('Travelers', String(numTravelers)),
              brandedRow('Requested start date', escapeHtml(startDate ?? 'not specified')),
              brandedRow('Estimated price', escapeHtml(priceRange)),
            ].join(''))}
            <p style="margin: 20px 0 0;">A travel designer will confirm availability, pricing, and every detail within 24 hours. No payment has been taken yet.</p>
            ${pdfAttachment.length > 0 ? `<p style="margin: 12px 0 0; color: rgba(28,28,28,0.6); font-size: 13px;">A beautifully laid-out PDF of your itinerary is attached to this email — save it, print it, or share it with anyone joining you.</p>` : ''}
            <p style="margin: 22px 0 0;">
              ${brandedButton(`${origin}/bookings/${booking.reference}`, 'Track This Booking')}
            </p>
          `
        ),
      });
    } catch (err) {
      console.error('[book-experience] failed to send customer confirmation email', err);
    }
  } else {
    console.error('[book-experience] SMTP is not configured — skipping notification email');
  }

  const response = NextResponse.json({ ok: true, reference: booking.reference });
  if (refreshed) setSessionCookies(response, refreshed);
  return response;
}
