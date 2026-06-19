'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { stagger, staggerFast, scaleIn, slideUp, fadeUp, fadeUpSoft, scaleFade, viewport, viewportNear } from '@/lib/motion'

const panels = {
  guide: {
    image: '/images/Guided tour.jpg',
    imagePosition: 'center top',
    title: 'Private Guides',
    description:
      'Secure an accompanied local expert for wildlife photography, cultural heritage, or multi-day expeditions.',
  },
  transport: {
    image: '/images/Trusted transport.jpg',
    imagePosition: 'center center',
    title: 'Trusted Transport',
    description:
      "Private, secure, unbranded SUVs through our exclusive partnership with Motogari — Kenya's premier private transport network.",
  },
}

export default function OnGroundSection() {
  const [activePanel, setActivePanel] = useState<'guide' | 'transport'>('guide')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  const current = panels[activePanel]

  return (
    <section className="bg-sand py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header — badge pops, heading slides up, body fades */}
        <motion.div
          className="text-center mb-12"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <motion.span
            variants={scaleIn}
            className="text-gold text-xs font-medium tracking-[0.2em] uppercase bg-gold/10 px-3 py-1.5 rounded-full inline-block"
          >
            Already in Kenya?
          </motion.span>
          <motion.h2 variants={slideUp} className="mt-6 text-navy text-4xl md:text-5xl font-medium tracking-tight">
            On-The-Ground Access
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-charcoal/60 text-lg max-w-xl mx-auto">
            Let us refine your stay. Immediate, vetted access to Kenya&apos;s leading guides and private transport network.
          </motion.p>
        </motion.div>

        {/* Tab selector — slides up */}
        <motion.div
          className="flex rounded-full bg-navy/10 p-1 mb-8 max-w-lg mx-auto"
          variants={fadeUpSoft}
          initial="hidden"
          whileInView="visible"
          viewport={viewportNear}
        >
          <button
            onClick={() => { setActivePanel('guide'); setSubmitted(false) }}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
              activePanel === 'guide' ? 'bg-navy text-cream shadow-sm' : 'text-navy/60 hover:text-navy'
            }`}
          >
            Request a Private Guide
          </button>
          <button
            onClick={() => { setActivePanel('transport'); setSubmitted(false) }}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
              activePanel === 'transport' ? 'bg-navy text-cream shadow-sm' : 'text-navy/60 hover:text-navy'
            }`}
          >
            Request Trusted Transport
          </button>
        </motion.div>

        {/* Main card — lifts in from below */}
        <motion.div
          className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-sm border border-navy/10 grid grid-cols-1 lg:grid-cols-2"
          variants={scaleFade}
          initial="hidden"
          whileInView="visible"
          viewport={viewportNear}
        >
          {/* Portrait image */}
          <div
            className="relative min-h-72 lg:min-h-full transition-all duration-700"
            style={{
              backgroundImage: `url('${encodeURI(current.image)}')`,
              backgroundSize: 'cover',
              backgroundPosition: current.imagePosition,
            }}
          >
            <div className="absolute inset-0 bg-linear-to-t from-navy/60 via-navy/10 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="text-cream/70 text-[10px] font-medium tracking-[0.18em] uppercase">
                {activePanel === 'guide' ? 'Your guide awaits' : 'Your vehicle awaits'}
              </span>
            </div>
          </div>

          {/* Form — stagger fields */}
          <motion.div
            className="bg-cream p-8 lg:p-10"
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewportNear}
          >
            <motion.h3 variants={fadeUpSoft} className="text-navy text-xl font-medium mb-2">{current.title}</motion.h3>
            <motion.p variants={fadeUpSoft} className="text-charcoal/60 text-sm mb-7 leading-relaxed">{current.description}</motion.p>

            {activePanel === 'guide' ? (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <motion.input variants={fadeUpSoft}
                  type="text" placeholder="Your Name" required
                  className="w-full bg-sand border border-navy/20 rounded-xl px-4 py-3 text-navy placeholder-navy/40 text-sm focus:outline-none focus:border-gold transition-colors"
                />
                <motion.input variants={fadeUpSoft}
                  type="email" placeholder="Email Address" required
                  className="w-full bg-sand border border-navy/20 rounded-xl px-4 py-3 text-navy placeholder-navy/40 text-sm focus:outline-none focus:border-gold transition-colors"
                />
                <motion.input variants={fadeUpSoft}
                  type="tel" placeholder="Phone / WhatsApp"
                  className="w-full bg-sand border border-navy/20 rounded-xl px-4 py-3 text-navy placeholder-navy/40 text-sm focus:outline-none focus:border-gold transition-colors"
                />
                <motion.select variants={fadeUpSoft} className="w-full bg-sand border border-navy/20 rounded-xl px-4 py-3 text-navy/60 text-sm focus:outline-none focus:border-gold transition-colors appearance-none">
                  <option value="">Type of Guide Needed</option>
                  <option>Wildlife Photography</option>
                  <option>Cultural Heritage</option>
                  <option>Multi-Day Expedition</option>
                  <option>Birding Specialist</option>
                </motion.select>
                <motion.button variants={scaleIn}
                  type="submit"
                  className="w-full bg-gold text-navy font-medium py-3.5 rounded-xl hover:bg-gold/90 transition-colors text-sm mt-2"
                >
                  {submitted ? "Request Sent — We'll be in touch shortly." : 'Request a Private Guide'}
                </motion.button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <motion.input variants={fadeUpSoft}
                  type="text" placeholder="Your Name" required
                  className="w-full bg-sand border border-navy/20 rounded-xl px-4 py-3 text-navy placeholder-navy/40 text-sm focus:outline-none focus:border-gold transition-colors"
                />
                <motion.input variants={fadeUpSoft}
                  type="email" placeholder="Email Address" required
                  className="w-full bg-sand border border-navy/20 rounded-xl px-4 py-3 text-navy placeholder-navy/40 text-sm focus:outline-none focus:border-gold transition-colors"
                />
                <motion.input variants={fadeUpSoft}
                  type="text" placeholder="Pickup Location"
                  className="w-full bg-sand border border-navy/20 rounded-xl px-4 py-3 text-navy placeholder-navy/40 text-sm focus:outline-none focus:border-gold transition-colors"
                />
                <motion.input variants={fadeUpSoft}
                  type="text" placeholder="Destination"
                  className="w-full bg-sand border border-navy/20 rounded-xl px-4 py-3 text-navy placeholder-navy/40 text-sm focus:outline-none focus:border-gold transition-colors"
                />
                <motion.button variants={scaleIn}
                  type="submit"
                  className="w-full bg-gold text-navy font-medium py-3.5 rounded-xl hover:bg-gold/90 transition-colors text-sm mt-2"
                >
                  {submitted ? "Request Sent — We'll be in touch shortly." : 'Request Transport'}
                </motion.button>
              </form>
            )}
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}
