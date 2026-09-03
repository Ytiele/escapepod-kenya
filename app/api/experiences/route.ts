import { supabaseAdmin } from '@/lib/supabase';

// Read-only, public-safe listing of verified inventory for the Engine's
// sidebar browser. Only exposes display fields — never anything from the
// traveler tables, and never the service-role key itself (that stays in
// lib/supabase.ts, imported only into server-side route handlers like this
// one — it never reaches the browser bundle).
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('experiences')
    .select('id, name, destination, duration_days, price_usd_pp_min, price_usd_pp_max, key_activities, ideal_for')
    .order('destination');

  if (error) {
    console.error('[experiences]', error);
    return Response.json({ error: 'Could not load experiences.' }, { status: 500 });
  }

  return Response.json({ experiences: data ?? [] });
}
