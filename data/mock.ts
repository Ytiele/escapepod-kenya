import type { Tour, JournalPost } from '@/lib/types'

export const tours: Tour[] = [
  {
    id: 'lamu-pod-experience',
    title: 'Lamu Pod Experience',
    location: 'Lamu Archipelago',
    days: 4,
    price: 2500,
    travelerType: 'Solo',
    tags: ['coastal', 'culture', 'dhow sailing', 'swahili heritage'],
    description:
      'Step into a world untouched by time. Lamu, a UNESCO World Heritage Site, is the oldest living Swahili town in East Africa — a labyrinth of coral-stone architecture, narrow donkey-paced lanes, and a seafront that opens to the Indian Ocean. No cars. No crowds. Pure silence and soul.',
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Welcome to Lamu',
        description:
          'Morning flight Nairobi → Lamu (included). Private boat transfer to your boutique villa (Majlis or Peponi). Leisurely afternoon to settle in and enjoy the property.',
      },
      {
        day: 2,
        title: 'Lamu Old Town & Cultural Immersion',
        description:
          'Private walking tour of the UNESCO-listed Old Town with a local historian. Visit the Lamu Museum, the ancient mosques, and the dhow-building yards. Sunset cruise on a traditional jahazi dhow.',
      },
      {
        day: 3,
        title: 'Shela Village & Beach',
        description:
          'Slow morning. Walk to the pristine Shela Beach — 14km of untouched white sand. Afternoon snorkeling in the Indian Ocean. Chef-curated coastal dinner under the stars.',
      },
      {
        day: 4,
        title: 'Island Hopping & Marine Reserve',
        description:
          'Private boat excursion to Manda Island and Kipungani. Explore tidal creeks, marine forest, and secluded sandbanks. Late afternoon return flight to Nairobi.',
      },
    ],
  },
  {
    id: 'maasai-mara-experience',
    title: 'Maasai Mara Deep Reset',
    location: 'Maasai Mara, Narok County',
    days: 5,
    price: 3800,
    travelerType: 'Couples',
    tags: ['wildlife', 'big five', 'private conservancy', 'bush dinner'],
    description:
      'Forget the crowded main reserve. We place you inside a private conservancy adjacent to the Mara — exclusive access, zero other vehicles, and trackers who know the land\'s deepest secrets. Wake when you want. The wilderness works around your rhythm.',
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Bush Welcome',
        description:
          'Private charter flight to the Mara. Conservancy welcome briefing. Afternoon game drive to settle in. Sundowner on the plains.',
      },
      {
        day: 2,
        title: 'Dawn Patrol & Big Cat Territory',
        description:
          'Pre-dawn game drive with expert tracker. Breakfast in the bush. Midday rest at camp. Afternoon full-day drive through the conservancy core zone.',
      },
      {
        day: 3,
        title: 'Walking Safari & Cultural Visit',
        description:
          'Guided walking safari at sunrise. Maasai village visit with a community elder. Afternoon river crossing watch (seasonal). Candlelit bush dinner.',
      },
      {
        day: 4,
        title: 'Hot Air Balloon (Optional) & Photography',
        description:
          'Sunrise balloon flight over the Mara (add-on, $450/person). Morning photography with a guide. Afternoon at leisure — spa, pool, or optional game drive.',
      },
      {
        day: 5,
        title: 'Final Dawn Drive & Departure',
        description:
          'Last sunrise game drive. Brunch at camp. Late morning charter back to Nairobi.',
      },
    ],
  },
  {
    id: 'samburu-pod-experience',
    title: 'Samburu Pod Experience',
    location: 'Samburu County',
    days: 4,
    price: 2500,
    travelerType: 'Solo',
    tags: ['wildlife', 'rare species', 'northern kenya', 'rugged'],
    description:
      "Samburu is Kenya's great secret — remote, raw, and strikingly beautiful. This is the only place in the world to see the 'Samburu Special Five': the reticulated giraffe, Grevy's zebra, Somali ostrich, gerenuk, and beisa oryx. Luxury lodges blend seamlessly into the ochre riverbanks of the Ewaso Ng'iro.",
    itinerary: [
      {
        day: 1,
        title: "Arrival & First Glimpse of Samburu's Wild",
        description:
          "Flight to Samburu airstrip. Transfer to lodge. Afternoon game drive along the Ewaso Ng'iro River. Welcome dinner under the stars.",
      },
      {
        day: 2,
        title: 'Special Five & River Crossing',
        description:
          'Full-day game drive focusing on the Samburu Special Five. Breakfast on the riverbank. Afternoon crocodile and elephant observation at the river.',
      },
      {
        day: 3,
        title: 'Camel Walk & Community Engagement',
        description:
          'Sunrise camel walk through the bush with a Samburu guide. Visit a traditional manyatta. Afternoon bird watching (350+ species) along the river.',
      },
      {
        day: 4,
        title: 'Final Drive & Departure',
        description:
          'Dawn drive for last wildlife encounters. Leisurely breakfast. Mid-morning flight back to Nairobi.',
      },
    ],
  },
  {
    id: 'watamu-pod-experience',
    title: 'Watamu Pod Experience',
    location: 'Watamu, Kilifi County',
    days: 4,
    price: 2200,
    travelerType: 'Family',
    tags: ['marine', 'snorkeling', 'sea turtles', 'beach'],
    description:
      "Watamu is Kenya's most pristine coastal jewel — a UNESCO Biosphere Reserve where sea turtles nest, whale sharks pass in season, and the Indian Ocean is a translucent shade of turquoise. Away from mass tourism, it remains genuinely unhurried.",
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Marine Reserve Orientation',
        description:
          'Fly into Malindi, private transfer to Watamu. Afternoon guided snorkel in the Marine National Park. Sunset at the villa with fresh-caught seafood.',
      },
      {
        day: 2,
        title: 'Sea Turtle Sanctuary & Deep Sea',
        description:
          'Morning visit to the Local Ocean Trust sea turtle conservation centre. Afternoon deep-sea fishing or snorkeling at Turtle Bay.',
      },
      {
        day: 3,
        title: 'Kayak Safari & Mida Creek',
        description:
          'Sunrise kayak through Mida Creek mangrove system. Birdwatching with a local ornithologist. Afternoon free at the beach villa.',
      },
      {
        day: 4,
        title: 'Gede Ruins & Departure',
        description:
          'Morning visit to the ancient Gede Ruins — a Swahili city abandoned mysteriously in the 18th century. Late morning transfer to Malindi for return flight.',
      },
    ],
  },
  {
    id: 'laikipia-experience',
    title: 'Laikipia Plains Retreat',
    location: 'Laikipia Plateau',
    days: 4,
    price: 3200,
    travelerType: 'Social circle',
    tags: ['ranch', 'horse riding', 'conservation', 'wide open spaces'],
    description:
      'The Laikipia Plateau is Kenya\'s most visionary conservation landscape — a mosaic of private ranches, community conservancies, and wilderness that rivals the Mara in diversity. Here, you ride horseback through game, track rhino on foot, and sleep to the sound of nothing but wind.',
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Ranch Orientation',
        description:
          'Fly to Nanyuki. Private transfer to the conservancy. Horse introduction and afternoon ride across the plateau. Open-fire dinner.',
      },
      {
        day: 2,
        title: 'Horseback Safari & Rhino Tracking',
        description:
          'Full-day horseback safari among elephant and giraffe. Afternoon guided rhino tracking on foot with armed rangers. Sundowner on a rocky outcrop.',
      },
      {
        day: 3,
        title: 'Community Conservancy & Dog Sledding',
        description:
          'Morning visit to community conservancy project. Afternoon at leisure: fly-fishing, game drives, or spa.',
      },
      {
        day: 4,
        title: 'Dawn Ride & Departure',
        description:
          'Final sunrise horseback ride. Bush brunch. Mid-morning transfer to Nanyuki for return flight.',
      },
    ],
  },
  {
    id: 'mount-kenya-experience',
    title: 'Mount Kenya Ascent',
    location: 'Mount Kenya, Central Kenya',
    days: 5,
    price: 2800,
    travelerType: 'Solo',
    tags: ['trekking', 'alpine', 'high altitude', 'adventure'],
    description:
      "Africa's second highest peak and a UNESCO World Heritage Site. The trek to Point Lenana (4,985m) combines bamboo forest, alpine moorland, and glacial lakes in a single ascent. Our guides are mountain specialists who adapt the pace entirely to you.",
    itinerary: [
      {
        day: 1,
        title: 'Nairobi → Sirimon Gate → Judmaier Camp',
        description:
          'Private drive to Mount Kenya National Park. Trek through montane forest to first camp (3,300m). Acclimatisation walk. Camp dinner.',
      },
      {
        day: 2,
        title: 'Mackinders Camp via Shipton\'s',
        description:
          "Trek through the iconic 'Vertical Bog' moorland. Arrive at Mackinders Camp (4,300m). Afternoon rest and acclimatisation hike.",
      },
      {
        day: 3,
        title: 'Summit Day — Point Lenana',
        description:
          '3am departure. Summit at sunrise for panoramic views of Kilimanjaro and the Rift Valley on clear days. Descent to Mintos Hut for lunch.',
      },
      {
        day: 4,
        title: 'Descent via Chogoria Route',
        description:
          "Descent through Kenya's most scenic valley, past Lake Michaelson and through giant heather forest.",
      },
      {
        day: 5,
        title: 'Chogoria Gate & Return',
        description:
          'Final descent to gate. Private transfer back to Nairobi. Celebratory dinner at a Nairobi restaurant.',
      },
    ],
  },
]

