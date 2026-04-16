'use client'

import React, { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import Link from 'next/link'

type Stage = 'signin' | 'forgot' | 'reset'

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [stage, setStage] = useState<Stage>('signin')

  // Sign-in fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Reset fields
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        window.location.href = '/dashboard'
      }
    } catch (err: unknown) {
      const e = err as { errors?: { message: string }[] }
      setError(e.errors?.[0]?.message ?? 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      setStage('reset')
    } catch (err: unknown) {
      const e = err as { errors?: { message: string }[] }
      setError(e.errors?.[0]?.message ?? 'Could not send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isLoaded) return
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        window.location.href = '/dashboard'
      }
    } catch (err: unknown) {
      const e = err as { errors?: { message: string }[] }
      setError(e.errors?.[0]?.message ?? 'Reset failed. Check your code and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (stage === 'forgot') {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.title}>Reset password</h1>
          <p style={s.sub}>Enter your email and we'll send a reset code.</p>

          <form onSubmit={handleForgot} style={s.form}>
            <label style={s.label}>
              Email
              <input
                type="email" required autoFocus autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                style={s.input} placeholder="you@example.com"
              />
            </label>

            {error && <p style={s.error}>{error}</p>}

            <button type="submit" disabled={loading || !isLoaded} style={s.btn}>
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>

          <p style={s.footer}>
            <button onClick={() => { setStage('signin'); setError('') }} style={s.backBtn}>
              ← Back to sign in
            </button>
          </p>
        </div>
      </div>
    )
  }

  if (stage === 'reset') {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.title}>Set new password</h1>
          <p style={s.sub}>
            Check <strong>{email}</strong> for a 6-digit code.
          </p>

          <form onSubmit={handleReset} style={s.form}>
            <label style={s.label}>
              Reset code
              <input
                type="text" required inputMode="numeric" maxLength={6} autoFocus
                value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                style={{ ...s.input, letterSpacing: '0.25em', fontSize: '1.25rem', textAlign: 'center' }}
                placeholder="000000"
              />
            </label>

            <label style={s.label}>
              New password
              <input
                type="password" required minLength={8} autoComplete="new-password"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                style={s.input} placeholder="Min. 8 characters"
              />
            </label>

            <label style={s.label}>
              Confirm new password
              <input
                type="password" required autoComplete="new-password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                style={s.input} placeholder="Re-enter password"
              />
            </label>

            {error && <p style={s.error}>{error}</p>}

            <button type="submit" disabled={loading || !isLoaded} style={s.btn}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>

          <p style={s.footer}>
            <button onClick={() => { setStage('forgot'); setError(''); setResetCode('') }} style={s.backBtn}>
              ← Resend code
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Sign in</h1>
        <p style={s.sub}>Welcome back to Team Scheduler</p>

        <form onSubmit={handleSignIn} style={s.form}>
          <label style={s.label}>
            Email
            <input
              type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              style={s.input} placeholder="you@example.com"
            />
          </label>

          <label style={s.label}>
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Password
              <button
                type="button"
                onClick={() => { setStage('forgot'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#667eea', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
              >
                Forgot password?
              </button>
            </span>
            <input
              type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              style={s.input} placeholder="••••••••"
            />
          </label>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={loading || !isLoaded} style={s.btn}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={s.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" style={s.link}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1rem' },
  card:    { background: 'white', borderRadius: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2.5rem 2rem', width: '100%', maxWidth: '400px' },
  title:   { fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1e293b' },
  sub:     { color: '#64748b', fontSize: '0.9rem', marginBottom: '1.75rem' },
  form:    { display: 'flex', flexDirection: 'column', gap: '1.125rem' },
  label:   { display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' },
  input:   { padding: '0.625rem 0.875rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', fontFamily: 'inherit', color: '#1e293b' },
  error:   { color: '#ef4444', fontSize: '0.85rem', margin: 0 },
  btn:     { marginTop: '0.25rem', padding: '0.75rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' },
  footer:  { marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' },
  link:    { color: '#667eea', fontWeight: 600 },
  backBtn: { background: 'none', border: 'none', color: '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
}
