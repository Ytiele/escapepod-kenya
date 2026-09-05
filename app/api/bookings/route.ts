import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveSession, setSessionCookies } from '@/lib/session';

// GET — every booking for the authenticated traveler, newest first.
// Powers the "My Bookings" list (app/bookings/page.tsx). Booking creation
// itself happens in app/api/book-experience/route.ts.
export async function GET(req: NextRequest) {
  const { user, refreshed } = await resolveSession(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('traveler_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[bookings] list failed', error);
    return NextResponse.json({ error: 'Could not load your bookings.' }, { status: 500 });
  }

  const response = NextResponse.json({ bookings: data ?? [] });
  if (refreshed) setSessionCookies(response, refreshed);
  return response;
}
