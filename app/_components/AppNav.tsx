'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AppNav() {
  const pathname = usePathname()
  const onScheduler = !pathname.startsWith('/projects')
  const onProjects = pathname.startsWith('/projects')

  return (
    <div style={{
      height: '44px',
      background: '#0f172a',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1rem',
      gap: '0.25rem',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 200,
    }}>
      {/* Brand */}
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: '1rem' }}>
        Kato
      </span>

      {/* Section tabs */}
      <NavTab href="/dashboard" label="Scheduler" active={onScheduler} />
      <NavTab href="/projects" label="Projects" active={onProjects} />
    </div>
  )
}

function NavTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        padding: '0.3rem 0.875rem',
        borderRadius: '0.375rem',
        fontSize: '0.82rem',
        fontWeight: active ? 600 : 400,
        color: active ? 'white' : 'rgba(255,255,255,0.45)',
        background: active ? 'rgba(102,126,234,0.25)' : 'transparent',
        textDecoration: 'none',
        border: active ? '1px solid rgba(102,126,234,0.4)' : '1px solid transparent',
        transition: 'all 0.1s',
      }}
    >
      {label}
    </Link>
  )
}
