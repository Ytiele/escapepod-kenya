import { NextRequest } from 'next/server'
import { anthropic, TOUR_ENGINE_SYSTEM_PROMPT } from '@/lib/anthropic'
import type { RecommendationData } from '@/lib/types'

type Message = { role: 'user' | 'assistant'; content: string }

export type ParsedResponse = {
  type: 'question' | 'recommendations' | 'refinement' | 'lead_capture'
  message: string
  options?: string[]
  recommendations?: RecommendationData[]
  tourIds?: string[]
}

// ── Pre-written rich tour data for demo mode ──────────────────────────────

const TOUR_REC_BASE: Record<string, Omit<RecommendationData, 'label' | 'whyThisFits'>> = {
  'lamu-pod-experience': {
    tourId: 'lamu-pod-experience',
    journeyName: 'Lamu: A Return to Stillness',
    accommodation: 'Majlis Hotel or Peponi Hotel',
    signatureExperiences: [
      'Private sunrise dhow sail along the ancient waterfront',
      'Guided walk through the UNESCO Swahili old town with a local historian',
      '14km of pristine Shela Beach — completely uncrowded',
      'Island hopping to Manda and Kipungani by private boat',
    ],
    travelNotes: [
      'Lamu has no motor vehicles — the silence is part of the experience',
      'Best October–March; April–May rains can be heavy',
    ],
    whatToPack: [
      'Light cotton and linen clothing', 'Strong sun protection',
      'Comfortable walking sandals', 'Modest cover-up for town walks', 'A good book',
    ],
    enhancements: [
      'Overnight dhow sail with private chef (+$280 per person)',
      'Private old town photography session (+$150)',
    ],
  },
  'maasai-mara-experience': {
    tourId: 'maasai-mara-experience',
    journeyName: 'The Mara Unseen',
    accommodation: 'Angama Mara or Cottar\'s 1920s Camp',
    signatureExperiences: [
      'Private conservancy game drives — zero other vehicles',
      'Big Five tracking with a Maasai expert ranger',
      'Sunrise balloon safari over the open plains',
      'Candlelit bush dinner beneath an acacia tree',
    ],
    travelNotes: [
      'Best July–October for the Great Migration river crossings',
      'Private conservancy means you never share a game drive',
    ],
    whatToPack: [
      'Neutral-coloured layers (khaki, olive, tan)', 'Quality binoculars (8×42 minimum)',
      'Camera with a zoom lens of at least 300mm', 'Warm fleece for pre-dawn drives', 'Polarized sunglasses',
    ],
    enhancements: [
      'Sunrise hot air balloon safari (+$450 per person)',
      'Private photography guide for a full day (+$300)',
    ],
  },
  'samburu-pod-experience': {
    tourId: 'samburu-pod-experience',
    journeyName: 'Samburu: The Secret North',
    accommodation: 'Sasaab Lodge or Larsen\'s Tented Camp',
    signatureExperiences: [
      'Tracking the Samburu Special Five — found nowhere else on earth',
      'Camel walk at dawn along the Ewaso Ng\'iro River',
      'Night drive permits for exclusive nocturnal wildlife',
      'Star-gazing dinner on the riverbank',
    ],
    travelNotes: [
      'Samburu is genuinely remote — that\'s its greatest quality',
      'Best January–April and June–September',
    ],
    whatToPack: [
      'Light breathable safari clothes', 'High-factor sun protection',
      'Insect repellent', 'Binoculars', 'Dust-proof camera bag',
    ],
    enhancements: [
      'Extended fly camping under the stars (+$380 per night)',
      'Samburu community cultural tour (+$120 per person)',
    ],
  },
  'watamu-pod-experience': {
    tourId: 'watamu-pod-experience',
    journeyName: 'Watamu: The Blue Unspoiled',
    accommodation: 'Hemingways Watamu or Temple Point Resort',
    signatureExperiences: [
      'Guided snorkel in the Marine National Park',
      'Sea turtle sanctuary visit and release programme',
      'Sunrise kayak through Mida Creek mangrove forest',
      'Whale shark encounter (October–January, seasonal)',
    ],
    travelNotes: [
      'Whale sharks are seasonal (October–January) — worth timing your visit around',
      'Best October–March; water visibility is exceptional in these months',
    ],
    whatToPack: [
      'Reef-safe sunscreen only (marine protected area)', 'Underwater camera or GoPro',
      'Rash vest for snorkeling', 'Light quick-dry clothing', 'Good walking sandals',
    ],
    enhancements: [
      'Private deep-sea fishing charter (+$350 per boat)',
      'Whale shark snorkel tour with marine biologist (+$180 per person)',
    ],
  },
  'laikipia-experience': {
    tourId: 'laikipia-experience',
    journeyName: 'Laikipia: Wide Open Country',
    accommodation: 'Ol Pejeta Bush Camp or Sosian Lodge',
    signatureExperiences: [
      'Horseback safari alongside elephant and giraffe on open plains',
      'Guided tracking of endangered black rhino on foot',
      'Community conservancy visit with Maasai and Samburu guides',
      'Fly-fishing on the Ewaso Ng\'iro River at dusk',
    ],
    travelNotes: [
      'Horseback activity requires a basic riding level — please advise us in advance',
      'Best January–March and June–October (dry seasons)',
    ],
    whatToPack: [
      'Long riding trousers (essential for horseback)', 'Closed-toe shoes or riding boots',
      'Neutral safari colours', 'Wide-brimmed hat', 'Sunglasses with side coverage',
    ],
    enhancements: [
      'Night game drive in open vehicle (+$140 per person)',
      'Guided black rhino tracking with armed rangers (+$200 per person)',
    ],
  },
  'mount-kenya-experience': {
    tourId: 'mount-kenya-experience',
    journeyName: 'Point Lenana: Summit at First Light',
    accommodation: 'Serena Mountain Lodge (pre-trek) + mountain huts at altitude',
    signatureExperiences: [
      'Point Lenana summit at sunrise — Africa\'s second-highest peak at 4,985m',
      'Walk through ancient bamboo forest with colobus monkeys',
      'Teleki Valley traverse with glacial lake reflections',
      'Descent via the Chogoria Route — considered the most scenic in Africa',
    ],
    travelNotes: [
      'Good cardiovascular fitness is essential — the summit push begins at 3am',
      'Best January–February and August–September for clearest summit views',
    ],
    whatToPack: [
      'Warm sleeping bag rated to −10°C', 'Waterproof outer shell jacket and trousers',
      'Technical hiking boots (waterproof)', 'Trekking poles (strongly recommended)', 'Altitude medication (discuss with your doctor)',
    ],
    enhancements: [
      'Professional mountain photography guide (+$250 per day)',
      'Technical peak extension to Batian summit (+$800 per person)',
    ],
  },
}

