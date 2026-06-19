import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Book a 20-minute zero-commitment consultation via Google Meet. Tell us what you want to achieve.',
}

export default function ContactPage() {
  return (
    <>
      <section className="relative bg-navy min-h-[50vh] flex items-end pb-16 pt-40 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(ellipse at 80% 20%, #F2A755 0%, transparent 50%)`,
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full">
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">Get In Touch</span>
          <h1 className="mt-4 text-cream text-5xl md:text-6xl font-medium leading-[1.1] tracking-tight max-w-2xl">
            Contact Us
          </h1>
        </div>
      </section>

      <section className="bg-cream py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">
                Schedule a Consultation
              </span>
              <h2 className="mt-4 text-navy text-4xl font-medium tracking-tight leading-[1.15]">
                A 20-minute, zero-commitment conversation.
              </h2>
              <p className="mt-6 text-charcoal/70 text-base leading-relaxed">
                Tell us what you want to achieve, and we will immediately outline the geography,
                logistics, and pacing required to make it happen. Via Google Meet — at a time that
                suits you entirely.
              </p>

              <div className="mt-8">
                <Link
                  href="https://calendly.com/escapepodkenya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-gold text-navy font-medium px-8 py-4 rounded-full text-base hover:bg-gold/90 transition-colors"
                >
                  Book A Time
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">
                  Direct Access
                </span>
                <p className="mt-3 text-charcoal/60 text-sm leading-relaxed">
                  For immediate inquiries, partner requests, or travelers already in Kenya requiring
                  trusted on-the-ground support.
                </p>
              </div>

              <div className="space-y-5">
                <a
                  href="https://wa.me/254117335858"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                    <svg className="w-5 h-5 text-navy" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-charcoal/40 uppercase tracking-wider">WhatsApp &amp; Voice</p>
                    <p className="text-navy font-medium">+254 117 335 858</p>
                  </div>
                </a>

                <a
                  href="mailto:sales@escapepodkenya.com"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                    <svg className="w-5 h-5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-charcoal/40 uppercase tracking-wider">Private Email</p>
                    <p className="text-navy font-medium">sales@escapepodkenya.com</p>
                  </div>
                </a>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center">
                    <svg className="w-5 h-5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-charcoal/40 uppercase tracking-wider">Office</p>
                    <p className="text-navy font-medium">Zamani Business Park, Nairobi</p>
                    <p className="text-charcoal/50 text-sm">Mon – Friday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
