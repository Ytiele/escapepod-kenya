import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ACCESS_COOKIE, getSessionUserReadOnly } from '@/lib/session'

export const metadata = {
  title: 'EscapePod Tour Engine',
  description: 'Tell us how you want to feel. We will orchestrate the rest.',
  // Account-gated — an unauthenticated request redirects straight to
  // /login, so there's nothing here for search engines to usefully index.
  robots: { index: false, follow: false },
}

export default async function EngineLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const user = await getSessionUserReadOnly(cookieStore.get(ACCESS_COOKIE)?.value)
  if (!user) redirect('/login')

  return <div className="min-h-screen bg-navy">{children}</div>
}
