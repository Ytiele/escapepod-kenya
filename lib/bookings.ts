import type { Booking, BookingStatus, PaymentStatus } from './types'

// Pure, framework-free helpers shared between the booking API routes
// (lib/supabase.ts is server-only) and the client-rendered dashboard pages
// — nothing here touches Supabase or the DOM.

export function generateBookingReference(): string {
  const digits = Math.floor(100000 + Math.random() * 900000)
  return `EK-${digits}`
}

// UTC-safe by construction — parsing via `new Date(dateStr + 'T00:00:00')`
// (local time) and then reading back with `.toISOString()` (UTC) silently
// shifts the date by a day on any server whose local timezone isn't UTC.
// Date.UTC + setUTCDate keeps every step in UTC, so the result never
// depends on where this code happens to run.
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function paymentStatus(b: Pick<Booking, 'total_price_usd' | 'amount_paid_usd'>): PaymentStatus {
  if (b.amount_paid_usd <= 0) return 'unpaid'
  if (b.amount_paid_usd >= b.total_price_usd && b.total_price_usd > 0) return 'paid'
  return 'partial'
}

export function paymentPercentage(b: Pick<Booking, 'total_price_usd' | 'amount_paid_usd'>): number {
  if (!b.total_price_usd) return 0
  return Math.min(100, Math.round((b.amount_paid_usd / b.total_price_usd) * 100))
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  created: 'Created',
  confirmed: 'Confirmed',
  itinerary_ready: 'Itinerary Ready',
  trip_ready: 'Trip Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  partial: 'Partially Paid',
  paid: 'Paid in Full',
}

export interface TimelineStep {
  label: string
  done: boolean
}

// The dashboard's checklist is derived entirely from booking_status +
// amount_paid_usd — there's no separate set of boolean flags to keep in
// sync with those two fields.
export function timelineSteps(b: Booking): TimelineStep[] {
  const confirmed = (['confirmed', 'itinerary_ready', 'trip_ready', 'completed'] as BookingStatus[]).includes(b.booking_status)
  const itineraryReady = (['itinerary_ready', 'trip_ready', 'completed'] as BookingStatus[]).includes(b.booking_status)
  const tripReady = (['trip_ready', 'completed'] as BookingStatus[]).includes(b.booking_status)
  return [
    { label: 'Booking created', done: true },
    { label: 'Deposit/payment received', done: paymentStatus(b) !== 'unpaid' },
    { label: 'Booking confirmed', done: confirmed },
    { label: 'Final itinerary prepared', done: itineraryReady },
    { label: 'Trip ready', done: tripReady },
  ]
}

export function formatUsd(n: number): string {
  return `$${Math.round(n).toLocaleString()}`
}

export function formatDate(iso: string | null): string {
  if (!iso) return 'To be confirmed'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return 'Dates to be confirmed'
  const s = new Date(`${start}T00:00:00`)
  const e = new Date(`${end}T00:00:00`)
  const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'long' })
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  return sameMonth
    ? `${s.getDate()}–${e.getDate()} ${month(e)} ${e.getFullYear()}`
    : `${s.getDate()} ${month(s)} – ${e.getDate()} ${month(e)} ${e.getFullYear()}`
}
