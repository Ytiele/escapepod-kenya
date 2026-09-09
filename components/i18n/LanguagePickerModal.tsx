'use client';

import Image from 'next/image';
import { LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/languages';
import { useLocale } from './LanguageContext';
import { T } from './T';

// Shown once, on a visitor's very first load with no stored language
// preference at all (see LanguageContext's showLanguagePicker) — not on
// every page load. Picking any option, including the skip link, persists
// a choice via setLocale, so this never reappears for that visitor again
// unless their browser storage is cleared.
export default function LanguagePickerModal() {
  const { setLocale, showLanguagePicker } = useLocale();

  if (!showLanguagePicker) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-navy/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setLocale(DEFAULT_LOCALE)}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your language"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-cream rounded-3xl shadow-2xl overflow-hidden animate-fade-in"
      >
        <div className="bg-navy px-8 pt-8 pb-7 text-center">
          <Image
            src="/images/png logo.png"
            alt="EscapePod Logo"
            width={430}
            height={101}
            priority
            className="h-7 w-auto mx-auto mb-5"
          />
          <p className="text-gold text-[11px] font-medium tracking-[0.25em] uppercase mb-2"><T>Welcome</T></p>
          <h2 className="text-cream text-xl font-medium"><T>Choose your language</T></h2>
        </div>

        <div className="p-5 grid grid-cols-2 gap-2.5">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-navy/10 hover:border-gold/50 hover:bg-gold/5 transition-colors text-left"
            >
              <span className="text-xl leading-none shrink-0">{l.flag}</span>
              <span className="min-w-0">
                <span className="block text-navy font-semibold text-[13.5px] truncate">{l.native}</span>
                <span className="block text-charcoal/40 text-[11px]">{l.name}</span>
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setLocale(DEFAULT_LOCALE)}
          className="w-full text-center text-charcoal/40 text-xs py-4 border-t border-navy/8 hover:text-charcoal/60 transition-colors"
        >
          <T>Continue in English</T>
        </button>
      </div>
    </div>
  );
}