export const posts: JournalPost[] = [
  {
    slug: 'swahili-silence-lamu',
    title: 'The Swahili Silence of Lamu',
    excerpt:
      'A journey back in time where the only sounds are the rustle of dhow sails and the distant call to prayer. Discover private island living with zero digital intrusion.',
    author: 'Christopher James',
    date: 'Dec 20, 2023',
    category: 'Solo',
    readTime: '6 min read',
    image: '/images/lamu-sunset.jpg',
    content: `
Lamu does not announce itself. It simply absorbs you.

The flight from Wilson Airport takes forty-five minutes — a small propeller aircraft banking over the ochre coast before descending onto a grass strip on Manda Island. A dhow is waiting. Not a tourist dhow — a proper working vessel, low and wooden, crewed by two men who have made this crossing ten thousand times.

The channel between Manda and Lamu Island is short, maybe fifteen minutes, but it is the kind of crossing that resets something inside you. The engine is a distant concern. The sail catches a wind you hadn't noticed before. And then the Lamu waterfront appears: a bleached coral facade stretching along the seagrass channel, unchanged in its essentials for six hundred years.

There are no cars in Lamu Town. The streets are precisely wide enough for a donkey and a human to pass side by side. This is not a charm offensive — it is simply the way the old city was built, and nothing about its internal logic has required updating. You navigate by walls and the smell of cardamom.

I spent four days here. The itinerary EscapePod had built was technically very light — a guide for the first morning, a snorkeling session at Manda Toto Island, a sunset dhow sail, and otherwise an empty calendar. This turned out to be exactly right.

The Majlis Hotel, where I stayed, is on the seafront. My room had a carved Swahili bed, a ceiling fan, and a window that opened onto the channel. I woke each morning to the first call to prayer, which comes just before dawn and is genuinely one of the most beautiful sounds a human can hear from a warm bed.

What Lamu teaches, if you stay long enough, is that silence is a texture. It has depth and variation. The silence at noon — when the heat pushes everyone indoors — is different from the silence of 3am, which is absolute. The silence of the mosque courtyard is different from the silence of the beach at Shela, where the wind and the surf create a kind of white noise that clears the mind completely.

I had not expected to think about my work, my phone, the particular ambient anxiety that constitutes modern life in a city. But I noticed on day two that I had stopped thinking about them. Not suppressed — simply replaced by other, slower things.

This is, I think, what EscapePod means by the Luxury of Zero Friction. It isn't that everything is perfect. It's that nothing requires your attention. The boat arrives when it should. The meal is ready. The guide knows when to speak and when to be quiet. The machinery of the trip runs invisibly, and you are left to simply be somewhere.

Lamu will not suit everyone. It has no air-conditioned malls, no nightlife in the conventional sense, no spa with a swim-up pool. What it has is a profound, almost physical stillness that is increasingly rare in the world. For four days, I lived inside it. I recommend it without reservation.
    `,
  },
  {
    slug: 'deep-reset-in-the-mara',
    title: 'A Deep Reset in the Mara',
    excerpt:
      'Escape the crowds with exclusive access to a private Maasai Mara conservancy. Depart only when you are ready, guided by trackers who know the land\'s secrets.',
    author: 'Christopher James',
    date: 'Dec 20, 2023',
    category: '',
    readTime: '7 min read',
    image: '/images/mara.jpg',
    content: `
There is a version of the Maasai Mara that most people experience: a convoy of minibuses clustered around a cheetah, engines running, lenses extended, a hundred people witnessing the same thing simultaneously. It is not unmoving — the animal is real, the landscape is real. But it is witnessed rather than experienced.

The private conservancy where EscapePod placed me was different in kind, not degree.

The conservancy adjoins the northeastern edge of the main reserve. It is managed by the local Maasai community and accessible to guests of a single camp at a time. On the morning of my second game drive, I counted zero other vehicles from the time we left at 5:30am until we returned at noon. Six and a half hours in a landscape the size of a small country, and we were alone in it.

Our tracker was a man named Jackson, who had grown up in this ecosystem and whose relationship with it was not professional but ancestral. He read the grass in a way that I could not begin to decode — a bent stem here, a shadow there — and twice found leopard before I had understood we were looking for one.

The drive on day three began before dawn and ended with breakfast in a dry riverbed. The cook had arrived before us with a portable stove and a table covered in a white cloth. We ate eggs and fruit in complete silence while a martial eagle worked a thermal overhead and a herd of impala moved through the acacia at the edge of the tree line. There is no restaurant in the world with a better view.

What I hadn't expected was the pace. I had arrived expecting the rhythms of a safari — wake up, drive, eat, drive, eat, sleep — but EscapePod had built something looser and more honest. The camp manager told me on the first evening: "We have no schedule. We have suggestions. You tell us how you want to use your time."

I took this seriously. On day four I slept until nine. I sat by the fire with coffee for two hours. I walked to the perimeter of the camp with Jackson and watched a herd of elephant cross the lugga below us. I did not take my camera. I was simply there.

The bush dinner on the final evening was, by any metric, extraordinary: a clearing in the acacia wood, lit by lanterns, with a four-course meal and a night sky that made the Milky Way visible as a physical presence, not an abstraction. But what I remember more clearly is the silence between the courses, and the fact that no one felt compelled to fill it.

This is a place that rewards patience. Come with empty days and an open attention. Leave the itinerary loose.
    `,
  },
  {
    slug: 'raw-elegance-samburu',
    title: 'Raw Elegance in Samburu',
    excerpt:
      'Venture into the rugged, ochre-colored landscapes of the north. Encounter rare wildlife unique to this harsh paradise, while staying in uncompromised luxury.',
    author: 'Christopher James',
    date: 'Dec 20, 2023',
    category: 'Solo',
    readTime: '5 min read',
    image: '/images/elephant.jpg',
    content: `
Samburu is not easy to reach. That is part of its value.

The drive north from Nairobi takes six hours on a good day. The landscape changes almost immediately after you cross the equator — the highlands thin out, the trees grow sparse and thorned, and the earth turns from red to ochre to a pale, sun-bleached colour that has no exact name. By the time you reach the Ewaso Ng'iro River, you are in a different Kenya entirely.

The river is the spine of Samburu National Reserve. Everything worth seeing orbits it. The elephant arrive in the late afternoon to drink and spar and stand with their feet in the water. The crocodile are always there, barely visible, only the ridge of their skulls above the surface. Hippo emerge at dusk. And on the opposite bank, if you are patient, the reticulated giraffe — the long-necked signature species of the north — move between the doum palms with a slow grace that is somehow both absurd and beautiful.

I came to Samburu specifically to see the Special Five, and I saw all of them within thirty-six hours. But what stayed with me was not the checklist but the atmosphere. Samburu feels genuinely remote in a way that many reserves no longer do. There is something in the dry air and the flat-topped sky that registers as solitude.

The lodge EscapePod selected sits on a raised bank above the river. My tent — and I use the word loosely; it had a concrete floor, a four-poster bed, and hot water — looked directly onto the water. On the first night I lay in the dark and listened to the hippo moving below me. They are surprisingly loud animals: the water displacement alone is audible from twenty metres, a kind of wet percussion.

The camel walk on day three was the experience I hadn't anticipated. A Samburu guide named Leshao took me out at six in the morning with three camels — one to ride, two for the gear — and we walked for four hours across the plains in the direction of nothing in particular. We saw gerenuk. We saw a martial eagle take a dik-dik. We did not speak much, because there was nothing that needed saying.

Samburu will not suit everyone. If you want density of experience — multiple environments, varied activities, changing scenery — the coast or the highlands might serve you better. But if you want to be very still in a beautiful and uncompromising place, come here. The reserve has a quality of attention that is rare and, once noticed, addictive.
    `,
  },
  {
    slug: 'mount-kenya-trekking-guide',
    title: 'Mount Kenya Trekking: Routes, Difficulty, Prices, and What to Expect',
    excerpt:
      "Mount Kenya, the second-highest peak in Africa at 5,199 meters, offers a unique trekking experience that blends alpine challenge with extraordinary ecological richness.",
    author: 'Layla Doey',
    date: 'Dec 20, 2023',
    category: 'Adventure',
    readTime: '9 min read',
    image: '/images/mt kenya.jpg',
    content: `
Mount Kenya invites adventurers into a landscape of striking contrasts and layered experiences. As Kenya's highest mountain and a UNESCO World Heritage Site, it offers multiple peaks, diverse ecosystems, and tranquil trails that set it apart from every other mountain experience in Africa.

**Multiple Peaks to Explore**

From the technical summits of Batian (5,199m) and Nelion (5,188m) to the more accessible Point Lenana (4,985m), trekkers can choose their challenge and pace. Lenana is achievable by non-technical climbers with good fitness; Batian and Nelion require technical climbing experience and equipment.

**Diverse Ecosystems**

Traverse bamboo forests, alpine moorlands, and glacial valleys, all within a single ascent. The mountain's ecological richness is a journey in itself. Below 3,000m, dense montane forest houses colobus monkeys, elephant, and buffalo. The moorland zone above 3,500m is dominated by giant lobelia and giant senecio — plants that exist nowhere else.

**Route Options**

The Sirimon Route (the standard ascent) offers the most gradual acclimatisation and the best wildlife viewing. The Chogoria Route (for descent) is widely considered the most scenic in Africa, passing Lake Michaelson in a glacial valley that feels like another world.

**Pricing**

A guided 5-day Sirimon-Chogoria circuit, including park fees, accommodation, porter and guide costs, starts at approximately $2,800 per person through EscapePod Kenya. This is an all-inclusive price; there are no hidden costs.

**What to Expect**

The mountain demands respect. Altitude affects everyone differently; the itinerary we use for EscapePod clients is designed to allow proper acclimatisation, with a rest day built in before the summit attempt. The summit push begins at 3am to hit the peak at sunrise before afternoon cloud moves in.

The mountain is cold — below freezing at night above 4,000m. Good sleeping bag, layering system, and waterproofs are essential. EscapePod provides a full kit list and can organise equipment rental from Nanyuki if needed.

**Why Trek Mount Kenya with EscapePod**

Our guides are drawn from the mountain communities — men who have summited Lenana hundreds of times and who understand the mountain's moods with an intimacy that no outsider can replicate. The logistics — park fees, porters, hut bookings, transfers — are handled before you arrive. You carry only what you choose to carry.
    `,
  },
]

export const toursByTag: Record<string, string[]> = {
  coastal: ['lamu-pod-experience', 'watamu-pod-experience'],
  wildlife: ['maasai-mara-experience', 'samburu-pod-experience', 'laikipia-experience'],
  adventure: ['mount-kenya-experience', 'laikipia-experience'],
  culture: ['lamu-pod-experience', 'watamu-pod-experience'],
  solo: ['lamu-pod-experience', 'samburu-pod-experience', 'mount-kenya-experience'],
  couples: ['maasai-mara-experience', 'lamu-pod-experience'],
  family: ['watamu-pod-experience'],
  group: ['laikipia-experience'],
}
