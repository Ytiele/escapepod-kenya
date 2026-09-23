import type { Metadata } from 'next'
import Image from 'next/image'
import { T } from '@/components/i18n/T'
import FAQAccordion from '@/components/study-abroad/FAQAccordion'
import StudyAbroadInquiryForm from '@/components/study-abroad/StudyAbroadInquiryForm'
import { studyAbroadFaqs } from '@/data/studyAbroadFaqs'
import { SITE_NAME, absoluteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Faculty-Led Study Abroad in Africa',
  description:
    'Escape Pod partners with universities to design and deliver faculty-led study abroad programs across Africa — academically aligned, ethically grounded, and operationally seamless. We are not a tour provider; we are an in-country academic partner.',
  alternates: { canonical: '/study-abroad' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    title: 'Faculty-Led Study Abroad in Africa',
    description:
      'Curated. Immersive. Academically rigorous. Escape Pod designs and delivers faculty-led study abroad programs across Africa as an in-country academic partner, not a tour provider.',
    url: '/study-abroad',
  },
}

const partnerReasons = [
  {
    title: 'Academic-First Design',
    description: 'Faculty maintain curricular control; we translate objectives into structured field experiences.',
  },
  {
    title: 'Institutional Rigor',
    description: 'Governance, compliance awareness, and operational accountability embedded in program design.',
  },
  {
    title: 'Ethical Community Engagement',
    description: 'Respectful, reciprocal partnerships that prioritize responsible engagement.',
  },
  {
    title: 'Operational Precision',
    description: 'Transparent budgeting, clear communication, and structured execution.',
  },
  {
    title: 'Proven Delivery',
    description:
      'A track record of running faculty-led programs successfully in the field, including a multi-institutional program across UIUC, UniMac Ghana, and Fourah Bay College.',
  },
]

const logistics = [
  'Vetted accommodation partners aligned with university standards',
  'Trusted transport providers and professional drivers',
  'Dedicated on-ground program coordination throughout',
  'Risk protocols and emergency response planning',
  'Local language support and culturally fluent guidance',
  'Clear pre-departure communication and briefing support',
]

const learningOutcomes = [
  'Field-based research and documentation experience',
  'Cross-cultural competence and global awareness',
  'Exposure to local industries and civic institutions',
  'Ethical engagement practice in real-world environments',
  'Portfolio-ready academic or professional outputs',
]

const programModels = [
  '10–14 Day Faculty-Led Programs',
  'Discipline-Specific Tracks',
  'Custom-Built Academic Immersions Aligned to Departmental Goals',
  'Multi-Institutional & Cross-Border Collaborations',
]

const programConcepts = [
  {
    title: 'Science of Speed',
    location: 'Iten',
    description:
      "Set in Iten, home to some of the world's most decorated distance runners. Students explore the physiology, training science, and culture behind high-altitude endurance athletics, working alongside local coaches and athletes.",
  },
  {
    title: 'Conservation',
    location: 'Maasai Mara',
    description:
      "Set in the Maasai Mara. Students engage directly with wildlife conservation practice, community-based conservancy models, and the ecological and economic tradeoffs shaping East Africa's conservation landscape today.",
  },
]

const featuredProgramRows: [string, string][] = [
  ['Partner', 'University of Illinois Urbana-Champaign, College of Media'],
  ['Collaborating Institutions', 'UniMac (Ghana), Fourah Bay College (Sierra Leone)'],
  ['Participants', '9 students + 3 faculty (UIUC), with 6 students from UniMac and 3 from Fourah Bay'],
  ['Location', 'Accra, Ghana'],
  ['Duration', '13–21 March 2026'],
  ['Focus', 'Storytelling, cultural documentation, creative industry engagement'],
]

