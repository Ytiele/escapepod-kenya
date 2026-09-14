import type { Metadata } from 'next'

// app/reset-password/page.tsx is a Client Component, which can't export
// `metadata` itself. Account-flow page — noindex, no reason to rank, and
// it's only ever reached via a one-time emailed token anyway.
export const metadata: Metadata = {
  title: 'Reset Password',
  robots: { index: false, follow: false },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
