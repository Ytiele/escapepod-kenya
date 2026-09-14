import type { Metadata } from 'next'

// app/(site)/about/page.tsx is a Client Component ('use client', for the
// FounderSection's expand/collapse state), which can't export `metadata`
// itself — this server-rendered layout carries it instead.
export const metadata: Metadata = {
  title: 'Who We Are',
  description:
    'Escape Pod Kenya was built to eliminate friction, not sell itineraries — meet the philosophy and the founder, Rose Kagucia, behind bespoke Kenyan travel design.',
  alternates: { canonical: '/about' },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
