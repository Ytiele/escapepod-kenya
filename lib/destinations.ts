// Real EscapePod photography, mapped only where we're confident it actually
// depicts the destination — everywhere else falls back to a gradient
// rather than showing a photo of somewhere else as if it were this trip.
// The five *-wikimedia entries were sourced from Wikimedia Commons to
// cover destinations that had no cover photo at all (see PHOTO_CREDITS
// below — every one of these except Kilifi is licensed CC BY/BY-SA, which
// legally requires attribution on a commercial site, so don't add a new
// entry here without also adding its credit).
export const DESTINATION_IMAGES: Record<string, string> = {
  'Maasai Mara': '/images/mara.jpg',
  'Samburu': '/images/journals/samburu.jpg',
  'Mount Kenya': '/images/mt kenya.jpg',
  'Lamu': '/images/lamu-sunset.jpg',
  'Laikipia': '/images/laikipia-ol-pejeta-wikimedia.jpg',
  'Nairobi': '/images/nairobi-skyline-wikimedia.jpg',
  'Watamu': '/images/watamu-beach-wikimedia.jpg',
  'Malindi': '/images/malindi-marine-park-wikimedia.jpg',
  'Kilifi': '/images/kilifi-creek-wikimedia.jpg',
}

export function imageForDestination(destination: string): string | null {
  for (const [key, src] of Object.entries(DESTINATION_IMAGES)) {
    if (destination.includes(key)) return src
  }
  return null
}

// Attribution for the Wikimedia Commons photos above — required by their
// CC BY/BY-SA licenses even for a small decorative cover image. Kilifi's
// photo is public domain, so it's deliberately not listed here.
export const PHOTO_CREDITS: Record<string, { name: string; url: string }> = {
  '/images/laikipia-ol-pejeta-wikimedia.jpg': {
    name: 'Ninara (CC BY 2.0)',
    url: 'https://commons.wikimedia.org/wiki/File:Ol_Pejeta_Conservancy,_Kenya_(53960819653).jpg',
  },
  '/images/nairobi-skyline-wikimedia.jpg': {
    name: 'Daniel Case (CC BY-SA 4.0)',
    url: 'https://commons.wikimedia.org/wiki/File:Nairobi_skyline_from_Gem_Hotel.jpg',
  },
  '/images/watamu-beach-wikimedia.jpg': {
    name: 'Alsandro (CC BY-SA 3.0)',
    url: 'https://commons.wikimedia.org/wiki/File:Watamu_Beach,_Kenya.JPG',
  },
  '/images/malindi-marine-park-wikimedia.jpg': {
    name: 'Николай Максимович (CC BY 3.0)',
    url: 'https://commons.wikimedia.org/wiki/File:Malindi_Marine_National_Park._%D0%9C%D0%B0%D0%BB%D0%B8%D0%BD%D0%B4%D0%B8,_%D0%9A%D0%B5%D0%BD%D0%B8%D1%8F_-_panoramio.jpg',
  },
}

export function creditForImage(src: string | null): { name: string; url: string } | null {
  return (src && PHOTO_CREDITS[src]) || null
}
