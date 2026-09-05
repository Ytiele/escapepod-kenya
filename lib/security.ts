import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ── HTML escaping ───────────────────────────────────────────────────────
// Every contact-form-style route interpolates traveler-submitted text
// straight into an HTML email body. Escape it so a submitted name/message
// containing markup can't inject links, scripts, or styling into the email
// an EscapePod staffer opens.
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

// Cap length before it ever reaches an email body, a DB row, or the
// Anthropic API — keeps a single field from ballooning a request or email.
export function clip(input: string, max: number): string {
  return input.length > max ? input.slice(0, max) : input;
}

// ── Client IP ────────────────────────────────────────────────────────────
// Vercel (and most reverse proxies) set x-forwarded-for; NextRequest has no
// built-in `.ip` in the App Router, so this is the standard way to get it.
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

// ── Rate limiting ────────────────────────────────────────────────────────
// Backed by the `rate_limits` table + `rate_limit_hit` function — see
// scripts/rate-limit-schema.sql. Fails open on a DB error (logs and allows
// the request) so an infra hiccup here never takes down the whole site.
export async function checkRateLimit(key: string, windowSeconds: number, max: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('rate_limit_hit', {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) {
    console.error('[security] rate limit check failed — failing open', error);
    return true;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row?.allowed !== false;
}

export const RATE_LIMIT_MESSAGE = 'Too many requests — please wait a few minutes and try again.';

// ── No-store for per-user responses ─────────────────────────────────────
// Next's own Route Handlers aren't cached by default, but a CDN/WAF sitting
// in front of the deployment (proxies, edge caches) may still cache a GET
// JSON response unless the origin explicitly says not to — which would
// serve one traveler's personalized data (bookings, chats, session) to
// whoever hits that edge node next, or serve a stale copy that misses a
// just-created row. Apply to every route that returns data scoped to the
// requesting session.
export function noStore(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  return response;
}
