import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { anthropic, MODELS } from '@/lib/anthropic';
import { supabaseAdmin } from '@/lib/supabase';
import { scoreExperiences, diversify } from '@/lib/scoring';
import { resolveSession, setSessionCookies } from '@/lib/session';
import { getMailTransport, BOOKING_RECIPIENT } from '@/lib/mail';

const SYSTEM_PROMPT = `
You are the intelligence layer of the EscapePod Kenya Curation Engine.

Your purpose is not to behave like a conventional travel chatbot. It is to
understand how a traveler wants to experience Kenya and progressively
construct a personalized journey using EscapePod's verified experience
inventory only.

CORE PRINCIPLE
The traveler should provide as little information as necessary. Do not
interrogate them. Ask a question only when the answer would materially
change the journey. Infer wherever you reasonably can from what they say
and what they react to.

PERSONA
Use solo / couples / family / social as starting hypotheses, not rules.
Anything the traveler states overrides the persona default.

INVENTORY INTEGRITY
Never invent an experience, property, price, availability, or transfer
time. Always retrieve it via a tool. If something isn't available, say so
internally and route to a verified alternative.

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
traveler said. Avoid generic tourism language.
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

  const { messages } = await req.json();

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
  const systemWithProfile = `${SYSTEM_PROMPT}\n\n---\n\nCURRENT KNOWN TRAVELER PROFILE (already captured — do not re-ask for these):\n${JSON.stringify(traveler.profile ?? {})}`;

  // Agent loop: cap tool round-trips so a stuck loop can't run forever.
  for (let i = 0; i < 5; i++) {
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

  const response = NextResponse.json({ text: finalText, payload: uiPayload });
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

      const { data: candidates } = await query;
      if (!candidates || candidates.length === 0) return [];

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
      return data;
    }

    case 'generate_directions': {
      const { data } = await supabaseAdmin.from('experiences').select('*').in('id', input.candidate_ids);
      if (!data || data.length === 0) return [];

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

      try {
        await transport.sendMail({
          from: `"EscapePod Curation Engine" <${process.env.SMTP_USER}>`,
          to: BOOKING_RECIPIENT,
          replyTo: ctx.email,
          subject: `Custom Itinerary Request — ${input.destination} — ${ctx.name}`,
          text: [
            `A traveler asked for a destination/experience not in the verified catalogue.`,
            ``,
            `Traveler: ${ctx.name} <${ctx.email}>`,
            `Persona: ${traveler?.persona ?? 'unknown'}`,
            `Requested destination: ${input.destination}`,
            `Duration: ${input.duration_days ?? '—'} days`,
            `Party size: ${input.party_size ?? '—'}`,
            `Budget level: ${input.budget_level ?? traveler?.profile?.budget_level ?? '—'}`,
            ``,
            `Brief (from Claude):`,
            input.summary,
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
