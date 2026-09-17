import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { tours, getTourBySlug } from '@/data/tours'
import { formatUsd } from '@/lib/bookings'
import { SITE_NAME, absoluteUrl } from '@/lib/seo'
import { T } from '@/components/i18n/T'
import TourBookingButton from '@/components/tours/TourBookingButton'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return tours.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tour = getTourBySlug(slug)
  if (!tour) return {}
  const url = `/tours/${tour.slug}`
  return {
    title: tour.name,
    description: tour.summary,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      title: tour.name,
      description: tour.summary,
      url,
      images: [{ url: tour.image, width: 2400, height: 1600, alt: tour.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: tour.name,
      description: tour.summary,
      images: [tour.image],
    },
  }
}

export default async function TourDetailPage({ params }: Props) {
  const { slug } = await params
  const tour = getTourBySlug(slug)
  if (!tour) notFound()

  const otherTours = tours.filter((t) => t.slug !== slug).slice(0, 3)

  const tripJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.name,
    description: tour.summary,
    image: absoluteUrl(tour.image),
    touristType: tour.idealFor,
    itinerary: {
      '@type': 'ItemList',
      itemListElement: tour.activities.map((activity, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: activity,
      })),
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: tour.priceUsdPerPerson,
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(`/tours/${tour.slug}`),
    },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Pre-Planned Journeys', item: absoluteUrl('/#pre-planned-trips') },
      { '@type': 'ListItem', position: 3, name: tour.name, item: absoluteUrl(`/tours/${tour.slug}`) },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="relative min-h-[60vh] flex items-end pb-16 pt-40 overflow-hidden">
        <Image src={tour.image} alt={tour.name} fill sizes="100vw" priority className="object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-navy/90 via-navy/40 to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-10 w-full">
          <Link href="/#pre-planned-trips" className="text-cream/50 hover:text-cream text-sm flex items-center gap-1.5 transition-colors mb-5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <T>Pre-Planned Journeys</T>
          </Link>
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">{tour.destination}</span>
          <h1 className="mt-4 text-cream text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.1] tracking-tight max-w-3xl">
            {tour.name}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-cream/70">
            <span className="bg-white/10 px-3 py-1.5 rounded-full">{tour.durationDays} <T>days</T></span>
            <span className="bg-gold text-navy font-semibold px-3 py-1.5 rounded-full"><T>From</T> {formatUsd(tour.priceUsdPerPerson)} <T>pp</T></span>
          </div>
        </div>
      </section>

      <div className="bg-cream">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16">
            <div className="prose prose-lg prose-navy max-w-none">
              {tour.description.map((para, i) => (
                <p key={i} className="mb-6 text-charcoal/70 leading-relaxed text-base">
                  <T>{para}</T>
                </p>
              ))}

              <h3 className="text-navy font-medium text-xl mt-10 mb-4"><T>Highlights</T></h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none pl-0">
                {tour.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-charcoal/70 text-[15px]">
                    <span className="text-gold mt-1">✓</span>
                    <T>{h}</T>
                  </li>
                ))}
              </ul>

              <h3 className="text-navy font-medium text-xl mt-10 mb-4"><T>Accommodation</T></h3>
              <ul className="list-disc pl-5 space-y-1.5 text-charcoal/70 text-[15px]">
                {tour.accommodation.map((a) => <li key={a}><T>{a}</T></li>)}
              </ul>

              <h3 className="text-navy font-medium text-xl mt-10 mb-4"><T>Included Activities</T></h3>
              <ul className="list-disc pl-5 space-y-1.5 text-charcoal/70 text-[15px]">
                {tour.activities.map((a) => <li key={a}><T>{a}</T></li>)}
              </ul>

              <h3 className="text-navy font-medium text-xl mt-10 mb-4"><T>Ideal For</T></h3>
              <div className="flex flex-wrap gap-2">
                {tour.idealFor.map((tag) => (
                  <span key={tag} className="bg-gold/15 text-gold text-xs font-medium px-3 py-1.5 rounded-full">
                    <T>{tag}</T>
                  </span>
                ))}
              </div>
            </div>

            <aside className="space-y-6">
              {/* z-20: the sticky card needs to sit above the "Other
                  Pre-Planned Journeys" thumbnail images below it (and any
                  other-tour images further down the page) as it scrolls
                  past them — those <Image>s create their own stacking
                  context and were winning by DOM order without this. */}
              <div className="relative z-20 bg-white rounded-3xl border border-navy/8 shadow-sm p-6 flex flex-col gap-4 lg:sticky lg:top-24">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-navy/40"><T>From</T></p>
                  <p className="text-navy text-3xl font-medium mt-1">{formatUsd(tour.priceUsdPerPerson)}<span className="text-base font-normal text-charcoal/40"> <T>pp</T></span></p>
                </div>
                <div className="flex flex-col gap-2 text-sm text-charcoal/60 border-t border-navy/8 pt-4">
                  <div className="flex justify-between"><span><T>Duration</T></span><span className="text-navy font-medium">{tour.durationDays} <T>days</T></span></div>
                  <div className="flex justify-between"><span><T>Destination</T></span><span className="text-navy font-medium text-right">{tour.destination}</span></div>
                </div>
                <TourBookingButton tour={tour} />
                <p className="text-charcoal/40 text-xs text-center">
                  <T>No payment now — a travel designer confirms everything by email first.</T>
                </p>
              </div>

              {otherTours.length > 0 && (
                <div className="bg-navy rounded-2xl p-6">
                  <h4 className="text-cream text-sm font-medium uppercase tracking-wider mb-5">
                    <T>Other Pre-Planned Journeys</T>
                  </h4>
                  <div className="space-y-4">
                    {otherTours.map((t) => (
                      <Link key={t.slug} href={`/tours/${t.slug}`} className="group flex gap-3">
                        <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-linear-to-br from-slate to-navy">
                          <Image src={t.image} alt={t.name} fill sizes="56px" loading="lazy" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-gold text-xs font-medium">{t.durationDays} <T>days</T></span>
                          <p className="text-cream/80 text-sm font-medium leading-tight mt-0.5 group-hover:text-gold transition-colors line-clamp-2">
                            {t.name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
