import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const ACCESS_COOKIE = 'sb-access-token';
export const REFRESH_COOKIE = 'sb-refresh-token';

const ACCESS_MAX_AGE = 60 * 60;          // 1 hour — matches Supabase's default access token lifetime
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

function toSessionUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): SessionUser {
  return {
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string | undefined) ?? user.email?.split('@')[0] ?? 'Traveler',
  };
}

/**
 * For Route Handlers only (they can set cookies on their response). Reads
 * the access/refresh cookies off `request`, verifies the access token, and
 * transparently refreshes it if expired. Returns the resolved user (or
 * null) plus a `session` payload to persist as cookies on the response —
 * call `applySessionCookies` with it before returning.
 */
export async function resolveSession(request: NextRequest): Promise<{
  user: SessionUser | null;
  refreshed: { access_token: string; refresh_token: string } | null;
}> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (!error && data.user) {
      return { user: toSessionUser(data.user), refreshed: null };
    }
  }

  if (refreshToken) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });
    if (!error && data.user && data.session) {
      return {
        user: toSessionUser(data.user),
        refreshed: { access_token: data.session.access_token, refresh_token: data.session.refresh_token },
      };
    }
  }

  return { user: null, refreshed: null };
}

/** Set the auth cookies on a Route Handler's response. */
export function setSessionCookies(response: NextResponse, session: { access_token: string; refresh_token: string }) {
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: REFRESH_MAX_AGE,
  });
}

/** Clear the auth cookies on a Route Handler's response. */
export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { path: '/', maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { path: '/', maxAge: 0 });
}

/**
 * For Server Components (layouts, pages) — read-only, cannot refresh (Next
 * disallows setting cookies during render). If the access token has
 * expired, this returns null even if a valid refresh token exists; the
 * client-side session check (/api/auth/session) is what keeps the cookies
 * refreshed during active use.
 */
export async function getSessionUserReadOnly(accessToken: string | undefined): Promise<SessionUser | null> {
  if (!accessToken) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return toSessionUser(data.user);
}