const partnerInstitutions = [
  { name: 'University of Illinois Urbana-Champaign (College of Media)', note: 'Accra, Ghana, Spring 2026' },
  { name: 'UniMac Ghana', note: 'Collaborating institution, Accra program' },
  { name: 'Fourah Bay College, Sierra Leone', note: 'Collaborating institution, Accra program' },
]

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

      {/* Hero — image unchanged */}
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
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Escape Pod</T></span>
          <h1 className="mt-4 text-cream text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] tracking-tight max-w-3xl">
            <T>Faculty-Led Study Abroad in Africa</T>
          </h1>
          <p className="mt-6 text-gold/90 text-lg italic max-w-xl leading-relaxed">
            <T>Curated. Immersive. Academically rigorous.</T>
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

      {/* Transformative Academic Experiences */}
      <section className="bg-cream py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Our Approach</T></span>
              <h2 className="mt-4 text-navy text-4xl font-medium tracking-tight leading-[1.15]">
                <T>Transformative Academic Experiences</T>
              </h2>
            </div>
            <div className="space-y-5 text-charcoal/70 text-base leading-relaxed">
              <p>
                <T>Escape Pod partners with universities to design and deliver faculty-led study abroad programs
                across Africa that are academically aligned, ethically grounded, and operationally seamless. We
                are not a tour provider — we are an in-country academic partner.</T>
              </p>
              <p>
                <T>Our programs are co-developed with faculty to ensure direct alignment with course objectives
                and learning outcomes. Students engage in real-world contexts through field research,
                documentation, industry engagement, and structured reflection.</T>
              </p>
              <p className="border-l-2 border-gold pl-5">
                <T>In Spring 2026, we served as the logistics and experience partner for the University of
                Illinois Urbana-Champaign College of Media's study abroad program in Accra — a cross-disciplinary
                journalism and advertising immersion exploring storytelling through culture, commerce, and
                community. Nine UIUC students and three faculty worked alongside students from UniMac Ghana and
                Fourah Bay College (Sierra Leone), collaborating across institutions and borders to document and
                tell the story of the Kayayei with depth and intention. It's proof of what's possible when a
                university's academic vision meets our operational depth — and our capacity to build genuinely
                multi-institutional programs.</T>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why universities partner with us */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Why Partner With Us</T></span>
            <h2 className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight"><T>Why Universities Partner With Escape Pod</T></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {partnerReasons.map((r) => (
              <div key={r.title} className="bg-navy/5 border border-navy/10 rounded-2xl p-8 hover:border-gold/30 transition-colors">
                <div className="text-gold mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <h3 className="text-navy text-xl font-medium mb-3"><T>{r.title}</T></h3>
                <p className="text-navy/50 text-sm leading-relaxed"><T>{r.description}</T></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seamless logistics & on-ground support */}
      <section className="bg-sand py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl mb-14">
            <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Logistics</T></span>
            <h2 className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]"><T>Seamless Logistics & On-Ground Support</T></h2>
            <p className="mt-5 text-charcoal/70 text-base leading-relaxed">
              <T>We manage the operational complexity so faculty can focus on teaching and academic leadership.
              Our logistics framework includes:</T>
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-navy/8 shadow-sm p-8 lg:p-10">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {logistics.map((item) => (
                <li key={item} className="flex items-start gap-3 text-charcoal/70 text-[15px]">
                  <span className="text-gold mt-0.5">✓</span>
                  <T>{item}</T>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Student learning outcomes */}
      <section className="bg-cream py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-14">
            <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Learning Outcomes</T></span>
            <h2 className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight"><T>Student Learning Outcomes</T></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningOutcomes.map((item) => (
              <div key={item} className="bg-white rounded-2xl border border-navy/8 shadow-sm p-6 flex items-start gap-3">
                <span className="text-gold text-lg leading-none mt-0.5">✓</span>
                <p className="text-navy text-[15px] font-medium leading-snug"><T>{item}</T></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program models */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center">
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Program Models</T></span>
          <h2 className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight"><T>Program Models</T></h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {programModels.map((model) => (
              <span key={model} className="bg-navy/5 border border-navy/10 text-navy text-sm font-medium px-5 py-3 rounded-full">
                <T>{model}</T>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sample program concepts */}
      <section className="bg-sand py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-14 max-w-3xl">
            <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Sample Program Concepts</T></span>
            <h2 className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]"><T>From Discipline to Field Experience</T></h2>
            <p className="mt-5 text-charcoal/70 text-base leading-relaxed">
              <T>A look at how we translate a discipline into a field experience:</T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programConcepts.map((c) => (
              <div key={c.title} className="bg-white rounded-3xl border border-navy/8 shadow-sm p-8 flex flex-col gap-3">
                <span className="text-gold text-xs font-medium tracking-wide uppercase"><T>{c.location}</T></span>
                <h3 className="text-navy text-xl font-medium"><T>{c.title}</T></h3>
                <p className="text-charcoal/60 text-sm leading-relaxed"><T>{c.description}</T></p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-charcoal/60 text-sm leading-relaxed max-w-3xl">
            <T>These sit alongside concepts already in development for Chemistry, Business, and other departments
            — each one built the same way: starting from a faculty's learning objectives and working outward into
            the field.</T>
          </p>
        </div>
      </section>

      {/* Featured program */}
      <section className="bg-cream py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Featured Program</T></span>
          <h2 className="mt-4 text-navy text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
            <T>UIUC College of Media × Accra, Ghana</T>
          </h2>
          <p className="mt-2 text-charcoal/50 text-sm italic"><T>Spring 2026</T></p>
          <p className="mt-6 text-charcoal/70 text-base leading-relaxed max-w-3xl">
            <T>A cross-disciplinary journalism and advertising immersion exploring storytelling through culture,
            commerce, and community — delivered across three institutions and three countries.</T>
          </p>

          <div className="mt-10 rounded-2xl border border-navy/10 overflow-hidden divide-y divide-navy/10 bg-white">
            {featuredProgramRows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-6 px-6 py-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-navy/40"><T>{label}</T></span>
                <span className="text-navy text-[15px] font-medium"><T>{value}</T></span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-charcoal/70 text-base leading-relaxed max-w-3xl">
            <T>Students moved between Accra's creative agencies, art spaces, and Kantamanto Market, working across
            institutions to document and tell the story of the Kayayei with depth and empathy. Escape Pod ran the
            full operational arc — arrivals through final debrief — so faculty could focus entirely on the
            academic experience.</T>
          </p>

          <p className="mt-6 inline-block bg-gold/10 border border-gold/30 rounded-full px-5 py-2.5 text-navy text-sm font-medium italic">
            <T>Escape Pod is now booking the 2026/2027 study abroad calendar.</T>
          </p>
        </div>
      </section>

      {/* Institutions we've worked with */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Our Partners</T></span>
            <h2 className="mt-4 text-navy text-4xl font-medium tracking-tight"><T>Trusted by Academic Institutions Across Disciplines and Borders</T></h2>
            <p className="mt-5 text-charcoal/70 text-base leading-relaxed max-w-2xl mx-auto">
              <T>Escape Pod has delivered faculty-led programs for and alongside:</T>
            </p>
          </div>

          <div className="rounded-2xl border border-navy/10 overflow-hidden divide-y divide-navy/10">
            {partnerInstitutions.map((inst) => (
              <div key={inst.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-6 py-4 bg-sand/40">
                <span className="text-navy font-medium text-[15px]"><T>{inst.name}</T></span>
                <span className="text-charcoal/50 text-sm"><T>{inst.note}</T></span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-navy text-sm font-medium italic">
            <T>Currently in development: a Spring 2027 program with UIUC in Tamale, Ghana.</T>
          </p>

          <p className="mt-6 text-charcoal/60 text-sm leading-relaxed max-w-2xl mx-auto text-center">
            <T>We're building our university partner roster deliberately — one well-executed program at a time.
            If your institution is exploring Africa-based study abroad, we'd welcome the conversation.</T>
          </p>
        </div>
      </section>

      {/* Leadership & institutional credibility */}
      <section className="bg-sand py-24 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Leadership</T></span>
          <h2 className="mt-4 text-navy text-3xl md:text-4xl font-medium tracking-tight"><T>Leadership & Institutional Credibility</T></h2>
          <p className="mt-6 text-charcoal/70 text-base leading-relaxed">
            <T>Escape Pod is founded and led by Rose Kagucia, an executive-level strategist with senior leadership
            and board experience in finance and governance. This background brings institutional discipline,
            strategic clarity, and risk awareness to every program.</T>
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
              <T>Let's design a program aligned to your curriculum goals.</T>
            </h2>
            <p className="mt-5 text-cream/60 text-base md:text-lg leading-relaxed">
              <T>Program design consultations available — tell us a little about your goals and we'll follow up
              directly.</T>
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