// ── Why-this-fits generator (personalized per context) ────────────────────

type TravelerType = 'solo' | 'couple' | 'family' | 'group' | null
type ExperienceType = 'wildlife' | 'coastal' | 'adventure' | 'culture' | 'mix' | null

function whyThisFits(tourId: string, travelerType: TravelerType, context: string): string {
  const c = context.toLowerCase()
  const isRomantic = /anniversary|romantic|honeymoon|wife|husband|partner|celebrate/i.test(c)
  const isCoupleOrRomantic = travelerType === 'couple' || isRomantic

  const data: Record<string, Record<string, string>> = {
    'lamu-pod-experience': {
      couple: 'Lamu\'s boutique villas and complete absence of motor vehicles create a romantic stillness that\'s genuinely hard to find elsewhere. No itinerary, no schedule — just the Indian Ocean and each other.',
      solo: 'Solo travelers often find Lamu quietly transformative. The unhurried pace and the old town\'s textures create conditions for genuine reflection — and genuine rest.',
      family: 'Older children love Lamu\'s sense of discovery — the narrow lanes, dhow rides, and island-hopping make for an adventure that feels both exotic and manageable.',
      group: 'Groups who love culture and history thrive in Lamu. The dhow sail becomes an event in itself, and the old town is endlessly explorable.',
      default: 'Lamu has a quality that is increasingly rare: genuine unhurriedness. The old town, the Indian Ocean, and the absence of motor vehicles combine into something that stays with you.',
    },
    'maasai-mara-experience': {
      couple: 'A private conservancy in the Mara is the most intimate wildlife experience in Kenya — you\'ll share the landscape with no one else. A sunrise together over the plains is something you\'ll carry for a long time.',
      solo: 'The private conservancy experience is equally powerful solo — in some ways more so. You set the pace, the direction, and the silence entirely.',
      family: 'The private conservancy keeps game drives personal and educational — no crowds, just your family and the landscape. Children tend to remember this kind of encounter for the rest of their lives.',
      group: 'A private conservancy for a group feels like having the Mara entirely to yourselves. Game drives are intimate, and conversations happen naturally when there\'s nothing competing for your attention.',
      default: 'The private Mara conservancy is Kenya\'s most celebrated wildlife experience for good reason. Exclusive access and expert guidance make every drive feel deeply personal.',
    },
    'samburu-pod-experience': {
      couple: 'Samburu\'s remoteness and the dramatic Ewaso Ng\'iro riverbank create an atmosphere that\'s genuinely rare. If you want something your friends haven\'t done, and you want it to feel private and surprising — this is it.',
      solo: 'Samburu suits a solo traveler who wants to feel genuinely far from ordinary life. The Special Five are extraordinary, and the solitude is real.',
      family: 'Samburu\'s unique species — animals your children likely haven\'t seen before — make this an exceptional choice for families who want something beyond the expected.',
      group: 'For a group that wants to feel genuinely off the beaten path, Samburu delivers every time. The Special Five become a shared discovery no one forgets.',
      default: 'Samburu offers what the Mara cannot: rare northern species found nowhere else. If you\'ve done the classic safari and want something genuinely new, come here.',
    },
    'watamu-pod-experience': {
      couple: 'Watamu offers a gentle coastal pace ideal for couples who want to relax as well as explore — sea turtles, quiet snorkeling, and long evenings watching the Indian Ocean.',
      solo: 'Watamu offers a coastal rhythm that works beautifully for solo travelers: enough to explore each day, enough stillness to truly recover.',
      family: 'Watamu is Kenya\'s most family-friendly coastal destination — sea turtles captivate children instantly, and the calm, protected bay is safe for all ages.',
      group: 'Watamu suits a group beautifully — enough activities to fill the days, and a villa setting that lends itself to evenings together.',
      default: 'Watamu Marine Reserve offers a coastal experience that is genuinely protected and pristine — a rarer thing on the Kenyan coast than it once was.',
    },
    'laikipia-experience': {
      couple: 'For a couple wanting something active together, horseback safari in Laikipia is genuinely memorable — nothing quite like riding alongside wild animals on open plains.',
      solo: 'Solo travelers often find the horseback dynamic liberating — it\'s you, the guide, and open country. Laikipia\'s conservancy model also gives the trip a sense of meaning.',
      family: 'Horseback safari in Laikipia is magical for families with children comfortable on horses. The conservation focus resonates deeply with young travelers who care about the world.',
      group: 'Laikipia is exceptional for groups — the ranch setting and horseback activities create shared experiences that bring people together. Communal open-fire dinners are particularly special.',
      default: 'The Laikipia Plateau combines horseback safari, rhino conservation, and wide-open landscapes into something that feels completely different from a conventional game park.',
    },
    'mount-kenya-experience': {
      couple: 'A summit together is an experience that stays with you for life. If both of you are active and looking for something genuinely different — something that demands commitment — this is the one.',
      solo: 'A solo summit of Point Lenana is among the most personally meaningful things you can do in East Africa. Your guide becomes your companion. The mountain rewards patience.',
      family: 'Best suited for older children and teenagers with a real spirit of adventure. A summit as a family is a bonding experience unlike anything a conventional holiday offers.',
      group: 'A group summit is a remarkable shared challenge — the experience bonds people in a way that comfortable travel rarely achieves. The 3am start is hard. The sunrise is worth it.',
      default: 'Point Lenana at sunrise — clouds below, Kilimanjaro visible on the horizon on a clear day — is one of the defining moments East Africa has to offer.',
    },
  }

  const tourData = data[tourId]
  if (!tourData) return 'A thoughtfully curated fit for your Kenyan journey.'
  if (isCoupleOrRomantic) return tourData.couple
  if (travelerType === 'family') return tourData.family
  if (travelerType === 'group') return tourData.group
  if (travelerType === 'solo') return tourData.solo
  return tourData.default
}

