import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { setSessionCookies } from '@/lib/session';
import { checkRateLimit, clip, escapeHtml, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';
import { getMailTransport, BOOKING_RECIPIENT } from '@/lib/mail';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = body.name?.trim() ? clip(body.name.trim(), 120) : undefined;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are all required.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  // Cap account creation per IP — stops a script from mass-creating
  // accounts (spam, or to farm around the opener cache/other per-account
  // limits elsewhere).
  const ip = getClientIp(request);
  if (!(await checkRateLimit(`signup:ip:${ip}`, 3600, 6))) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  // Auto-confirm — no email-verification link step. This product's whole
  // premise is minimal friction, and we already control delivery of every
  // itinerary/booking email ourselves via SMTP.
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError || !created.user) {
    const message = /already.*registered|already.*exists/i.test(createError?.message ?? '')
      ? 'An account with that email already exists.'
      : 'Could not create your account. Please try again.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Seed the traveler profile row, keyed by the auth user's own id — no
  // separate anonymous traveler id needed anywhere in the app.
  await supabaseAdmin.from('travelers').upsert({ id: created.user.id, profile: {} }, { onConflict: 'id' });

  // Notify the team of every new profile, same as booking/guide/transport
  // requests. Never lets a mail hiccup fail the signup itself.
  const transport = getMailTransport();
  if (transport) {
    transport
      .sendMail({
        from: `"EscapePod Sign-ups" <${process.env.SMTP_USER}>`,
        to: BOOKING_RECIPIENT,
        replyTo: email,
        subject: `New Profile Created — ${name}`,
        text: [
          `A new traveler profile was created on escapepodkenya.com.`,
          ``,
          `Name: ${name}`,
          `Email: ${email}`,
          `Created: ${new Date().toISOString()}`,
        ].join('\n'),
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #0A1F3C;">New Profile Created</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <tr><td style="padding: 8px 0; color: #888;">Name</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(name)}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(email)}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Created</td><td style="padding: 8px 0;">${escapeHtml(new Date().toLocaleString())}</td></tr>
            </table>
          </div>
        `,
      })
      .catch((err) => console.error('[signup] failed to send new-profile notification', err));
  } else {
    console.error('[signup] SMTP is not configured — skipping new-profile notification');
  }

  const { data: signedIn, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (signInError || !signedIn.session) {
    return NextResponse.json({ error: 'Account created — please sign in.' }, { status: 201 });
  }

  const response = NextResponse.json({
    user: { id: created.user.id, email, name },
  });
  setSessionCookies(response, signedIn.session);
  return response;
}
