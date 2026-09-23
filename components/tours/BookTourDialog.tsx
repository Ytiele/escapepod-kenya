'use client'

import { useState } from 'react'
import type { PreplannedTour } from '@/lib/types'
import { formatUsd } from '@/lib/bookings'
import { T, useTranslated } from '@/components/i18n/T'
import RecaptchaCheckbox from '@/components/RecaptchaCheckbox'

// Public request form for a pre-planned tour — no account/session needed
// (unlike the Curation Engine's BookingDialog in app/engine/page.tsx,
// which books a real `bookings` row against a signed-in traveler). This
// only ever sends an email via /api/book-tour, same as the site's other
// public request forms (Contact page's "Book A Time", request-guide,
// request-transport). No dates are held or confirmed here — a travel
// designer follows up by email.
export default function BookTourDialog({ tour, onClose }: { tour: PreplannedTour; onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'done'>('idle')
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [numTravelers, setNumTravelers] = useState(2)
  const [startDate, setStartDate] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const genericErrorMsg = useTranslated('Something went wrong. Please try again.')
  const namePlaceholder = useTranslated('Your full name')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/book-tour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourSlug: tour.slug,
          name,
          email,
          phone: phone || undefined,
          numTravelers,
          startDate: startDate || undefined,
          recaptchaToken: captchaToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || genericErrorMsg)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : genericErrorMsg)
    } finally {
      setCaptchaToken(null)
      setCaptchaKey((k) => k + 1)
    }
  }

  if (status === 'done') {
    return (
      <div onClick={onClose} className="fixed inset-0 z-92 bg-navy/40 flex items-center justify-center p-4">
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-cream rounded-3xl shadow-lg p-6 flex flex-col items-center gap-3 text-center">
          <h3 className="text-navy text-2xl font-medium"><T>Request sent</T></h3>
          <p className="text-sm text-charcoal/60 leading-relaxed">
            <T>We&rsquo;ve received your request for</T> <span className="font-semibold text-navy">{tour.name}</span>.{' '}
            <T>A travel designer will confirm availability and every detail by email within 24 hours.</T>
          </p>
          <button onClick={onClose} className="w-full bg-gold text-navy font-semibold py-3.5 rounded-full text-sm hover:bg-gold/90 transition-colors mt-2">
            <T>Close</T>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-92 bg-navy/40 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-cream rounded-3xl shadow-lg p-6 flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-navy text-2xl font-medium"><T>Book This Tour</T></h3>
        <p className="text-sm text-charcoal/60 leading-relaxed">
          <T>Send this request to the EscapePod team and a travel designer will confirm availability, pricing, and every detail, then follow up within 24 hours. No payment is taken here.</T>
        </p>

        <div className="bg-navy/5 rounded-xl px-4 py-3 flex flex-col gap-1.5 mt-1">
          <div className="flex justify-between text-[13px]"><span className="text-charcoal/50"><T>Tour</T></span><span className="font-medium text-navy">{tour.name}</span></div>
          <div className="flex justify-between text-[13px]"><span className="text-charcoal/50"><T>Duration</T></span><span className="font-medium text-navy">{tour.durationDays} <T>days</T></span></div>
          <div className="flex justify-between text-[13px]"><span className="text-charcoal/50"><T>Price</T></span><span className="font-medium text-navy">{formatUsd(tour.priceUsdPerPerson)} <T>pp</T></span></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <label className="flex flex-col gap-1 text-[11.5px] text-charcoal/50 sm:col-span-2">
            <T>Full name</T>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={namePlaceholder}
              className="border border-navy/15 rounded-lg px-3 py-2.5 text-navy text-sm bg-white focus:outline-none focus:border-gold transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11.5px] text-charcoal/50 sm:col-span-2">
            <T>Email</T>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border border-navy/15 rounded-lg px-3 py-2.5 text-navy text-sm bg-white focus:outline-none focus:border-gold transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11.5px] text-charcoal/50 sm:col-span-2">
            <T>Phone / WhatsApp (optional)</T>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-navy/15 rounded-lg px-3 py-2.5 text-navy text-sm bg-white focus:outline-none focus:border-gold transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11.5px] text-charcoal/50">
            <T>Travelers</T>
            <input
              type="number"
              min={1}
              max={20}
              value={numTravelers}
              onChange={(e) => setNumTravelers(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="border border-navy/15 rounded-lg px-3 py-2.5 text-navy text-sm bg-white focus:outline-none focus:border-gold transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11.5px] text-charcoal/50">
            <T>Preferred start date</T>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="border border-navy/15 rounded-lg px-3 py-2.5 text-navy text-sm bg-white focus:outline-none focus:border-gold transition-colors"
            />
          </label>
        </div>

        <RecaptchaCheckbox key={captchaKey} onChange={setCaptchaToken} />

        {status === 'error' && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-navy/15 text-navy font-medium py-3 rounded-full text-sm hover:bg-navy/5 transition-colors">
            <T>Not yet</T>
          </button>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="flex-1 bg-gold text-navy font-semibold py-3 rounded-full text-sm hover:bg-gold/90 disabled:opacity-60 transition-colors"
          >
            <T>{status === 'sending' ? 'Sending…' : 'Send booking request'}</T>
          </button>
        </div>
      </form>
    </div>
  )
}
