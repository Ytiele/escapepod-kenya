import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { setSessionCookies } from '@/lib/session';
import { checkRateLimit, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/security';

export async function POST(request: NextRequest) {
  let body: { token_hash?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const tokenHash = body.token_hash?.trim();
  const password = body.password ?? '';

  if (!tokenHash) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`reset-password:ip:${ip}`, 3600, 20))) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  // Consumes the one-time recovery token — a second attempt with the same
  // link will fail here, same as clicking an already-used link twice.
  const { data: verified, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
    type: 'recovery',
    token_hash: tokenHash,
  });
  if (verifyError || !verified.user) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(verified.user.id, { password });
  if (updateError) {
    return NextResponse.json({ error: 'Could not update your password. Please try again.' }, { status: 500 });
  }

  const email = verified.user.email;
  if (!email) {
    return NextResponse.json({ message: 'Password updated — please sign in.' });
  }

  // Sign in fresh with the new password so the traveler lands straight in
  // the app instead of being sent back to the login form.
  const { data: signedIn, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (signInError || !signedIn.session) {
    return NextResponse.json({ message: 'Password updated — please sign in.' });
  }

  const response = NextResponse.json({
    user: {
      id: verified.user.id,
      email,
      name: (verified.user.user_metadata?.name as string | undefined) ?? email.split('@')[0],
    },
  });
  setSessionCookies(response, signedIn.session);
  return response;
}