// ── Profile extraction ────────────────────────────────────────────────────

type Profile = {
  travelerType: TravelerType
  experience: ExperienceType
  duration: 4 | 5 | 7 | null
}

function extractProfile(userMsgs: string[]): Profile {
  const text = userMsgs.join(' ').toLowerCase()
  let travelerType: TravelerType = null
  if (/\bjust me\b|\bsolo\b|\balone\b|\bmyself\b/.test(text)) travelerType = 'solo'
  else if (/\bpartner\b|\bcouple\b|\bhoneymoon\b|\bromantic\b|\bwife\b|\bhusband\b|\banniversary\b/.test(text)) travelerType = 'couple'
  else if (/\bfamily\b|\bkids\b|\bchildren\b|\bchild\b|\bdaughter\b|\bson\b/.test(text)) travelerType = 'family'
  else if (/\bgroup\b|\bfriends\b|\bcrew\b|\btogether\b/.test(text)) travelerType = 'group'

  let experience: ExperienceType = null
  if (/\bwildlife\b|\bsafari\b|\bbig five\b|\bgame\b|\banimal/.test(text)) experience = 'wildlife'
  else if (/\bcoastal\b|\bisland\b|\bbeach\b|\bocean\b|\bsea\b|\bmarine/.test(text)) experience = 'coastal'
  else if (/\bmountain\b|\btrek\b|\bhike\b|\bclimb\b|\badventure\b|\bactive\b/.test(text)) experience = 'adventure'
  else if (/\bcultur\b|\bheritage\b|\bhistory\b|\bswahili\b/.test(text)) experience = 'culture'
  else if (/\bmix\b|\bboth\b|\beverything\b/.test(text)) experience = 'mix'

  let duration: Profile['duration'] = null
  if (/\bthree\b|\b3[\s-]?day|\bweekend\b/.test(text)) duration = 4
  else if (/\bfour\b|\b4[\s-]?day/.test(text)) duration = 4
  else if (/\bfive\b|\b5[\s-]?day/.test(text)) duration = 5
  else if (/\bweek\b|\b7[\s-]?day|\bseven\b/.test(text)) duration = 7

  return { travelerType, experience, duration }
}

