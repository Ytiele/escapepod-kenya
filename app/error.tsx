'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { T } from '@/components/i18n/T'

// Root-level error.tsx — the React error boundary Next.js wraps around
// every page under this layout (see app/error.md: it does NOT cover the
// root layout itself — app/global-error.tsx handles that). Framed as a
// "504" moment (something on our end took too long or hiccupped) since
// that's the everyday case travelers actually hit; a true infrastructure-
// level gateway timeout is served by the host before our code ever runs
// and can't be skinned from here, but a stalled Curation Engine call,
// booking submission, or Supabase blip all land on this boundary and get
// the same on-brand treatment instead of a raw stack trace.
export default function GlobalErrorBoundary({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  reset?: () => void
  unstable_retry?: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const retry = unstable_retry ?? reset

  return (
    <div className="relative min-h-screen bg-navy flex flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 18% 22%, #3C1101 0%, transparent 55%), radial-gradient(ellipse at 85% 78%, #F2A755 0%, transparent 50%)',
        }}
      />

      <Link href="/" className="absolute top-8 hover:opacity-80 transition-opacity">
        <Image
          src="/images/png logo.png"
          alt="EscapePod Kenya"
          width={172}
          height={40}
          priority
          className="h-8 w-auto"
        />
      </Link>

      <div className="relative z-10 flex flex-col items-center max-w-xl">
        <span className="text-gold text-xs font-medium tracking-[0.3em] uppercase">
          <T>Taking Longer Than Expected</T>
        </span>
        <p className="mt-6 text-cream font-medium leading-none tracking-tight text-[6.5rem] sm:text-[9rem]">
          504
        </p>
        <h1 className="mt-2 text-cream text-2xl sm:text-3xl font-medium tracking-tight">
          <T>A Brief Delay In The Journey</T>
        </h1>
        <p className="mt-5 text-cream/50 text-base leading-relaxed max-w-md">
          <T>Something on our end is taking too long to respond. This is almost always
          temporary &mdash; try again in a moment, or head back to solid ground.</T>
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
          {retry && (
            <button
              onClick={() => retry()}
              className="inline-flex items-center gap-2 bg-gold text-navy font-semibold px-8 py-3.5 rounded-full text-sm hover:bg-gold/90 transition-colors"
            >
              <T>Try Again</T>
            </button>
          )}
          <Link
            href="/"
            className={
              retry
                ? 'inline-flex items-center gap-2 border border-cream/25 text-cream font-semibold px-8 py-3.5 rounded-full text-sm hover:bg-cream/10 transition-colors'
                : 'inline-flex items-center gap-2 bg-gold text-navy font-semibold px-8 py-3.5 rounded-full text-sm hover:bg-gold/90 transition-colors'
            }
          >
            <T>Back to Homepage</T>
          </Link>
        </div>
      </div>
    </div>
  )
}
