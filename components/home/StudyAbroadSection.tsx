'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { stagger, staggerSlow, fromLeft, slideUp, fadeUp, scaleIn, viewport } from '@/lib/motion'
import { T } from '@/components/i18n/T'

// Compact homepage teaser for the /study-abroad page (faculty-led,
// institutional programs) — sits right under Pre-Planned Journeys since
// both are "browse a ready-made offering" sections, but this one is a
// single band rather than a card grid: it's a distinct B2B audience
// (universities, not individual travelers) and doesn't need its own
// card grid duplicated on the homepage.
export default function StudyAbroadSection() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="rounded-3xl overflow-hidden shadow-sm border border-navy/10 order-2 lg:order-1"
          >
            <Image
              src="/images/nairobi-skyline-wikimedia.jpg"
              alt="Nairobi skyline"
              width={1600}
              height={1067}
              sizes="(min-width: 1024px) 45vw, 100vw"
              loading="lazy"
              className="w-full h-auto object-cover"
            />
          </motion.div>

          <motion.div
            className="order-1 lg:order-2"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <motion.span variants={fromLeft} className="text-gold text-xs font-medium tracking-[0.2em] uppercase">
              <T>For Universities & Institutions</T>
            </motion.span>
            <motion.h2 variants={slideUp} className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
              <T>Bring Your Classroom to Africa</T>
            </motion.h2>
            <motion.div variants={staggerSlow} className="mt-6 space-y-4">
              <motion.p variants={fadeUp} className="text-charcoal/70 text-base leading-relaxed max-w-lg">
                <T>Faculty-led study abroad programs across Kenya, Uganda, and Ghana — end-to-end logistics,
                academic enrichment, and real-world immersion, designed around your course.</T>
              </motion.p>
            </motion.div>
            <motion.div variants={scaleIn} className="pt-6">
              <Link
                href="/study-abroad"
                className="inline-flex items-center gap-3 bg-gold text-navy font-medium px-7 py-3.5 rounded-full text-sm hover:bg-gold/90 transition-colors"
              >
                <T>Explore Educational Tours</T>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
