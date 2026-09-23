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
  // www.google.com/recaptcha + www.gstatic.com/recaptcha: the reCAPTCHA v3
  // script every public form loads (lib/recaptcha-client.ts) to fetch a
  // verification token before submitting.
  "script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com https://cdn.fontshare.com",
  "font-src 'self' https://cdn.fontshare.com",
  // i.ytimg.com serves the click-to-play thumbnail for the About page's
  // embedded YouTube video (components/media/YouTubeEmbed.tsx) — the
  // actual player iframe only loads on click, into youtube-nocookie.com
  // per frame-src below, not img-src.
  "img-src 'self' data: blob: https://cdn.sanity.io https://images.unsplash.com https://i.ytimg.com https://www.gstatic.com",
  // www.google.com: reCAPTCHA v3's own script makes calls back to Google
  // to score the token request.
  "connect-src 'self' https://www.google.com",
  // reCAPTCHA v3 renders its required visibility badge in an invisible
  // iframe from google.com, alongside the existing YouTube embed.
  "frame-src https://www.youtube-nocookie.com https://www.google.com",
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
  // Several API routes read public/images/** off disk at runtime (email
  // logo attachments via lib/mail.ts's getLogoAttachment(), and the
  // itinerary PDF's cover photo via lib/pdf/bookingPdf.tsx) using a
  // dynamic fs.readFileSync path Next's build-time file tracer can't
  // statically follow — without this, those reads would 404/ENOENT in
  // Vercel's serverless bundle even though they work fine in `next dev`
  // (which always has full filesystem access).
  outputFileTracingIncludes: {
    '/*': ['public/images/**/*'],
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
