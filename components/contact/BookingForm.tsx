'use client'

import { useState } from 'react'
import { T, useTranslated } from '@/components/i18n/T'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function BookingForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const translatedError = useTranslated(errorMessage)
  const namePlaceholder = useTranslated('Your full name')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/book-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, date, time }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }

      setStatus('success')
      setName('')
      setEmail('')
      setDate('')
      setTime('')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="mt-8 bg-gold/10 border border-gold/30 rounded-2xl px-8 py-6">
        <p className="text-navy font-medium text-lg"><T>Request sent.</T></p>
        <p className="text-charcoal/60 text-sm mt-1">
          <T>We&apos;ve received your booking request and will confirm your consultation time by email shortly.</T>
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-gold font-medium hover:underline"
        >
          <T>Book another time</T>
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 max-w-md">
      <div>
        <label htmlFor="name" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
          <T>Name</T>
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={namePlaceholder}
          className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy placeholder-charcoal/30 text-sm focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
          <T>Email</T>
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy placeholder-charcoal/30 text-sm focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="date" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
            <T>Date</T>
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy text-sm focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="time" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
            <T>Time</T>
          </label>
          <input
            id="time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-navy/5 border border-navy/10 rounded-full px-6 py-3.5 text-navy text-sm focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">{translatedError}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center gap-3 bg-gold text-navy font-medium px-8 py-4 rounded-full text-base hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? <T>Sending…</T> : <T>Book A Time</T>}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </button>

      <p className="text-charcoal/40 text-xs pt-1">
        <T>We&apos;ll confirm your requested time by email — this is not an automated calendar booking.</T>
      </p>
    </form>
  )
}
