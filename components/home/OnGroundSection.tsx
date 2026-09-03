'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { stagger, staggerFast, scaleIn, slideUp, fadeUp, fadeUpSoft, scaleFade, viewport, viewportNear, ease } from '@/lib/motion'

// For fields that mount conditionally (after the parent's whileInView has
// already resolved) — `variants` alone won't animate them in, since they
// weren't there when the parent's stagger fired. Self-contained instead.
const revealIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease } }

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

const CAR_TYPES = ['Sedan', 'SUV (4x4)', 'Van / Minibus', 'Luxury SUV']

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const inputCls = 'w-full bg-sand border border-navy/20 rounded-xl px-4 py-3 text-navy placeholder-navy/40 text-sm focus:outline-none focus:border-gold transition-colors'
const selectCls = 'w-full bg-sand border border-navy/20 rounded-xl px-4 py-3 text-navy/60 text-sm focus:outline-none focus:border-gold transition-colors appearance-none'

// ── Success / error feedback, shared by both forms ─────────────────────────

function FormFeedback({ status, errorMessage, onReset }: { status: FormStatus; errorMessage: string; onReset: () => void }) {
  if (status === 'success') {
    return (
      <div className="bg-gold/10 border border-gold/30 rounded-xl px-5 py-4 text-center">
        <p className="text-navy font-medium text-sm">Request sent.</p>
        <p className="text-charcoal/60 text-xs mt-1">We&apos;ll be in touch shortly.</p>
        <button onClick={onReset} className="mt-3 text-xs text-gold font-medium hover:underline">
          Send another request
        </button>
      </div>
    )
  }
  if (status === 'error') {
    return <p className="text-xs text-red-600">{errorMessage}</p>
  }
  return null
}

// ── Guide form ──────────────────────────────────────────────────────────────

function GuideForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [guideType, setGuideType] = useState('')
  const [otherDescription, setOtherDescription] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function reset() {
    setName(''); setEmail(''); setPhone(''); setGuideType(''); setOtherDescription('')
    setStatus('idle'); setErrorMessage('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || status === 'success') return // no double submission
    setStatus('submitting')
    try {
      const res = await fetch('/api/request-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, guideType, otherDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return <FormFeedback status={status} errorMessage={errorMessage} onReset={reset} />
  }

  const isSubmitting = status === 'submitting'

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <motion.input {...revealIn}
        type="text" placeholder="Your Name" required disabled={isSubmitting}
        value={name} onChange={(e) => setName(e.target.value)}
        className={inputCls}
      />
      <motion.input {...revealIn}
        type="email" placeholder="Email Address" required disabled={isSubmitting}
        value={email} onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
      />
      <motion.input {...revealIn}
        type="tel" placeholder="Phone / WhatsApp" disabled={isSubmitting}
        value={phone} onChange={(e) => setPhone(e.target.value)}
        className={inputCls}
      />
      <motion.select {...revealIn} required disabled={isSubmitting}
        value={guideType} onChange={(e) => setGuideType(e.target.value)}
        className={selectCls}
      >
        <option value="">Type of Guide Needed</option>
        <option>Wildlife Photography</option>
        <option>Cultural Heritage</option>
        <option>Multi-Day Expedition</option>
        <option>Birding Specialist</option>
        <option>Other</option>
      </motion.select>

      {guideType === 'Other' && (
        <motion.textarea {...revealIn}
          placeholder="Describe the kind of guide you need" required disabled={isSubmitting}
          value={otherDescription} onChange={(e) => setOtherDescription(e.target.value)}
          rows={3}
          className={`${inputCls} resize-none`}
        />
      )}

      <motion.button {...revealIn}
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gold text-navy font-medium py-3.5 rounded-xl hover:bg-gold/90 transition-colors text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending…' : 'Request a Private Guide'}
      </motion.button>

      {status === 'error' && <FormFeedback status={status} errorMessage={errorMessage} onReset={reset} />}
    </form>
  )
}

// ── Transport form ──────────────────────────────────────────────────────────

function TransportForm() {
  const [carType, setCarType] = useState('')
  const [serviceType, setServiceType] = useState<'rent' | 'taxi' | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function reset() {
    setCarType(''); setServiceType(null); setName(''); setEmail('')
    setPickupLocation(''); setPickupTime(''); setDropoffLocation('')
    setStatus('idle'); setErrorMessage('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || status === 'success') return // no double submission
    setStatus('submitting')
    try {
      const res = await fetch('/api/request-transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, carType, serviceType, pickupLocation, pickupTime, dropoffLocation }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return <FormFeedback status={status} errorMessage={errorMessage} onReset={reset} />
  }

  const isSubmitting = status === 'submitting'

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <motion.select {...revealIn} required disabled={isSubmitting}
        value={carType}
        onChange={(e) => { setCarType(e.target.value); setServiceType(null) }}
        className={selectCls}
      >
        <option value="">Type of Car</option>
        {CAR_TYPES.map((t) => <option key={t}>{t}</option>)}
      </motion.select>

      {carType && (
        <motion.div {...revealIn} className="flex rounded-xl bg-navy/10 p-1">
          {(['rent', 'taxi'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={isSubmitting}
              onClick={() => setServiceType(opt)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                serviceType === opt ? 'bg-navy text-cream shadow-sm' : 'text-navy/60 hover:text-navy'
              }`}
            >
              {opt === 'rent' ? 'Rent a Car' : 'Hire a Taxi'}
            </button>
          ))}
        </motion.div>
      )}

      {serviceType && (
        <>
          <motion.input {...revealIn}
            type="text" placeholder="Your Name" required disabled={isSubmitting}
            value={name} onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
          <motion.input {...revealIn}
            type="email" placeholder="Email Address" required disabled={isSubmitting}
            value={email} onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />

          {serviceType === 'taxi' && (
            <>
              <motion.input {...revealIn}
                type="text" placeholder="Pickup Location" required disabled={isSubmitting}
                value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)}
                className={inputCls}
              />
              <motion.input {...revealIn}
                type="datetime-local" placeholder="Pickup Time" required disabled={isSubmitting}
                value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}
                className={inputCls}
              />
              <motion.input {...revealIn}
                type="text" placeholder="Drop-off Location" required disabled={isSubmitting}
                value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)}
                className={inputCls}
              />
            </>
          )}

          <motion.button {...revealIn}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold text-navy font-medium py-3.5 rounded-xl hover:bg-gold/90 transition-colors text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending…' : 'Request Transport'}
          </motion.button>
        </>
      )}

      {status === 'error' && <FormFeedback status={status} errorMessage={errorMessage} onReset={reset} />}
    </form>
  )
}

// ── Section ───────────────────────────────────────────────────────────────

export default function OnGroundSection() {
  const [activePanel, setActivePanel] = useState<'guide' | 'transport'>('guide')
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
            onClick={() => setActivePanel('guide')}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
              activePanel === 'guide' ? 'bg-navy text-cream shadow-sm' : 'text-navy/60 hover:text-navy'
            }`}
          >
            Request a Private Guide
          </button>
          <button
            onClick={() => setActivePanel('transport')}
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
          <div className="relative min-h-72 lg:min-h-full transition-all duration-700">
            <Image
              src={current.image}
              alt={current.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              loading="lazy"
              className="object-cover"
              style={{ objectPosition: current.imagePosition }}
            />
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

            {activePanel === 'guide' ? <GuideForm key="guide" /> : <TransportForm key="transport" />}
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}
