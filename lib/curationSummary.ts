import { anthropic, MODELS } from '@/lib/anthropic';

// Shared by app/api/book-experience and app/api/request-custom-itinerary —
// both are triggered by a plain UI button click (not an AI tool call), so
// unlike submit_custom_itinerary_request (where Claude already has the
// whole conversation in context and writes its own summary as part of the
// tool call, at no extra cost), these need a fresh, cheap Haiku call to
// turn the traveler's chat history into a short internal briefing note for
// whoever follows up on the booking/request.

export const MAX_SUMMARY_MESSAGES = 40;
export const MAX_SUMMARY_MESSAGE_CHARS = 4000;

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

// Same validation shape as /api/curate's validateMessages — never trust an
// unbounded or malformed array from the client into a paid model call.
export function isValidConversation(value: unknown): value is ConversationTurn[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_SUMMARY_MESSAGES) return false;
  return value.every((m) => {
    if (!m || typeof m !== 'object') return false;
    const { role, content } = m as { role?: unknown; content?: unknown };
    return (
      (role === 'user' || role === 'assistant') &&
      typeof content === 'string' &&
      content.length > 0 &&
      content.length <= MAX_SUMMARY_MESSAGE_CHARS
    );
  });
}

// Returns '' on any failure (missing/invalid conversation, API error) —
// callers should treat that as "no summary available" and just omit it
// from the email, never block the booking/request itself on this. Takes
// `unknown` deliberately — validates the client-submitted shape itself
// rather than pushing an unsafe cast onto every call site.
export async function summarizeConversation(rawMessages: unknown): Promise<string> {
  if (!isValidConversation(rawMessages)) return '';
  const messages = rawMessages;

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Traveler' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  try {
    const response = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 300,
      system:
        `Summarize this conversation between a traveler and EscapePod Kenya's AI Curation Engine, ` +
        `for an internal team member who is about to follow up on the booking/request it led to. ` +
        `3-5 sentences, factual, no fluff. Cover: what the traveler actually wants (mood, persona, ` +
        `must-haves), what was discussed or shown, and anything explicitly stated (budget, dates, ` +
        `party size, dislikes). Write it as a briefing note for staff, not a message to the traveler — ` +
        `don't address them directly, don't restate the obvious. Respond with ONLY the summary, no ` +
        `preamble or commentary.`,
      messages: [{ role: 'user', content: transcript }],
    });
    const block = response.content.find((b) => b.type === 'text');
    return block && block.type === 'text' ? block.text.trim() : '';
  } catch (err) {
    console.error('[curationSummary] failed to summarize conversation', err);
    return '';
  }
}
