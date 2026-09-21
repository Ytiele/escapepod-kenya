import type { Metadata } from 'next'
import Image from 'next/image'
import { T } from '@/components/i18n/T'
import FAQAccordion from '@/components/study-abroad/FAQAccordion'
import StudyAbroadInquiryForm from '@/components/study-abroad/StudyAbroadInquiryForm'
import { studyAbroadFaqs } from '@/data/studyAbroadFaqs'
import { SITE_NAME, absoluteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Faculty-Led Study Abroad Programs in Africa',
  description:
    'Escape Pod designs and delivers faculty-led, short-term study abroad programs across Kenya, Uganda, and Ghana — end-to-end logistics, academic enrichment, and real-world immersion for universities.',
  alternates: { canonical: '/study-abroad' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    title: 'Faculty-Led Study Abroad Programs in Africa',
    description:
      'Escape Pod designs and delivers faculty-led, short-term study abroad programs across Kenya, Uganda, and Ghana — end-to-end logistics, academic enrichment, and real-world immersion.',
    url: '/study-abroad',
  },
}

const benefits = [
  {
    title: 'Global Perspective',
    description: 'Exposure to new cultures, systems, and ways of thinking.',
  },
  {
    title: 'Real-World Learning',
    description: 'Direct engagement with communities, professionals, and local organizations.',
  },
  {
    title: 'Interdisciplinary Insight',
    description: 'Academic content comes alive through site visits, case studies, and field immersion.',
  },
  {
    title: 'Personal Growth',
    description: 'Confidence, adaptability, and a deeper sense of purpose.',
  },
  {
    title: 'Career Readiness',
    description: 'A competitive edge in a global job market.',
  },
]

const offerings = [
  {
    number: '01',
    title: 'End-to-End Program Design',
    intro:
      'We collaborate with faculty to shape a program that meets your academic goals — whether in public health, entrepreneurship, governance, or environmental studies — and to align with course objectives which may include:',
    items: ['Site visits', 'Field research opportunities', 'Community engagements', 'Industry briefings', 'Cultural excursions'],
  },
  {
    number: '02',
    title: 'Logistical Management',
    intro: 'From airport pickup to final farewell dinner, we handle all in-country arrangements:',
    items: ['Transport & accommodation', 'Venue bookings', 'Safety briefings & risk mitigation', 'Local support staff & guides'],
  },
  {
    number: '03',
    title: 'Academic Enrichment',
    intro: 'We facilitate access to:',
    items: [
      'Government agencies',
      'Grassroots organizations',
      'Local experts and guest lecturers',
      'NGOs, government offices, and private sector innovators',
      'Cultural experiences and community-led engagement',
    ],
  },
]

const destinations = [
  {
    flag: '🇰🇪',
    country: 'Kenya',
    tagline: 'Our Home Base',
    description:
      "We've hosted dozens of faculty-led programs across Nairobi, Laikipia, Kisumu, and the coast. From urban development studies in Kibera to conservation fieldwork in Lewa, our local insights run deep.",
  },
  {
    flag: '🇺🇬',
    country: 'Uganda',
    tagline: 'Cross-Border Collaboration',
    description:
      'We supported public health programs in Kampala and Gulu, integrating with NGOs and medical institutions on the ground.',
  },
  {
    flag: '🇬🇭',
    country: 'Ghana',
    tagline: 'West African Expansion',
    description:
      "We've coordinated short-term immersions in Accra and Cape Coast, focusing on African diasporic studies and community development. We have partnered with Jamgo-cee Company Limited (JCL), a specialist in student exchange and study abroad programs in Ghana.",
  },
]

const universities = ['University of Nairobi', 'Strathmore University', 'United States International University – Africa (USIU-A)']

