'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'

const SLIDE_DURATION = 6000

const travelerTypes = [
  {
    label: 'Couples',
    tag: 'Couples',
    headline: 'Intimate Escapes &\nShared Silences.',
    sub: 'Reclaim your privacy with slow luxury, surprise moments, and zero cognitive load.',
    image: '/images/hero/couples.jpg',
    cardLabel: 'Private coastal villa',
  },
  {
    label: 'Family',
    tag: 'Family',
    headline: 'Unforgettable\nFamily Adventures.',
    sub: 'Expertly curated for every age and pace. We design the framework; your family writes the story.',
    image: '/images/hero/family.jpg',
    cardLabel: 'Marine parks & wildlife',
  },
  {
    label: 'Social circle',
    tag: 'Social circle',
    headline: 'Gather in\nthe Wild.',
    sub: 'Private exclusivity for the group who refuses ordinary. One call, one curator, no compromise.',
    image: '/images/hero/social.jpg',
    cardLabel: 'Private ranches & conservancies',
  },
  {
    label: 'Solo',
    tag: 'Solo',
    headline: 'Your Rhythm.\nYour Kenya.',
    sub: 'Absolute freedom with zero compromise. You set the pace; we make every moment count.',
    image: '/images/hero/solo.jpg',
    cardLabel: 'Wilderness & remote terrain',
  },
]

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const active = travelerTypes[activeIndex]

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }, [])

  const startCycle = useCallback(() => {
    clearTimers()
    setProgress(0)
    const TICK = 50
    let elapsed = 0
    progressRef.current = setInterval(() => {
      elapsed += TICK
      setProgress(Math.min((elapsed / SLIDE_DURATION) * 100, 100))
    }, TICK)
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % travelerTypes.length)
    }, SLIDE_DURATION)
  }, [clearTimers])

  useEffect(() => {
    startCycle()
    return clearTimers
  }, [activeIndex, startCycle, clearTimers])

  function jumpTo(i: number) {
    clearTimers()
    setActiveIndex(i)
    setProgress(0)
    startCycle()
  }

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-navy">
      {/* Full-screen photo backgrounds — CSS background-image crossfade */}
      {travelerTypes.map((t, i) => (
        <div
          key={t.label}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: i === activeIndex ? 1 : 0,
            backgroundImage: `url('${t.image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-navy/55 via-navy/25 to-navy/80" />
          <div className="absolute inset-0 bg-linear-to-r from-navy/65 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 max-w-7xl mx-auto px-6 lg:px-10 w-full pt-32 pb-6">
        <div className="flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="h-px w-8 bg-gold" />
            <span
              key={active.tag}
              className="text-gold text-xs font-medium tracking-[0.2em] uppercase"
            >
              {active.tag}
            </span>
          </div>

          <div className="overflow-hidden">
            <h1
              key={`headline-${activeIndex}`}
              className="text-cream text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] tracking-tight mb-8 max-w-3xl whitespace-pre-line animate-fadeSlideUp"
            >
              {active.headline}
            </h1>
          </div>

          <p
            key={`sub-${activeIndex}`}
            className="text-cream/80 text-lg md:text-xl leading-relaxed max-w-xl mb-12 animate-fadeSlideUp"
            style={{ animationDelay: '80ms' }}
          >
            {active.sub}
          </p>

          <Link
            href="/engine"
            className="inline-flex items-center gap-3 bg-gold text-navy font-medium px-8 py-4 rounded-full text-base hover:bg-gold/90 transition-colors w-fit group"
          >
            Design Your Experience
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Thumbnail slider cards */}
        <div className="mt-10 grid grid-cols-4 gap-3">
          {travelerTypes.map((t, i) => (
            <button
              key={t.label}
              onClick={() => jumpTo(i)}
              className={`group relative rounded-2xl overflow-hidden text-left transition-all duration-300 focus:outline-none ${
                i === activeIndex
                  ? 'ring-2 ring-gold ring-offset-2 ring-offset-transparent'
                  : 'opacity-55 hover:opacity-85'
              }`}
              style={{
                height: '130px',
                backgroundImage: `url('${t.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

              <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                <p className="text-cream/60 text-[10px] font-medium mb-0.5">{t.cardLabel}</p>
                <p className="text-cream text-sm font-medium leading-tight">{t.label}</p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cream/10">
                {i === activeIndex && (
                  <div
                    className="h-full bg-gold transition-none"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-42.5 right-10 text-cream/15 text-xs tracking-widest uppercase rotate-90 origin-right hidden lg:block">
        EscapePod Kenya
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlideUp {
          animation: fadeSlideUp 0.6s ease both;
        }
      `}</style>
    </section>
  )
}
