'use client'

import { useState } from 'react'
import type { PreplannedTour } from '@/lib/types'
import { T } from '@/components/i18n/T'
import BookTourDialog from '@/components/tours/BookTourDialog'

// The detail page (app/(site)/tours/[slug]/page.tsx) stays a Server
// Component for metadata/generateStaticParams — this tiny client island
// is just the button + dialog-open state for it.
export default function TourBookingButton({ tour, className }: { tour: PreplannedTour; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? 'w-full bg-gold text-navy font-semibold py-3.5 rounded-full text-sm hover:bg-gold/90 transition-colors'}
      >
        <T>Book This Tour</T>
      </button>
      {open && <BookTourDialog tour={tour} onClose={() => setOpen(false)} />}
    </>
  )
}
