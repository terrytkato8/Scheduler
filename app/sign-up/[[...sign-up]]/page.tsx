'use client'

import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import React, { useState } from 'react'

type Stage = 'details' | 'verify' | 'profile'

const TEAMS = ['Corebound', 'Last Light', 'BBCU', 'Studio']
const ROLES = ['Designer', 'Engineer', 'Artist', 'Sound Designer', 'Other']

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('details')

  // Stage 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Stage 2
  const [code, setCode] = useState('')

  // Stage 3
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('')
  const [teams, setTeams] = useState<string[]>([])
  const [discordUsername, setDiscordUsername] = useState('')
  const [discordUserId, setDiscordUserId] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleTeam = (t: string) =>
    setTeams(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        setStage('profile')
      }
    } catch (err: unknown) {
      const e = err as { errors?: { message: string }[] }
      setError(e.errors?.[0]?.message ?? 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          role: role || null,
          teams,
          discord_username: discordUsername.trim() || null,
          discord_user_id: discordUserId.trim() || null,
        }),
      })
      router.push('/dashboard')
    } catch {
      setError('Could not save profile. You can update it later in My Profile.')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (stage === 'details') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <StepDots current={0} />
          <h1 style={styles.title}>Create account</h1>
          <p style={styles.sub}>Join Kato.8 Team Scheduler</p>

          <form onSubmit={handleSignUp} style={styles.form}>
            <label style={styles.label}>
              Email
              <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} placeholder="you@example.com" />
            </label>
            <label style={styles.label}>
              Password
              <input type="password" required autoComplete="new-password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} style={styles.input} placeholder="Min. 8 characters" />
            </label>

            {/* Required by Clerk Smart CAPTCHA */}
            <div id="clerk-captcha" />

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" disabled={loading || !isLoaded} style={styles.btn}>
              {loading ? 'Creating account…' : 'Continue →'}
            </button>
          </form>

          <p style={styles.footer}>
            Already have an account?{' '}
            <Link href="/sign-in" style={styles.link}>Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  if (stage === 'verify') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <StepDots current={1} />
          <h1 style={styles.title}>Check your email</h1>
          <p style={styles.sub}>We sent a 6-digit code to <strong>{email}</strong></p>

          <form onSubmit={handleVerify} style={styles.form}>
            <label style={styles.label}>
              Verification code
              <input
                type="text" required inputMode="numeric" maxLength={6}
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                style={{ ...styles.input, letterSpacing: '0.25em', fontSize: '1.25rem', textAlign: 'center' }}
                placeholder="000000" autoFocus
              />
            </label>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" disabled={loading || !isLoaded} style={styles.btn}>
              {loading ? 'Verifying…' : 'Verify email →'}
            </button>
          </form>

          <p style={styles.footer}>
            <button onClick={() => { setStage('details'); setError('') }} style={styles.backBtn}>
              ← Back
            </button>
          </p>
        </div>
      </div>
    )
  }

  // Stage 3: profile setup
  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, maxWidth: 460 }}>
        <StepDots current={2} />
        <h1 style={styles.title}>Set up your profile</h1>
        <p style={styles.sub}>Tell your team who you are. You can always update this later.</p>

        <form onSubmit={handleProfile} style={styles.form}>
          <label style={styles.label}>
            Display name
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} style={styles.input} placeholder="Your full name" autoFocus />
          </label>

          <label style={styles.label}>
            Role
            <select value={role} onChange={e => setRole(e.target.value)} style={styles.input}>
              <option value="">— Select a role —</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>

          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Team(s)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {TEAMS.map(t => {
                const sel = teams.includes(t)
                return (
                  <button key={t} type="button" onClick={() => toggleTeam(t)} style={{
                    padding: '0.35rem 0.875rem', borderRadius: '999px', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600,
                    border: sel ? '2px solid #667eea' : '1px solid #e2e8f0',
                    background: sel ? '#eef2ff' : 'white',
                    color: sel ? '#4338ca' : '#475569',
                  }}>
                    {sel && '✓ '}{t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Discord — optional */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.875rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🎮</span> Discord <span style={{ fontWeight: 400, color: '#94a3b8' }}>— optional, for meeting alerts</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <label style={styles.label}>
                Discord username
                <input type="text" value={discordUsername} onChange={e => setDiscordUsername(e.target.value)} style={styles.input} placeholder="your username (no @ needed)" />
              </label>
              <label style={styles.label}>
                Discord user ID
                <input type="text" value={discordUserId} onChange={e => setDiscordUserId(e.target.value)} style={styles.input} placeholder="e.g. 123456789012345678" />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>
                  Enables @mention pings. Right-click your name in Discord with Developer Mode on.
                </span>
              </label>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Saving…' : 'Go to dashboard →'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  )
}

function StepDots({ current }: { current: number }) {
  const labels = ['Account', 'Verify', 'Profile']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '1.5rem' }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < current ? '#667eea' : i === current ? '#667eea' : '#e2e8f0',
              color: i <= current ? 'white' : '#94a3b8',
              fontSize: '0.75rem', fontWeight: 700,
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.65rem', color: i === current ? '#667eea' : '#94a3b8', fontWeight: i === current ? 700 : 400 }}>
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div style={{ width: 40, height: 2, background: i < current ? '#667eea' : '#e2e8f0', marginBottom: 16, marginLeft: 2, marginRight: 2 }} />
          )}
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1rem' },
  card: { background: 'white', borderRadius: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2.5rem 2rem', width: '100%', maxWidth: '400px' },
  title: { fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1e293b' },
  sub: { color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' },
  input: { padding: '0.625rem 0.875rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', color: '#1e293b' },
  error: { color: '#ef4444', fontSize: '0.85rem', margin: 0 },
  btn: { marginTop: '0.25rem', padding: '0.75rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' },
  footer: { marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' },
  link: { color: '#667eea', fontWeight: 600 },
  backBtn: { background: 'none', border: 'none', color: '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
}
