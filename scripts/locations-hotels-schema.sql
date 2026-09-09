-- Run this once in the Supabase SQL editor to load the full Kenya
-- location/hotel candidate catalogue (35 locations across 7 regions, 78
-- real hotels/lodges) — supplied as escapepod_kenya.sql / locations.csv /
-- hotels.csv.
--
-- This is reference/planning data, NOT the same thing as the `experiences`
-- table (see scripts/curate-schema.sql) — `experiences` holds fully
-- curated, priced, bookable packages (currently 10 destinations); this is
-- the much broader "candidate site" catalogue the team is scouting from,
-- with no pricing, persona_fit, or experience_dna, so it isn't wired into
-- the Curation Engine's search/matching. Nothing here should be presented
-- to a traveler as a bookable listing until it's been turned into a real,
-- verified `experiences` row.
--
-- Adapted from the provided SQLite dump: same schema and data, but with
-- `locations` created (and seeded) before `hotels`, since `hotels.location_id`
-- references `locations(id)` — Postgres enforces that the referenced table
-- exist at CREATE TABLE time, unlike SQLite's more lenient deferred check.

create table if not exists locations (
  id                     integer primary key,
  region                 text not null,
  name                   text not null,
  tier                   text not null check (tier in ('Top-Tier', 'Mid-Tier')),
  site_type              text,
  key_attractions        text,
  signature_activities   text,
  distance_from_nairobi  text,
  suitability_notes      text
);

create table if not exists hotels (
  id             integer primary key,
  location_id    integer not null references locations(id),
  name           text not null,
  price_segment  text not null check (price_segment in ('Luxury', 'Mid-Tier'))
);

