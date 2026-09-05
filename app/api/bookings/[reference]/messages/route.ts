import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveSession, setSessionCookies } from '@/lib/session';
import { getMailTransport, BOOKING_RECIPIENT } from '@/lib/mail';
import { checkRateLimit, clip, escapeHtml, getClientIp, noStore, RATE_LIMIT_MESSAGE } from '@/lib/security';

// Never prerendered/cached at the Next.js level, and explicitly no-store
// on the response — see lib/security.ts noStore().
export const dynamic = 'force-dynamic';

const MAX_MESSAGE_CHARS = 2000;

interface Params {
  params: Promise<{ reference: string }>;
}

// Looks up the booking by reference, scoped to the authenticated
// traveler — the same ownership pattern as every other /api/bookings
// route, so a message can never be attached to (or read from) a booking
// that isn't the caller's own.
async function getOwnedBooking(reference: string, travelerId: string) {
  const { data } = await supabaseAdmin
    .from('bookings')
    .select('id, reference, package_name')
    .eq('reference', reference)
    .eq('traveler_id', travelerId)
    .maybeSingle();
  return data;
}

// GET — message history for one booking, oldest first, so the chat panel
// still has it next time the traveler opens this booking.
export async function GET(req: NextRequest, { params }: Params) {
  const { user, refreshed } = await resolveSession(req);
  if (!user) {
    return noStore(NextResponse.json({ error: 'Please sign in.' }, { status: 401 }));
  }

  const { reference } = await params;
  const booking = await getOwnedBooking(reference, user.id);
  if (!booking) {
    return noStore(NextResponse.json({ error: 'Booking not found.' }, { status: 404 }));
  }

  const { data, error } = await supabaseAdmin
    .from('booking_messages')
    .select('id, message, created_at')
    .eq('booking_id', booking.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[booking-messages] list failed', JSON.stringify(error));
    return noStore(NextResponse.json({ error: 'Could not load messages.' }, { status: 500 }));
  }

  const response = NextResponse.json({ messages: data ?? [] });
  if (refreshed) setSessionCookies(response, refreshed);
  return noStore(response);
}

// POST — send a message about this booking. Stores it (so the traveler
// sees their own history) and best-effort emails the team with reply-to
// set to the traveler's address — the actual reply happens in their
// inbox, not back through this endpoint.
export async function POST(req: NextRequest, { params }: Params) {
  const { user, refreshed } = await resolveSession(req);
  if (!user) {
    return noStore(NextResponse.json({ error: 'Please sign in.' }, { status: 401 }));
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return noStore(NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }));
  }

  const message = body.message?.trim() ? clip(body.message.trim(), MAX_MESSAGE_CHARS) : '';
  if (!message) {
    return noStore(NextResponse.json({ error: 'Please enter a message.' }, { status: 400 }));
  }

  const ip = getClientIp(req);
  const [userOk, ipOk] = await Promise.all([
    checkRateLimit(`booking-message:user:${user.id}`, 600, 10),
    checkRateLimit(`booking-message:ip:${ip}`, 600, 20),
  ]);
  if (!userOk || !ipOk) {
    return noStore(NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 }));
  }

  const { reference } = await params;
  const booking = await getOwnedBooking(reference, user.id);
  if (!booking) {
    return noStore(NextResponse.json({ error: 'Booking not found.' }, { status: 404 }));
  }

  const { data: saved, error } = await supabaseAdmin
    .from('booking_messages')
    .insert({ booking_id: booking.id, traveler_id: user.id, message })
    .select('id, message, created_at')
    .single();

  if (error || !saved) {
    console.error('[booking-messages] insert failed', JSON.stringify(error));
    return noStore(NextResponse.json({ error: 'Could not send your message.' }, { status: 500 }));
  }

  const transport = getMailTransport();
  if (transport) {
    transport
      .sendMail({
        from: `"EscapePod Support" <${process.env.SMTP_USER}>`,
        to: BOOKING_RECIPIENT,
        replyTo: user.email,
        subject: `Booking Message — ${booking.reference} — ${user.name}`,
        text: [
          `New message about a booking from the support chat.`,
          ``,
          `Booking: ${booking.reference} — ${booking.package_name}`,
          `Traveler: ${user.name} <${user.email}>`,
          ``,
          message,
        ].join('\n'),
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #0A1F3C;">New Booking Message — ${escapeHtml(booking.reference)}</h2>
            <p style="margin: 0 0 4px;"><strong>${escapeHtml(user.name)}</strong> — ${escapeHtml(user.email)}</p>
            <p style="margin: 0 0 12px; color: #666;">Re: ${escapeHtml(booking.package_name)}</p>
            <p style="background: #f4f4f4; padding: 12px; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(message)}</p>
            <p style="color: #888; font-size: 12px; margin-top: 16px;">Reply directly to this email to respond to ${escapeHtml(user.name)}.</p>
          </div>
        `,
      })
      .catch((err) => console.error('[booking-messages] failed to send notification email', err));
  } else {
    console.error('[booking-messages] SMTP is not configured — message saved but not emailed');
  }

  const response = NextResponse.json({ message: saved });
  if (refreshed) setSessionCookies(response, refreshed);
  return noStore(response);
}
