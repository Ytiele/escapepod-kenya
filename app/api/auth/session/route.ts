import { NextRequest, NextResponse } from 'next/server';
import { resolveSession, setSessionCookies } from '@/lib/session';
import { noStore } from '@/lib/security';

// Never prerendered/cached at the Next.js level, and explicitly no-store
// on the response — see lib/security.ts noStore(). Critical here in
// particular: a cached response would mean whoever hits a stale copy gets
// told they're signed in as somebody else (or as nobody).
export const dynamic = 'force-dynamic';

// Called by the client to check login status. Also the point where an
// expiring access token gets transparently refreshed — Server Components
// (like the /engine layout guard) can't set cookies, so this endpoint is
// what keeps an active session alive past the 1-hour access-token window.
export async function GET(request: NextRequest) {
  const { user, refreshed } = await resolveSession(request);

  const response = NextResponse.json({ user });
  if (refreshed) setSessionCookies(response, refreshed);
  return noStore(response);
}
