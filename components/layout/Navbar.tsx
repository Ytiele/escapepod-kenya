'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Who We Are', href: '/about' },
  { label: 'Our Stories', href: '/stories' },
  { label: 'Contact Us', href: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || menuOpen ? 'bg-navy shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img
            src="/images/png logo.png"
            alt="EscapePod Logo"
            className="h-12 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-gold'
                  : 'text-cream/80 hover:text-cream'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/engine"
            className="bg-gold text-navy text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gold/90 transition-colors"
          >
            Design Your Experience
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-cream p-2"
          aria-label="Toggle menu"
        >
          <div className="w-6 flex flex-col gap-1.5">
            <span className={`block h-px bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
            <span className={`block h-px bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-px bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-navy border-t border-cream/10 px-6 pb-8 pt-4">
          <nav className="flex flex-col gap-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-medium transition-colors ${
                  pathname === link.href ? 'text-gold' : 'text-cream/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/engine"
              className="mt-2 bg-gold text-navy text-sm font-medium px-5 py-3 rounded-full text-center"
            >
              Design Your Experience
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
