'use client'

import { useState } from 'react'
import { T, useTranslated } from '@/components/i18n/T'

type Status = 'idle' | 'submitting' | 'success' | 'error'

// Sidebar newsletter box shared by /stories and /stories/[slug]. Sends to
// the same /api/newsletter route as the homepage's Inner Circle section.
export default function NewsletterSidebar() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const translatedError = useTranslated(errorMessage)
  const emailPlaceholder = useTranslated('Your email')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || status === 'success') return
    setStatus('submitting')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setStatus('success')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="bg-gold/10 border border-gold/30 rounded-2xl p-6">
      <h4 className="text-navy text-sm font-medium uppercase tracking-wider mb-3">
        <T>Subscribe to Newsletter</T>
      </h4>

      {status === 'success' ? (
        <p className="text-navy text-sm">
          <T>You&apos;re on the list — expect something worth reading, never noise.</T>
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-charcoal/60 text-xs mb-4 leading-relaxed">
            <T>Rare destinations and unreleased itineraries, delivered elegantly.</T>
          </p>
          <input
            type="email"
            required
            disabled={status === 'submitting'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            className="w-full bg-cream border border-navy/10 rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-gold mb-3 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-navy text-cream font-medium py-2.5 rounded-xl text-sm hover:bg-navy/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? <T>Sending…</T> : <T>Subscribe</T>}
          </button>
          {status === 'error' && (
            <p className="text-red-600 text-xs mt-2">{translatedError}</p>
          )}
        </form>
      )}
    </div>
  )
}
