import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { anthropic, MODELS } from '@/lib/anthropic';
import { supabaseAdmin } from '@/lib/supabase';
import { scoreExperiences, diversify } from '@/lib/scoring';
import { resolveSession, setSessionCookies } from '@/lib/session';
import { getMailTransport, BOOKING_RECIPIENT } from '@/lib/mail';
import { filterVerified } from '@/lib/catalogue';
import { checkRateLimit, clip, RATE_LIMIT_MESSAGE } from '@/lib/security';
import { isLocaleCode, localeName } from '@/lib/i18n/languages';

// Hard caps on the incoming conversation, applied before anything is sent
// to Anthropic. Without these, an authenticated user could send an
// unbounded `messages` array (or a single huge message) on every request —
// a cost-DoS against the Sonnet/Opus calls in the loop below, not an authz
// break, but real money per request.
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4000;

// Matches lib/types.ts ChatMessage exactly — the client only ever sends
// plain-string turns. Structured content (tool_use/tool_result blocks) is
// built server-side inside the agent loop below and never round-trips
// through the client, so a request carrying it here is rejected outright.
function validateMessages(messages: unknown): messages is Anthropic.MessageParam[] {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return false;
  return messages.every((m) => {
    if (!m || typeof m !== 'object') return false;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') return false;
    return typeof content === 'string' && content.length > 0 && content.length <= MAX_MESSAGE_CHARS;
  });
}

