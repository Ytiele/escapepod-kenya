'use client'

import { useEffect, useRef } from 'react'

// Visible "I'm not a robot" checkbox (reCAPTCHA v2) — swapped in from the
// original invisible v3 scoring because the ask was specifically for
// people to complete a verification step, not a silent background check.
// lib/recaptcha.ts's server-side verifyRecaptcha() already tolerates a v2
// response as-is (no `score`/`action` fields), so nothing server-side
// needed to change — only how each form collects the token.
//
// Explicit render (`render=explicit` + `onload` callback) rather than the
// implicit `class="g-recaptcha"` auto-scan: React re-renders would fight
// the auto-scan's own DOM ownership of the widget.

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        params: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'light' | 'dark'
          size?: 'normal' | 'compact'
        }
      ) => number
      reset: (widgetId?: number) => void
    }
    __onRecaptchaLoad?: () => void
  }
}

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.grecaptcha?.render) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve) => {
    window.__onRecaptchaLoad = () => resolve()
    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js?onload=__onRecaptchaLoad&render=explicit'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  })
  return scriptPromise
}

// Give the component a fresh `key` after a submit attempt (success or
// error) to force a full remount — a v2 token is single-use, and
// `grecaptcha.reset()` is one more moving part than just letting React
// tear down and re-render the widget from scratch.
export default function RecaptchaCheckbox({
  onChange,
  theme = 'light',
  size = 'normal',
}: {
  onChange: (token: string | null) => void
  // 'dark' for a form sitting on a navy background (e.g. the newsletter
  // section) — Google's own widget chrome, not this site's brand colors.
  theme?: 'light' | 'dark'
  // 'compact' (164x144) for a narrow container (e.g. a sidebar) where the
  // default 304px-wide widget wouldn't fit.
  size?: 'normal' | 'compact'
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<number | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let cancelled = false
    loadScript().then(() => {
      if (cancelled || !containerRef.current || widgetId.current !== null) return
      widgetId.current = window.grecaptcha!.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onChange(token),
        'expired-callback': () => onChange(null),
        'error-callback': () => onChange(null),
        theme,
        size,
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange/theme
    // are passed fresh per render from useState setters/literals, which are
    // stable in practice; re-running this on every render would re-render
    // the widget in place.
  }, [siteKey])

  // Not configured yet — render nothing rather than an empty gap, same
  // "additive, not required" behavior as the rest of this integration.
  if (!siteKey) return null

  return <div ref={containerRef} className="[&>div]:mx-auto" />
}
