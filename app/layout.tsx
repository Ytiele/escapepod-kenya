import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/components/i18n/LanguageContext'
import LanguageBar from '@/components/i18n/LanguageBar'

export const metadata: Metadata = {
  title: {
    default: 'EscapePod Kenya — Bespoke Kenyan Journeys',
    template: '%s | EscapePod Kenya',
  },
  description:
    'The luxury of zero friction. Curated by EscapePod Intelligence, bespoke Kenyan travel experiences designed around your unique rhythm.',
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
      <body className="min-h-full antialiased pt-9">
        <LanguageProvider>
          <LanguageBar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
