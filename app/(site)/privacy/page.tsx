import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Escape Pod Limited collects, uses, and safeguards your information.',
}

const sections = [
  {
    heading: '1. Information We Collect',
    body: (
      <>
        <p className="mb-4 text-charcoal/70 leading-relaxed">
          We may collect personal and non-personal information when you interact with our website or use our services, including:
        </p>
        <p className="text-navy font-medium mb-2">a. Personal Information</p>
        <ul className="space-y-1.5 mb-4">
          {['Full name', 'Email address', 'Phone number', 'Billing and shipping address', 'Travel preferences', 'Payment details (processed securely via third-party payment providers)'].map((item) => (
            <li key={item} className="flex gap-2 text-charcoal/70 leading-relaxed">
              <span className="text-gold shrink-0">•</span>{item}
            </li>
          ))}
        </ul>
        <p className="text-navy font-medium mb-2">b. Non-Personal Information</p>
        <ul className="space-y-1.5">
          {['IP address', 'Browser type and version', 'Pages visited and time spent', 'Referring website URLs'].map((item) => (
            <li key={item} className="flex gap-2 text-charcoal/70 leading-relaxed">
              <span className="text-gold shrink-0">•</span>{item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    heading: '2. How We Use Your Information',
    body: (
      <>
        <p className="mb-4 text-charcoal/70 leading-relaxed">We use the information we collect to:</p>
        <ul className="space-y-1.5">
          {[
            'Respond to your inquiries and provide personalized travel proposals',
            'Process and manage bookings and payments',
            'Send newsletters, updates, and promotional offers (only with your consent)',
            'Improve our website and services',
            'Comply with legal obligations',
          ].map((item) => (
            <li key={item} className="flex gap-2 text-charcoal/70 leading-relaxed">
              <span className="text-gold shrink-0">•</span>{item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    heading: '3. Sharing Your Information',
    body: (
      <>
        <p className="mb-4 text-charcoal/70 leading-relaxed">
          We respect your privacy and will never sell or rent your personal data. We may share your information only with:
        </p>
        <ul className="space-y-1.5">
          <li className="flex gap-2 text-charcoal/70 leading-relaxed">
            <span className="text-gold shrink-0">•</span>
            Trusted partners and service providers who assist us in delivering travel experiences (e.g., hotels, guides, logistics partners), under strict confidentiality agreements.
          </li>
          <li className="flex gap-2 text-charcoal/70 leading-relaxed">
            <span className="text-gold shrink-0">•</span>Third-party payment processors for secure transactions.
          </li>
          <li className="flex gap-2 text-charcoal/70 leading-relaxed">
            <span className="text-gold shrink-0">•</span>Regulatory or legal authorities, if required by law or to protect our legal rights.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: '4. Cookies and Tracking Technologies',
    body: (
      <>
        <p className="mb-4 text-charcoal/70 leading-relaxed">Our website uses cookies to enhance your browsing experience. These cookies:</p>
        <ul className="space-y-1.5 mb-4">
          {['Remember your preferences', 'Help us understand how visitors use our site', 'Enable analytics tools such as Google Analytics'].map((item) => (
            <li key={item} className="flex gap-2 text-charcoal/70 leading-relaxed">
              <span className="text-gold shrink-0">•</span>{item}
            </li>
          ))}
        </ul>
        <p className="text-charcoal/70 leading-relaxed">
          You may adjust your browser settings to refuse cookies, but some features of the site may not function properly.
        </p>
      </>
    ),
  },
  {
    heading: '5. Your Rights',
    body: (
      <>
        <p className="mb-4 text-charcoal/70 leading-relaxed">You have the right to:</p>
        <ul className="space-y-1.5 mb-4">
          {['Access, update, or delete your personal information', 'Withdraw consent for marketing communications', 'Request a copy of your data', 'Lodge a complaint with a data protection authority'].map((item) => (
            <li key={item} className="flex gap-2 text-charcoal/70 leading-relaxed">
              <span className="text-gold shrink-0">•</span>{item}
            </li>
          ))}
        </ul>
        <p className="text-charcoal/70 leading-relaxed">
          To exercise these rights, contact us at:{' '}
          <a href="mailto:sales@escapepodkenya.com" className="text-gold hover:underline">sales@escapepodkenya.com</a>
        </p>
      </>
    ),
  },
  {
    heading: '6. Data Security',
    body: (
      <p className="text-charcoal/70 leading-relaxed">
        We implement industry-standard security measures to protect your data. However, no method of online transmission or storage is 100% secure. We encourage you to use strong passwords and be cautious when sharing personal information online.
      </p>
    ),
  },
  {
    heading: '7. Third-Party Links',
    body: (
      <p className="text-charcoal/70 leading-relaxed">
        Our website may contain links to third-party sites. We are not responsible for the privacy practices or content of these external websites.
      </p>
    ),
  },
  {
    heading: '8. Changes to This Policy',
    body: (
      <p className="text-charcoal/70 leading-relaxed">
        We may update this Privacy Policy from time to time. All changes will be posted on this page with a revised effective date. We encourage you to review this page periodically.
      </p>
    ),
  },
  {
    heading: '9. Contact Us',
    body: (
      <>
        <p className="mb-4 text-charcoal/70 leading-relaxed">
          If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us:
        </p>
        <p className="text-charcoal/70 leading-relaxed">Email: <a href="mailto:sales@escapepodkenya.com" className="text-gold hover:underline">sales@escapepodkenya.com</a></p>
        <p className="text-charcoal/70 leading-relaxed">
          Website: <Link href="/" className="text-gold hover:underline">www.escapepodkenya.com</Link>
        </p>
        <p className="text-charcoal/70 leading-relaxed">Telephone/WhatsApp: +254 117 335 858</p>
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <>
      <section className="relative bg-navy min-h-[40vh] flex items-end pb-16 pt-40 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(ellipse at 80% 20%, #F2A755 0%, transparent 50%)` }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-10 w-full">
          <span className="text-gold text-xs font-medium tracking-[0.2em] uppercase">Legal</span>
          <h1 className="mt-4 text-cream text-5xl md:text-6xl font-medium leading-[1.1] tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 text-cream/50 text-sm">Effective Date: 1st May 2025</p>
        </div>
      </section>

      <section className="bg-cream py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <p className="mb-14 text-charcoal/70 text-base leading-relaxed">
            Escape Pod Limited (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, and safeguard your information when you visit our website{' '}
            <Link href="/" className="text-gold hover:underline">www.escapepodkenya.com</Link> and when you engage with our services.
          </p>

          <div className="space-y-12">
            {sections.map((s) => (
              <div key={s.heading}>
                <h2 className="text-navy text-xl font-semibold mb-4">{s.heading}</h2>
                {s.body}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
