import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'EscapePod Kenya — Bespoke Kenyan Journeys',
    template: '%s | EscapePod Kenya',
  },
  description:
    'The luxury of zero friction. AI-curated, bespoke Kenyan travel experiences designed around your unique rhythm.',
  keywords: ['Kenya safari', 'luxury travel', 'bespoke travel', 'EscapePod', 'Lamu', 'Maasai Mara'],
  openGraph: {
    siteName: 'EscapePod Kenya',
    type: 'website',
  },
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
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
