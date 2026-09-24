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
  // www.google.com/recaptcha + www.gstatic.com/recaptcha: the reCAPTCHA v2
  // checkbox widget every public form renders (components/RecaptchaCheckbox.tsx).
  "script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com https://cdn.fontshare.com",
  "font-src 'self' https://cdn.fontshare.com",
  // i.ytimg.com serves the click-to-play thumbnail for the About page's
  // embedded YouTube video (components/media/YouTubeEmbed.tsx) — the
  // actual player iframe only loads on click, into youtube-nocookie.com
  // per frame-src below, not img-src.
  "img-src 'self' data: blob: https://cdn.sanity.io https://images.unsplash.com https://i.ytimg.com https://www.gstatic.com",
  // www.google.com: the reCAPTCHA checkbox's own script makes calls back
  // to Google to verify the interaction.
  "connect-src 'self' https://www.google.com",
  // reCAPTCHA renders the checkbox itself in an iframe from google.com,
  // alongside the existing YouTube embed.
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
  // escapepodkenya.com ran a WordPress tour-operator theme before this
  // Next.js rebuild — Google Search Console is still finding these old
  // URLs (from its pre-rebuild crawl) and reporting them as 404s. Rather
  // than leave genuinely-gone-but-real pages as dead ends, 301 the ones
  // with a clear modern equivalent so any residual backlinks/index
  // entries land somewhere real. The rest (generic tour/taxonomy pages
  // with no 1:1 replacement) go to the homepage's tours section.
  async redirects() {
    return [
      // A dead marketing subdomain from the same pre-rebuild era, caught
      // by Vercel's wildcard DNS for the domain (so it resolves at all)
      // but never attached to a project — Google has facultyledstudyabroad
      // .escapepodkenya.com/about indexed from back when it was live.
      // Attached to this project (see `vercel domains add`) specifically
      // so this host-matched rule can catch it and send it to the current
      // real page instead of leaving it a dead end.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'facultyledstudyabroad.escapepodkenya.com' }],
        destination: '/study-abroad',
        permanent: true,
      },
      // Exact match — WordPress's own "Faculty-Led Study Abroad in
      // Africa" page, now rebuilt at /study-abroad.
      { source: '/faculty-led-study-abroad-in-africa', destination: '/study-abroad', permanent: true },
      // WordPress's booking/contact form pages ("enquiries").
      { source: '/enquiries/:path*', destination: '/contact', permanent: true },
      // Individual WordPress tour posts and the "tour-type" taxonomy
      // (including its /feed variant) — no 1:1 modern equivalent, so
      // these land on the homepage's Pre-Planned Journeys section.
      { source: '/tour/:path*', destination: '/#pre-planned-trips', permanent: true },
      { source: '/tour-type/:path*', destination: '/#pre-planned-trips', permanent: true },
      { source: '/wp/:path*', destination: '/#pre-planned-trips', permanent: true },
      // WordPress's date-based post archive URLs (/YYYY/MM/DD/).
      {
        source: '/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})',
        destination: '/stories',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
