import Link from 'next/link'

const quickLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Our Stories', href: '/stories' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Safari Booking', href: '/engine' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Contact Us', href: '/contact' },
]

export default function Footer() {
  return (
    <footer className="bg-navy text-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-cream/10">
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity">
              <img
                src="/images/png logo.png"
                alt="EscapePod Logo"
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-4 text-cream/60 text-sm leading-relaxed max-w-xs">
              We design African safari packages that blend wilderness, white-sand beaches, and culture
              — so you can travel deeply without the crowds or chaos.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase text-gold mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase text-gold mb-5">Contact</h4>
            <address className="not-italic space-y-3 text-sm text-cream/60">
              <p>
                <a href="tel:+254117335858" className="hover:text-cream transition-colors">
                  +254 117 335 858
                </a>
              </p>
              <p>
                <a href="mailto:sales@escapepodkenya.com" className="hover:text-cream transition-colors">
                  sales@escapepodkenya.com
                </a>
              </p>
              <p>Zamani Business Park, Nairobi</p>
              <p>Working Days: Mon – Friday</p>
            </address>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-cream/40 text-sm">Copyrights 2026 EscapePod Kenya. All rights reserved.</p>
          <div className="flex items-center gap-6 text-cream/40 text-sm">
            <Link href="/privacy" className="hover:text-cream/70 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-cream/70 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
