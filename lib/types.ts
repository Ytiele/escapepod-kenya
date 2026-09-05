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

// Shape of a row in the Supabase `bookings` table — see
// scripts/bookings-schema.sql. package_name/destination/duration_days/
// accommodation/included_activities are a SNAPSHOT taken at booking time,
// not a live join against `experiences`, so a booking stays accurate even
// if the underlying listing changes later. payment_status and the
// timeline shown on the dashboard are both derived from amount_paid_usd/
// total_price_usd and booking_status — see lib/bookings.ts — rather than
// stored directly, so there's nothing to drift out of sync.
export type BookingStatus = 'created' | 'confirmed' | 'itinerary_ready' | 'trip_ready' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface PaymentHistoryEntry {
  date: string
  amount: number
  method: string
  note?: string
}

export interface Booking {
  id: string
  reference: string
  traveler_id: string
  experience_id: string | null
  package_name: string
  destination: string
  duration_days: number | null
  num_travelers: number
  start_date: string | null
  end_date: string | null
  accommodation: string[]
  included_activities: string[]
  total_price_usd: number
  amount_paid_usd: number
  next_payment_due_date: string | null
  booking_status: BookingStatus
  payment_history: PaymentHistoryEntry[]
  created_at: string
  updated_at: string
}