// ── Tour selection ────────────────────────────────────────────────────────

function selectTours(profile: Profile, context: string): [string, string, string] {
  const { travelerType: t, experience: e } = profile
  const c = context.toLowerCase()
  const isRomantic = /anniversary|romantic|honeymoon|celebrate/i.test(c)

  if ((t === 'couple' || isRomantic) && (e === 'wildlife' || e === 'mix' || e === null))
    return ['maasai-mara-experience', 'lamu-pod-experience', 'samburu-pod-experience']
  if ((t === 'couple' || isRomantic) && e === 'coastal')
    return ['lamu-pod-experience', 'watamu-pod-experience', 'maasai-mara-experience']
  if (t === 'family')
    return ['watamu-pod-experience', 'laikipia-experience', 'lamu-pod-experience']
  if (t === 'group')
    return ['laikipia-experience', 'maasai-mara-experience', 'watamu-pod-experience']
  if (t === 'solo' && e === 'adventure')
    return ['mount-kenya-experience', 'laikipia-experience', 'samburu-pod-experience']
  if (t === 'solo' && e === 'coastal')
    return ['lamu-pod-experience', 'watamu-pod-experience', 'samburu-pod-experience']
  if (t === 'solo')
    return ['samburu-pod-experience', 'lamu-pod-experience', 'mount-kenya-experience']
  if (e === 'wildlife')
    return ['maasai-mara-experience', 'samburu-pod-experience', 'laikipia-experience']
  if (e === 'coastal' || e === 'culture')
    return ['lamu-pod-experience', 'watamu-pod-experience', 'maasai-mara-experience']
  if (e === 'adventure')
    return ['mount-kenya-experience', 'laikipia-experience', 'maasai-mara-experience']

  return ['lamu-pod-experience', 'maasai-mara-experience', 'mount-kenya-experience']
}

