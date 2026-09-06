import type { Metadata } from 'next'
import { T } from '@/components/i18n/T'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Escape Pod Safari Booking Terms & Conditions.',
}

const sections: { heading: string; body: React.ReactNode }[] = [
  {
    heading: '1. Booking & Confirmation',
    body: (
      <ul className="space-y-1.5">
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>A booking is confirmed only upon receipt of full payment and written confirmation from Escape Pod.</T></li>
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>By confirming your booking, you agree to these Terms &amp; Conditions on behalf of all persons in your party.</T></li>
      </ul>
    ),
  },
  {
    heading: '2. Payments',
    body: (
      <ul className="space-y-1.5">
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Full payment is required at the time of booking.</T></li>
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Bookings are not guaranteed until full payment has been received and acknowledged by Escape Pod.</T></li>
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Payment methods accepted include bank transfer, credit card, or mobile money (details provided at the time of booking).</T></li>
      </ul>
    ),
  },
  {
    heading: '3. Cancellations & Refunds',
    body: (
      <>
        <ul className="space-y-1.5 mb-3">
          <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>All cancellations must be submitted in writing.</T></li>
          <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>The following cancellation fees apply:</T></li>
        </ul>
        <ul className="space-y-1.5 mb-3 ml-6">
          <li className="flex gap-2 text-charcoal/60 leading-relaxed"><span className="text-gold/60 shrink-0">–</span><T>More than 60 days before travel: 90% refund of total payment.</T></li>
          <li className="flex gap-2 text-charcoal/60 leading-relaxed"><span className="text-gold/60 shrink-0">–</span><T>30–59 days before travel: 70% refund of total payment.</T></li>
          <li className="flex gap-2 text-charcoal/60 leading-relaxed"><span className="text-gold/60 shrink-0">–</span><T>Less than 30 days before travel: No refund.</T></li>
        </ul>
        <p className="text-charcoal/70 leading-relaxed"><T>No refunds will be given for no-shows, early departures, or unused services.</T></p>
      </>
    ),
  },
  {
    heading: '4. Amendments',
    body: (
      <ul className="space-y-1.5">
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Booking changes (dates, accommodations, etc.) are subject to availability and may incur additional charges.</T></li>
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Requests for changes within 30 days of departure may be treated as a cancellation and rebooking.</T></li>
      </ul>
    ),
  },
  {
    heading: '5. Inclusions & Exclusions',
    body: (
      <ul className="space-y-1.5">
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Your safari package includes accommodation, meals as specified, scheduled transport, park fees, and listed experiences.</T></li>
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Exclusions: international flights, visas, insurance, personal expenses, gratuities, and optional activities not specified in your itinerary.</T></li>
      </ul>
    ),
  },
  {
    heading: '6. Travel Insurance',
    body: (
      <ul className="space-y-1.5">
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Travel insurance is mandatory and must cover trip cancellation, medical emergencies, evacuation, and personal belongings.</T></li>
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Proof of insurance may be requested before travel.</T></li>
      </ul>
    ),
  },
  {
    heading: '7. Health & Special Requirements',
    body: (
      <ul className="space-y-1.5">
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Guests must disclose any medical conditions, dietary needs, or special requirements at the time of booking.</T></li>
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Participation in safari activities is at the guest&rsquo;s own risk.</T></li>
      </ul>
    ),
  },
  {
    heading: '8. Passports & Visas',
    body: (
      <p className="text-charcoal/70 leading-relaxed">
        <T>Travelers are responsible for obtaining valid passports (minimum 6 months validity) and all necessary visas prior to departure.</T>
      </p>
    ),
  },
  {
    heading: '9. Wildlife Sightings',
    body: (
      <p className="text-charcoal/70 leading-relaxed">
        <T>Wildlife experiences are authentic and unscripted. Sightings cannot be guaranteed.</T>
      </p>
    ),
  },
  {
    heading: '10. Force Majeure',
    body: (
      <p className="text-charcoal/70 leading-relaxed">
        <T>Escape Pod is not liable for delays or disruptions due to events beyond our control (including weather, political instability, natural disasters, or global health crises).</T>
      </p>
    ),
  },
  {
    heading: '11. Liability Disclaimer',
    body: (
      <ul className="space-y-1.5">
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>Escape Pod acts as an agent for third-party service providers and is not liable for injury, loss, damage, or delays caused by these providers.</T></li>
        <li className="flex gap-2 text-charcoal/70 leading-relaxed"><span className="text-gold shrink-0">•</span><T>A waiver and indemnity form must be signed by all travelers prior to departure.</T></li>
      </ul>
    ),
  },
  {
    heading: '12. Child Policy',
    body: (
      <p className="text-charcoal/70 leading-relaxed">
        <T>Children are welcome, but participation may be subject to accommodation and activity age restrictions. Please confirm in advance.</T>
      </p>
    ),
  },
  {
    heading: '13. Photography & Marketing',
    body: (
      <p className="text-charcoal/70 leading-relaxed">
        <T>Escape Pod may use photos or videos taken during safaris for promotional purposes. If you prefer not to appear in any marketing materials, please notify us in writing before travel.</T>
      </p>
    ),
  },
]

const glance = [
  'Full payment is required to confirm your booking.',
  'Cancellations: >60 days before travel — 90% refund · 30–59 days — 70% refund · <30 days — no refund.',
  'Travel insurance is mandatory and must cover medical emergencies, cancellations, and evacuations.',
  'Safari rates include accommodation, listed meals, transport, park fees & scheduled activities.',
  'International flights, visas, personal expenses & optional add-ons are not included.',
  'Wildlife sightings are not guaranteed, but we work with expert guides to give you the best chance.',
  "You'll be required to sign a liability waiver before travel.",
  'Children are welcome, subject to lodge and activity age limits.',
  'Let us know of any medical, dietary, or mobility needs when booking.',
]

export default function TermsPage() {
  return (
    <>
      <section className="relative bg-navy min-h-[40vh] flex items-end pb-16 pt-40 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(ellipse at 80% 20%, #F2A755 0%, transparent 50%)` }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-10 w-full">
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase"><T>Legal</T></span>
          <h1 className="mt-4 text-cream text-5xl md:text-6xl font-medium leading-[1.1] tracking-tight">
            <T>Safari Booking Terms &amp; Conditions</T>
          </h1>
        </div>
      </section>

      <section className="bg-cream py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">

          {/* Quick summary */}
          <div className="bg-navy/5 border border-navy/10 rounded-2xl p-8 mb-14">
            <h2 className="text-navy text-sm font-medium tracking-widest uppercase mb-5"><T>Booking Terms at a Glance</T></h2>
            <ul className="space-y-2">
              {glance.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-charcoal/70 leading-relaxed">
                  <span className="text-gold shrink-0">•</span><T>{item}</T>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-12">
            {sections.map((s) => (
              <div key={s.heading}>
                <h2 className="text-navy text-xl font-semibold mb-4"><T>{s.heading}</T></h2>
                {s.body}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
