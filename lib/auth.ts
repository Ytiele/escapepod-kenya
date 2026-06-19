export type User = { name: string; email: string }

type StoredUser = User & { password: string }

function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('ep_users') ?? '[]') } catch { return [] }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const s = localStorage.getItem('ep_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export function signIn(email: string, password: string): { user: User } | { error: string } {
  const match = getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  )
  if (!match) return { error: 'Incorrect email or password.' }
  const user: User = { name: match.name, email: match.email }
  localStorage.setItem('ep_session', JSON.stringify(user))
  return { user }
}

export function signUp(
  name: string,
  email: string,
  password: string,
): { user: User } | { error: string } {
  const users = getUsers()
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: 'An account with that email already exists.' }
  }
  users.push({ name, email, password })
  localStorage.setItem('ep_users', JSON.stringify(users))
  const user: User = { name, email }
  localStorage.setItem('ep_session', JSON.stringify(user))
  return { user }
}

export function signOut() {
  localStorage.removeItem('ep_session')
}
