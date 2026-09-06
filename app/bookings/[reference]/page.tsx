'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Booking } from '@/lib/types'
import { getCurrentUser, type User } from '@/lib/auth'
import { imageForDestination } from '@/lib/destinations'
import PhotoCredit from '@/components/PhotoCredit'
import BookingChatPanel from '@/components/BookingChatPanel'
import {
  BOOKING_STATUS_LABELS,
  formatDate,
  formatUsd,
  PAYMENT_STATUS_LABELS,
  paymentPercentage,
  paymentStatus,
  timelineSteps,
} from '@/lib/bookings'
import { T, useTranslated } from '@/components/i18n/T'

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl border border-navy/8 shadow-sm p-6 flex flex-col gap-4">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-navy/40"><T>{title}</T></h2>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-charcoal/40"><T>{label}</T></p>
      <p className="text-navy font-medium text-[15px] mt-0.5">{value}</p>
    </div>
  )
}

export default function BookingDetailPage() {
  const params = useParams<{ reference: string }>()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [notFound, setNotFound] = useState(false)
  const dayLabel = useTranslated('day')
  const daysLabel = useTranslated('days')
  const toBeConfirmed = useTranslated('To be confirmed')
  const payTooltip = useTranslated('Online payment is coming soon — contact your travel designer to arrange payment for now.')

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) { router.replace('/login'); return }
      setUser(u)
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
          <p className="text-navy text-xl font-medium"><T>Booking not found</T></p>
          <p className="text-sm text-charcoal/50"><T>It may not exist, or it isn&apos;t linked to this account.</T></p>
          <Link href="/bookings" className="mt-2 bg-gold text-navy font-semibold px-6 py-3 rounded-full text-sm hover:bg-gold/90 transition-colors">
            <T>Back to My Bookings</T>
          </Link>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-cream text-charcoal flex items-center justify-center p-6">
        <p className="text-sm text-charcoal/50"><T>Loading your booking…</T></p>
      </div>
    )
  }

  const status = paymentStatus(booking)
  const percentage = paymentPercentage(booking)
  const balance = booking.total_price_usd - booking.amount_paid_usd
  const steps = timelineSteps(booking)
  const coverImage = imageForDestination(booking.destination)

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <header className="bg-navy">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5 max-w-3xl mx-auto">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity shrink-0">
            <Image src="/images/png logo.png" alt="EscapePod" width={430} height={101} priority className="h-6 sm:h-7 w-auto object-contain brightness-0 invert opacity-90" />
          </Link>
          {/* Shows who's signed in, in place of the old "← My Bookings" text
              link — that link read as cream-on-navy at low contrast and was
              easy to miss. The actual back navigation now lives as a clearly
              visible button at the top-left of the content below. */}
          {user && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-cream/85 font-medium truncate max-w-[140px] hidden sm:inline">{user.name}</span>
              <span className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold font-semibold text-xs shrink-0">
                {user.name[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-24">
        <Link
          href="/bookings"
          className="self-start inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-navy/70 transition-colors mb-5"
        >
          ← <T>My Bookings</T>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="flex flex-col gap-5 min-w-0">
            {/* Booking Header — cover photo for the trip's destination
                behind the reference/status, same treatment as the
                suggestion cards. */}
            <section className="relative rounded-3xl overflow-hidden text-cream flex flex-col justify-end gap-4 p-6 min-h-[180px]">
              {coverImage ? (
                <Image src={coverImage} alt={booking.destination} fill sizes="768px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-navy" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-navy via-navy/60 to-navy/20" />
              <PhotoCredit src={coverImage} />
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gold"><T>Booking Reference</T></p>
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
              <p className="text-[13px] text-cream/50"><T>Booked on</T> {formatDate(booking.created_at.slice(0, 10))}</p>
            </section>

            {/* Package */}
            <SectionCard title="Package">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Package" value={booking.package_name} />
                <Field label="Destination" value={booking.destination} />
                <Field label="Duration" value={booking.duration_days ? `${booking.duration_days} ${booking.duration_days === 1 ? dayLabel : daysLabel}` : '—'} />
                <Field label="Travelers" value={booking.num_travelers} />
                <div className="sm:col-span-2">
                  <Field label="Selected Travel Dates" value={booking.start_date && booking.end_date ? `${formatDate(booking.start_date)} – ${formatDate(booking.end_date)}` : toBeConfirmed} />
                </div>
              </div>
            </SectionCard>

            {/* Payment */}
            <SectionCard title="Payment">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <p className="text-[11px] uppercase tracking-wide text-charcoal/40 mb-2"><T>Payment History</T></p>
                {booking.payment_history.length === 0 ? (
                  <p className="text-sm text-charcoal/40 italic"><T>No payments recorded yet.</T></p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {booking.payment_history.map((p, i) => (
                      <div key={i} className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 text-[13.5px] bg-navy/5 rounded-lg px-3.5 py-2.5">
                        <span className="text-charcoal/60">{formatDate(p.date)} · {p.method}{p.note ? ` · ${p.note}` : ''}</span>
                        <span className="font-semibold text-navy shrink-0">{formatUsd(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                disabled
                title={payTooltip}
                className="w-full bg-navy/10 text-navy/40 font-semibold py-3.5 rounded-full text-sm cursor-not-allowed"
              >
                <T>Pay Now — Coming Soon</T>
              </button>
            </SectionCard>

            {/* Trip Details */}
            <SectionCard title="Trip Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Start Date" value={formatDate(booking.start_date)} />
                <Field label="End Date" value={formatDate(booking.end_date)} />
                <Field label="Travelers" value={booking.num_travelers} />
                <div className="sm:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-charcoal/40 mb-1"><T>Accommodation</T></p>
                  <p className="text-navy text-[15px]">{booking.accommodation.length > 0 ? booking.accommodation.join(', ') : toBeConfirmed}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-charcoal/40 mb-1"><T>Included Experiences / Activities</T></p>
                  <p className="text-navy text-[15px]">{booking.included_activities.length > 0 ? booking.included_activities.join(', ') : toBeConfirmed}</p>
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
          </div>

          <BookingChatPanel reference={booking.reference} />
        </div>
      </main>
    </div>
  )
}