export default function StudyAbroadPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: studyAbroadFaqs.map((qa) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: { '@type': 'Answer', text: qa.answer },
    })),
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Study Abroad', item: absoluteUrl('/study-abroad') },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Hero */}
      <section className="relative bg-navy min-h-[60vh] flex items-end pb-16 pt-40 overflow-hidden">
        <Image
          src="/images/nairobi-skyline-wikimedia.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-navy/90 via-navy/50 to-navy/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full">
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Academic Travel Partner</T></span>
          <h1 className="mt-4 text-cream text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] tracking-tight max-w-3xl">
            <T>Transformative Academic Travel Across Africa</T>
          </h1>
          <p className="mt-6 text-cream/60 text-lg max-w-xl leading-relaxed">
            <T>Faculty-led study abroad programs, designed and delivered end-to-end across Kenya, Uganda, Ghana, and beyond.</T>
          </p>
          <div className="mt-8">
            <a
              href="#inquiry-form"
              className="inline-flex items-center gap-2 bg-gold text-navy font-medium px-7 py-3.5 rounded-full text-sm hover:bg-gold/90 transition-colors"
            >
              <T>Start Planning Your Program</T>
            </a>
          </div>
        </div>
      </section>

      {/* What are faculty-led programs */}
      <section className="bg-cream py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>What They Are</T></span>
              <h2 className="mt-4 text-navy text-4xl font-medium tracking-tight leading-[1.15]">
                <T>Faculty-Led Study Abroad Programs</T>
              </h2>
            </div>
            <div className="space-y-5 text-charcoal/70 text-base leading-relaxed">
              <p>
                <T>Faculty-led study abroad programs are short-term academic experiences where university faculty
                accompany students to another country to deliver a course or curriculum in a real-world setting.
                These programs are typically 1 to 4 weeks long and combine classroom learning with cultural
                immersion, fieldwork, and site visits.</T>
              </p>
              <p>
                <T>Unlike semester-long exchanges, faculty-led programs are intensive, focused, and tailored —
                providing an incredible opportunity for students to apply theoretical knowledge in practical,
                cross-cultural contexts.</T>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why study abroad */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Why Study Abroad</T></span>
            <h2 className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight"><T>It's not just about travel — it's about transformation.</T></h2>
            <p className="mt-4 text-navy/50 text-lg max-w-2xl mx-auto"><T>Students who participate in these programs gain:</T></p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b) => (
              <div key={b.title} className="bg-navy/5 border border-navy/10 rounded-2xl p-8 hover:border-gold/30 transition-colors">
                <div className="text-gold mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <h3 className="text-navy text-xl font-medium mb-3"><T>{b.title}</T></h3>
                <p className="text-navy/50 text-sm leading-relaxed"><T>{b.description}</T></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic travel partner + what we offer */}
      <section className="bg-sand py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl mb-16">
            <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>What We Offer</T></span>
            <h2 className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]"><T>Your Academic Travel Partner in Africa</T></h2>
            <p className="mt-5 text-charcoal/70 text-base leading-relaxed">
              <T>At Escape Pod, we specialize in designing and delivering short-term, faculty-led study abroad
              programs tailored to academic institutions seeking immersive, experiential learning in Africa. With
              deep local networks, logistical expertise, and a passion for meaningful engagement, we create
              seamless travel-study programs rooted in real-world impact and cultural immersion.</T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offerings.map((o) => (
              <div key={o.number} className="bg-white rounded-3xl border border-navy/8 shadow-sm p-8 flex flex-col gap-4">
                <span className="text-gold text-sm font-semibold tracking-widest">{o.number}</span>
                <h3 className="text-navy text-xl font-medium leading-tight"><T>{o.title}</T></h3>
                <p className="text-charcoal/60 text-sm leading-relaxed"><T>{o.intro}</T></p>
                <ul className="space-y-2 mt-1">
                  {o.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-charcoal/70 text-[14px]">
                      <span className="text-gold mt-1">✓</span>
                      <T>{item}</T>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations & case studies */}
      <section className="bg-cream py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-16">
            <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Case Studies</T></span>
            <h2 className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight"><T>Destinations & Case Studies</T></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {destinations.map((d) => (
              <div key={d.country} className="bg-white rounded-3xl border border-navy/8 shadow-sm p-8 flex flex-col gap-3">
                <span className="text-3xl" aria-hidden>{d.flag}</span>
                <div>
                  <h3 className="text-navy text-xl font-medium"><T>{d.country}</T></h3>
                  <p className="text-gold text-xs font-medium tracking-wide uppercase mt-1"><T>{d.tagline}</T></p>
                </div>
                <p className="text-charcoal/60 text-sm leading-relaxed"><T>{d.description}</T></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we've worked with */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center">
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Who We've Worked With</T></span>
          <h2 className="mt-4 text-navy text-4xl font-medium tracking-tight"><T>Trusted by leading institutions</T></h2>
          <p className="mt-5 text-charcoal/70 text-base leading-relaxed max-w-2xl mx-auto">
            <T>We have successfully partnered with local universities in Kenya, including:</T>
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {universities.map((u) => (
              <span key={u} className="bg-navy/5 border border-navy/10 text-navy text-sm font-medium px-5 py-2.5 rounded-full">
                {u}
              </span>
            ))}
          </div>
          <p className="mt-8 text-charcoal/60 text-sm leading-relaxed max-w-2xl mx-auto">
            <T>Our team is also equipped to handle global cohorts, including undergraduate, graduate, and executive
            learners from universities worldwide. Whether it's your first program in Africa or part of an ongoing
            academic collaboration, we are ready to support you.</T>
          </p>
        </div>
      </section>

      {/* Inquiry form — both this page's CTAs (hero + this section) scroll
          here rather than routing off to /contact, per a dedicated
          request-form for this page's own leads. */}
      <section id="inquiry-form" className="bg-navy py-24 lg:py-28 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-cream text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
              <T>Let's Build Your Next Program</T>
            </h2>
            <p className="mt-5 text-cream/60 text-base md:text-lg leading-relaxed">
              <T>Whether you're a faculty member looking to take your classroom abroad or an international education
              office seeking a reliable partner in Africa, let's co-create an unforgettable academic journey in
              Africa. Tell us a little about your program and we'll follow up directly.</T>
            </p>
          </div>
          <StudyAbroadInquiryForm />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-14">
            <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>FAQ</T></span>
            <h2 className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight"><T>Ready to Plan Your Program?</T></h2>
            <p className="mt-4 text-navy/50 text-lg max-w-2xl mx-auto">
              <T>Still have questions? Browse the FAQ below, or</T>{' '}
              <a href="#inquiry-form" className="text-gold underline underline-offset-4 hover:text-navy transition-colors">
                <T>jump straight to the inquiry form.</T>
              </a>
            </p>
          </div>
          <FAQAccordion />
        </div>
      </section>
    </>
  )
}