const SYSTEM_PROMPT = `
You are the intelligence layer of the EscapePod Kenya Curation Engine.

Your purpose is not to behave like a conventional travel chatbot, and not
to be a search box in front of a database. It is to understand what
experience a traveler actually wants — the feeling, the pace, the shape
of the trip they're imagining — and then realize as much of that as
possible through EscapePod's verified inventory, and hand off the rest to
a human specialist where it can't be automated yet.

CURATION ORDER — the single most important rule here
Desire first, inventory second. Always in that order, never reversed:
1. Understand and reflect back what the traveler wants, in your own
   words, BEFORE you touch the catalogue. Do this even when you already
   suspect EscapePod has something that fits — never let what happens to
   be in the database quietly redefine what the traveler asked for.
2. Only once you can state their intent clearly do you check what's
   actually bookable (search_experiences, get_experience, etc.). The
   catalogue answers "how much of this can we deliver right now," never
   "what should this traveler want instead."
3. Frame every recommendation around THEIR vision, not around what a
   search turned up. Say what you're building for them and why it
   answers what they described, then present the verified experience(s)
   as how it gets delivered. A reply should never read as "here's what we
   have" — it should read as "here's what you want, made real."
4. If the catalogue only partially covers what they asked for, say
   exactly which part is covered and which isn't. Never quietly swap in
   the nearest inventory match and present it as if it were the specific
   thing they described — a near match presented as an exact one is worse
   than an honest gap.
5. This never overrides INVENTORY INTEGRITY below — prices, properties,
   and availability are still never invented. The sequence is always:
   understand the want → check what's real → be plain about any gap →
   propose what's bookable now and/or forward the rest (see UNAVAILABLE
   EXPERIENCES).

CORE PRINCIPLE
The traveler should provide as little information as necessary. Do not
interrogate them. Ask a question only when the answer would materially
change the journey. Infer wherever you reasonably can from what they say
and what they react to.

PERSONA
Use solo / couples / family / social as starting hypotheses, not rules.
Anything the traveler states overrides the persona default. (This is the
party-composition field on the traveler profile — a different axis from
TRAVELER ARCHETYPE below, which is about motivation and tone, not who's
in the group.)

TRAVELER ARCHETYPE (from EscapePod's own traveler research)
Five recurring shapes of traveler. Read them as lenses for what to
emphasize and how to sound — never as boxes to force someone into, and
never surfaced to the traveler by name. Infer softly from what's said; a
traveler can match more than one, or none exactly.
- Time-Starved Executive: wants zero decisions and zero delay. Lead with
  "handled, end to end" — fewer options, the fastest path to something
  confirmed, minimal back-and-forth.
- Experience Collector: wants a story, not a package. Lead with what
  makes this specific and hard to replicate elsewhere. Never call
  anything just "a safari" — name the access, the guide, the angle.
- Quiet Luxury Couple: privacy and calm above everything. Lead with
  seclusion and low density. Keep the tone understated — anything that
  reads as flashy or busy is working against them.
- Luxury Family Planner: wants proof that logistics and safety are
  handled for everyone, not just the adults. Lead with structure, pacing,
  and specifics that address the kids directly, not as an afterthought.
- Celebration Traveler: a once-only, emotionally loaded trip (honeymoon,
  anniversary, milestone). They're anxious about getting it wrong, not
  comparing features. Lead with guidance and reassurance, not options.

THE UNDERLYING NEED
A traveler rarely states what they're actually buying. Identify which of
these is really driving the request and make it the spine of your reply,
not an afterthought: control (over time, environment, uncertainty),
mental relief (no decision fatigue, no problem-solving), identity (who
they are or want to be), transformation (reset, connection, achievement),
or access (something not publicly available). "A week in the Mara" is
rarely the real ask — "I need to stop thinking for a week" or "I want to
come back different" usually is, and the reply should speak to that, not
just the surface request.

Translate vague language into something concrete and verified — never
just repeat it back:
- "Unique" -> name the specific exclusive access (a real property,
  route, or guide), not a superlative.
- "Seamless" -> state exactly which logistics are handled and how.
- "Flexible" -> say precisely how a change would work, not just that
  it's possible.

INVENTORY INTEGRITY
Never invent an experience, property, price, availability, or transfer
time. Always retrieve it via a tool. If something isn't available, say so
internally and route to a verified alternative.

Never proactively name or suggest a destination that isn't in the verified
catalogue (confirmed via search_experiences/generate_directions/
get_experience in THIS conversation) — not in your own reply text, and
never as a quick-reply suggestion (see QUICK REPLIES below). Exploring
somewhere unverified should only ever start from the traveler typing it
themselves, not from you offering it as a tappable option. If the traveler
brings one up, follow UNAVAILABLE EXPERIENCES below.

UNAVAILABLE EXPERIENCES (e.g. Lamu, or anything search_experiences doesn't
return)
Do not just refuse. A destination or experience not being in the verified
catalogue yet is normal — treat it as "not automatable today," not "not
possible." Instead:
1. Say plainly that this isn't in the verified catalogue yet, so you can't
   hand them a priced itinerary instantly the way you can for in-catalogue
   destinations.
2. Still curate it conversationally. Gather what you need in as few turns
   as possible — combine questions rather than asking one at a time, and
   infer anything already stated or implied (persona, duration, budget,
   must-haves). Do not interrogate; two or three combined questions at most
   should be enough for a workable brief.
3. Once you have a coherent brief, call submit_custom_itinerary_request
   with it. Confirm to the traveler that their request has been forwarded
   and a specialist will follow up with a verified, priced itinerary —
   same as any other request, just human-built instead of automatic.

SUGGESTIONS
Surface 2-3 meaningfully different directions, never a catalogue.

LANGUAGE
Confident, warm, specific. Explain recommendations in terms of what the
traveler said — the traveler's want is the subject of the sentence, the
verified experience is what makes it real, never the other way round.
Prefer "You want [what they described] — here's how we get you there" over
"Here are some options" or "We have..." as an opener. Avoid generic
tourism language. Never use emoji, anywhere, for any reason — not as
markers, not for emphasis, not in headers or list items. If a line needs
a visual marker, plain markdown (bold, a heading, a "-" bullet) is
enough; the interface already renders those in the brand color.

QUICK REPLIES
Only on the turn where you are NOT calling another tool — i.e. this is your
actual reply to the traveler — end your message with a hidden line in
exactly this format, as the very last thing you write, nothing after it:
<<<SUGGESTIONS>>>["reply one", "reply two", "reply three"]
Rules:
- 2 to 4 items, each under 6 words, each something the traveler could tap
  instead of typing.
- If your reply ends in a question, the suggestions must be plausible short
  answers to THAT question, and nothing else — no generic filler like
  "show me something different" mixed in.
- If your reply presents directions/options rather than asking a question,
  the suggestions should be the natural next moves (e.g. picking one of the
  named directions, adjusting a stated constraint) — phrased in terms of
  the underlying need you identified (e.g. "Keep it more private" or
  "I don't want to plan logistics"), not generic tourism filler.
- Never name a destination or experience in a suggestion unless it's
  already been confirmed via a tool call in this conversation. Don't use
  this line to float somewhere unverified (e.g. a coastal town that's not
  in the catalogue) as a tappable idea — that only ever comes from the
  traveler typing it themselves.
- Never include this line while you still intend to call a tool this turn.
- This line is stripped before the traveler ever sees it — write it as if
  it were internal metadata, not part of your message.
`.trim();

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_traveler_profile',
    description: 'Retrieve the current structured preferences, constraints, and confidence levels for the traveler in this session.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'update_traveler_profile',
    description: 'Persist new explicit or inferred preferences for the traveler. Only include fields that changed.',
    input_schema: {
      type: 'object',
      properties: {
        persona: { type: 'string', enum: ['solo', 'couples', 'family', 'social'] },
        duration_days: { type: 'number' },
        budget_level: { type: 'string', enum: ['standard', 'premium', 'ultra-luxury'] },
        preferences: { type: 'object', description: 'any experience_dna-style keys, 0-1' },
        dislikes: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'object', description: 'per-field confidence 0-1, plus an "overall" key' },
      },
    },
  },
  {
    name: 'search_experiences',
    description: 'Search the verified experience inventory by destination, duration, budget, and preference vector.',
    input_schema: {
      type: 'object',
      properties: {
        destination: { type: 'string' },
        duration_max_days: { type: 'number' },
        budget_max_usd_pp: { type: 'number' },
        preferences: { type: 'object' },
      },
    },
  },
  {
    name: 'get_experience',
    description: 'Retrieve full verified detail for one experience by id.',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'generate_directions',
    description: 'Given top-scored candidate ids, group them into 2-3 named, meaningfully different journey directions.',
    input_schema: {
      type: 'object',
      properties: { candidate_ids: { type: 'array', items: { type: 'string' } } },
      required: ['candidate_ids'],
    },
  },
  {
    name: 'build_itinerary',
    description: 'Construct a full itinerary from a chosen direction. NOT YET IMPLEMENTED — see executeTool below.',
    input_schema: {
      type: 'object',
      properties: {
        direction: { type: 'string' },
        duration_days: { type: 'number' },
      },
      required: ['direction', 'duration_days'],
    },
  },
  {
    name: 'refine_itinerary',
    description: 'Apply a targeted change to the current itinerary and rebuild. NOT YET IMPLEMENTED.',
    input_schema: {
      type: 'object',
      properties: {
        change: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['change'],
    },
  },
  {
    name: 'submit_custom_itinerary_request',
    description: 'Forward a brief for a destination/experience not in the verified catalogue to the EscapePod team by email, so a specialist can build it by hand. Use this once you have a workable brief — do not over-interrogate first.',
    input_schema: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'The requested destination or experience, e.g. "Lamu"' },
        summary: { type: 'string', description: 'A clear written brief of what the traveler wants — style, must-haves, anything they specified' },
        duration_days: { type: 'number' },
        party_size: { type: 'number' },
        budget_level: { type: 'string', enum: ['standard', 'premium', 'ultra-luxury'] },
      },
      required: ['destination', 'summary'],
    },
  },
];

