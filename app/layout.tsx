import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/components/i18n/LanguageContext'
import LanguageBar from '@/components/i18n/LanguageBar'
import LanguagePickerModal from '@/components/i18n/LanguagePickerModal'
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, absoluteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  // Every relative URL in a metadata export (canonical links, OG/Twitter
  // images) resolves against this — without it, Next falls back to
  // http://localhost:3000 in production and social platforms/search
  // engines end up with broken preview images and canonical links.
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'EscapePod Kenya — Bespoke Kenyan Journeys',
    template: '%s | EscapePod Kenya',
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'Kenya safari',
    'luxury travel Kenya',
    'bespoke travel',
    'private safari Kenya',
    'Lamu holidays',
    'Maasai Mara safari',
    'Kenya travel designer',
    'EscapePod',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    url: SITE_URL,
    locale: 'en_US',
    title: 'EscapePod Kenya — Bespoke Kenyan Journeys',
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EscapePod Kenya — Bespoke Kenyan Journeys',
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

// Organization + WebSite structured data (JSON-LD) — site-wide, so it
// belongs once in the root layout rather than repeated per page. Helps
// search engines attribute pages to the business correctly (logo/name in
// the Knowledge Panel, richer results) rather than affecting rankings
// directly — there's no per-page equivalent worth duplicating this for.
const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: SITE_NAME,
  url: SITE_URL,
  // absoluteUrl (via the WHATWG URL constructor) percent-encodes the
  // space in the logo's real filename — a raw template-literal
  // concatenation here would emit an invalid URL.
  logo: absoluteUrl('/images/png logo.png'),
  image: absoluteUrl(DEFAULT_OG_IMAGE),
  description: DEFAULT_DESCRIPTION,
  email: 'sales@escapepodkenya.com',
  telephone: '+254117335858',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Zamani Business Park',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
  areaServed: 'Kenya',
}

const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
          precedence="default"
        />
      </head>
      <body className="min-h-full antialiased pt-9">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        <LanguageProvider>
          <LanguageBar />
          <LanguagePickerModal />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
