import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { setSessionCookies } from '@/lib/session';
import { checkRateLimit, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Please enter your email and password.' }, { status: 400 });
  }

  // Two independent limits: one per IP (stop a spray across many accounts)
  // and one per email (stop repeated guesses against one account from
  // rotating IPs). Generous enough not to bother a real user mistyping a
  // password a couple of times.
  const ip = getClientIp(request);
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, 600, 20),
    checkRateLimit(`login:email:${email}`, 600, 8),
  ]);
  if (!ipOk || !emailOk) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error || !data.session || !data.user) {
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email ?? email,
      name: (data.user.user_metadata?.name as string | undefined) ?? email.split('@')[0],
    },
  });
  setSessionCookies(response, data.session);
  return response;
}