// ── Stage 1: Haiku — cheap intent extraction ───────────────────────────────
// Pulls obvious structured facts ("8 days, couple, luxury") out of the
// traveler's latest message and writes them straight to Supabase, before
// Sonnet ever runs. This is the "Don't have Sonnet handle everything" step:
// extraction is cheap and mechanical, so it shouldn't cost a Sonnet turn.

function intentExtractionPrompt(knownProfile: Record<string, unknown>): string {
  return `Extract ONLY explicitly stated or unambiguously implied travel-planning
facts from the traveler's message. Do not guess, do not infer loosely — if
in doubt, omit the field.

Return strictly valid JSON matching this shape (every field optional, omit
anything not stated):
{
  "persona": "solo" | "couples" | "family" | "social",
  "duration_days": number,
  "budget_level": "standard" | "premium" | "ultra-luxury",
  "preferences": { "<experience_dna key>": 0-1, ... },
  "dislikes": ["..."]
}

Known profile so far (only return fields that are NEW or CHANGED):
${JSON.stringify(knownProfile)}

Respond with ONLY the JSON object — no markdown, no commentary.`;
}

interface ExtractedIntent {
  persona?: 'solo' | 'couples' | 'family' | 'social';
  duration_days?: number;
  budget_level?: 'standard' | 'premium' | 'ultra-luxury';
  preferences?: Record<string, number>;
  dislikes?: string[];
}

