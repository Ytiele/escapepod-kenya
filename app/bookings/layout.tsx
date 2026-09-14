import type { Metadata } from 'next'

// Covers both app/bookings/page.tsx and app/bookings/[reference]/page.tsx
// (both Client Components, which can't export `metadata` themselves).
// Every booking here belongs to one traveler's account — private,
// noindexed, and excluded from the sitemap.
export const metadata: Metadata = {
  title: 'My Bookings',
  robots: { index: false, follow: false },
}

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
