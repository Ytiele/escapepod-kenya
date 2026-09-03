/* eslint-disable @typescript-eslint/no-require-imports */
// One-off script: downscale + recompress everything in public/images.
// Run: node scripts/optimize-images.js
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.join(__dirname, '..', 'public', 'images')
const MAX_WIDTH = 1920
const SKIP_UNDER_BYTES = 150 * 1024 // don't bother re-encoding already-small files

function walk(dir) {
  let out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out = out.concat(walk(full))
    else out.push(full)
  }
  return out
}

async function optimize(file) {
  const ext = path.extname(file).toLowerCase()
  const before = fs.statSync(file).size
  if (before < SKIP_UNDER_BYTES) return { file, before, after: before, skipped: true }

  const img = sharp(file)
  const meta = await img.metadata()
  const resized = img.resize({ width: MAX_WIDTH, withoutEnlargement: true })

  let buffer
  if (ext === '.jpg' || ext === '.jpeg') {
    buffer = await resized.jpeg({ quality: 75, mozjpeg: true }).toBuffer()
  } else if (ext === '.png') {
    buffer = await resized.png({ quality: 78, compressionLevel: 9, effort: 8 }).toBuffer()
  } else {
    return { file, before, after: before, skipped: true }
  }

  // Only write if it's actually smaller — never make a file bigger.
  if (buffer.length < before) {
    // Write to a temp file then rename — avoids Windows file-lock errors
    // when something (e.g. the dev server) still holds a handle on `file`.
    const tmp = file + '.tmp'
    fs.writeFileSync(tmp, buffer)
    fs.renameSync(tmp, file)
    return { file, before, after: buffer.length, skipped: false, width: meta.width }
  }
  return { file, before, after: before, skipped: true }
}

async function main() {
  const files = walk(ROOT).filter(f => /\.(jpe?g|png)$/i.test(f))
  let totalBefore = 0
  let totalAfter = 0
  for (const file of files) {
    const r = await optimize(file)
    totalBefore += r.before
    totalAfter += r.after
    const rel = path.relative(ROOT, r.file)
    if (r.skipped) {
      console.log(`skip   ${rel}  (${(r.before / 1024).toFixed(0)} KB)`)
    } else {
      console.log(`shrink ${rel}  ${(r.before / 1024 / 1024).toFixed(2)}MB -> ${(r.after / 1024 / 1024).toFixed(2)}MB`)
    }
  }
  console.log('---')
  console.log(`Total: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB`)
}

main()
