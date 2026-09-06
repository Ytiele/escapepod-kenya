export const LOCALES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export const LOCALE_CODES: LocaleCode[] = LOCALES.map((l) => l.code);

export function isLocaleCode(value: unknown): value is LocaleCode {
  return typeof value === 'string' && (LOCALE_CODES as string[]).includes(value);
}

export function localeName(code: LocaleCode): string {
  return LOCALES.find((l) => l.code === code)?.name ?? 'English';
}
