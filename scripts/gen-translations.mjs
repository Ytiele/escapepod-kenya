// One-off/maintenance script — NOT part of the Next.js build or runtime.
//
// Run manually with: node scripts/gen-translations.mjs
//
// Scans app/ and components/ for every string wrapped in <T>...</T> or
// passed to useTranslated('...'), translates each one (meaning-based, via
// Claude — same approach as app/api/translate/route.ts) into every
// supported non-English locale, and writes the results to
// lib/i18n/dictionaries/<locale>.json. Those files are committed to the
// repo and imported directly by the client (see lib/i18n/dictionary.ts),
// so a visitor switching languages gets an instant, already-translated
// page instead of waiting on a live API call — the live /api/translate
// route stays in place purely as a fallback for any string this scan
// misses or that gets added later without a re-run.
//
// Re-run this whenever you add new hardcoded UI copy wrapped in <T> or
// useTranslated(), then commit the updated JSON files under
// lib/i18n/dictionaries/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── .env.local (this runs outside Next's own env loading) ─────────────────
function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not found in .env.local — aborting.');
  process.exit(1);
}
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LOCALES = [
  { code: 'ru', name: 'Russian' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'fr', name: 'French' },
  { code: 'it', name: 'Italian' },
  { code: 'es', name: 'Spanish' },
];

// ── File walking ────────────────────────────────────────────────────────
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) out.push(full);
  }
  return out;
}

// ── JSX text entity decoding + whitespace collapsing (must exactly match
// what the JSX runtime hands <T> as `children` at runtime, or a dictionary
// lookup will miss) ────────────────────────────────────────────────────
const ENTITY_MAP = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201D', ldquo: '\u201C',
  mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', nbsp: '\u00A0',
  copy: '\u00A9', reg: '\u00AE', trade: '\u2122', deg: '\u00B0', times: '\u00D7',
};
function decodeJsxEntities(str) {
  return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, ent) => {
    if (ent[0] === '#') {
      const isHex = ent[1] === 'x' || ent[1] === 'X';
      const code = isHex ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITY_MAP[ent] ?? whole;
  });
}
function collapseJsxWhitespace(raw) {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(' ');
}
function unescapeJsString(str) {
  return str.replace(/\\(['"\\nrt])/g, (_, ch) => ({ "'": "'", '"': '"', '\\': '\\', n: '\n', r: '\r', t: '\t' }[ch]));
}

// ── Extraction ──────────────────────────────────────────────────────────
function extractFromFile(content) {
  const strings = new Set();

  for (const m of content.matchAll(/<T>([^<>{}]+)<\/T>/g)) {
    const text = collapseJsxWhitespace(decodeJsxEntities(m[1]));
    if (text) strings.add(text);
  }

  for (const m of content.matchAll(
    /<T>\{\s*[\w.]+\s*===?\s*'[^']*'\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'\s*\}<\/T>/g
  )) {
    strings.add(unescapeJsString(m[1]));
    strings.add(unescapeJsString(m[2]));
  }

  for (const m of content.matchAll(/<T>\{\s*'((?:[^'\\]|\\.)*)'\s*\}<\/T>/g)) {
    strings.add(unescapeJsString(m[1]));
  }
  for (const m of content.matchAll(/<T>\{\s*"((?:[^"\\]|\\.)*)"\s*\}<\/T>/g)) {
    strings.add(unescapeJsString(m[1]));
  }

  for (const m of content.matchAll(/useTranslated\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g)) {
    strings.add(unescapeJsString(m[1]));
  }
  for (const m of content.matchAll(/useTranslated\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g)) {
    strings.add(unescapeJsString(m[1]));
  }

  return strings;
}

// A handful of <T>{variable}</T> sites reference a local array of objects
// rather than a literal — regex can't resolve those generically without
// risking false positives elsewhere, so these three known cases are
// special-cased by hand. Anything else that's variable-driven just falls
// back to the live /api/translate path at runtime, same as before.
function extractKnownArrays(filePath, content, strings) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');

  if (rel === 'components/layout/Navbar.tsx' || rel === 'components/layout/Footer.tsx') {
    const arrayName = rel.endsWith('Navbar.tsx') ? 'links' : 'quickLinks';
    const block = content.match(new RegExp(`const ${arrayName}\\s*=\\s*\\[([\\s\\S]*?)\\]`));
    if (block) {
      for (const m of block[1].matchAll(/label:\s*'([^']*)'/g)) strings.add(m[1]);
    }
  }

  if (rel === 'components/home/TestimonialsSection.tsx') {
    const block = content.match(/const testimonials\s*=\s*\[([\s\S]*?)\n\]/);
    if (block) {
      for (const m of block[1].matchAll(/quote:\s*'((?:[^'\\]|\\.)*)'/g)) strings.add(unescapeJsString(m[1]));
      for (const m of block[1].matchAll(/type:\s*'([^']*)'/g)) strings.add(`${m[1]} Journey`);
    }
  }
}