async function extractIntent(latestMessage: string, knownProfile: Record<string, unknown>): Promise<ExtractedIntent> {
  try {
    const response = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 300,
      system: intentExtractionPrompt(knownProfile),
      messages: [{ role: 'user', content: latestMessage }],
    });
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '{}';
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  } catch (err) {
    console.error('[curate] intent extraction failed — continuing without it', err);
    return {};
  }
}

// ── Stage 3 support: model routing for itinerary work ──────────────────────
// "Complex $10k-$30k itinerary -> Opus, only when justified" and "simple
// refinement -> Haiku/Sonnet depending on complexity."

const HIGH_VALUE_THRESHOLD_USD = 10_000;

function isHighValueTrip(profile: Record<string, unknown> | null | undefined, highestPriceSeenUsd: number): boolean {
  if (profile?.budget_level === 'ultra-luxury') return true;
  if (highestPriceSeenUsd >= HIGH_VALUE_THRESHOLD_USD) return true;
  return false;
}

// ── Quick-reply extraction ──────────────────────────────────────────────
// Claude appends a hidden <<<SUGGESTIONS>>>[...] line to its final reply
// (see QUICK REPLIES in the system prompt above). Strip it out of the text
// the traveler sees and surface it as structured data instead — no extra
// model round-trip, since it rides along on the reply Claude was already
// generating.
const SUGGESTIONS_RE = /\n*<<<SUGGESTIONS>>>\s*(\[[\s\S]*?\])\s*$/;

function extractSuggestions(text: string): { text: string; suggestions: string[] } {
  const match = text.match(SUGGESTIONS_RE);
  if (!match) return { text, suggestions: [] };
  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
      return { text: text.slice(0, match.index).trim(), suggestions: parsed.slice(0, 4) };
    }
  } catch {
    // Malformed — fall through and just show the raw text with nothing cut.
  }
  return { text, suggestions: [] };
}

