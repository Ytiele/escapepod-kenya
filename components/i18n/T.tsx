'use client';

import { useEffect, useState } from 'react';
import { useLocale } from './LanguageContext';
import { translateText } from '@/lib/i18n/translateClient';

// Renders `text` as-is in English; in any other locale, kicks off an
// AI translation (batched + cached — see lib/i18n/translateClient.ts) and
// swaps it in once it resolves. Shows the original English text while
// waiting, so nothing ever flashes blank or empty.
export function useTranslated(text: string): string {
  const { locale } = useLocale();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    if (locale === 'en' || !text.trim()) {
      setTranslated(text);
      return;
    }
    let alive = true;
    setTranslated(text);
    translateText(locale, text).then((result) => {
      if (alive) setTranslated(result);
    });
    return () => {
      alive = false;
    };
  }, [locale, text]);

  return locale === 'en' ? text : translated;
}

// Drop-in wrapper for a plain-text UI string: <T>Design Your Experience</T>.
// Only takes a plain string child — for copy with embedded markup (a bold
// name, a link), wrap each text segment separately and leave the markup
// untouched around it.
export function T({ children }: { children: string }) {
  return <>{useTranslated(children)}</>;
}
