'use client'

// Browser-side half of Google reCAPTCHA v3. Invisible — no checkbox
// widget on any form, just a small badge Google requires stay visible
// (bottom-right corner; see the "Terms" note at recaptcha.google.com).
//
// Returns undefined when NEXT_PUBLIC_RECAPTCHA_SITE_KEY isn't set — every
// call site treats that as "skip the token, submit normally," so every
// form keeps working today, before real keys are configured. See
// lib/recaptcha.ts for the matching server-side behavior.

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, opts: { action: string }) => Promise<string>
    }
  }
}

let scriptPromise: Promise<void> | null = null

function loadScript(siteKey: string): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (window.grecaptcha) { resolve(); return }
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

// Call right before submitting a form: `getRecaptchaToken('book_time')`.
// The action string must match the one the corresponding API route passes
// to verifyRecaptcha() — reCAPTCHA scores differently per action and a
// mismatch is treated as invalid server-side.
export async function getRecaptchaToken(action: string): Promise<string | undefined> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  if (!siteKey) return undefined

  try {
    await loadScript(siteKey)
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha!.ready(() => {
        window.grecaptcha!.execute(siteKey, { action }).then(resolve).catch(reject)
      })
    })
  } catch (err) {
    // Script blocked (ad-blocker) or a network hiccup — return undefined
    // rather than throwing, so the caller's own submit flow decides what
    // happens next. Once RECAPTCHA_SECRET_KEY is configured server-side, a
    // missing token here does get rejected there — an accepted tradeoff
    // once this is actually turned on, not a bug.
    console.error('[recaptcha] failed to get token', err)
    return undefined
  }
}
