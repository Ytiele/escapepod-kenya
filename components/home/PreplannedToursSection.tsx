'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { tours } from '@/data/tours'
import { formatUsd } from '@/lib/bookings'
import { stagger, fromLeft, fromRight, slideUp, viewport } from '@/lib/motion'
import { T } from '@/components/i18n/T'
import BookTourDialog from '@/components/tours/BookTourDialog'

// Fixed, pre-designed itineraries (see the PreplannedTour comment in
// lib/types.ts) — distinct from the AI-curated Experience cards inside
// the Curation Engine. "See More Details" is a real page (SEO-indexable,
// shareable); "Book This Tour" opens a lightweight request form that
// emails the team directly (app/api/book-tour/route.ts) rather than
// creating an instant booking.
export default function PreplannedToursSection() {
  const [bookingSlug, setBookingSlug] = useState<string | null>(null)
  const bookingTour = tours.find((t) => t.slug === bookingSlug) ?? null

  return (
    <section id="pre-planned-trips" className="bg-sand py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <div>
            <motion.span variants={fromLeft} className="text-gold text-xs font-medium tracking-[0.2em] uppercase">
              <T>Pre-Planned Journeys</T>
            </motion.span>
            <motion.h2 variants={slideUp} className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight leading-[1.1] max-w-2xl">
              <T>Perfected already. Yours whenever you are.</T>
            </motion.h2>
          </div>
          <motion.div variants={fromRight}>
            <Link
              href="/engine"
              className="text-sm font-medium text-gold flex items-center gap-2 hover:gap-3 transition-all group shrink-0"
            >
              <T>Or design something entirely your own</T>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tours.map((tour, i) => (
            <motion.div
              key={tour.slug}
              initial={{ opacity: 0, y: 36, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: i * 0.1 }}
              className="bg-cream rounded-3xl overflow-hidden border border-navy/8 shadow-sm flex flex-col"
            >
              <div className="relative aspect-16/10 shrink-0">
                <Image
                  src={tour.image}
                  alt={tour.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  loading="lazy"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="bg-navy/80 backdrop-blur-sm text-cream text-xs font-medium px-3 py-1.5 rounded-full">
                    {tour.durationDays} <T>days</T>
                  </span>
                  <span className="bg-gold text-navy text-xs font-semibold px-3 py-1.5 rounded-full">
                    <T>From</T> {formatUsd(tour.priceUsdPerPerson)} <T>pp</T>
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-3 flex-1">
                <div>
                  <span className="text-gold text-xs font-medium tracking-[0.15em] uppercase">{tour.destination}</span>
                  <h3 className="mt-1.5 text-navy text-xl font-medium leading-tight">{tour.name}</h3>
                </div>
                <p className="text-charcoal/60 text-sm leading-relaxed flex-1">{tour.summary}</p>

                <div className="flex gap-3 mt-2">
                  <Link
                    href={`/tours/${tour.slug}`}
                    className="flex-1 text-center border border-navy/15 text-navy font-medium py-3 rounded-full text-sm hover:bg-navy/5 transition-colors"
                  >
                    <T>See More Details</T>
                  </Link>
                  <button
                    onClick={() => setBookingSlug(tour.slug)}
                    className="flex-1 bg-gold text-navy font-semibold py-3 rounded-full text-sm hover:bg-gold/90 transition-colors"
                  >
                    <T>Book This Tour</T>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {bookingTour && <BookTourDialog tour={bookingTour} onClose={() => setBookingSlug(null)} />}
    </section>
  )
}
