'use client'
import { motion } from 'framer-motion'
import { stagger, slideUp, fadeUp, fromLeft, fromRight, viewport } from '@/lib/motion'

const testimonials = [
  {
    quote:
      "We never touched a bag, checked a schedule, or worried about a transfer. The purest form of travel I've ever experienced.",
    author: 'J. & M. Sterling',
    type: 'Couples',
  },
  {
    quote:
      "Exclusive access isn't a marketing buzzword for them. We were literally the only vehicle for miles in the Mara.",
    author: 'David L.',
    type: 'Solo',
  },
]

const cardDirections = [fromLeft, fromRight]

export default function TestimonialsSection() {
  return (
    <section className="bg-navy py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <motion.span variants={fadeUp} className="text-gold text-xs font-medium tracking-[0.2em] uppercase">
            Voices of the Journey
          </motion.span>
          <motion.h2 variants={slideUp} className="mt-4 text-cream text-4xl md:text-5xl font-medium tracking-tight">
            Hear from those who have<br className="hidden md:block" /> crossed the threshold.
          </motion.h2>
        </motion.div>

        {/* Cards — first from left, second from right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              variants={cardDirections[i]}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="bg-cream/10 border border-cream/20 rounded-2xl p-8 flex flex-col gap-6"
            >
              <svg className="w-8 h-8 text-gold/60" fill="currentColor" viewBox="0 0 32 32">
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>
              <p className="text-cream text-lg leading-relaxed font-medium flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p className="text-cream font-medium">{t.author}</p>
                <p className="text-cream/50 text-sm">{t.type} Journey</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
