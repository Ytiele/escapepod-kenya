'use client'
import { motion } from 'framer-motion'
import { stagger, fadeUp, slideUp, viewport } from '@/lib/motion'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: 'Invisible Logistics',
    description:
      'Private SUVs only. No shared transport, no waiting rooms, and no crowds. Your movement through the landscape is entirely seamless.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: 'Zero-Surprise Execution',
    description:
      'Over 95% of our journeys are delivered exactly as planned, with proactive weather and delay management happening quietly behind the scenes.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Fluid Itineraries',
    description:
      'Wake up when you want. Eat when you are hungry. We design the flawless framework, but you ultimately dictate the daily rhythm.',
  },
]

export default function ZeroFrictionSection() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <motion.span variants={fadeUp} className="text-gold text-xs font-medium tracking-[0.2em] uppercase">
            Our Standard
          </motion.span>
          <motion.h2 variants={slideUp} className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight">
            The Luxury of Zero Friction
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-navy/50 text-lg max-w-2xl mx-auto">
            We believe the greatest luxury is the absence of concern. Our operational standard is
            absolute invisibility.
          </motion.p>
        </motion.div>

        {/* Cards — stagger up with inline transition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                delay: i * 0.12,
              }}
              className="bg-navy/5 border border-navy/10 rounded-2xl p-8 hover:border-gold/30 transition-colors"
            >
              <div className="text-gold mb-5">{f.icon}</div>
              <h3 className="text-navy text-xl font-medium mb-3">{f.title}</h3>
              <p className="text-navy/50 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
