'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { resetPassword } from '@/lib/auth'
import { T, useTranslated } from '@/components/i18n/T'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordPlaceholder = useTranslated('New Password (min 8 chars)')
  const confirmPlaceholder = useTranslated('Confirm New Password')
  const passwordLengthMsg = useTranslated('Password must be at least 8 characters.')
  const mismatchMsg = useTranslated("Passwords don't match.")
  const invalidLinkMsg = useTranslated('This reset link is invalid. Please request a new one.')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!tokenHash) { setError(invalidLinkMsg); return }
    if (password.length < 8) { setError(passwordLengthMsg); return }
    if (password !== confirmPassword) { setError(mismatchMsg); return }

    setLoading(true)
    try {
      const result = await resetPassword(tokenHash, password)
      if ('error' in result) setError(result.error)
      else router.push('/engine')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
            <Image src="/images/png logo.png" alt="EscapePod Logo" width={430} height={101} priority className="h-8 w-auto" />
          </Link>
        </div>

        <h1 className="text-cream text-2xl font-medium mb-1 text-center"><T>Set a new password</T></h1>
        <p className="text-cream/40 text-sm mb-8 text-center">
          <T>Choose a new password for your EscapePod account.</T>
        </p>

        {!tokenHash ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{invalidLinkMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={passwordPlaceholder}
              autoComplete="new-password"
              className="w-full bg-cream/5 border border-cream/15 rounded-xl px-4 py-3.5 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/60 transition-colors"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={confirmPlaceholder}
              autoComplete="new-password"
              className="w-full bg-cream/5 border border-cream/15 rounded-xl px-4 py-3.5 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/60 transition-colors"
            />

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
                  <T>Updating...</T>
                </>
              ) : (
                <T>Update Password</T>
              )}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-cream/30 text-xs">
          <Link href="/login" className="text-gold/60 hover:text-gold transition-colors"><T>Back to sign in</T></Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
