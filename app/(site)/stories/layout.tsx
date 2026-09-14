import type { Metadata } from 'next'

// app/(site)/stories/page.tsx is a Client Component ('use client', for the
// category filter state), which can't export `metadata` itself — this
// server-rendered layout carries it instead. Individual posts under
// stories/[slug] set their own title/description via generateMetadata,
// which overrides these for that route.
export const metadata: Metadata = {
  title: 'Our Stories',
  description:
    'Journals from the road — real accounts of Kenyan safaris, coastal escapes, and journeys designed by EscapePod, from Lamu to the Maasai Mara to Mount Kenya.',
  alternates: { canonical: '/stories' },
}

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