// ── Translation (mirrors app/api/translate/route.ts's translateBatch) ────
//
// Output is delimiter-separated plain text, not JSON. Several of this
// site's source strings contain literal quote characters (e.g. the privacy
// policy's `("we," "our," or "us")`), and a JSON-array response occasionally
// carried an un-escaped quote straight through into a translated string —
// breaking JSON.parse. A delimiter that would never plausibly appear in
// translated UI copy sidesteps the whole escaping problem.
const DELIMITER = '\n§§§\n';

async function translateChunk(texts, languageName) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system:
      `You are a professional translator for EscapePod Kenya, a luxury bespoke travel brand. ` +
      `Translate each of the following strings from English into ${languageName}. ` +
      `Translate for meaning, tone, and natural fluency — the way a native ${languageName} speaker ` +
      `writing marketing copy or UI text would phrase it — never a literal word-for-word translation. ` +
      `Preserve the register (elegant, warm, confident) and keep placeholders, numbers, proper nouns ` +
      `(brand names, place names like "Maasai Mara" or "Lamu"), and punctuation-only strings unchanged. ` +
      `Respond with ONLY the translations, one per input string, in the exact same order as the input, ` +
      `with each translation separated from the next by a line containing exactly: §§§ ` +
      `Do not add numbering, quotes, JSON formatting, or any commentary — just the raw translated text ` +
      `for each string in order, separated by that marker.`,
    messages: [{ role: 'user', content: JSON.stringify(texts) }],
  });
  const block = message.content.find((b) => b.type === 'text');
  const raw = block && block.type === 'text' ? block.text.trim() : '';
  const parts = raw.split(/\n?§§§\n?/).map((s) => s.trim());
  if (process.argv.includes('--debug') && parts.length !== texts.length) {
    console.error(`\n--- MISMATCHED PART COUNT (got ${parts.length}, expected ${texts.length}) ---\n${raw}\n--- END ---\n`);
  }
  return texts.map((text, i) => (parts[i] && parts[i].trim() ? parts[i] : text));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  const files = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))];
  const allStrings = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const s of extractFromFile(content)) allStrings.add(s);
    extractKnownArrays(file, content, allStrings);
  }

  const list = Array.from(allStrings).filter((s) => s.length <= 1200);
  console.log(`Extracted ${list.length} unique strings from ${files.length} files.`);

  if (process.argv.includes('--dry')) {
    list.sort().forEach((s) => console.log(`  - ${s}`));
    console.log(`\n(dry run — no translation calls made)`);
    return;
  }

  const outDir = path.join(ROOT, 'lib', 'i18n', 'dictionaries');
  fs.mkdirSync(outDir, { recursive: true });

  const localeFilterArg = process.argv.find((a) => a.startsWith('--locales='));
  const localeFilter = localeFilterArg ? new Set(localeFilterArg.split('=')[1].split(',')) : null;
  const targets = localeFilter ? LOCALES.filter((l) => localeFilter.has(l.code)) : LOCALES;

  for (const { code, name } of targets) {
    console.log(`\nTranslating into ${name} (${code})...`);
    const outPath = path.join(outDir, `${code}.json`);
    const dict = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};

    // Idempotent — only translate strings this locale doesn't already have,
    // so a re-run (new copy added, or retrying a locale that partially
    // failed last time) is fast and doesn't re-spend on what's already done.
    const missing = list.filter((s) => !(s in dict));
    if (missing.length === 0) {
      console.log(`  already complete (${Object.keys(dict).length} entries) — nothing to do`);
      continue;
    }
    console.log(`  ${missing.length} of ${list.length} strings need translating`);
    const chunks = chunk(missing, 40);
    for (let i = 0; i < chunks.length; i++) {
      process.stdout.write(`  chunk ${i + 1}/${chunks.length}...`);
      let translated = null;
      let lastErr = null;
      for (let attempt = 0; attempt < 3 && !translated; attempt++) {
        try {
          translated = await translateChunk(chunks[i], name);
        } catch (err) {
          lastErr = err;
        }
      }
      if (translated) {
        chunks[i].forEach((source, j) => { dict[source] = translated[j]; });
        console.log(' ok');
      } else {
        console.log(' FAILED after 3 attempts — leaving these for the runtime fallback');
        console.error(lastErr);
      }
    }
    fs.writeFileSync(outPath, JSON.stringify(dict, null, 2) + '\n', 'utf8');
    console.log(`  wrote ${Object.keys(dict).length} entries to ${path.relative(ROOT, outPath)}`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
