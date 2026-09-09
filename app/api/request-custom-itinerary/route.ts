import { NextRequest, NextResponse } from 'next/server';
import { resolveSession, setSessionCookies } from '@/lib/session';
import { getMailTransport, BOOKING_RECIPIENT, customerEmailShell } from '@/lib/mail';
import { checkRateLimit, clip, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';
import { summarizeConversation } from '@/lib/curationSummary';

// The "Request Pricing" CTA on a custom itinerary card (see
// build_custom_direction_cards in app/api/curate/route.ts) — the card
// itself is built from the locations/hotels scouting catalogue, which
// carries no pricing or availability, so there's no `experiences` row to
// book against the way /api/book-experience works. This just forwards the
// request to the team by email, the same way the Curation Engine's own
// submit_custom_itinerary_request tool does when the AI initiates it —
// this route exists so the card's own button can do the same thing
// directly, without needing another AI turn. No `bookings` row is created
// here; there's no real price or confirmed listing yet for one to hold.
export async function POST(request: NextRequest) {
  const { user, refreshed } = await resolveSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to request pricing.' }, { status: 401 });
  }

  let body: {
    destination?: string;
    packageName?: string;
    numTravelers?: number;
    startDate?: string;
    accommodation?: string[];
    keyActivities?: string[];
    conversation?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const destination = clip(String(body.destination ?? '').trim(), 200);
  if (!destination) {
    return NextResponse.json({ error: 'Missing destination.' }, { status: 400 });
  }

  // Best-effort — kicked off now so it runs concurrently with everything
  // below rather than adding its own latency before the email goes out.
  // Never blocks the request itself: see summarizeConversation's own
  // failure handling.
  const conversationSummaryPromise = summarizeConversation(body.conversation);
  const packageName = clip(String(body.packageName ?? destination).trim(), 200);
  const numTravelers = Number.isInteger(body.numTravelers) && (body.numTravelers as number) >= 1 && (body.numTravelers as number) <= 20
    ? (body.numTravelers as number)
    : 1;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const startDate = typeof body.startDate === 'string' && DATE_RE.test(body.startDate) && !Number.isNaN(Date.parse(body.startDate))
    ? body.startDate
    : null;
  const accommodation = Array.isArray(body.accommodation) ? body.accommodation.map(String).slice(0, 5) : [];
  const keyActivities = Array.isArray(body.keyActivities) ? body.keyActivities.map(String).slice(0, 8) : [];

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`request-custom-itinerary:ip:${ip}`, 600, 10))) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  const transport = getMailTransport();
  if (!transport) {
    console.error('[request-custom-itinerary] SMTP is not configured — cannot forward request');
    return NextResponse.json({ error: 'Forwarding is temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }

  const conversationSummary = await conversationSummaryPromise;

  try {
    await transport.sendMail({
      from: `"EscapePod Curation Engine" <${process.env.SMTP_USER}>`,
      to: BOOKING_RECIPIENT,
      replyTo: user.email,
      subject: `Custom Itinerary Pricing Request — ${destination} — ${user.name}`,
      text: [
        `A traveler requested pricing for a custom itinerary card (destination outside the verified catalogue).`,
        ``,
        `Traveler: ${user.name} <${user.email}>`,
        `Destination: ${destination}`,
        `Package: ${packageName}`,
        `Travelers: ${numTravelers}`,
        `Requested start date: ${startDate ?? 'not specified'}`,
        `Candidate accommodation: ${accommodation.join(', ') || '—'}`,
        `Signature activities: ${keyActivities.join(', ') || '—'}`,
        ...(conversationSummary ? ['', `Conversation summary:`, conversationSummary] : []),
      ].join('\n'),
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #0A1F3C;">Custom Itinerary Pricing Request</h2>
          <p style="margin: 0 0 4px;"><strong>${escapeHtml(user.name)}</strong> — ${escapeHtml(user.email)}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            <tr><td style="padding: 6px 0; color: #888;">Destination</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(destination)}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Package</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(packageName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Travelers</td><td style="padding: 6px 0; font-weight: 600;">${numTravelers}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Requested start date</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(startDate ?? 'not specified')}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Candidate accommodation</td><td style="padding: 6px 0;">${escapeHtml(accommodation.join(', ') || '—')}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Signature activities</td><td style="padding: 6px 0;">${escapeHtml(keyActivities.join(', ') || '—')}</td></tr>
          </table>
          ${conversationSummary ? `
          <h3 style="color: #0A1F3C; margin-top: 20px;">Conversation Summary</h3>
          <p style="margin: 0; color: #333; white-space: pre-wrap;">${escapeHtml(conversationSummary)}</p>
          ` : ''}
        </div>
      `,
    });
  } catch (err) {
    console.error('[request-custom-itinerary] failed to send email', err);
    return NextResponse.json({ error: 'Something went wrong sending your request. Please try again.' }, { status: 500 });
  }

  // Customer-facing confirmation — sent immediately so the traveler knows
  // their pricing request actually went through. A failure here shouldn't
  // fail the request itself, since the team notification above already
  // succeeded.
  try {
    await transport.sendMail({
      from: `"EscapePod Kenya" <${process.env.SMTP_USER}>`,
      to: user.email,
      replyTo: BOOKING_RECIPIENT,
      subject: `Request Received — ${destination}`,
      text: [
        `Hi ${user.name},`,
        ``,
        `Thanks for your interest in ${destination} — we've received your request.`,
        ``,
        `This destination isn't in our verified, priced catalogue yet, so a travel designer will build a real, priced itinerary by hand and follow up by email within 24 hours.`,
        ``,
        `Package: ${packageName}`,
        `Travelers: ${numTravelers}`,
        `Requested start date: ${startDate ?? 'not specified'}`,
        ``,
        `Warmly,`,
        `The EscapePod Kenya Team`,
      ].join('\n'),
      html: customerEmailShell(
        'Request Received',
        `
          <p style="margin: 0 0 16px;">Hi ${escapeHtml(user.name)}, thanks for your interest in ${escapeHtml(destination)} — we've received your request.</p>
          <p style="margin: 0 0 16px;">This destination isn't in our verified, priced catalogue yet, so a travel designer will build a real, priced itinerary by hand and follow up by email within 24 hours.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #888;">Package</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(packageName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Travelers</td><td style="padding: 6px 0; font-weight: 600;">${numTravelers}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Requested start date</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(startDate ?? 'not specified')}</td></tr>
          </table>
        `
      ),
    });
  } catch (err) {
    console.error('[request-custom-itinerary] failed to send customer confirmation email', err);
  }

  const response = NextResponse.json({ ok: true });
  if (refreshed) setSessionCookies(response, refreshed);
  return response;
}
