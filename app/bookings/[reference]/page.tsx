'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Booking } from '@/lib/types'
import { getCurrentUser } from '@/lib/auth'
import {
  BOOKING_STATUS_LABELS,
  formatDate,
  formatUsd,
  PAYMENT_STATUS_LABELS,
  paymentPercentage,
  paymentStatus,
  timelineSteps,
} from '@/lib/bookings'

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl border border-navy/8 shadow-sm p-6 flex flex-col gap-4">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-navy/40">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-charcoal/40">{label}</p>
      <p className="text-navy font-medium text-[15px] mt-0.5">{value}</p>
    </div>
  )
}

export default function BookingDetailPage() {
  const params = useParams<{ reference: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) { router.replace('/login'); return }
      fetch(`/api/bookings/${params.reference}`)
        .then((res) => {
          if (res.status === 404) { setNotFound(true); return null }
          return res.ok ? res.json() : Promise.reject()
        })
        .then((data) => { if (data?.booking) setBooking(data.booking) })
        .catch(() => setNotFound(true))
    })
  }, [params.reference, router])

  if (notFound) {
    return (
      <div className="min-h-screen bg-cream text-charcoal flex items-center justify-center p-6">
        <div className="text-center flex flex-col items-center gap-3">
          <p className="text-navy text-xl font-medium">Booking not found</p>
          <p className="text-sm text-charcoal/50">It may not exist, or it isn&apos;t linked to this account.</p>
          <Link href="/bookings" className="mt-2 bg-gold text-navy font-semibold px-6 py-3 rounded-full text-sm hover:bg-gold/90 transition-colors">
            Back to My Bookings
          </Link>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-cream text-charcoal flex items-center justify-center p-6">
        <p className="text-sm text-charcoal/50">Loading your booking…</p>
      </div>
    )
  }

  const status = paymentStatus(booking)
  const percentage = paymentPercentage(booking)
  const balance = booking.total_price_usd - booking.amount_paid_usd
  const steps = timelineSteps(booking)

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <header className="flex items-center justify-between gap-4 px-6 py-5 max-w-3xl mx-auto">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image src="/images/png logo.png" alt="EscapePod" width={430} height={101} priority className="h-7 w-auto object-contain" />
        </Link>
        <Link href="/bookings" className="text-sm text-navy/60 hover:text-navy transition-colors">
          ← My Bookings
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-24 flex flex-col gap-5">
        {/* Booking Header */}
        <section className="bg-navy text-cream rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gold">Booking Reference</p>
              <p className="text-2xl font-medium mt-0.5">{booking.reference}</p>
            </div>
            <div className="flex gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/10 text-cream/80">
                {BOOKING_STATUS_LABELS[booking.booking_status]}
              </span>
              <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${status === 'paid' ? 'bg-emerald-400/20 text-emerald-300' : status === 'partial' ? 'bg-gold/20 text-gold' : 'bg-white/10 text-cream/60'}`}>
                {PAYMENT_STATUS_LABELS[status]}
              </span>
            </div>
          </div>
          <p className="text-[13px] text-cream/50">Booked on {formatDate(booking.created_at.slice(0, 10))}</p>
        </section>

        {/* Package */}
        <SectionCard title="Package">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Package" value={booking.package_name} />
            <Field label="Destination" value={booking.destination} />
            <Field label="Duration" value={booking.duration_days ? `${booking.duration_days} ${booking.duration_days === 1 ? 'day' : 'days'}` : '—'} />
            <Field label="Travelers" value={booking.num_travelers} />
            <div className="col-span-2">
              <Field label="Selected Travel Dates" value={booking.start_date && booking.end_date ? `${formatDate(booking.start_date)} – ${formatDate(booking.end_date)}` : 'To be confirmed'} />
            </div>
          </div>
        </SectionCard>

        {/* Payment */}
        <SectionCard title="Payment">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Total Price" value={formatUsd(booking.total_price_usd)} />
            <Field label="Amount Paid" value={formatUsd(booking.amount_paid_usd)} />
            <Field label="Amount Remaining" value={formatUsd(balance)} />
            <Field label="Payment Progress" value={`${percentage}%`} />
            <Field label="Next Payment Due" value={formatDate(booking.next_payment_due_date)} />
          </div>

          <div className="w-full h-2 rounded-full bg-navy/8 overflow-hidden">
            <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${percentage}%` }} />
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-charcoal/40 mb-2">Payment History</p>
            {booking.payment_history.length === 0 ? (
              <p className="text-sm text-charcoal/40 italic">No payments recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {booking.payment_history.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-[13.5px] bg-navy/5 rounded-lg px-3.5 py-2.5">
                    <span className="text-charcoal/60">{formatDate(p.date)} · {p.method}{p.note ? ` · ${p.note}` : ''}</span>
                    <span className="font-semibold text-navy">{formatUsd(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            disabled
            title="Online payment is coming soon — contact your travel designer to arrange payment for now."
            className="w-full bg-navy/10 text-navy/40 font-semibold py-3.5 rounded-full text-sm cursor-not-allowed"
          >
            Pay Now — Coming Soon
          </button>
        </SectionCard>

        {/* Trip Details */}
        <SectionCard title="Trip Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" value={formatDate(booking.start_date)} />
            <Field label="End Date" value={formatDate(booking.end_date)} />
            <Field label="Travelers" value={booking.num_travelers} />
            <div className="col-span-2">
              <p className="text-[11px] uppercase tracking-wide text-charcoal/40 mb-1">Accommodation</p>
              <p className="text-navy text-[15px]">{booking.accommodation.length > 0 ? booking.accommodation.join(', ') : 'To be confirmed'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] uppercase tracking-wide text-charcoal/40 mb-1">Included Experiences / Activities</p>
              <p className="text-navy text-[15px]">{booking.included_activities.length > 0 ? booking.included_activities.join(', ') : 'To be confirmed'}</p>
            </div>
          </div>
        </SectionCard>

        {/* Booking Timeline */}
        <SectionCard title="Booking Timeline">
          <div className="flex flex-col gap-3">
            {steps.map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${step.done ? 'bg-gold text-navy' : 'border border-navy/20 text-transparent'}`}>
                  {step.done ? '✓' : ''}
                </span>
                <span className={`text-[14px] ${step.done ? 'text-navy font-medium' : 'text-charcoal/40'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </main>
    </div>
  )
}
