'use client'

import { useEffect, useState } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7)
const COLORS = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

function fmtHour(h: number) {
  if (h === 12) return '12 pm'
  return h < 12 ? `${h} am` : `${h - 12} pm`
}

interface Member {
  user_id: string
  display_name: string | null
  slots: string[]
}

export default function TeamCalendar() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/team-availability')
      .then(r => r.json())
      .then(d => { setMembers(d.members ?? []); setLoading(false) })
      .catch(() => { setError('Failed to load team data.'); setLoading(false) })
  }, [])

  if (loading) return <p style={{ color: '#64748b' }}>Loading team data…</p>
  if (error)   return <p style={{ color: '#ef4444' }}>{error}</p>

  if (members.length === 0) return (
    <div style={{ background: 'white', borderRadius: '0.75rem', padding: '3rem 2rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <p style={{ color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>No team data yet</p>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
        Ask your teammates to save their availability in My Availability.
      </p>
    </div>
  )

  // slot key → list of { name, color }
  const slotMap = new Map<string, { name: string; color: string }[]>()
  members.forEach((m, i) => {
    const color = COLORS[i % COLORS.length]
    const name = m.display_name || `Member ${i + 1}`;
    (m.slots || []).forEach(slot => {
      if (!slotMap.has(slot)) slotMap.set(slot, [])
      slotMap.get(slot)!.push({ name, color })
    })
  })

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {members.map((m, i) => (
          <span key={m.user_id} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.8rem', color: '#475569',
            background: 'white', padding: '0.3rem 0.75rem',
            borderRadius: '999px', border: '1px solid #e2e8f0',
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block', flexShrink: 0 }} />
            {m.display_name || `Member ${i + 1}`}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', background: 'white' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '540px' }}>
          <thead>
            <tr>
              <th style={{ width: 64, padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }} />
              {DAYS.map(d => (
                <th key={d} style={{ padding: '0.75rem 0.25rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center', color: '#475569', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.04em' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, ri) => (
              <tr key={hour} style={{ background: ri % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '0.375rem 1rem', color: '#94a3b8', fontSize: '0.75rem', whiteSpace: 'nowrap', borderRight: '1px solid #f1f5f9' }}>
                  {fmtHour(hour)}
                </td>
                {DAYS.map((_, di) => {
                  const who = slotMap.get(`${di}-${hour}`) || []
                  return (
                    <td key={di} style={{ padding: '2px', height: '32px' }}>
                      {who.length > 0 && (
                        <div
                          title={who.map(w => w.name).join(', ')}
                          style={{ display: 'flex', height: '100%', gap: '1px', borderRadius: '3px', overflow: 'hidden' }}
                        >
                          {who.map((w, i) => (
                            <div key={i} style={{ flex: 1, background: w.color, opacity: 0.82, minWidth: 0 }} />
                          ))}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
        {members.length} member{members.length !== 1 ? 's' : ''} &mdash; hover a colored slot to see who&apos;s available
      </p>
    </div>
  )
}
