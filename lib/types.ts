export interface JournalPost {
  slug: string
  title: string
  excerpt: string
  author: string
  date: string
  category: string
  readTime: string
  content: string
  image?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Shape of a row in the Supabase `experiences` table — see
// scripts/curate-schema.sql. Everything here is verified inventory data;
// nothing on this type should ever be filled in by guesswork.
export interface Experience {
  id: string
  name: string
  destination: string
  duration_days: number | null
  price_usd_pp_min: number | null
  price_usd_pp_max: number | null
  weather?: string | null
  accommodation?: string[]
  key_activities?: string[]
  persona_fit?: Record<string, number>
  experience_dna?: Record<string, number>
  travel_style?: Record<string, string>
  physical_intensity?: number
  ideal_for?: string[]
  match_score?: number
}

// What /api/curate returns after a turn.
export interface CuratePayload {
  type: 'search_experiences' | 'generate_directions' | 'build_itinerary'
  data: Experience[] | Record<string, unknown>
}

export interface CurateResponse {
  text: string
  payload: CuratePayload | null
  // Short, conversation-specific quick replies Claude proposes for its own
  // final reply — e.g. plausible answers to a question it just asked, or
  // next moves that follow from what it just presented. Empty when Claude
  // didn't produce any (the client falls back to generic chips).
  suggestions?: string[]
}
