import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { T } from '@/components/i18n/T'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
}

// Root-level not-found.tsx — Next.js renders this for any unmatched route
// across the whole app. Lives outside the (site) route group, so it does
// its own minimal navy/logo header rather than pulling in the full
// Navbar/Footer — a deliberate, quieter full-screen moment rather than a
// broken page dressed up in the normal chrome.
export default function NotFound() {
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
          <T>Off The Map</T>
        </span>
        <p className="mt-6 text-cream font-medium leading-none tracking-tight text-[6.5rem] sm:text-[9rem]">
          404
        </p>
        <h1 className="mt-2 text-cream text-2xl sm:text-3xl font-medium tracking-tight">
          <T>This Path Doesn&rsquo;t Exist</T>
        </h1>
        <p className="mt-5 text-cream/50 text-base leading-relaxed max-w-md">
          <T>The page you&rsquo;re looking for has wandered off &mdash; perhaps to Lamu, perhaps to the
          Mara. Let&rsquo;s get you back to solid ground.</T>
        </p>
        <Link
          href="/"
          className="mt-9 inline-flex items-center gap-2 bg-gold text-navy font-semibold px-8 py-3.5 rounded-full text-sm hover:bg-gold/90 transition-colors"
        >
          <T>Back to Homepage</T>
        </Link>
      </div>
    </div>
  )
}
