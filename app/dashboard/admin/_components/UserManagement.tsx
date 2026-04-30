'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type User = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  imageUrl: string
  createdAt: number
  lastSignInAt: number | null
  displayName: string | null
  team: string | null
  role: string | null
  isTeamLead: boolean
}

function fmtDate(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtRelative(ts: number | null) {
  if (!ts) return 'Never'
  const diff = Date.now() - ts
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.email?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      u.team?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    )
  })

  if (loading) return <p style={{ color: '#64748b' }}>Loading users…</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 800 }}>
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total accounts', value: users.length },
          { label: 'With profiles', value: users.filter(u => u.displayName || u.team).length },
          { label: 'Team leads', value: users.filter(u => u.isTeamLead).length },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', minWidth: 120 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, email, team, or role…"
        style={{
          padding: '0.625rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.875rem',
          border: '1px solid #e2e8f0', background: 'white', outline: 'none',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      />

      {/* User list */}
      <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
            {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <p style={{ padding: '1.5rem', color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>No users match your search.</p>
        ) : (
          filtered.map((u, i) => {
            const name = u.displayName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Unknown'
            const isOpen = expanded === u.id

            return (
              <div key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                {/* Row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : u.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.875rem 1.25rem', cursor: 'pointer',
                    transition: 'background 0.1s',
                    background: isOpen ? '#f8fafc' : 'transparent',
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0, width: 36, height: 36 }}>
                    <Image
                      src={u.imageUrl}
                      alt={name}
                      width={36}
                      height={36}
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                    />
                    {u.isTeamLead && (
                      <span style={{
                        position: 'absolute', bottom: -2, right: -2,
                        background: '#fbbf24', borderRadius: '50%',
                        width: 14, height: 14, fontSize: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1.5px solid white',
                      }}>⭐</span>
                    )}
                  </div>

                  {/* Name / email */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </div>
                  </div>

                  {/* Team badge */}
                  {u.team ? (
                    <span style={{ flexShrink: 0, background: '#ede9fe', color: '#6d28d9', borderRadius: '999px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>
                      {u.team}
                    </span>
                  ) : (
                    <span style={{ flexShrink: 0, background: '#f1f5f9', color: '#94a3b8', borderRadius: '999px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>
                      No team
                    </span>
                  )}

                  {/* Last active */}
                  <span style={{ flexShrink: 0, fontSize: '0.75rem', color: '#94a3b8', minWidth: 64, textAlign: 'right' }}>
                    {fmtRelative(u.lastSignInAt)}
                  </span>

                  {/* Chevron */}
                  <svg
                    style={{ flexShrink: 0, color: '#cbd5e1', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                    width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding: '0.75rem 1.25rem 1rem 4.25rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Clerk ID', value: u.id },
                      { label: 'Role', value: u.role || '—' },
                      { label: 'Team Lead', value: u.isTeamLead ? 'Yes ⭐' : 'No' },
                      { label: 'Joined', value: fmtDate(u.createdAt) },
                      { label: 'Last sign-in', value: fmtDate(u.lastSignInAt) },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{f.label}</div>
                        <div style={{ fontSize: '0.8rem', color: '#1e293b', fontFamily: f.label === 'Clerk ID' ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
