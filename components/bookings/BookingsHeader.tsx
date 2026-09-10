'use client'

import Link from 'next/link'
import Image from 'next/image'
import { T } from '@/components/i18n/T'

// Same set as the main site Navbar, so the booking pages don't feel like a
// dead end with only a way back to the engine.
const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Who We Are', href: '/about' },
  { label: 'Our Stories', href: '/stories' },
  { label: 'Contact Us', href: '/contact' },
]

export default function BookingsHeader({
  maxWidth = 'max-w-5xl',
  rightSlot,
}: {
  maxWidth?: string
  rightSlot?: React.ReactNode
}) {
  return (
    <header className="bg-navy">
      <div className={`flex items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5 ${maxWidth} mx-auto`}>
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity shrink-0">
          <Image
            src="/images/png logo.png"
            alt="EscapePod"
            width={430}
            height={101}
            priority
            className="h-12 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-cream/70 hover:text-cream transition-colors"
            >
              <T>{l.label}</T>
            </Link>
          ))}
        </nav>

        {rightSlot ?? (
          <Link
            href="/engine"
            className="shrink-0 inline-flex items-center gap-1.5 bg-gold text-navy font-semibold px-4 py-2 rounded-full text-sm hover:bg-gold/90 transition-colors whitespace-nowrap"
          >
            <span aria-hidden>←</span>
            <span className="hidden sm:inline"><T>Back to Curation Engine</T></span>
            <span className="sm:hidden"><T>Back</T></span>
          </Link>
        )}
      </div>
    </header>
  )
}
