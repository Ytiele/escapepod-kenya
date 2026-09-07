'use client';

import { useEffect, useState } from 'react';
import { useLocale } from './LanguageContext';
import { translateText } from '@/lib/i18n/translateClient';
import { getDictionarySync } from '@/lib/i18n/dictionary';

// Renders `text` as-is in English. In another locale, checks the
// pre-translated static dictionary for that locale FIRST (see
// lib/i18n/dictionary.ts + scripts/gen-translations.mjs) — a synchronous
// lookup, so a string already in the dictionary appears instantly with no
// flash of English at all, not even for one frame. Only a string that
// isn't in the dictionary (added since the last generation run, or one of
// the few variable-driven sites the generator can't resolve statically)
// falls back to the live, cached /api/translate path, which behaves
// exactly as it did before the static dictionary existed: shows English
// while the request is in flight, then swaps in the result.
export function useTranslated(text: string): string {
  const { locale, dictVersion } = useLocale();
  const [liveResult, setLiveResult] = useState<string | null>(null);

  const staticHit = locale === 'en' ? undefined : getDictionarySync(locale)?.[text];

  useEffect(() => {
    setLiveResult(null);
    if (locale === 'en' || !text.trim() || staticHit) return;
    let alive = true;
    translateText(locale, text).then((result) => {
      if (alive) setLiveResult(result);
    });
    return () => {
      alive = false;
    };
    // dictVersion isn't read here, only relied on to re-run this effect —
    // once dictionaries finish preloading, `staticHit` above is
    // recomputed on the resulting re-render and pre-empts this branch
    // entirely, so this effect's own re-run just becomes a no-op.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, text, staticHit, dictVersion]);

  if (locale === 'en') return text;
  if (staticHit) return staticHit;
  return liveResult ?? text;
}

// Drop-in wrapper for a plain-text UI string: <T>Design Your Experience</T>.
// Only takes a plain string child — for copy with embedded markup (a bold
// name, a link), wrap each text segment separately and leave the markup
// untouched around it.
export function T({ children }: { children: string }) {
  return <>{useTranslated(children)}</>;
}
