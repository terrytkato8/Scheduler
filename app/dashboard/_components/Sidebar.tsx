'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const GridIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)

const UsersIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const CalIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const NAV = [
  { href: '/dashboard/availability', label: 'My Availability', Icon: GridIcon },
  { href: '/dashboard/team',         label: 'Team Calendar',   Icon: UsersIcon },
  { href: '/dashboard/calendar',     label: 'My Calendar',     Icon: CalIcon },
]

export default function Sidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '232px',
      minHeight: '100vh',
      background: '#1e293b',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {/* Brand */}
      <div style={{ padding: '1.375rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
          Team Scheduler
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0.625rem 0.625rem', flex: 1, overflowY: 'auto' }}>
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '2px',
                color: active ? 'white' : 'rgba(255,255,255,0.52)',
                background: active ? 'rgba(102,126,234,0.28)' : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'all 0.12s',
              }}
            >
              <span style={{ color: active ? '#a5b4fc' : 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                <Icon />
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: '0.875rem 1.25rem',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
      }}>
        <UserButton afterSignOutUrl="/" />
        <span style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.8rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {displayName}
        </span>
      </div>
    </aside>
  )
}
