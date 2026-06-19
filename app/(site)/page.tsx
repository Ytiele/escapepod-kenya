import HeroSection from '@/components/home/HeroSection'
import PhilosophySection from '@/components/home/PhilosophySection'
import ZeroFrictionSection from '@/components/home/ZeroFrictionSection'
import JournalsSection from '@/components/home/JournalsSection'
import OnGroundSection from '@/components/home/OnGroundSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import NewsletterSection from '@/components/home/NewsletterSection'
import { posts } from '@/data/mock'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PhilosophySection />
      <ZeroFrictionSection />
      <JournalsSection posts={posts.slice(0, 3)} />
      <OnGroundSection />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  )
}