function buildRecs(profile: Profile, context: string): RecommendationData[] {
  const labels: RecommendationData['label'][] = ['Best Fit', 'Alternative Luxury', 'Stretch']
  const [id1, id2, id3] = selectTours(profile, context)
  return [id1, id2, id3].map((id, i) => ({
    ...TOUR_REC_BASE[id],
    label: labels[i],
    whyThisFits: whyThisFits(id, profile.travelerType, context),
  }))
}

// ── Greeting detection ────────────────────────────────────────────────────

function isGreetingOnly(text: string): boolean {
  const t = text.trim().toLowerCase()
  return /^(hi|hello|hey|good\s+(morning|afternoon|evening)|howdy|greetings|hola|salut)\b/.test(t) && t.split(/\s+/).length < 6
}

// ── Lead capture detection ────────────────────────────────────────────────

function isLeadCapture(text: string): boolean {
  return /\b(book|reserve|want this|i'd like|how do i|sign up|get a proposal|get a quote|proceed|let's go|go ahead|contact)\b/i.test(text)
}

// ── Conversation history helpers ──────────────────────────────────────────

function hasShownRecommendations(messages: Message[]): boolean {
  return messages.some(m => {
    if (m.role !== 'assistant') return false
    try { const p = JSON.parse(m.content); return p.type === 'recommendations' || p.type === 'refinement' } catch { return false }
  })
}

// ── Follow-up question selection ──────────────────────────────────────────

function nextQuestion(profile: Profile): ParsedResponse {
  if (profile.travelerType && !profile.experience) {
    const q: Record<string, string> = {
      solo: 'Kenya has so many sides — are you drawn more toward wildlife and open plains, or something coastal and slower-paced?',
      couple: 'For your trip together — are you more drawn toward a bush and wildlife experience, or something coastal and romantic?',
      family: 'For the family — are you leaning toward wildlife, a beach experience, or a mix of both?',
      group: 'For your group — would you say the vibe is more adventure and safari, coastal and social, or something in between?',
    }
    return {
      type: 'question',
      message: q[profile.travelerType] ?? 'What kind of experience speaks to you most?',
      options: ['Wildlife & safari', 'Coastal & beach', 'Adventure & trekking', 'Culture & heritage'],
    }
  }

  if (profile.experience && !profile.travelerType) {
    return {
      type: 'question',
      message: 'And who will be making this journey?',
      options: ['Traveling solo', 'With my partner', 'With family', 'With a group of friends'],
    }
  }

  // Generic opener (first real question)
  return {
    type: 'question',
    message: 'To help me find the right fit — who will you be traveling with, and what kind of experience are you after?',
    options: ['Solo wildlife trip', 'Romantic escape', 'Family adventure', 'Group getaway'],
  }
}

// ── Refinement handler ────────────────────────────────────────────────────

function demoRefinement(text: string, previousMessages: Message[]): ParsedResponse {
  const lower = text.toLowerCase()
  let context = previousMessages.filter(m => m.role === 'user').map(m => m.content).join(' ')
  context += ' ' + text

  const profile = extractProfile([context])

  if (/\bwildlife\b|\bsafari\b|\banimal\b/.test(lower)) {
    profile.experience = 'wildlife'
  }
  if (/\bbeach\b|\bcoastal\b|\bocean\b|\bisland\b/.test(lower)) {
    profile.experience = 'coastal'
  }
  if (/\badventure\b|\btrek\b|\bactive\b|\bmountain\b/.test(lower)) {
    profile.experience = 'adventure'
  }
  if (/\bdifferent\b|\bother\b|\balternative\b|\bchange\b|\bnone/.test(lower)) {
    // Rotate — explicitly pick the next set
    const recs = buildRecs(profile, context)
    recs.reverse()
    return {
      type: 'refinement',
      message: 'Let me look at this from a different angle.',
      recommendations: recs,
      tourIds: recs.map(r => r.tourId),
    }
  }

  const recs = buildRecs(profile, context)
  const msg = /\bmore\b|\badjust\b/.test(lower)
    ? 'Here\'s an updated selection based on what you\'ve said.'
    : 'Noted — here\'s how I\'d revise the options.'

  return { type: 'refinement', message: msg, recommendations: recs, tourIds: recs.map(r => r.tourId) }
}

