'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)
const TicketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
  </svg>
)
const DocIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)
const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const NAV = [
  { href: '/dashboard/availability', label: 'My Availability', Icon: GridIcon },
  { href: '/dashboard/team',         label: 'Team Calendar',   Icon: UsersIcon },
  { href: '/dashboard/calendar',     label: 'My Calendar',     Icon: CalIcon },
  { href: '/dashboard/profile',      label: 'My Profile',      Icon: UserIcon },
]

const WORK_NAV = [
  { href: '/projects', label: 'Projects', Icon: FolderIcon },
  { href: '/docs',     label: 'Docs',     Icon: DocIcon },
]

export default function Sidebar({ displayName, isAdmin }: { displayName: string; isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '228px', background: '#1e293b',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'sticky', top: 0, height: 'calc(100vh - 52px)',
    }}>
      {/* Brand */}
      <div style={{ padding: '1.25rem 1.25rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
          Team Scheduler
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0.5rem 0.5rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0.375rem 0.75rem 0.2rem', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Personal
        </div>
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return <NavLink key={href} href={href} label={label} Icon={Icon} active={active} />
        })}

        <div style={{ padding: '0.625rem 0.75rem 0.2rem', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
          Studio
        </div>
        {WORK_NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return <NavLink key={href} href={href} label={label} Icon={Icon} active={active} />
        })}

        {isAdmin && (
          <>
            <div style={{ padding: '0.625rem 0.75rem 0.2rem', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
              Admin
            </div>
            <NavLink
              href="/dashboard/admin"
              label="Lead Requests"
              Icon={ShieldIcon}
              active={pathname.startsWith('/dashboard/admin')}
            />
            <NavLink
              href="/settings"
              label="Settings"
              Icon={GearIcon}
              active={pathname.startsWith('/settings')}
            />
          </>
        )}
      </nav>

      {/* User */}
      <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <UserButton />
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>
      </div>
    </aside>
  )
}

function NavLink({ href, label, Icon, active }: { href: string; label: string; Icon: () => React.JSX.Element; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.575rem 0.75rem', borderRadius: '0.5rem', marginBottom: '2px',
        color: active ? 'white' : 'rgba(255,255,255,0.5)',
        background: active ? 'rgba(102,126,234,0.28)' : 'transparent',
        fontWeight: active ? 600 : 400, fontSize: '0.875rem', textDecoration: 'none',
        transition: 'all 0.1s',
      }}
    >
      <span style={{ color: active ? '#a5b4fc' : 'rgba(255,255,255,0.32)', flexShrink: 0 }}>
        <Icon />
      </span>
      {label}
    </Link>
  )
}
