import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveSession, setSessionCookies } from '@/lib/session';
import { noStore } from '@/lib/security';

// Never prerendered/cached at the Next.js level, and explicitly no-store
// on the response — see lib/security.ts noStore().
export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ reference: string }>;
}

// GET — one booking by its reference, scoped to the authenticated
// traveler so nobody can view another traveler's booking (payment history
// included) just by guessing/incrementing a reference in the URL.
export async function GET(req: NextRequest, { params }: Params) {
  const { user, refreshed } = await resolveSession(req);
  if (!user) {
    return noStore(NextResponse.json({ error: 'Please sign in.' }, { status: 401 }));
  }

  const { reference } = await params;
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('reference', reference)
    .eq('traveler_id', user.id)
    .maybeSingle();

  if (error || !data) {
    return noStore(NextResponse.json({ error: 'Booking not found.' }, { status: 404 }));
  }

  const response = NextResponse.json({ booking: data });
  if (refreshed) setSessionCookies(response, refreshed);
  return noStore(response);
}
