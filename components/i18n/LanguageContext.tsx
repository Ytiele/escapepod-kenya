'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_LOCALE, isLocaleCode, type LocaleCode } from '@/lib/i18n/languages';
import { loadDictionary, preloadAllDictionaries } from '@/lib/i18n/dictionary';

const STORAGE_KEY = 'ek_locale';

interface LanguageContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  // Bumped once the background dictionary preload settles — included in
  // the context value purely so every useLocale() consumer (every <T>/
  // useTranslated) re-renders and re-checks the now-available static
  // dictionary, even ones that already committed to the live-translate
  // fallback before the preload finished.
  dictVersion: number;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  dictVersion: 0,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [dictVersion, setDictVersion] = useState(0);

  // Runs once on mount. Starting from DEFAULT_LOCALE on the server (and on
  // this first client render) keeps SSR markup and the first client render
  // identical, avoiding a hydration mismatch. For a returning visitor with
  // a remembered non-English locale, their dictionary is loaded FIRST and
  // the locale flip only happens once it's ready — so the page doesn't
  // flash English before jumping to their language. Every other
  // dictionary loads in the background regardless, so a later switch to
  // any language is instant too.
  useEffect(() => {
    let alive = true;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable (private mode, etc) — just stay on default.
    }

    if (isLocaleCode(stored) && stored !== 'en') {
      loadDictionary(stored).then(() => {
        if (alive) setLocaleState(stored as LocaleCode);
      });
    } else if (isLocaleCode(stored)) {
      setLocaleState(stored);
    }

    preloadAllDictionaries().then(() => {
      if (alive) setDictVersion((v) => v + 1);
    });

    return () => {
      alive = false;
    };
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

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dictVersion }}>{children}</LanguageContext.Provider>
  );
}

export function useLocale() {
  return useContext(LanguageContext);
}
