import Anthropic from '@anthropic-ai/sdk'

// Server-side only — never import this into a 'use client' component.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Model routing for the Curation Engine (/api/curate). Keep the cheapest
// model that can do the job well — see app/api/curate/route.ts for how
// these are chosen per turn.
export const MODELS = {
  haiku: 'claude-haiku-4-5-20251001',   // intent extraction, simple refinements
  sonnet: 'claude-sonnet-4-6',          // main curation intelligence
  opus: 'claude-opus-5',                // complex/high-value itinerary work only
} as const
