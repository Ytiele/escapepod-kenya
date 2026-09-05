import { NextRequest, NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { supabaseAdmin } from '@/lib/supabase';
import { getImapConfig } from '@/lib/mail';

export const dynamic = 'force-dynamic';

// Triggered on a schedule (see .env.local.example for the required env
// vars, and vercel.json for the default Vercel Cron wiring) to pull an
// admin's email reply back into the traveler-facing chat panel on
// app/bookings/[reference]. Protected by CRON_SECRET since
// it has no traveler session to check — only whoever holds that secret
// (your scheduler) may trigger it. Accepts the secret either as a bearer
// token (Vercel Cron's convention) or a `?secret=` query param (for
// schedulers that can't set custom headers, e.g. cron-job.org can, but
// some simpler ones can't).
function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = req.headers.get('authorization');
  if (header === `Bearer ${expected}`) return true;
  return req.nextUrl.searchParams.get('secret') === expected;
}

const REFERENCE_RE = /EK-\d{6}/;
const MAX_MESSAGE_CHARS = 4000;

// Best-effort trim of quoted history below an admin's actual new reply
// text. Email clients vary wildly in how they mark this, so this covers
// the most common patterns; if none match, the whole body is kept as-is
// rather than risk cutting off a real reply.
function stripQuotedReply(text: string): string {
  const markers = [
    /\n[ \t]*On .{0,150} wrote:[ \t]*\n[\s\S]*$/i,
    /\n-{2,}[ \t]*Original Message[ \t]*-{2,}[\s\S]*$/i,
    /\nFrom:.*\nSent:.*\nTo:[\s\S]*$/i,
    /\n>.*[\s\S]*$/,
  ];
  let result = text;
  for (const marker of markers) {
    const match = result.match(marker);
    if (match && typeof match.index === 'number' && match.index > 0) {
      result = result.slice(0, match.index);
    }
  }
  return result.trim();
}

// Vercel Cron always issues a GET request (and automatically attaches
// `Authorization: Bearer $CRON_SECRET` when that env var is set on the
// project — matching isAuthorized above). POST is also exposed for
// schedulers that prefer to trigger via POST instead.
export async function GET(req: NextRequest) {
  return handlePoll(req);
}

export async function POST(req: NextRequest) {
  return handlePoll(req);
}

async function handlePoll(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = getImapConfig();
  if (!config) {
    return NextResponse.json({ error: 'IMAP is not configured.' }, { status: 503 });
  }

  const { data: state } = await supabaseAdmin
    .from('imap_poll_state')
    .select('last_uid')
    .eq('id', 'default')
    .maybeSingle();

  const client = new ImapFlow({ ...config, logger: false });
  let imported = 0;
  const skipped: string[] = [];

  try {
    await client.connect();

    // First-ever run: there's no baseline yet. Rather than importing this
    // mailbox's entire history (slow, and old mail could coincidentally
    // contain an "EK-XXXXXX"-looking string), record the current high-water
    // mark and start processing from the next poll onward.
    if (!state) {
      const status = await client.status('INBOX', { uidNext: true });
      const baseline = (status.uidNext ?? 1) - 1;
      await supabaseAdmin.from('imap_poll_state').insert({ id: 'default', last_uid: baseline });
      return NextResponse.json({ initialized: true, baseline, imported: 0, skipped: [] });
    }

    const lock = await client.getMailboxLock('INBOX');
    let maxUidSeen = state.last_uid;
    try {
      for await (const msg of client.fetch(
        `${state.last_uid + 1}:*`,
        { envelope: true, source: true, uid: true },
        { uid: true }
      )) {
        if (msg.uid <= state.last_uid) continue; // '*' can echo the last existing message even above range
        if (msg.uid > maxUidSeen) maxUidSeen = msg.uid;

        const subject = msg.envelope?.subject ?? '';
        const refMatch = subject.match(REFERENCE_RE);
        if (!refMatch) { skipped.push(`uid ${msg.uid}: no booking reference in subject`); continue; }
        const reference = refMatch[0];

        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('id, traveler_id')
          .eq('reference', reference)
          .maybeSingle();
        if (!booking) { skipped.push(`uid ${msg.uid}: no booking found for ${reference}`); continue; }

        if (!msg.source) { skipped.push(`uid ${msg.uid}: no source available`); continue; }
        const parsed = await simpleParser(msg.source);
        const bodyText = (parsed.text ?? '').trim();
        if (!bodyText) { skipped.push(`uid ${msg.uid}: empty body`); continue; }

        const message = stripQuotedReply(bodyText).slice(0, MAX_MESSAGE_CHARS);
        if (!message) { skipped.push(`uid ${msg.uid}: nothing left after trimming quoted text`); continue; }

        const { error: insertError } = await supabaseAdmin.from('booking_messages').insert({
          booking_id: booking.id,
          traveler_id: booking.traveler_id,
          message,
          sender: 'admin',
        });
        if (insertError) { skipped.push(`uid ${msg.uid}: insert failed — ${insertError.message}`); continue; }
        imported++;
      }
    } finally {
      lock.release();
    }

    if (maxUidSeen > state.last_uid) {
      await supabaseAdmin
        .from('imap_poll_state')
        .update({ last_uid: maxUidSeen, updated_at: new Date().toISOString() })
        .eq('id', 'default');
    }
  } catch (err) {
    console.error('[poll-inbox] failed', err);
    return NextResponse.json({ error: 'Inbox poll failed.' }, { status: 500 });
  } finally {
    await client.logout().catch(() => {});
  }

  return NextResponse.json({ imported, skipped });
}