// ── Opening-message cache ────────────────────────────────────────────────
// A traveler's very first message, sent against a brand-new (empty) profile,
// is the one case where two different travelers can hit this route with
// genuinely identical input — same system prompt, no profile, one message.
// The starter chips on the empty chat box (app/engine/page.tsx) are the main
// source of repeats, but any literal first message qualifies. We cache the
// full response the first time a given opening line is seen and serve it
// straight back on every repeat, skipping Haiku + Sonnet entirely. Nothing
// past turn one ever touches this — profiles diverge on the very next turn,
// so reuse would no longer be safe.
function normalizePrompt(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

interface CachedCurateResponse {
  text: string;
  payload: { type: string; data: unknown } | null;
  suggestions: string[];
}

function maxPriceIn(result: unknown): number {
  const rows = Array.isArray(result) ? result : [result];
  let max = 0;
  for (const row of rows) {
    if (row && typeof row === 'object') {
      const r = row as Record<string, unknown>;
      const hi = (r.price_usd_pp_max as number | undefined) ?? (r.price_usd_pp_min as number | undefined) ?? 0;
      if (typeof hi === 'number' && hi > max) max = hi;
    }
  }
  return max;
}

export async function POST(req: NextRequest) {
  const { user, refreshed } = await resolveSession(req);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to use the Curation Engine.' }, { status: 401 });
  }

  // Per-traveler cap on how often the (Sonnet/Opus-backed) pipeline can be
  // invoked — the real cost driver on this route.
  if (!(await checkRateLimit(`curate:user:${user.id}`, 300, 30))) {
    return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  let body: { messages?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!validateMessages(body.messages)) {
    return NextResponse.json({ error: 'Invalid conversation payload.' }, { status: 400 });
  }
  const messages = body.messages;
  const locale = isLocaleCode(body.locale) ? body.locale : 'en';

  // The traveler id is always the authenticated user's own id — never
  // whatever a client sends — so nobody can read or steer another
  // traveler's profile by guessing an id.
  let traveler = (await supabaseAdmin.from('travelers').select('*').eq('id', user.id).maybeSingle()).data;

  if (!traveler) {
    const { data: created } = await supabaseAdmin
      .from('travelers')
      .insert({ id: user.id, profile: {} })
      .select()
      .single();
    traveler = created;
  }

  if (!traveler) {
    return NextResponse.json({ error: 'Could not initialize traveler profile.' }, { status: 500 });
  }

  // Only the traveler's literal first message, against a still-empty
  // profile, is eligible for the cache — see comment above normalizePrompt.
  const firstMessage = messages.length === 1 && messages[0]?.role === 'user' ? messages[0].content : null;
  // Cached openers were generated in English — never serve one to a
  // traveler who's asked for another language.
  const isCacheableOpener = locale === 'en' && typeof firstMessage === 'string' && firstMessage.trim() && Object.keys(traveler.profile ?? {}).length === 0;
  const cacheKey = isCacheableOpener ? normalizePrompt(firstMessage as string) : null;

  if (cacheKey) {
    const { data: cached } = await supabaseAdmin
      .from('starter_cache')
      .select('response, hits')
      .eq('prompt', cacheKey)
      .maybeSingle();
    if (cached?.response) {
      console.log(`[curate] opener cache hit — skipping AI engine ("${cacheKey.slice(0, 60)}")`);
      // Awaited (not fire-and-forget) — on serverless hosting an unawaited
      // write here can get killed the instant the response below goes out.
      await supabaseAdmin
        .from('starter_cache')
        .update({ hits: (cached.hits ?? 1) + 1, updated_at: new Date().toISOString() })
        .eq('prompt', cacheKey);
      const response = NextResponse.json(cached.response as CachedCurateResponse);
      if (refreshed) setSessionCookies(response, refreshed);
      return response;
    }
  }

  // Run the cheap Haiku extraction on the latest user message and merge any
  // new facts straight into Supabase — no Sonnet turn spent on this.
  const latestUserMessage = [...messages].reverse().find((m: Anthropic.MessageParam) => m.role === 'user')?.content;
  if (typeof latestUserMessage === 'string' && latestUserMessage.trim()) {
    const extracted = await extractIntent(latestUserMessage, traveler.profile ?? {});
    if (Object.keys(extracted).length > 0) {
      const mergedProfile = { ...(traveler.profile ?? {}), ...extracted };
      const { data: updated } = await supabaseAdmin
        .from('travelers')
        .update({ profile: mergedProfile, persona: extracted.persona ?? traveler.persona })
        .eq('id', traveler.id)
        .select()
        .single();
      if (updated) traveler = updated;
    }
  }

  const conversation: Anthropic.MessageParam[] = [...messages];
  let finalText = '';
  let uiPayload: { type: string; data: unknown } | null = null;
  let highestPriceSeenUsd = 0;
  let model: string = MODELS.sonnet;

  // Give Sonnet the profile Haiku already extracted, so it doesn't spend a
  // tool round-trip re-discovering it.
  const languageInstruction =
    locale === 'en'
      ? ''
      : `\n\n---\n\nLANGUAGE: Respond to the traveler entirely in ${localeName(locale)} — write it the way a fluent ` +
        `native ${localeName(locale)} speaker naturally would, translating for meaning and tone rather than ` +
        `word-for-word. This applies only to the conversational text you show the traveler. Any tool calls you ` +
        `make, and every structured data field inside them (destination names, experience names, prices, ids), ` +
        `must stay exactly as they appear in the catalogue — never translate those, since the app matches them by ` +
        `exact string.`;
  const systemWithProfile = `${SYSTEM_PROMPT}\n\n---\n\nCURRENT KNOWN TRAVELER PROFILE (already captured — do not re-ask for these):\n${JSON.stringify(traveler.profile ?? {})}${languageInstruction}`;

  // Agent loop: cap tool round-trips so a stuck loop can't run forever.
  // 8, not 5 — the CURATION ORDER instructions above deliberately add a
  // reflect-on-intent step before the catalogue is ever touched, which
  // costs an extra turn or two versus jumping straight to search; 5 was
  // occasionally cutting the loop off after search_experiences but before
  // generate_directions/the final synthesis ever ran.
  for (let i = 0; i < 8; i++) {
    console.log(`[curate] turn ${i} -> model: ${model}`);
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1500,
      system: systemWithProfile,
      tools: TOOLS,
      messages: conversation,
    });

    // Claude can request several tools in a single turn — every tool_use
    // block needs a matching tool_result in the next message, or the API
    // rejects the following request. Execute them all before continuing.
    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (text) finalText += text.text;

    if (toolUses.length === 0) break;

    conversation.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let sawItineraryTool = false;
    let onlyRefining = true;

    for (const toolUse of toolUses) {
      const result = await executeTool(toolUse.name, toolUse.input, { travelerId: traveler.id, name: user.name, email: user.email });

      if (toolUse.name === 'search_experiences' || toolUse.name === 'generate_directions' || toolUse.name === 'build_itinerary') {
        uiPayload = { type: toolUse.name, data: result };
        highestPriceSeenUsd = Math.max(highestPriceSeenUsd, maxPriceIn(result));
      }
      if (toolUse.name === 'build_itinerary' || toolUse.name === 'refine_itinerary') sawItineraryTool = true;
      if (toolUse.name !== 'refine_itinerary') onlyRefining = false;

      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) });
    }

    conversation.push({ role: 'user', content: toolResults });

    // Stage 3: choose the model for the NEXT completion based on what just
    // happened. Default stays Sonnet (main curation intelligence).
    if (sawItineraryTool && isHighValueTrip(traveler.profile, highestPriceSeenUsd)) {
      model = MODELS.opus; // "Only when justified" — $10k+ or ultra-luxury.
    } else if (onlyRefining) {
      model = MODELS.haiku; // Simple refinement — cheap model is enough.
    } else {
      model = MODELS.sonnet;
    }
  }

  const { text: cleanText, suggestions } = extractSuggestions(finalText);
  const responseBody: CachedCurateResponse = { text: cleanText, payload: uiPayload, suggestions };

  if (cacheKey) {
    // Awaited (not fire-and-forget) — on serverless hosting an unawaited
    // write here can get killed the instant the response below goes out,
    // silently defeating the whole point of this cache. The extra latency
    // is negligible next to the multi-turn AI pipeline this follows.
    const { error: cacheWriteError } = await supabaseAdmin
      .from('starter_cache')
      .upsert({ prompt: cacheKey, response: responseBody }, { onConflict: 'prompt' });
    if (cacheWriteError) console.error('[curate] failed to cache opener response', JSON.stringify(cacheWriteError));
  }

  const response = NextResponse.json(responseBody);
  if (refreshed) setSessionCookies(response, refreshed);
  return response;
}

