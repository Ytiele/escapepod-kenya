// Single source of truth for the site's canonical public URL — used by
// metadataBase (app/layout.tsx), sitemap.ts, robots.ts, and any page that
// needs to build an absolute URL (OG/Twitter images, JSON-LD). Keeping this
// in one place means the domain only has to be right in one file if it
// ever changes, rather than hardcoded across every metadata export.
export const SITE_URL = 'https://escapepodkenya.com'

export const SITE_NAME = 'EscapePod Kenya'

export const DEFAULT_DESCRIPTION =
  'The luxury of zero friction. Curated by EscapePod Intelligence, bespoke Kenyan travel experiences designed around your unique rhythm.'

// The branded 1200x630 share image (logo + brand palette, generated once
// with sharp) — used as the default Open Graph/Twitter card image
// everywhere a page doesn't set its own (e.g. a journal post using its
// own cover photo instead).
export const DEFAULT_OG_IMAGE = '/images/og-image.jpg'

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString()
}
