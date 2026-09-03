import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveSession, setSessionCookies } from '@/lib/session';
import { getMailTransport, BOOKING_RECIPIENT } from '@/lib/mail';

// The "Book This Journey" CTA. Always re-fetches the traveler's profile and
// the experience straight from Supabase using the authenticated session —
// never trusts client-submitted profile data for the record we send out.
export async function POST(request: NextRequest) {
  const { user, refreshed } = await resolveSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to book a journey.' }, { status: 401 });
  }

  let body: { experienceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.experienceId) {
    return NextResponse.json({ error: 'Missing experienceId.' }, { status: 400 });
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

  const transport = getMailTransport();
  if (!transport) {
    console.error('[book-experience] SMTP is not configured');
    return NextResponse.json(
      { error: 'Booking is temporarily unavailable. Please email sales@escapepodkenya.com directly.' },
      { status: 503 }
    );
  }

  const priceRange = experience.price_usd_pp_min && experience.price_usd_pp_max && experience.price_usd_pp_min !== experience.price_usd_pp_max
    ? `$${experience.price_usd_pp_min.toLocaleString()}–$${experience.price_usd_pp_max.toLocaleString()} pp`
    : experience.price_usd_pp_min
      ? `$${experience.price_usd_pp_min.toLocaleString()} pp`
      : 'Price on request';

  try {
    await transport.sendMail({
      from: `"EscapePod Curation Engine" <${process.env.SMTP_USER}>`,
      to: BOOKING_RECIPIENT,
      replyTo: user.email,
      subject: `Booking Request — ${experience.name} — ${user.name}`,
      text: [
        `New booking request from the Curation Engine.`,
        ``,
        `Traveler: ${user.name} <${user.email}>`,
        `Persona: ${traveler?.persona ?? 'unknown'}`,
        `Profile: ${JSON.stringify(traveler?.profile ?? {}, null, 2)}`,
        ``,
        `Experience: ${experience.name} (${experience.id})`,
        `Destination: ${experience.destination}`,
        `Duration: ${experience.duration_days ?? '—'} days`,
        `Price: ${priceRange}`,
        `Accommodation: ${(experience.accommodation ?? []).join(', ') || '—'}`,
        `Key activities: ${(experience.key_activities ?? []).join(', ') || '—'}`,
      ].join('\n'),
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #0A1F3C;">New Booking Request — Curation Engine</h2>
          <h3 style="color: #0A1F3C; margin-bottom: 4px;">Traveler</h3>
          <p style="margin: 0 0 4px;"><strong>${user.name}</strong> — ${user.email}</p>
          <p style="margin: 0 0 12px; color: #666;">Persona: ${traveler?.persona ?? 'unknown'}</p>
          <pre style="background: #f4f4f4; padding: 12px; border-radius: 8px; font-size: 12px; white-space: pre-wrap;">${JSON.stringify(traveler?.profile ?? {}, null, 2)}</pre>

          <h3 style="color: #0A1F3C; margin-top: 20px;">Experience Booked</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #888;">Name</td><td style="padding: 6px 0; font-weight: 600;">${experience.name}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Destination</td><td style="padding: 6px 0; font-weight: 600;">${experience.destination}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Duration</td><td style="padding: 6px 0; font-weight: 600;">${experience.duration_days ?? '—'} days</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Price</td><td style="padding: 6px 0; font-weight: 600;">${priceRange}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Accommodation</td><td style="padding: 6px 0;">${(experience.accommodation ?? []).join(', ') || '—'}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">Key Activities</td><td style="padding: 6px 0;">${(experience.key_activities ?? []).join(', ') || '—'}</td></tr>
          </table>
        </div>
      `,
    });

    const response = NextResponse.json({ ok: true });
    if (refreshed) setSessionCookies(response, refreshed);
    return response;
  } catch (err) {
    console.error('[book-experience]', err);
    return NextResponse.json(
      { error: 'Something went wrong sending your booking request. Please try again.' },
      { status: 500 }
    );
  }
}
