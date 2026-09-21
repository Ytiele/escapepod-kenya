'use client'

import { useState } from 'react'
import { T, useTranslated } from '@/components/i18n/T'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const COUNTRIES = ['Kenya', 'Uganda', 'Ghana', 'Multiple / Not sure yet']

// Dedicated lead form for this page's two CTAs (hero's "Start Planning Your
// Program" and the CTA band's "Contact Us Today" both anchor-scroll to it
// instead of routing off to /contact) — see app/api/study-abroad-inquiry.
// A separate endpoint/shape from BookingForm's consultation request: this
// is an institutional program inquiry, not an individual booking a call.
export default function StudyAbroadInquiryForm() {
  const [institution, setInstitution] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [groupSize, setGroupSize] = useState('')
  const [timing, setTiming] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const translatedError = useTranslated(errorMessage)
  const institutionPlaceholder = useTranslated('University or organization name')
  const namePlaceholder = useTranslated('Your full name')
  const timingPlaceholder = useTranslated('e.g. Spring 2027, or flexible')
  const messagePlaceholder = useTranslated("Course focus, learning objectives, anything that helps us shape the program")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/study-abroad-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution,
          name,
          email,
          phone: phone || undefined,
          country: country || undefined,
          groupSize: groupSize || undefined,
          timing: timing || undefined,
          message: message || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }

      setStatus('success')
      setInstitution('')
      setName('')
      setEmail('')
      setPhone('')
      setCountry('')
      setGroupSize('')
      setTiming('')
      setMessage('')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-cream rounded-3xl px-8 py-10 text-center">
        <p className="text-navy font-medium text-lg"><T>Inquiry sent.</T></p>
        <p className="text-charcoal/60 text-sm mt-2 max-w-md mx-auto">
          <T>We&rsquo;ve received your program inquiry and will follow up by email within 1–2 business days.</T>
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-5 text-sm text-gold font-medium hover:underline"
        >
          <T>Submit another inquiry</T>
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-cream rounded-3xl p-8 md:p-10 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="sa-institution" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
            <T>Institution / Organization</T>
          </label>
          <input
            id="sa-institution"
            type="text"
            required
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder={institutionPlaceholder}
            className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy placeholder-charcoal/30 text-sm focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div>
          <label htmlFor="sa-name" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
            <T>Your Name</T>
          </label>
          <input
            id="sa-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={namePlaceholder}
            className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy placeholder-charcoal/30 text-sm focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div>
          <label htmlFor="sa-email" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
            <T>Email</T>
          </label>
          <input
            id="sa-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy placeholder-charcoal/30 text-sm focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div>
          <label htmlFor="sa-phone" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
            <T>Phone (optional)</T>
          </label>
          <input
            id="sa-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy placeholder-charcoal/30 text-sm focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div>
          <label htmlFor="sa-country" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
            <T>Country of Interest</T>
          </label>
          <select
            id="sa-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy text-sm focus:outline-none focus:border-gold transition-colors appearance-none"
          >
            <option value=""></option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sa-group-size" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
            <T>Group Size (optional)</T>
          </label>
          <input
            id="sa-group-size"
            type="number"
            min={1}
            max={200}
            value={groupSize}
            onChange={(e) => setGroupSize(e.target.value)}
            className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy placeholder-charcoal/30 text-sm focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div>
          <label htmlFor="sa-timing" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
            <T>Preferred Timing (optional)</T>
          </label>
          <input
            id="sa-timing"
            type="text"
            value={timing}
            onChange={(e) => setTiming(e.target.value)}
            placeholder={timingPlaceholder}
            className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy placeholder-charcoal/30 text-sm focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="sa-message" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
            <T>Program Goals (optional)</T>
          </label>
          <textarea
            id="sa-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={messagePlaceholder}
            className="w-full bg-navy/5 border border-navy/10 rounded-2xl px-6 py-3.5 text-navy placeholder-charcoal/30 text-sm focus:outline-none focus:border-gold transition-colors resize-none"
          />
        </div>
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600 mt-4">{translatedError}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gold text-navy font-medium px-8 py-4 rounded-full text-base hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? <T>Sending…</T> : <T>Submit Inquiry</T>}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>

      <p className="text-charcoal/40 text-xs pt-4">
        <T>We typically reply within 1–2 business days with next steps.</T>
      </p>
    </form>
  )
}
