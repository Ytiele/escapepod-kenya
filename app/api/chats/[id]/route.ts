import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveSession, setSessionCookies } from '@/lib/session';

interface Params {
  params: Promise<{ id: string }>;
}

// GET — full transcript for one chat, fetched only when a traveler opens
// it from the "Recent plans" sidebar. Scoped to traveler_id so nobody can
// read another traveler's chat just by guessing/incrementing an id.
export async function GET(req: NextRequest, { params }: Params) {
  const { user, refreshed } = await resolveSession(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('chats')
    .select('id, title, messages, experiences')
    .eq('id', id)
    .eq('traveler_id', user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Chat not found.' }, { status: 404 });
  }

  const response = NextResponse.json({ chat: data });
  if (refreshed) setSessionCookies(response, refreshed);
  return response;
}