// ── Demo engine ───────────────────────────────────────────────────────────

function demoEngine(messages: Message[]): ParsedResponse {
  const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content)
  const assistantCount = messages.filter(m => m.role === 'assistant').length
  const lastUser = userMsgs[userMsgs.length - 1] ?? ''
  const allText = userMsgs.join(' ')
  const profile = extractProfile(userMsgs)

  // Lead capture check (after recommendations shown)
  if (hasShownRecommendations(messages) && isLeadCapture(lastUser)) {
    return {
      type: 'lead_capture',
      message: 'Wonderful — your journey is taking shape beautifully. To prepare your personalized proposal and connect you with an EscapePod travel designer, I just need a few details from you. This is where the real planning begins.',
    }
  }

  // Refinement (after recommendations shown)
  if (hasShownRecommendations(messages)) {
    return demoRefinement(lastUser, messages)
  }

  // Greeting-only first message
  if (userMsgs.length === 1 && isGreetingOnly(lastUser)) {
    return {
      type: 'question',
      message: 'Hello — wonderful to have you here. What kind of journey to Kenya are you imagining? I\'d love to help you put something together.',
      options: ['A wild safari', 'A coastal escape', 'Something romantic', 'Open to being surprised'],
    }
  }

  // If we have enough to recommend (2+ signals or 2+ AI turns)
  const signals = [profile.travelerType, profile.experience].filter(Boolean).length
  if (signals >= 2 || (assistantCount >= 2 && signals >= 1) || assistantCount >= 3) {
    const recs = buildRecs(profile, allText)
    const intros = [
      'Based on what you\'ve shared, these three journeys feel like the strongest match.',
      'Here\'s what I\'d put together for you — each option approaches Kenya from a different angle.',
      'These stood out immediately for someone with your travel profile.',
    ]
    return {
      type: 'recommendations',
      message: intros[Math.min(assistantCount, 2)],
      recommendations: recs,
      tourIds: recs.map(r => r.tourId),
    }
  }

  // Ask the next most useful question
  return nextQuestion(profile)
}

// ── Real Claude path ──────────────────────────────────────────────────────

function toClaudeHistory(messages: Message[]): Message[] {
  return messages.map(m => {
    if (m.role !== 'assistant') return m
    try {
      const p = JSON.parse(m.content) as { message?: string }
      return { role: 'assistant', content: p.message ?? m.content }
    } catch { return m }
  })
}

function parseJSON(text: string): ParsedResponse | null {
  try { return JSON.parse(text) as ParsedResponse } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) { try { return JSON.parse(match[0]) as ParsedResponse } catch { /* fall through */ } }
    return null
  }
}

// ── Handler ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json() as { messages?: Message[] }
  const messages = body.messages

  if (!Array.isArray(messages)) {
    return Response.json({ error: 'messages array required' }, { status: 400 })
  }

  // Demo mode (no API key)
  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise(r => setTimeout(r, 600)) // natural feel
    const parsed = demoEngine(messages)
    return Response.json({ text: JSON.stringify(parsed), parsed })
  }

  // Real Claude mode
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      system: TOUR_ENGINE_SYSTEM_PROMPT,
      messages: toClaudeHistory(messages),
    })
    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = parseJSON(rawText)
    if (!parsed) {
      const fb = demoEngine(messages)
      return Response.json({ text: JSON.stringify(fb), parsed: fb })
    }
    if (parsed.recommendations?.length) parsed.tourIds = parsed.recommendations.map(r => r.tourId)
    return Response.json({ text: rawText, parsed })
  } catch (err) {
    console.error('[tour-engine]', err)
    const fb = demoEngine(messages)
    return Response.json({ text: JSON.stringify(fb), parsed: fb })
  }
}
