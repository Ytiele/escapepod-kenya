import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveSession, setSessionCookies } from '@/lib/session';

// Recent chat history, tied to the authenticated traveler — not the
// device. Replaces the old localStorage-based "Recent plans", which
// obviously couldn't follow a traveler across devices.

// GET — lightweight list for the sidebar. Full transcripts are fetched
// on demand via GET /api/chats/[id] when a traveler actually opens one.
export async function GET(req: NextRequest) {
  const { user, refreshed } = await resolveSession(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('chats')
    .select('id, title, updated_at')
    .eq('traveler_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(8);

  if (error) {
    console.error('[chats] list failed', error);
    return NextResponse.json({ error: 'Could not load chat history.' }, { status: 500 });
  }

  const response = NextResponse.json({ chats: data ?? [] });
  if (refreshed) setSessionCookies(response, refreshed);
  return response;
}

// PUT — upsert a chat (create on first message, update on every exchange
// after). traveler_id always comes from the session, never the client.
export async function PUT(req: NextRequest) {
  const { user, refreshed } = await resolveSession(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { id, title, messages, experiences } = await req.json();
  if (typeof id !== 'string' || !id || typeof title !== 'string' || !title || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid chat payload.' }, { status: 400 });
  }

  // Client-generated ids (a timestamp) are vanishingly unlikely to
  // collide across travelers, but guard against it anyway rather than
  // let an upsert silently reassign someone else's chat.
  const { data: existing } = await supabaseAdmin
    .from('chats')
    .select('traveler_id')
    .eq('id', id)
    .maybeSingle();
  if (existing && existing.traveler_id !== user.id) {
    return NextResponse.json({ error: 'Chat id conflict.' }, { status: 409 });
  }

  const { error } = await supabaseAdmin.from('chats').upsert({
    id,
    traveler_id: user.id,
    title,
    messages,
    experiences: experiences ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[chats] save failed', error);
    return NextResponse.json({ error: 'Could not save chat.' }, { status: 500 });
  }

  // Keep this bounded — prune anything past the most recent 20 for this
  // traveler so history doesn't grow forever.
  const { data: rest } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('traveler_id', user.id)
    .order('updated_at', { ascending: false })
    .range(20, 999);
  if (rest && rest.length > 0) {
    await supabaseAdmin.from('chats').delete().in('id', rest.map((r) => r.id));
  }

  const response = NextResponse.json({ ok: true });
  if (refreshed) setSessionCookies(response, refreshed);
  return response;
}
