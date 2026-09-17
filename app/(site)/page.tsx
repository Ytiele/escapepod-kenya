import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import PhilosophySection from '@/components/home/PhilosophySection'
import ZeroFrictionSection from '@/components/home/ZeroFrictionSection'
import PreplannedToursSection from '@/components/home/PreplannedToursSection'
import JournalsSection from '@/components/home/JournalsSection'
import OnGroundSection from '@/components/home/OnGroundSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import NewsletterSection from '@/components/home/NewsletterSection'
import { posts } from '@/data/mock'

// Explicit rather than relying purely on the root layout's default title —
// this IS the page search engines most often land on for the site's core
// terms, so it's worth a canonical + description tuned to it specifically.
export const metadata: Metadata = {
  title: 'EscapePod Kenya — Bespoke Kenyan Journeys, Zero Friction',
  description:
    'Private, intention-led travel design across Kenya — safaris, coastal escapes, and family journeys curated by EscapePod Intelligence and a real travel designer, not a template.',
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PhilosophySection />
      <ZeroFrictionSection />
      <PreplannedToursSection />
      <JournalsSection posts={posts.slice(0, 3)} />
      <OnGroundSection />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  )
}