insert into locations (id, region, name, tier, site_type, key_attractions, signature_activities, distance_from_nairobi, suitability_notes) values
(1,'Coastal Kenya','Diani Beach','Top-Tier','Beach','Coral reef, Kaya Kinondo forest, colobus monkeys','Kite-surfing, snorkeling, diving, beach yoga; gentle beach walks and verandah relaxation for quieter guests','500 km / 5-6 hrs drive, 1 hr flight','Crowded top-tier market; needs a distinctive design angle'),
(2,'Coastal Kenya','Watamu','Top-Tier','Beach / Marine Park','Watamu Marine Park, Mida Creek, Gede Ruins','Snorkeling, dhow trips, deep-sea fishing; calm glass-bottom boat tours and beachfront lounging suit slower-paced guests','480 km / 5 hrs drive, 1 hr flight','Quieter than Diani, strong conservation branding fits an eco-pod concept well'),
(3,'Coastal Kenya','Lamu Island / Shela','Top-Tier','Island / Heritage','Lamu Old Town (UNESCO), Shela Beach, dhow culture','Dhow cruises, donkey trails, heritage tours; slow-paced old-town walks and verandah reading, no cars on the island','Fly-in only, ~1 hr from Nairobi','Premium, low-density, exclusivity-driven market'),
(4,'Coastal Kenya','Kilifi','Mid-Tier','Creek / Cliff','Kilifi Creek, Mnarani ruins, Bofa Beach','Kitesurfing, sailing, creek kayaking; gentle sundowner cruises on the creek are a low-exertion favorite','530 km / 5.5 hrs drive, 1 hr flight','Younger, creative crowd; fits design-forward pods on the creek cliffs'),
(5,'Coastal Kenya','Tiwi Beach','Mid-Tier','Beach','Tiwi tide pools, reef snorkeling, coconut groves','Snorkeling, beach relaxation; calm-water swimming and quiet beach lounging, away from Diani''s crowds','500 km / 5 hrs drive','Under-developed relative to Diani; room for a differentiated mid-tier pod site'),
(6,'Southern Safari Circuit','Maasai Mara National Reserve','Top-Tier','Savanna / Wildlife Reserve','Wildebeest Migration, Big Five, Mara River crossings','Game drives, hot-air ballooning, cultural visits; vehicle-based drives need no walking, well suited to limited mobility','270 km / 5-6 hrs drive, 45 min flight','Flagship safari draw; premium pricing but heavy competition'),
(7,'Southern Safari Circuit','Mara Naboisho Conservancy','Top-Tier','Private Conservancy','Low tourist density, elephant and lion corridors, granite outcrops','Private, unhurried game drives, bush picnics; quieter and less bumpy than the main reserve','270 km / 5-6 hrs drive, 45 min flight','Private conservancy model allows flexible development terms and a calmer pace than the reserve'),
(8,'Southern Safari Circuit','Amboseli National Park','Top-Tier','Savanna / Wildlife Reserve','Free-ranging elephant herds, Mt Kilimanjaro views','Game drives, photography, Observation Hill walks; flat terrain and short lodge-verandah viewing suit less-mobile guests','240 km / 4 hrs drive, 40 min flight','Iconic Kilimanjaro backdrop, strong visual hook for marketing'),
(9,'Southern Safari Circuit','Tsavo West National Park','Mid-Tier','Savanna / Volcanic','Mzima Springs, Shetani lava flow, Chyulu Hills views','Game drives, cave visits, walking safaris; low-impact spa and pool days between drives','240 km / 4-5 hrs drive','Wilder, less crowded than Tsavo East; good value positioning'),
(10,'Southern Safari Circuit','Tsavo East National Park','Mid-Tier','Savanna','Red elephants, Yatta Plateau, Lugard Falls','Game drives, riverside picnics; entirely vehicle-based viewing, minimal walking required','330 km / 5 hrs drive','Kenya''s largest park; affordable land access supports a mid-tier pod camp'),
(11,'Rift Valley Lakes','Lake Nakuru National Park','Top-Tier','Soda Lake / Wildlife Reserve','Rhino sanctuary, seasonal flamingos, Baboon Cliff','Game drives, rhino tracking; short viewpoint walks and vehicle drives, gentle pace available','160 km / 2.5-3 hrs drive','Fenced, rhino-secure park; strong conservation story'),
(12,'Rift Valley Lakes','Lake Naivasha','Mid-Tier','Freshwater Lake','Hippo pods, Crescent Island, Hell''s Gate gorge','Boat rides, cycling, birdwatching; gentle boat cruises let older guests view wildlife from the water','90 km / 1.5-2 hrs drive','Closest lake escape to Nairobi; ideal weekend-getaway site'),
(13,'Rift Valley Lakes','Lake Elementaita','Mid-Tier','Soda Lake','Flamingo flocks, Kariandusi prehistoric site, Soysambu Conservancy','Birdwatching, game drives, hiking; verandah bird-watching and gentle lakeshore relaxation','120 km / 2 hrs drive','Quieter than Naivasha/Nakuru; scenic conservancy access for a low-key site'),
(14,'Rift Valley Lakes','Lake Bogoria','Mid-Tier','Soda Lake / Geothermal','Steaming geysers, hot springs, flamingo flocks','Geyser walks, birdwatching, hot-spring bathing; the hot springs are a naturally restorative, low-exertion draw for older guests','260 km / 4 hrs drive','Dramatic geothermal landscape; unique mid-tier differentiator'),
(15,'Rift Valley Lakes','Lake Baringo','Mid-Tier','Freshwater Lake','Njemps fishing culture, crocodile/hippo populations, 470+ bird species','Boat safaris, birdwatching, island visits; boat-based birdwatching needs no walking at all','285 km / 4.5 hrs drive','Strong birding niche; ideal for a specialist eco-tourism audience'),
(16,'Central Highlands','Aberdare National Park','Top-Tier','Montane Forest','Treetop wildlife, waterfalls, moorland','Treetop-lodge game viewing, forest and waterfall hikes; waterhole-watching from lodge decks needs no exertion','165 km / 2.5-3 hrs drive','Treetop-lodge precedent; strong existing demand'),
(17,'Central Highlands','Mount Kenya (Naro Moru / Sirimon)','Top-Tier','Mountain / Alpine','Africa''s 2nd-highest peak, alpine moorland, glacial lakes','Trekking, mountaineering, high-altitude camping; lower-altitude lodge stays offer mountain views without the climb','180 km / 3 hrs drive','Mid-altitude pods could serve as summit-route acclimatisation stops'),
(18,'Central Highlands','Solio Ranch / Conservancy','Top-Tier','Private Rhino Sanctuary','Kenya''s most successful private rhino-breeding reserve, tree-climbing lions','Guided game drives, guided walks; easy vehicle-based rhino viewing and in-cottage spa treatments, very low exertion','200 km / 3.5-4 hrs drive, 40 min flight','Small, exclusive, high-conservation-value conservancy between Mt Kenya and the Aberdares'),
(19,'Central Highlands','Nanyuki','Mid-Tier','Highland Town','Equator line, Mt Kenya views, gateway to Laikipia','Horse riding, cycling, farm visits; gentle garden and farm tours for a slower pace','200 km / 3 hrs drive','Well-connected hub for highland and conservancy stays'),
(20,'Central Highlands','Nyeri / Aberdare Country Club area','Mid-Tier','Farmland / Foothills','Tea plantations, Mt Kenya foothill views, colonial-era history','Farm tours, golf, nature walks; golf, garden strolls and afternoon tea on the lawns suit a relaxed pace','150 km / 2.5 hrs drive','Gentle, accessible landscape good for a family or senior-friendly retreat'),
(21,'Northern Kenya','Lewa Wildlife Conservancy','Top-Tier','Conservancy','UNESCO site, black/white rhino, Grevy''s zebra','Walking safaris, horseback safaris, game drives; gentle vehicle safaris and guided verandah talks for less-active guests','280 km / 5 hrs drive, 1 hr flight','Ultra-premium conservancy brand; high design bar'),
(22,'Northern Kenya','Samburu National Reserve','Top-Tier','Semi-Arid Savanna','Special Five wildlife, Ewaso Nyiro River','Game drives, riverside walks, cultural visits; riverside lodge lounges offer wildlife views without walking','340 km / 6 hrs drive, 1 hr flight','Distinct arid-lands wildlife; flagship northern pod camp'),
(23,'Northern Kenya','Laikipia Plateau (Ol Pejeta)','Top-Tier','Conservancy','Last northern white rhinos, chimp sanctuary','Game drives, rhino tracking, night drives; the chimpanzee sanctuary viewing is a short, easy, paved walk','220 km / 4 hrs drive, 45 min flight','Conservation-led model; strong donor/visitor interest'),
(24,'Northern Kenya','Meru National Park','Top-Tier','Savanna / Riverine','Elsa the lioness heritage, Big Five, 400+ bird species','Game drives, birdwalks, cultural tours; quiet, low-crowd game drives and riverside verandah relaxation','350 km / 5-6 hrs drive, 1 hr flight','Uncrowded ''hidden gem'' park; calmer alternative to the busier northern reserves'),
(25,'Northern Kenya','Shaba National Reserve','Mid-Tier','Semi-Arid Savanna','Ewaso Nyiro River, doum palm oases, adjoins Samburu','Game drives, birdwatching; poolside relaxation between drives and gentle river walks','345 km / 6 hrs drive, 1 hr flight','Quieter sister reserve to Samburu; oasis-like setting with far fewer vehicles'),
(26,'Western Kenya','Kakamega Forest','Mid-Tier','Rainforest','Endemic birds and primates, canopy walkway','Guided forest walks, birdwatching, night walks; short, level forest trails suit gentle walkers','415 km / 6-7 hrs drive, 1 hr flight','Unique rainforest ecosystem; strong eco-tourism credentials'),
(27,'Western Kenya','Kisumu / Lake Victoria','Mid-Tier','Lake City','Lake Victoria shoreline, impala sanctuary','Boat trips, birdwatching, sunset cruises; calm lakeside boat cruises need no walking','340 km / 5-6 hrs drive, 1 hr flight','Growing city tourism plus lake access; business and leisure mix'),
(28,'Western Kenya','Kericho Tea Hills','Mid-Tier','Highland Tea Country','Rolling tea estates, cool highland climate, colonial-era hotel heritage','Tea-factory tours, garden walks; unhurried tea-estate drives and verandah tea service, long valued as a quiet retreat','266 km / 4-4.5 hrs drive','Established ''quiet countryside'' reputation; gentle scenery well suited to a low-key retreat concept'),
(29,'Western Kenya','Kit Mikayi & Hills','Mid-Tier','Cultural / Rock Formation','Sacred Luo rock formation, Nyanza views','Cultural tours, hiking, photography; a short, level viewpoint walk suits less-active visitors','370 km / 6 hrs drive','Strong cultural-tourism angle; small heritage-focused site'),
(30,'Western Kenya','Ruma National Park','Mid-Tier','Savanna','Kenya''s only roan antelope population, Rothschild''s giraffe','Game drives, guided walks; quiet, low-traffic game drives with minimal walking','425 km / 6.5 hrs drive','Under-visited niche park; low land pressure for an affordable pilot site'),
(31,'Nairobi & Environs','Nairobi National Park','Mid-Tier','Urban Savanna','Wildlife with city skyline, black rhino sanctuary','Game drives, walking trails, picnic sites; drive-through game viewing needs no walking at all','Within Nairobi city limits','''Wild city'' angle; easy-access entry-level pod product'),
(32,'Nairobi & Environs','Karen / Langata (Nairobi)','Top-Tier','Suburban / Heritage','Karen Blixen Museum, Giraffe Centre, Sheldrick elephant orphanage','Museum visits, giraffe feeding, garden strolls; all low-exertion and set in quiet, leafy grounds','Within Nairobi city limits (Karen suburb)','Established premium leisure suburb; low-density, garden-set properties already command top rates'),
(33,'Nairobi & Environs','Ngong Hills','Mid-Tier','Highland Ridge','Rift Valley escarpment views, Karen Blixen history','Hiking, cycling, paragliding; scenic drives along the ridge for those who prefer not to hike','25 km / 45 min drive','Very close, dramatic views; strong first pilot pod site'),
(34,'Nairobi & Environs','Karura Forest','Mid-Tier','Urban Forest','Waterfalls, caves, Mau Mau historical sites','Cycling, running, guided nature walks; flat, paved forest trails and picnic areas suit gentle walkers','Within Nairobi city limits','Very high accessibility for day visitors; better suited to a small showcase pod than a full retreat'),
(35,'Nairobi & Environs','Ol Donyo Sabuk / Fourteen Falls','Mid-Tier','Mountain / Waterfall','Fourteen Falls, forested mountain, buffalo herds','Hiking, waterfall visits, birdwatching; waterfall viewing is possible from accessible platforms near the car park','85 km / 1.5-2 hrs drive','Under-marketed but scenic; good value weekend option')
on conflict (id) do nothing;

insert into hotels (id, location_id, name, price_segment) values
(1,1,'Sands at Nomad','Luxury'),
(2,1,'Baobab Beach Resort & Spa','Mid-Tier'),
(3,1,'Diani Reef Beach Resort & Spa','Mid-Tier'),
(4,2,'Hemingways Watamu','Luxury'),
(5,2,'Medina Palms','Luxury'),
(6,2,'Turtle Bay Beach Club','Mid-Tier'),
(7,3,'Peponi Hotel','Luxury'),
(8,3,'Kijani Hotel','Luxury'),
(9,3,'Manda Bay Lodge','Luxury'),
(10,4,'Mnarani Beach Club','Mid-Tier'),
(11,4,'Baobab Sea Lodge','Mid-Tier'),
(12,4,'Distant Relatives Ecolodge','Mid-Tier'),
(13,5,'Amani Tiwi Beach Resort (has wheelchair-accessible rooms)','Mid-Tier'),
(14,6,'Governors'' Camp','Luxury'),
(15,6,'Mahali Mzuri','Luxury'),
(16,6,'Fig Tree Camp','Mid-Tier'),
(17,7,'Naboisho Camp','Luxury'),
(18,7,'Kicheche Valley Camp','Luxury'),
(19,8,'Amboseli Serena Safari Lodge','Luxury'),
(20,8,'Tortilis Camp','Luxury'),
(21,8,'Ol Tukai Lodge','Mid-Tier'),
(22,9,'Finch Hattons','Luxury'),
(23,9,'Kilaguni Serena Safari Lodge','Mid-Tier'),
(24,9,'Severin Safari Camp','Mid-Tier'),
(25,10,'Voi Safari Lodge','Mid-Tier'),
(26,10,'Ashnil Aruba Lodge','Mid-Tier'),
(27,11,'Sarova Lion Hill Game Lodge','Luxury'),
(28,11,'Lake Nakuru Sopa Lodge','Mid-Tier'),
(29,12,'Enashipai Resort & Spa','Luxury'),
(30,12,'Lake Naivasha Sopa Lodge','Mid-Tier'),
(31,12,'Lake Naivasha Country Club','Mid-Tier'),
(32,13,'Lake Elementaita Serena Camp','Luxury'),
(33,13,'Sunbird Lodge','Mid-Tier'),
(34,14,'Lake Bogoria Spa Resort','Mid-Tier'),
(35,15,'Lake Baringo Club','Mid-Tier'),
(36,15,'Robert''s Camp','Mid-Tier'),
(37,16,'The Ark','Luxury'),
(38,16,'Treetops Lodge','Luxury'),
(39,16,'Aberdare Country Club','Luxury'),
(40,17,'Serena Mountain Lodge','Luxury'),
(41,17,'Fairmont Mount Kenya Safari Club','Luxury'),
(42,18,'Solio Lodge','Luxury'),
(43,19,'Fairmont Mount Kenya Safari Club','Luxury'),
(44,19,'Sweetwaters Serena Camp','Luxury'),
(45,20,'Aberdare Country Club','Luxury'),
(46,20,'Outspan Hotel','Mid-Tier'),
(47,21,'Lewa Safari Camp','Luxury'),
(48,21,'Lewa House','Luxury'),
(49,21,'Lewa Wilderness','Luxury'),
(50,22,'Elephant Bedroom Camp','Luxury'),
(51,22,'Saruni Samburu','Luxury'),
(52,22,'Samburu Serena Lodge','Mid-Tier'),
(53,23,'Kicheche Laikipia','Luxury'),
(54,23,'Sweetwaters Serena Camp','Mid-Tier'),
(55,23,'Ol Pejeta Bush Camp','Mid-Tier'),
(56,24,'Elsa''s Kopje','Luxury'),
(57,24,'Rhino River Camp','Mid-Tier'),
(58,25,'Joy''s Camp','Luxury'),
(59,25,'Sarova Shaba Game Lodge','Mid-Tier'),
(60,26,'Rondo Retreat Centre','Mid-Tier'),
(61,27,'Sovereign Hotel','Mid-Tier'),
(62,27,'Acacia Premier Hotel','Mid-Tier'),
(63,28,'Kericho Tea Hotel (historic 1958 property amid the tea estates)','Mid-Tier'),
(64,29,'No dedicated lodge on site yet','Mid-Tier'),
(65,29,'nearest lodging is in Kisumu (~40 min)','Mid-Tier'),
(66,30,'No dedicated lodges','Mid-Tier'),
(67,30,'only basic KWS bandas and campsites','Mid-Tier'),
(68,31,'The Emakoko','Luxury'),
(69,31,'Ololo Safari Lodge','Luxury'),
(70,31,'Nairobi Tented Camp (Porini)','Mid-Tier'),
(71,32,'Giraffe Manor','Luxury'),
(72,32,'House of Waine','Luxury'),
(73,32,'Hemingways Nairobi','Luxury'),
(74,33,'Ngong Hills Hotel (base of the ridge, Ngong Road)','Mid-Tier'),
(75,34,'No lodging on site','Mid-Tier'),
(76,34,'nearest hotels in central Nairobi / Westlands (~20 min)','Mid-Tier'),
(77,35,'Fourteen Falls Lodge','Mid-Tier'),
(78,35,'Ol Donyo Sabuk Resort','Mid-Tier')
on conflict (id) do nothing;

-- Row-level security stays OFF, same as the other tables here — this is
-- only ever touched via supabaseAdmin (the service_role key).