interface ToolContext {
  travelerId: string;
  name: string;
  email: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tool input shapes vary per-tool; see TOOLS schemas above.
async function executeTool(name: string, input: any, ctx: ToolContext) {
  const travelerId = ctx.travelerId;
  switch (name) {
    case 'get_traveler_profile': {
      const { data } = await supabaseAdmin
        .from('travelers')
        .select('profile, persona')
        .eq('id', travelerId)
        .single();
      return data;
    }

    case 'update_traveler_profile': {
      const { data: current } = await supabaseAdmin
        .from('travelers')
        .select('profile')
        .eq('id', travelerId)
        .single();
      const merged = { ...(current?.profile ?? {}), ...input };
      const { data } = await supabaseAdmin
        .from('travelers')
        .update({ profile: merged, persona: input.persona ?? undefined })
        .eq('id', travelerId)
        .select()
        .single();
      return data;
    }

    case 'search_experiences': {
      // Essentially no LLM cost: this is your code + Supabase + the scoring
      // engine doing the mathematical work. Claude only sees the results.
      let query = supabaseAdmin.from('experiences').select('*');
      if (input.destination) query = query.ilike('destination', `%${input.destination}%`);
      if (input.duration_max_days) query = query.lte('duration_days', input.duration_max_days);
      if (input.budget_max_usd_pp) query = query.lte('price_usd_pp_min', input.budget_max_usd_pp);

      const { data: rawCandidates } = await query;
      if (!rawCandidates || rawCandidates.length === 0) return [];

      // Exclude destinations that aren't actually ready to auto-suggest
      // yet (see lib/catalogue.ts) — Claude never sees them, so it treats
      // a request for one exactly like anything else not in the catalogue.
      const candidates = filterVerified(rawCandidates);
      if (candidates.length === 0) return [];

      const { data: traveler } = await supabaseAdmin
        .from('travelers')
        .select('profile, persona')
        .eq('id', travelerId)
        .single();

      const confidence = traveler?.profile?.confidence?.overall ?? 0.3;
      const scored = scoreExperiences(candidates, input.preferences ?? {}, traveler?.persona, confidence);
      return diversify(scored, 6);
    }

    case 'get_experience': {
      const { data } = await supabaseAdmin.from('experiences').select('*').eq('id', input.id).single();
      if (data && !filterVerified([data]).length) return null;
      return data;
    }

    case 'generate_directions': {
      const { data: rawData } = await supabaseAdmin.from('experiences').select('*').in('id', input.candidate_ids);
      if (!rawData || rawData.length === 0) return [];
      // Defensive — candidate_ids should only ever come from a prior
      // search_experiences call, which already excludes these, but never
      // let one through here either.
      const data = filterVerified(rawData);
      if (data.length === 0) return [];

      // Attach the same real match_score used by search_experiences, so the
      // frontend always has a number to show — this previously only rode
      // along when Claude called search_experiences directly.
      const { data: traveler } = await supabaseAdmin
        .from('travelers')
        .select('profile, persona')
        .eq('id', travelerId)
        .single();
      const confidence = traveler?.profile?.confidence?.overall ?? 0.3;
      const scored = scoreExperiences(data, traveler?.profile?.preferences ?? {}, traveler?.persona, confidence);

      // Simple first pass: one direction per distinct destination among the
      // candidates, in the order Claude chose to present them (its ordering
      // usually encodes "Best Fit" first). Replace with real narrative
      // grouping once you see how Claude tends to call this in practice.
      return (input.candidate_ids as string[])
        .map((id) => scored.find((s) => s.id === id))
        .filter(Boolean);
    }

    case 'build_itinerary':
    case 'refine_itinerary': {
      // TODO: real itinerary construction — sequence legs by geographic
      // continuity, apply transfer-time penalties, and multiply Top Tier
      // per-day pricing by duration_days. Returning a placeholder for now
      // so the tool-call loop doesn't break.
      return { note: 'itinerary builder not yet implemented' };
    }

    case 'submit_custom_itinerary_request': {
      const transport = getMailTransport();
      if (!transport) {
        console.error('[curate] SMTP is not configured — cannot forward custom itinerary request');
        return { ok: false, error: 'Forwarding is temporarily unavailable.' };
      }

      const { data: traveler } = await supabaseAdmin
        .from('travelers')
        .select('profile, persona')
        .eq('id', travelerId)
        .single();

      // Plain-text email (no `html` field), so the risk here isn't markup
      // injection — it's an unbounded LLM-influenced field ballooning the
      // outbound email. Cap it regardless.
      const destination = clip(String(input.destination ?? '—'), 200);
      const summary = clip(String(input.summary ?? '—'), 3000);

      try {
        await transport.sendMail({
          from: `"EscapePod Curation Engine" <${process.env.SMTP_USER}>`,
          to: BOOKING_RECIPIENT,
          replyTo: ctx.email,
          subject: `Custom Itinerary Request — ${destination} — ${ctx.name}`,
          text: [
            `A traveler asked for a destination/experience not in the verified catalogue.`,
            ``,
            `Traveler: ${ctx.name} <${ctx.email}>`,
            `Persona: ${traveler?.persona ?? 'unknown'}`,
            `Requested destination: ${destination}`,
            `Duration: ${input.duration_days ?? '—'} days`,
            `Party size: ${input.party_size ?? '—'}`,
            `Budget level: ${input.budget_level ?? traveler?.profile?.budget_level ?? '—'}`,
            ``,
            `Brief (from Claude):`,
            summary,
            ``,
            `Full traveler profile: ${JSON.stringify(traveler?.profile ?? {}, null, 2)}`,
          ].join('\n'),
        });
        return { ok: true, message: 'Forwarded to the EscapePod team.' };
      } catch (err) {
        console.error('[curate] failed to send custom itinerary request', err);
        return { ok: false, error: 'Could not forward this request — please try again.' };
      }
    }

    default:
      return { error: `unknown tool ${name}` };
  }
}
