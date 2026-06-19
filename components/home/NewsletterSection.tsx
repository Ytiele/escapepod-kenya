'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { stagger, staggerFast, fadeUp, slideUp, scaleIn, scaleFade, viewport } from '@/lib/motion'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSubmitted(true)
    setEmail('')
  }

  return (
    <section className="bg-navy py-24 lg:py-32">
      <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">

        {/* Cascading text reveal */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <motion.span variants={fadeUp} className="text-gold text-xs font-medium tracking-[0.2em] uppercase">
            The Inner Circle
          </motion.span>
          <motion.h2 variants={slideUp} className="mt-4 text-cream text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
            Join our private editorial dispatch.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 text-cream/50 text-lg leading-relaxed">
            Receive rare destinations, unreleased itineraries, and travel philosophy delivered
            elegantly to your inbox.
          </motion.p>
        </motion.div>

        {/* Form / success — scales in */}
        {submitted ? (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="mt-10 bg-gold/10 border border-gold/30 rounded-2xl px-8 py-6"
          >
            <p className="text-gold font-medium text-lg">You're on the list.</p>
            <p className="text-cream/60 text-sm mt-1">
              Expect something worth reading — never noise.
            </p>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            variants={scaleFade}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 bg-cream/10 border border-cream/20 rounded-full px-6 py-3.5 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold transition-colors"
            />
            <button
              type="submit"
              className="bg-gold text-navy font-medium px-7 py-3.5 rounded-full text-sm hover:bg-gold/90 transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </motion.form>
        )}

        <motion.p
          className="mt-5 text-cream/30 text-xs"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          We respect your privacy. Unsubscribe at any time.
        </motion.p>

      </div>
    </section>
  )
}
