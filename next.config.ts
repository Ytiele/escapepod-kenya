import type { NextConfig } from 'next'

// Deliberately permissive on script/style execution (`unsafe-inline`) rather
// than a nonce-based policy — this repo hasn't been QA'd page-by-page for a
// stricter CSP, and shipping one blind risks silently breaking a real page
// (fonts, framer-motion inline styles, Next's hydration script) in
// production. This still buys real protection: no arbitrary third-party
// script/resource host can load, and the site can't be framed by another
// origin (clickjacking). Tighten to nonces once each page's been checked
// against it.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com https://cdn.fontshare.com",
  "font-src 'self' https://cdn.fontshare.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://images.unsplash.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // Serve AVIF when the browser supports it, falling back to WebP, then
    // the original format — negotiated via the request's Accept header.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
