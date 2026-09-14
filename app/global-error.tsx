'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import './globals.css'

// Catches a crash in the root layout itself (e.g. LanguageProvider) —
// app/error.tsx can't cover that case, only its own children. Must render
// full <html>/<body> tags and can't assume any app context is alive, so
// this stays static English with no <T>/useLocale dependency.
export default function GlobalError({
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
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div
          style={{
            position: 'relative',
            minHeight: '100vh',
            background: '#011627',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '96px 24px',
            textAlign: 'center',
            fontFamily: "'Satoshi', 'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.2,
              backgroundImage:
                'radial-gradient(ellipse at 18% 22%, #3C1101 0%, transparent 55%), radial-gradient(ellipse at 85% 78%, #F2A755 0%, transparent 50%)',
            }}
          />

          <Link href="/" style={{ position: 'absolute', top: 32 }}>
            <Image
              src="/images/png logo.png"
              alt="EscapePod Kenya"
              width={172}
              height={40}
              priority
              style={{ height: 32, width: 'auto' }}
            />
          </Link>

          <div style={{ position: 'relative', zIndex: 10, maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#F2A755', fontSize: 12, fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
              Taking Longer Than Expected
            </span>
            <p style={{ marginTop: 24, color: '#FAF7F2', fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em', fontSize: 96 }}>
              504
            </p>
            <h1 style={{ marginTop: 8, color: '#FAF7F2', fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>
              A Brief Delay In The Journey
            </h1>
            <p style={{ marginTop: 20, color: 'rgba(250,247,242,0.5)', fontSize: 16, lineHeight: 1.6, maxWidth: 420 }}>
              Something on our end is taking too long to respond. This is almost always temporary
              — try again in a moment, or head back to solid ground.
            </p>
            <div style={{ marginTop: 36, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {retry && (
                <button
                  onClick={() => retry()}
                  style={{
                    background: '#F2A755',
                    color: '#011627',
                    fontWeight: 600,
                    padding: '14px 32px',
                    borderRadius: 999,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Try Again
                </button>
              )}
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: retry ? 'transparent' : '#F2A755',
                  color: retry ? '#FAF7F2' : '#011627',
                  fontWeight: 600,
                  padding: '14px 32px',
                  borderRadius: 999,
                  fontSize: 14,
                  border: retry ? '1px solid rgba(250,247,242,0.25)' : 'none',
                  textDecoration: 'none',
                }}
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
