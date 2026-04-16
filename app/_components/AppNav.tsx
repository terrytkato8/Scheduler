'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function AppNav() {
  const pathname = usePathname()
  const onProjects  = pathname.startsWith('/projects')
  const onDocs      = pathname.startsWith('/docs')
  const onScheduler = !onProjects && !onDocs

  return (
    <div style={{
      height: '52px',
      background: '#0d0d14',
      borderBottom: '1px solid rgba(232,93,123,0.15)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1rem',
      gap: '0',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 200,
    }}>
      {/* Brand */}
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginRight: '1.5rem' }}>
        <Image
          src="/art/avatar.png"
          alt="Kato.8"
          width={28}
          height={28}
          style={{ imageRendering: 'pixelated' }}
        />
        <span style={{
          fontWeight: 800,
          fontSize: '0.95rem',
          letterSpacing: '-0.01em',
          background: 'linear-gradient(135deg, #e85d7b 0%, #ff8fab 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          KATO.8
        </span>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', alignSelf: 'flex-end', marginBottom: '1px' }}>
          Studios
        </span>
      </Link>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', marginRight: '1rem' }} />

      {/* Section tabs */}
      <NavTab href="/dashboard" label="Scheduler" icon="📅" active={onScheduler} />
      <NavTab href="/projects"  label="Projects"  icon="🎯" active={onProjects} />
      <NavTab href="/docs"      label="Docs"      icon="📚" active={onDocs} />
    </div>
  )
}

function NavTab({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.875rem',
        borderRadius: '0.375rem',
        fontSize: '0.8rem',
        fontWeight: active ? 700 : 400,
        color: active ? 'white' : 'rgba(255,255,255,0.4)',
        background: active ? 'rgba(232,93,123,0.18)' : 'transparent',
        textDecoration: 'none',
        border: active ? '1px solid rgba(232,93,123,0.35)' : '1px solid transparent',
        transition: 'all 0.12s',
      }}
    >
      <span style={{ fontSize: '0.75rem' }}>{icon}</span>
      {label}
    </Link>
  )
}
