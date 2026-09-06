import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { anthropic, MODELS } from '@/lib/anthropic';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp, noStore, RATE_LIMIT_MESSAGE } from '@/lib/security';
import { isLocaleCode, localeName, type LocaleCode } from '@/lib/i18n/languages';

export const dynamic = 'force-dynamic';

// Public — no traveler session required (the language toggle works for a
// signed-out visitor browsing the marketing site), so this is rate-limited
// by IP instead, and capped hard on both request size and text length to
// keep a single request cheap regardless of who's calling it.
const MAX_TEXTS_PER_REQUEST = 80;
const MAX_TEXT_CHARS = 1200;

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await checkRateLimit(`translate:ip:${ip}`, 60, 40))) {
    return noStore(NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 }));
  }

  let body: { texts?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return noStore(NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }));
  }

  if (!isLocaleCode(body.locale) || body.locale === 'en') {
    return noStore(NextResponse.json({ error: 'Invalid locale.' }, { status: 400 }));
  }
  const locale = body.locale;

  if (
    !Array.isArray(body.texts) ||
    body.texts.length === 0 ||
    body.texts.length > MAX_TEXTS_PER_REQUEST ||
    !body.texts.every((t) => typeof t === 'string' && t.length > 0 && t.length <= MAX_TEXT_CHARS)
  ) {
    return noStore(NextResponse.json({ error: 'Invalid texts array.' }, { status: 400 }));
  }
  const texts = body.texts as string[];

  // Dedupe — the same string (a nav label, a button) is often requested
  // many times in one page's worth of <T> components.
  const unique = Array.from(new Set(texts));
  const hashes = unique.map(hashText);

  const { data: cachedRows } = await supabaseAdmin
    .from('translation_cache')
    .select('text_hash, translated_text')
    .eq('locale', locale)
    .in('text_hash', hashes);

  const resolved = new Map<string, string>();
  for (const row of cachedRows ?? []) {
    resolved.set(row.text_hash, row.translated_text);
  }

  const missingIndexes = unique
    .map((text, i) => ({ text, hash: hashes[i] }))
    .filter(({ hash }) => !resolved.has(hash));

  if (missingIndexes.length > 0) {
    try {
      const translated = await translateBatch(
        missingIndexes.map((m) => m.text),
        locale
      );
      const rowsToInsert = missingIndexes.map((m, i) => ({
        text_hash: m.hash,
        locale,
        source_text: m.text,
        translated_text: translated[i] || m.text,
      }));
      rowsToInsert.forEach((row) => resolved.set(row.text_hash, row.translated_text));
      // Best-effort persist — a failure here just means this pair gets
      // translated again next time instead of being served from cache.
      await supabaseAdmin.from('translation_cache').upsert(rowsToInsert, { onConflict: 'text_hash,locale' });
    } catch (err) {
      console.error('[translate] AI translation failed — falling back to source text', err);
      missingIndexes.forEach((m) => resolved.set(m.hash, m.text));
    }
  }

  const translations = texts.map((text) => resolved.get(hashText(text)) ?? text);
  return noStore(NextResponse.json({ translations }));
}

// One batched Claude call per request, regardless of how many unique
// strings need translating — asked to translate meaning, tone, and
// register for a luxury travel brand, not word-for-word, and to hand back
// a strict JSON array so the response can be matched back up by position.
async function translateBatch(texts: string[], locale: LocaleCode): Promise<string[]> {
  const language = localeName(locale);
  const message = await anthropic.messages.create({
    model: MODELS.haiku,
    max_tokens: 4096,
    system:
      `You are a professional translator for EscapePod Kenya, a luxury bespoke travel brand. ` +
      `Translate each string in the JSON array from English into ${language}. ` +
      `Translate for meaning, tone, and natural fluency — the way a native ${language} speaker ` +
      `writing marketing copy or UI text would phrase it — never a literal word-for-word translation. ` +
      `Preserve the register (elegant, warm, confident) and keep placeholders, numbers, proper nouns ` +
      `(brand names, place names like "Maasai Mara" or "Lamu"), and punctuation-only strings unchanged. ` +
      `Respond with ONLY a JSON array of strings, same length and order as the input, no commentary.`,
    messages: [{ role: 'user', content: JSON.stringify(texts) }],
  });

  const block = message.content.find((b) => b.type === 'text');
  const raw = block && block.type === 'text' ? block.text.trim() : '[]';
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  if (!Array.isArray(parsed)) throw new Error('translation response was not an array');

  // Pad/truncate defensively so a malformed response can't desync the
  // position-based mapping back in the caller.
  return texts.map((text, i) => (typeof parsed[i] === 'string' && parsed[i].trim() ? parsed[i] : text));
}
