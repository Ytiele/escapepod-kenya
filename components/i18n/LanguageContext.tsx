'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from '@/lib/i18n/languages';

const STORAGE_KEY = 'ek_locale';

interface LanguageContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  // Runs once on mount — reads the visitor's last choice back out of
  // localStorage. Starting from DEFAULT_LOCALE on the server (and on this
  // first client render) keeps SSR markup and the first client render
  // identical, avoiding a hydration mismatch; the swap to a remembered
  // non-English locale happens a tick later, same as any client-only
  // preference (theme, etc).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLocaleCode(stored)) setLocaleState(stored);
    } catch {
      // localStorage unavailable (private mode, etc) — just stay on default.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal — the toggle still works for the rest of this session.
    }
  }, []);

  return <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>;
}

export function useLocale() {
  return useContext(LanguageContext);
}
