'use client'

import { useRouter } from 'next/navigation'

export const CURATE_PROMPT_KEY = 'ek_curate_prompt'

// The "Curate a similar journey" CTA on a story page. Stashes the story's
// curatePrompt in sessionStorage (survives the /login detour in the same
// tab, unlike a URL param that the engine layout's auth redirect would
// strip) and sends the reader to the engine, which picks it up on mount,
// auto-sends it, and shows the response — see app/engine/page.tsx.
export default function CurateSimilarButton({
  prompt,
  className,
  children,
}: {
  prompt: string
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        try {
          sessionStorage.setItem(CURATE_PROMPT_KEY, prompt)
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
