import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ACCESS_COOKIE, getSessionUserReadOnly } from '@/lib/session'

export const metadata = {
  title: 'EscapePod Tour Engine',
  description: 'Tell us how you want to feel. We will orchestrate the rest.',
}

export default async function EngineLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const user = await getSessionUserReadOnly(cookieStore.get(ACCESS_COOKIE)?.value)
  if (!user) redirect('/login')

  return <div className="min-h-screen bg-navy">{children}</div>
}
