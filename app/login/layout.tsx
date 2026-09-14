import type { Metadata } from 'next'

// app/login/page.tsx is a Client Component, which can't export `metadata`
// itself. Account-flow page — noindex, no reason to rank in search.
export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
