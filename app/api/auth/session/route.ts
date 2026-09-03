import { NextRequest, NextResponse } from 'next/server';
import { resolveSession, setSessionCookies } from '@/lib/session';

// Called by the client to check login status. Also the point where an
// expiring access token gets transparently refreshed — Server Components
// (like the /engine layout guard) can't set cookies, so this endpoint is
// what keeps an active session alive past the 1-hour access-token window.
export async function GET(request: NextRequest) {
  const { user, refreshed } = await resolveSession(request);

  const response = NextResponse.json({ user });
  if (refreshed) setSessionCookies(response, refreshed);
  return response;
}
