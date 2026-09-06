-- Run this once in the Supabase SQL editor to enable the site-wide language
-- toggle (components/i18n/LanguageBar.tsx + app/api/translate/route.ts).
--
-- What it's for: the same UI strings and page copy repeat across every
-- visitor who picks a given language, so each unique (source text, locale)
-- pair only ever needs to be translated by Claude once, globally, and then
-- served straight from this table forever after. Meaning-based translation
-- runs once per pair; every later hit (from any visitor) is a DB read only.

create table if not exists translation_cache (
  text_hash        text not null,              -- sha256 of the source (English) text
  locale           text not null,               -- target locale code, e.g. 'fr', 'ko'
  source_text      text not null,               -- original English string, kept for auditing/re-translation
  translated_text  text not null,
  created_at       timestamptz not null default now(),
  primary key (text_hash, locale)
);

-- Row-level security stays OFF, same as the other tables here — this is
-- only ever touched via supabaseAdmin (the service_role key).
