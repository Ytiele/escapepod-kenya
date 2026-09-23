// Thin client-side wrappers around the /api/auth/* routes. Real session
// state lives in httpOnly cookies set by those routes (backed by Supabase
// Auth) — nothing sensitive is ever stored in localStorage or read here.

export type User = { id: string; name: string; email: string }

async function parseJson(res: Response) {
  try { return await res.json() } catch { return {} }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/session')
    if (!res.ok) return null
    const data = await parseJson(res)
    return data.user ?? null
  } catch {
    return null
  }
}

// recaptchaToken comes from a visible <RecaptchaCheckbox> the calling page
// renders and manages (see app/login/page.tsx) — unlike the old invisible
// v3 flow, a v2 checkbox token can't be fetched on demand here; the caller
// must already have one from the widget before calling this.
export async function signIn(email: string, password: string, recaptchaToken?: string | null): Promise<{ user: User } | { error: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, recaptchaToken }),
  })
  const data = await parseJson(res)
  if (!res.ok) return { error: data.error ?? 'Incorrect email or password.' }
  return { user: data.user }
}

export async function signUp(name: string, email: string, password: string, recaptchaToken?: string | null): Promise<{ user: User } | { error: string }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, recaptchaToken }),
  })
  const data = await parseJson(res)
  if (!res.ok) return { error: data.error ?? 'Could not create your account.' }
  return { user: data.user }
}

export async function signOut(): Promise<void> {
  try { await fetch('/api/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
}

export async function requestPasswordReset(email: string, recaptchaToken?: string | null): Promise<{ message: string } | { error: string }> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, recaptchaToken }),
  })
  const data = await parseJson(res)
  if (!res.ok) return { error: data.error ?? 'Could not send the reset email.' }
  return { message: data.message }
}

export async function resetPassword(tokenHash: string, password: string): Promise<{ user: User } | { error: string }> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token_hash: tokenHash, password }),
  })
  const data = await parseJson(res)
  if (!res.ok) return { error: data.error ?? 'Could not reset your password.' }
  return { user: data.user }
}
