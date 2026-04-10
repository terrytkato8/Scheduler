'use client'

import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, FormEvent } from 'react'

type Stage = 'details' | 'verify'

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('details')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      await signUp.create({ emailAddress: email, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStage('verify')
    } catch (err: unknown) {
      const e = err as { errors?: { message: string }[] }
      setError(e.errors?.[0]?.message ?? 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      const e = err as { errors?: { message: string }[] }
      setError(e.errors?.[0]?.message ?? 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {stage === 'details' ? (
          <>
            <h1 style={styles.title}>Create account</h1>
            <p style={styles.sub}>Join Team Scheduler</p>

            <form onSubmit={handleSignUp} style={styles.form}>
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
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={styles.input}
                  placeholder="Min. 8 characters"
                />
              </label>

              {error && <p style={styles.error}>{error}</p>}

              <button type="submit" disabled={loading || !isLoaded} style={styles.btn}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p style={styles.footer}>
              Already have an account?{' '}
              <Link href="/sign-in" style={styles.link}>Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Check your email</h1>
            <p style={styles.sub}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>

            <form onSubmit={handleVerify} style={styles.form}>
              <label style={styles.label}>
                Verification code
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  style={{ ...styles.input, letterSpacing: '0.25em', fontSize: '1.25rem', textAlign: 'center' }}
                  placeholder="000000"
                  autoFocus
                />
              </label>

              {error && <p style={styles.error}>{error}</p>}

              <button type="submit" disabled={loading || !isLoaded} style={styles.btn}>
                {loading ? 'Verifying…' : 'Verify email'}
              </button>
            </form>

            <p style={styles.footer}>
              <button
                onClick={() => { setStage('details'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}
              >
                ← Back
              </button>
            </p>
          </>
        )}
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
