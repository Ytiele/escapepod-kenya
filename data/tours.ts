import type { PreplannedTour } from '@/lib/types'

// Hand-authored, fixed itineraries — see the PreplannedTour comment in
// lib/types.ts for how these differ from the Curation Engine's
// AI-matched Experience rows. Add a tour by adding an entry here; the
// homepage section, /tours/[slug] detail pages, sitemap, and booking API
// all read from this single list.
export const tours: PreplannedTour[] = [
  {
    slug: 'maasai-mara-migration-safari',
    name: 'Maasai Mara Migration Safari',
    destination: 'Maasai Mara, Kenya',
    durationDays: 4,
    priceUsdPerPerson: 2450,
    image: '/images/tours/mara-migration.jpg',
    summary:
      "Four days inside the world's greatest wildlife theatre — timed for the Great Migration, hosted from an intimate tented camp on the river's edge.",
    description: [
      'Every detail of this itinerary has already been solved: the camp, the guide, the game-drive rhythm. You arrive, and the only decision left is whether to have your coffee at 5:30am or 6.',
      "Dawn and dusk drives track the herds with a private guide and vehicle — no shared seats, no fixed schedule. Days open with a slow breakfast overlooking the river and close with sundowners wherever the light is best.",
    ],
    highlights: [
      'Private guide & 4x4 for the full stay',
      'Timed to track the Great Migration',
      'All meals, drinks, and park fees included',
      'Sundowner game drives',
    ],
    accommodation: ['River-front luxury tented camp, Maasai Mara'],
    activities: [
      'Dawn & dusk game drives',
      'Guided bush walk',
      'Sundowner at a private viewpoint',
      'Maasai village visit (optional)',
    ],
    idealFor: ['First safari', 'Couples', 'Photography'],
  },
  {
    slug: 'lamu-coastal-escape',
    name: 'Lamu Island Coastal Escape',
    destination: 'Lamu Island, Kenya',
    durationDays: 4,
    priceUsdPerPerson: 1980,
    image: '/images/tours/lamu-coastal-escape.jpg',
    summary:
      'A slow, screen-free four days on the Swahili coast — dhow sails, empty beaches, and a rooftop with nothing on the agenda.',
    description: [
      "Lamu moves at the pace of the tide, not the clock. This itinerary keeps it that way — one boat transfer, one arrival briefing, and then nothing scheduled you don't ask for.",
      'Mornings are yours. Afternoons drift toward a dhow sail or a swim off Manda Toto. Evenings end on a rooftop, call to prayer drifting over the old town below.',
    ],
    highlights: [
      'Private dhow sailing excursion',
      'Beachfront boutique stay',
      'Airport/Manda transfers included',
      'Zero fixed schedule after arrival',
    ],
    accommodation: ['Boutique Swahili-style guesthouse, Shela Beach'],
    activities: [
      'Dhow sailing & snorkeling',
      'Lamu Old Town walking tour',
      'Sunset on Shela beach',
      'Manda Toto snorkeling trip',
    ],
    idealFor: ['Solo travelers', 'Honeymoons', 'Digital detox'],
  },
  {
    slug: 'mount-kenya-trekking-expedition',
    name: 'Mount Kenya Trekking Expedition',
    destination: 'Mount Kenya, Kenya',
    durationDays: 5,
    priceUsdPerPerson: 2150,
    image: '/images/tours/mount-kenya-trek.jpg',
    summary:
      "A five-day ascent toward Point Lenana — guided, paced, and fully supported, for travelers who want the summit without the guesswork.",
    description: [
      "This is the itinerary for travelers who'd rather spend their planning energy on training, not logistics. Route, permits, porters, and camps are already arranged.",
      'The Sirimon–Chogoria route is timed for acclimatization, not speed — three nights ascending through five ecological zones before the final pre-dawn push to Point Lenana at sunrise.',
    ],
    highlights: [
      'Certified mountain guide & full porter team',
      'Sirimon–Chogoria route (best acclimatization profile)',
      'All park fees & hut/camp fees included',
      'Summit at sunrise, Point Lenana',
    ],
    accommodation: ['Mountain huts & camps en route'],
    activities: [
      'Guided ascent via Sirimon route',
      'Summit push to Point Lenana',
      'Descent via Chogoria route',
      'Equipment briefing & fitting',
    ],
    idealFor: ['Adventure travelers', 'Small groups', 'Experienced hikers'],
  },
  {
    slug: 'private-family-safari-adventure',
    name: 'Private Family Safari Adventure',
    destination: 'Maasai Mara & Lake Naivasha, Kenya',
    durationDays: 6,
    priceUsdPerPerson: 2650,
    image: '/images/tours/photographic-safari.jpg',
    summary:
      'Six days built around families — open-vehicle game drives, a working conservancy, and a lake stop that keeps the youngest travelers just as engaged as the adults.',
    description: [
      "Built for families who want a real safari, not a watered-down one — paced for children without losing what makes it extraordinary for the adults.",
      "Game drives are shorter and more frequent, with a naturalist who's genuinely good with kids. A conservancy visit and a boat ride at Naivasha break up the itinerary without breaking the mood.",
    ],
    highlights: [
      'Family-friendly pacing & guide',
      'Private vehicle for your group only',
      'Kid-focused conservancy activities',
      'Connecting family rooms at every stop',
    ],
    accommodation: ['Family-suite safari lodge, Maasai Mara', 'Lakeside lodge, Lake Naivasha'],
    activities: [
      'Shorter, frequent game drives',
      'Junior ranger conservancy program',
      'Boat ride & Crescent Island walk, Naivasha',
      'Maasai cultural visit',
    ],
    idealFor: ['Families', 'Multi-generational trips'],
  },
]

export function getTourBySlug(slug: string): PreplannedTour | undefined {
  return tours.find((t) => t.slug === slug)
}
