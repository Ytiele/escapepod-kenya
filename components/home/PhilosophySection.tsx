'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { stagger, staggerSlow, fromLeft, slideUp, fadeUp, scaleIn, viewport } from '@/lib/motion'

export default function PhilosophySection() {
  return (
    <section className="bg-cream py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left col — slides in from left */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <motion.span
              variants={fromLeft}
              className="text-gold text-xs font-medium tracking-[0.2em] uppercase"
            >
              The Process
            </motion.span>
            <motion.h2
              variants={slideUp}
              className="mt-4 text-navy text-4xl md:text-5xl font-medium leading-[1.15] tracking-tight"
            >
              Tell us how you want to feel.{' '}
              <span className="text-gold">We will orchestrate the rest.</span>
            </motion.h2>
          </motion.div>

          {/* Right col — stagger fade up */}
          <motion.div
            className="space-y-6"
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <motion.p variants={fadeUp} className="text-charcoal/70 text-lg leading-relaxed">
              True luxury cannot be found in a static itinerary. It is built around your specific,
              unspoken rhythm.
            </motion.p>
            <motion.p variants={fadeUp} className="text-charcoal/70 text-base leading-relaxed">
              Whether you crave the absolute isolation of an off-grid conservancy, the effortless
              flow of a fully staffed coastal villa, or the shared thrill of an untamed landscape —
              your ideal journey begins not with a destination, but with a state of mind.
            </motion.p>
            <motion.p variants={fadeUp} className="text-charcoal/70 text-base leading-relaxed">
              Leave the logistics, the research, and the cognitive load behind. Give us a few
              intuitive cues and we will architect an entirely unrepeatable Kenyan escape designed
              exclusively for you.
            </motion.p>
            <motion.div variants={scaleIn} className="pt-4">
              <Link
                href="/engine"
                className="inline-flex items-center gap-3 bg-navy text-cream font-medium px-7 py-3.5 rounded-full text-sm hover:bg-navy/80 transition-colors"
              >
                Begin The Curation
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
