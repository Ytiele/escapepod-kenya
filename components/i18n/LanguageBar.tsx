'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES } from '@/lib/i18n/languages';
import { useLocale } from './LanguageContext';

// Fixed at the very top of the viewport, above every page's own header
// (the Navbar, and the bookings/engine pages' own in-flow headers) — see
// app/layout.tsx, which reserves space for this via a top padding on
// <body> rather than each page managing its own offset.
export default function LanguageBar() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-9 bg-navy border-b border-cream/10 flex items-center justify-end px-4">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-cream/70 hover:text-cream transition-colors"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="text-sm leading-none">{current.flag}</span>
          <span>{current.native}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <ul
            role="listbox"
            className="absolute right-0 top-full mt-1 w-40 bg-navy border border-cream/10 rounded-lg shadow-xl overflow-hidden py-1"
          >
            {LOCALES.map((l) => (
              <li key={l.code}>
                <button
                  onClick={() => {
                    setLocale(l.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                    l.code === locale ? 'text-gold bg-cream/5' : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                  }`}
                >
                  <span className="text-sm leading-none">{l.flag}</span>
                  <span>{l.native}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
