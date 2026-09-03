import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { setSessionCookies } from '@/lib/session';

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

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are all required.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
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
