'use client'

import { useRouter } from 'next/navigation'

export const CURATE_HANDOFF_KEY = 'ek_curate_handoff'

// The "Curate a similar journey" CTA on a story page. Stashes the story's
// prompt AND its pre-written engine reply in sessionStorage (survives the
// /login detour in the same tab, unlike a URL param that the engine
// layout's auth redirect would strip) and sends the reader to the engine,
// which picks it up on mount and renders the whole opening exchange
// verbatim — no AI call. The model only engages once the traveler types a
// follow-up. See app/engine/page.tsx.
export default function CurateSimilarButton({
  prompt,
  response,
  suggestions,
  className,
  children,
}: {
  prompt: string
  response: string
  suggestions: string[]
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        try {
          sessionStorage.setItem(CURATE_HANDOFF_KEY, JSON.stringify({ prompt, response, suggestions }))
        } catch {
          // sessionStorage unavailable — fall back to a plain nav; the
          // reader just lands on the engine with an empty composer.
        }
        router.push('/engine')
      }}
      className={className}
    >
      {children}
    </button>
  )
}
