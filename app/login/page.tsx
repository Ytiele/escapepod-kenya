'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, signUp, getStoredUser } from '@/lib/auth'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in — go straight to engine
  useEffect(() => {
    if (getStoredUser()) router.replace('/engine')
  }, [router])

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setName('')
    setPassword('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (!password) { setError('Please enter your password.'); return }

    if (mode === 'signup') {
      if (!name.trim()) { setError('Please enter your name.'); return }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    }

    setLoading(true)
    try {
      const result =
        mode === 'signup'
          ? signUp(name.trim(), email.trim(), password)
          : signIn(email.trim(), password)

      if ('error' in result) {
        setError(result.error)
      } else {
        router.push('/engine')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex">
      {/* ── Left panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse at 25% 65%, rgba(242,167,85,0.25) 0%, transparent 55%), radial-gradient(ellipse at 75% 20%, rgba(242,167,85,0.12) 0%, transparent 50%)`,
          }}
        />
        <div className="relative z-10 p-16 flex flex-col justify-between h-full">
          <Link href="/" className="hover:opacity-80 transition-opacity w-fit">
            <img 
              src="/images/png logo.png" 
              alt="EscapePod Logo" 
              className="h-8 w-auto"
            />
          </Link>
          <div>
            <p className="text-gold/70 text-xs font-medium tracking-[0.25em] uppercase mb-5">
              The Luxury of Zero Friction
            </p>
            <h2 className="text-cream text-4xl font-medium leading-[1.2] mb-6">
              Your journey starts<br />with a single sentence.
            </h2>
            <p className="text-cream/40 text-sm leading-relaxed max-w-xs">
              Tell us what you&rsquo;re imagining. Our curation engine does the rest.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p className="text-cream/30 text-xs">Powered by EscapePod AI</p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
              <img 
                src="/images/png logo.png" 
                alt="EscapePod Logo" 
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Mode tabs */}
          <div className="flex mb-8 bg-cream/5 border border-cream/10 rounded-xl p-1 gap-1">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === m
                    ? 'bg-gold text-navy'
                    : 'text-cream/50 hover:text-cream'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <h1 className="text-cream text-2xl font-medium mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Start your journey'}
          </h1>
          <p className="text-cream/40 text-sm mb-8">
            {mode === 'signin'
              ? 'Sign in to continue to EscapePod'
              : 'Create an account to save and curate your trips'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  autoComplete="name"
                  className="w-full bg-cream/5 border border-cream/15 rounded-xl px-4 py-3.5 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/60 transition-colors"
                />
              </div>
            )}

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                autoComplete="email"
                className="w-full bg-cream/5 border border-cream/15 rounded-xl px-4 py-3.5 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/60 transition-colors"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Password (min 6 chars)' : 'Password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full bg-cream/5 border border-cream/15 rounded-xl px-4 py-3.5 pr-12 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {mode === 'signin' && (
              <div className="flex justify-end">
                <button type="button" className="text-gold/70 text-xs hover:text-gold transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-navy font-medium py-3.5 rounded-xl hover:bg-gold/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream/10" />
            </div>
            <div className="relative flex justify-center text-xs text-cream/30 px-4">
              <span className="bg-navy px-4">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full bg-cream/5 border border-cream/15 text-cream text-sm font-medium py-3.5 rounded-xl hover:border-cream/30 hover:bg-cream/8 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-cream/30 text-xs">
            By continuing, you agree to our{' '}
            <Link href="/" className="text-gold/60 hover:text-gold transition-colors">Terms</Link>
            {' & '}
            <Link href="/" className="text-gold/60 hover:text-gold transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
