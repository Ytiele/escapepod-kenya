'use client'

import Link from 'next/link'
import { useState } from 'react'


function FounderSection() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="bg-sand py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div
            className="rounded-3xl min-h-[600px] flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundImage: `url('${encodeURI('/images/rose kagushia.png')}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          <div>
            <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">The Founder</span>
            <h2 className="mt-4 text-navy text-4xl font-medium tracking-tight">The Architect</h2>
            <div className="mt-6">
              <p className="text-gold text-8xl font-semibold italic leading-none">&ldquo;</p>
              <p className="text-navy text-lg italic leading-relaxed mt-2">
                As co-host of Baiskeli Stories, Rose has spent years exploring narratives of
                resilience, purpose, and reinvention.
              </p>
            </div>
            <p className="mt-6 text-charcoal/70 text-base leading-relaxed">
              Escape Pod is the vision of{' '}
              <strong className="text-navy">Rose Kagucia</strong> — a curator of journeys defined
              by intention, depth, and absolute privacy.
            </p>
            <p className="mt-4 text-charcoal/70 text-base leading-relaxed">
              Shaped by a career at the highest levels of corporate leadership, Rose applies
              uncompromising precision to the art of travel design. Her approach strips away
              everything unnecessary and leaves only what is meaningful.
            </p>
            <p className="mt-4 text-charcoal/70 text-base leading-relaxed">
              Her years co-hosting Baiskeli Stories — exploring Kenya&rsquo;s landscapes on two
              wheels and in conversation with the people who inhabit them — gave her an intimacy
              with the country&rsquo;s quieter truths that no guidebook could provide.
            </p>

            {isExpanded && (
              <div className="mt-4 space-y-4">
                <p className="text-charcoal/70 text-base leading-relaxed">
                  It is from these spaces in between—the untamed landscapes and the unfiltered cultural encounters—that the soul of EscapePod emerged. Every detail is engineered to awaken a deeper sense of presence, ensuring that your journey is immersive yet effortless. Refined yet grounded.
                </p>
                <p className="text-charcoal/70 text-base leading-relaxed">
                  This is travel as it should be: intentional, intimate, and quietly extraordinary.
                </p>
              </div>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-6 inline-flex items-center gap-2 text-gold font-medium text-sm hover:gap-3 transition-all"
            >
              {isExpanded ? 'Read Less' : 'Read More'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <>
      <section 
        className="relative bg-navy min-h-[60vh] flex items-end pb-16 pt-40 overflow-hidden"
        style={{
          backgroundImage: `url('${encodeURI('/images/about escape.png')}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundColor: '#0a1e3a',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full">
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">Who We Are</span>
          <h1 className="mt-4 text-cream text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] tracking-tight max-w-3xl">
            Discover Our Journey &amp; What Drives Us.
          </h1>
          <p className="mt-6 text-cream/60 text-lg max-w-xl leading-relaxed">
            Most trips feel the same. We&rsquo;re here for the people who want something different.
          </p>
        </div>
      </section>

      <section className="bg-cream py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">Our Philosophy</span>
              <h2 className="mt-4 text-navy text-4xl font-medium tracking-tight leading-[1.15]">
                The Luxury of Intention
              </h2>
            </div>
            <div className="space-y-5 text-charcoal/70 text-base leading-relaxed">
              <p>
                Escape Pod Kenya was not built to sell itineraries. It was built to eliminate friction.
                We architect bespoke environments so you can bypass the research and focus entirely on
                the experience.
              </p>
              <p>
                You define the rhythm. You select the company. We orchestrate the execution —{' '}
                <em>quietly and completely</em> — ensuring the journey stays with you long after you
                return.
              </p>
              <div className="pt-2">
                <Link
                  href="/engine"
                  className="inline-flex items-center gap-2 bg-navy text-cream font-medium px-7 py-3.5 rounded-full text-sm hover:bg-navy/80 transition-colors"
                >
                  Design Your Experience
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FounderSection />

      {/* Operational Integrity — TRA logo */}
      <section className="bg-cream py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">Credentials</span>
              <h2 className="mt-4 text-navy text-4xl font-medium tracking-tight">
                Operational Integrity
              </h2>

              <img
                src="/images/Tourism logo.png"
                alt="Tourism Regulatory Authority"
                className="mt-10 w-80 h-auto"
              />
            </div>

            <div className="space-y-5 text-charcoal/70 text-base leading-relaxed">
              <p>
                Peace of mind is built on vetted excellence and verified accountability. EscapePod
                Kenya is fully accredited and officially licensed by the Travel and Tourism Authority.
              </p>
              <p>
                For us, this certification is merely the baseline. It guarantees that our operations,
                our on-the-ground network, and our financial practices meet the strictest national
                standards for safety and reliability.
              </p>
              <p>
                You travel with the quiet confidence that every logistical detail of your journey is
                formally protected and flawlessly executed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture of Movement — Motogari logo */}
      <section className="bg-navy py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">Transport</span>
              <h2 className="mt-4 text-cream text-4xl font-medium tracking-tight">
                The Architecture of Movement
              </h2>

              <img
                src="/images/transport logo.png"
                alt="Transport Partner Logo"
                className="mt-10 w-80 h-auto"
              />
            </div>

            <div className="space-y-5 text-cream/60 text-base leading-relaxed">
              <p>
                True privacy requires absolute control over your environment — especially in transit.
                To guarantee zero friction on the ground, EscapePod operates in an exclusive
                partnership with{' '}
                <strong className="text-gold">Motogari</strong>, Kenya&rsquo;s premier private
                transport network.
              </p>
              <p>
                We do not rely on shared transfers, public waiting rooms, or outsourced, unpredictable
                logistics. Every driver is meticulously background-checked and trained to our precise
                service standards.
              </p>
              <p>
                From the moment you land, your vehicle is private, secure, and entirely dedicated to
                your rhythm. Your movement through the landscape remains completely seamless.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-navy py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="text-cream text-4xl md:text-5xl font-medium tracking-tight leading-[1.1]">
            The Next Step is Yours
          </h2>
          <p className="mt-5 text-cream/70 text-lg leading-relaxed">
            The destination is only the backdrop; the true luxury is how you feel while you are there.
            Tell us who you are traveling with and how you want to feel. We will handle the invisible
            logistics to make it a reality.
          </p>
          <Link
            href="/engine"
            className="mt-8 inline-flex items-center gap-3 bg-gold text-navy font-medium px-8 py-4 rounded-full text-base hover:bg-gold/90 transition-colors"
          >
            Define Your Rhythm
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  )
}
