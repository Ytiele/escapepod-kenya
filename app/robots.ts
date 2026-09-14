import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Next's robots.txt file convention. /engine, /login, /reset-password, and
// /bookings are all account-gated (an unauthenticated request redirects to
// /login) — disallowing them here saves crawl budget rather than letting
// bots repeatedly hit a redirect; their own layout.tsx `robots` metadata
// additionally noindexes them in case a crawler reaches them anyway (e.g.
// via a stale external link).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/engine', '/login', '/reset-password', '/bookings'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
