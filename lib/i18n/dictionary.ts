import type { LocaleCode } from './languages';

// Pre-translated, committed-to-the-repo dictionaries (see
// scripts/gen-translations.mjs) — one JSON chunk per locale, code-split by
// the bundler so switching languages only ever pulls in the one file that's
// actually needed. This is the fast path: once a locale's dictionary is
// loaded, every <T>/useTranslated lookup for a string it contains resolves
// synchronously, with zero network round-trip and no flash of English.
//
// Anything NOT found here (a string added after the last script run, or
// one of the handful of variable-driven <T> sites the extractor can't
// resolve statically) transparently falls back to the live /api/translate
// path in lib/i18n/translateClient.ts — same as before this existed.

type Dictionary = Record<string, string>;

const loaders: Partial<Record<LocaleCode, () => Promise<{ default: Dictionary }>>> = {
  ru: () => import('./dictionaries/ru.json'),
  ko: () => import('./dictionaries/ko.json'),
  zh: () => import('./dictionaries/zh.json'),
  fr: () => import('./dictionaries/fr.json'),
  it: () => import('./dictionaries/it.json'),
  es: () => import('./dictionaries/es.json'),
};

const cache = new Map<LocaleCode, Dictionary>();
const inFlight = new Map<LocaleCode, Promise<Dictionary>>();

export function getDictionarySync(locale: LocaleCode): Dictionary | null {
  return cache.get(locale) ?? null;
}

export function loadDictionary(locale: LocaleCode): Promise<Dictionary> {
  if (locale === 'en') return Promise.resolve({});
  const cached = cache.get(locale);
  if (cached) return Promise.resolve(cached);
  const pending = inFlight.get(locale);
  if (pending) return pending;

  const loader = loaders[locale];
  if (!loader) return Promise.resolve({});

  const promise = loader()
    .then((mod) => {
      const dict = (mod?.default ?? {}) as Dictionary;
      cache.set(locale, dict);
      inFlight.delete(locale);
      return dict;
    })
    .catch((err) => {
      console.error(`[i18n] failed to load ${locale} dictionary — falling back to live translation`, err);
      inFlight.delete(locale);
      return {};
    });

  inFlight.set(locale, promise);
  return promise;
}

// Fired once when the app mounts (see LanguageContext) so that by the time
// a visitor actually opens the language menu, every dictionary is already
// sitting in memory — the switch itself is then just a synchronous lookup.
export function preloadAllDictionaries(): Promise<void> {
  return Promise.all((Object.keys(loaders) as LocaleCode[]).map((locale) => loadDictionary(locale))).then(() => {});
}
