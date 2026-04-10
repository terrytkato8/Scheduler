'use client'

import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, FormEvent } from 'react'

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      const e = err as { errors?: { message: string }[] }
      setError(e.errors?.[0]?.message ?? 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.sub}>Welcome back to Team Scheduler</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading || !isLoaded} style={styles.btn}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" style={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    padding: '1rem',
  },
  card: {
    background: 'white',
    borderRadius: '1rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    marginBottom: '0.25rem',
    color: '#1e293b',
  },
  sub: {
    color: '#64748b',
    fontSize: '0.9rem',
    marginBottom: '1.75rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.125rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '0.625rem 0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
    color: '#1e293b',
  },
  error: {
    color: '#ef4444',
    fontSize: '0.85rem',
    margin: 0,
  },
  btn: {
    marginTop: '0.25rem',
    padding: '0.75rem',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    fontFamily: 'inherit',
  },
  footer: {
    marginTop: '1.25rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  link: {
    color: '#667eea',
    fontWeight: 600,
  },
}
