import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
        Team Scheduler
      </h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2.5rem', opacity: 0.9, maxWidth: '480px' }}>
        Coordinate your team&apos;s availability and plan the week without the back-and-forth.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/sign-in"
          style={{
            padding: '0.75rem 2rem',
            background: 'white',
            color: '#764ba2',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            transition: 'opacity 0.15s',
          }}
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          style={{
            padding: '0.75rem 2rem',
            background: 'transparent',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.7)',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          Get Started
        </Link>
      </div>
    </main>
  )
}
