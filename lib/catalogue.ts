// Destinations that exist as rows in `experiences` but aren't actually
// ready to be auto-suggested/booked yet (e.g. added ahead of the property
// being confirmed). Keeping this as an explicit exclusion list — rather
// than deleting the rows — means the data survives once a destination is
// actually ready; just remove it from this list.
//
// Anything listed here is treated exactly like a destination that isn't in
// the catalogue at all: search/suggestions never surface it, and a
// traveler who asks for it by name goes through the normal "not in the
// verified catalogue yet" conversational + submit_custom_itinerary_request
// flow instead of getting an instantly-priced card.
export const NOT_YET_VERIFIED_DESTINATIONS = ['Kilifi'];

function isNotYetVerified(destination: string | null | undefined): boolean {
  if (!destination) return false;
  return NOT_YET_VERIFIED_DESTINATIONS.some((d) => d.toLowerCase() === destination.toLowerCase());
}

export function isVerifiedDestination(destination: string | null | undefined): boolean {
  return !isNotYetVerified(destination);
}

export function filterVerified<T extends { destination?: string | null }>(rows: T[]): T[] {
  return rows.filter((row) => isVerifiedDestination(row.destination));
}
