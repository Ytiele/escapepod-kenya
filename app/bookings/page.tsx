'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Booking } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import { formatDateRange, formatUsd, paymentStatus, PAYMENT_STATUS_LABELS } from '@/lib/bookings'

const STATUS_STYLES: Record<string, string> = {
  unpaid: 'bg-navy/8 text-navy/60',
  partial: 'bg-gold/15 text-gold',
  paid: 'bg-emerald-600/10 text-emerald-700',
}

function BookingCard({ booking }: { booking: Booking }) {
  const status = paymentStatus(booking)
  const balance = booking.total_price_usd - booking.amount_paid_usd

  return (
    <div className="bg-white rounded-3xl border border-navy/8 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold">{booking.reference}</p>
          <h3 className="text-navy text-xl font-medium mt-0.5 truncate">{booking.package_name}</h3>
        </div>
        <span className={`shrink-0 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}>
          {PAYMENT_STATUS_LABELS[status]}
        </span>
      </div>

      <div className="text-[13.5px] text-charcoal/60">
        <p>{booking.duration_days ? `${booking.duration_days} ${booking.duration_days === 1 ? 'Day' : 'Days'} · ` : ''}{booking.destination}</p>
        <p>Travel: {formatDateRange(booking.start_date, booking.end_date)}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-navy/5 rounded-xl px-4 py-3">
        <div>
          <p className="text-[10.5px] uppercase tracking-wide text-charcoal/40">Total</p>
          <p className="text-navy font-semibold text-[15px]">{formatUsd(booking.total_price_usd)}</p>
        </div>
        <div>
          <p className="text-[10.5px] uppercase tracking-wide text-charcoal/40">Paid</p>
          <p className="text-navy font-semibold text-[15px]">{formatUsd(booking.amount_paid_usd)}</p>
        </div>
        <div>
          <p className="text-[10.5px] uppercase tracking-wide text-charcoal/40">Balance</p>
          <p className="text-navy font-semibold text-[15px]">{formatUsd(balance)}</p>
        </div>
      </div>

      <Link
        href={`/bookings/${booking.reference}`}
        className="text-center bg-gold text-navy font-semibold py-3 rounded-full text-sm hover:bg-gold/90 transition-colors"
      >
        View Booking
      </Link>
    </div>
  )
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) { router.replace('/login'); return }
      fetch('/api/bookings')
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setBookings(Array.isArray(data.bookings) ? data.bookings : []))
        .catch(() => setError('Could not load your bookings — please try again.'))
    })
  }, [router])

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <header className="flex items-center justify-between gap-4 px-6 py-5 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image src="/images/png logo.png" alt="EscapePod" width={430} height={101} priority className="h-7 w-auto object-contain" />
        </Link>
        <Link href="/engine" className="text-sm text-navy/60 hover:text-navy transition-colors">
          ← Back to Curation Engine
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">
        <h1 className="text-[11px] font-bold uppercase tracking-widest text-navy/40 mb-1">My Bookings</h1>
        <p className="text-navy text-3xl font-medium mb-8">Your trips with EscapePod</p>

        {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

        {bookings === null && !error && (
          <p className="text-sm text-charcoal/50">Loading your bookings…</p>
        )}

        {bookings && bookings.length === 0 && (
          <div className="bg-white rounded-3xl border border-navy/8 p-10 text-center flex flex-col items-center gap-3">
            <p className="text-navy font-medium">No bookings yet</p>
            <p className="text-sm text-charcoal/50 max-w-sm">
              When you book a journey through the Curation Engine, it&apos;ll show up here with its reference, dates, and payment status.
            </p>
            <Link href="/engine" className="mt-2 bg-gold text-navy font-semibold px-6 py-3 rounded-full text-sm hover:bg-gold/90 transition-colors">
              Start planning a trip
            </Link>
          </div>
        )}

        {bookings && bookings.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </main>
    </div>
  )
}
