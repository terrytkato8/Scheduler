'use client'

import { useEffect, useState } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7)
const MINS = [0, 15, 30, 45]
const PALETTE = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#84cc16']

function fmt(h: number, m: number) {
  const ap = h < 12 ? 'am' : 'pm'
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hh}${ap}` : `${hh}:${String(m).padStart(2, '0')}${ap}`
}

interface Member {
  user_id: string
  display_name: string | null
  available_slots: string[]
  busy_slots: string[]
  team: string | null
  role: string | null
  team_lead_approved: boolean
}

export default function TeamCalendar() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/team-availability')
      .then(r => r.json())
      .then(d => { setMembers(d.members ?? []); setLoading(false) })
      .catch(() => { setError('Failed to load team data.'); setLoading(false) })
  }, [])

  if (loading) return <p style={{ color: '#64748b' }}>Loading team data…</p>
  if (error) return <p style={{ color: '#ef4444' }}>{error}</p>

  // Derive unique teams
  const teams = ['all', ...Array.from(new Set(members.map(m => m.team).filter(Boolean) as string[])).sort()]

  const filtered = selectedTeam === 'all'
    ? members
    : members.filter(m => m.team === selectedTeam)

  // Assign colors consistently by user_id order
  const colorMap = new Map(members.map((m, i) => [m.user_id, PALETTE[i % PALETTE.length]]))

  // slot → [{ name, color, type }]
  const slotData = new Map<string, { name: string; color: string; type: 'available' | 'busy' }[]>()
  for (const m of filtered) {
    const name = m.display_name || 'Team Member'
    const color = colorMap.get(m.user_id)!
    for (const slot of (m.available_slots ?? [])) {
      if (!slotData.has(slot)) slotData.set(slot, [])
      slotData.get(slot)!.push({ name, color, type: 'available' })
    }
    for (const slot of (m.busy_slots ?? [])) {
      if (!slotData.has(slot)) slotData.set(slot, [])
      slotData.get(slot)!.push({ name, color, type: 'busy' })
    }
  }

  return (
    <div>
      {/* Team filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginRight: '0.25rem' }}>Team:</span>
        {teams.map(t => (
          <button
            key={t}
            onClick={() => setSelectedTeam(t)}
            style={{
              padding: '0.3rem 0.875rem', borderRadius: '999px', border: 'none',
              fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
              background: selectedTeam === t ? '#667eea' : '#f1f5f9',
              color: selectedTeam === t ? 'white' : '#475569',
              transition: 'all 0.12s',
              textTransform: t === 'all' ? 'none' : 'capitalize',
            }}
          >
            {t === 'all' ? 'All teams' : t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '0.75rem', padding: '3rem 2rem',
          textAlign: 'center', border: '1px dashed #cbd5e1',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📅</div>
          <p style={{ color: '#475569', fontWeight: 600, marginBottom: '0.5rem' }}>
            No availability saved yet
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Team members need to save their availability in <strong>My Availability</strong> for it to appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Member legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {filtered.map(m => (
              <span
                key={m.user_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.78rem', color: '#475569',
                  background: 'white', padding: '0.3rem 0.625rem',
                  borderRadius: '999px', border: '1px solid #e2e8f0',
                  cursor: 'default',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: colorMap.get(m.user_id), display: 'inline-block', flexShrink: 0 }} />
                {m.display_name || 'Team Member'}
                {m.team_lead_approved && (
                  <span title="Team Lead" style={{ fontSize: '0.7rem', marginLeft: '2px' }}>⭐</span>
                )}
                {m.role && (
                  <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>· {m.role}</span>
                )}
              </span>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.72rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 20, height: 10, borderRadius: 2, background: 'linear-gradient(90deg, #86efac 50%, #fca5a5 50%)', display: 'inline-block', border: '1px solid #e2e8f0' }} />
              Green = available · Red = busy
            </span>
            <span style={{ color: '#94a3b8' }}>Hover a slot to see names</span>
          </div>

          {/* Tooltip */}
          {hovered && slotData.has(hovered) && (
            <div style={{
              position: 'fixed', pointerEvents: 'none', zIndex: 50,
              background: '#1e293b', color: 'white', borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem', fontSize: '0.78rem', maxWidth: 220,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
              id="tt"
            >
              {slotData.get(hovered)!.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: w.color, flexShrink: 0 }} />
                  <span>{w.name}</span>
                  <span style={{ color: w.type === 'available' ? '#86efac' : '#fca5a5', marginLeft: 'auto', fontSize: '0.68rem' }}>
                    {w.type}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          <div style={{ overflowX: 'auto', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', background: 'white' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '520px', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ width: 58, padding: '0.625rem 0.625rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#94a3b8', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Time
                  </th>
                  {DAYS.map(d => (
                    <th key={d} style={{ padding: '0.625rem 0', borderBottom: '2px solid #e2e8f0', textAlign: 'center', color: '#475569', fontSize: '0.78rem', fontWeight: 600 }}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.flatMap(hour =>
                  MINS.map(min => {
                    const isHourEnd = min === 45
                    return (
                      <tr key={`${hour}-${min}`}>
                        <td style={{
                          padding: '0 0.625rem', height: 13,
                          fontSize: '0.63rem', color: '#94a3b8', whiteSpace: 'nowrap',
                          borderRight: '1px solid #f1f5f9',
                          borderBottom: isHourEnd ? '1px solid #c8d3de' : '1px solid #f1f5f9',
                          background: min === 0 ? '#fafcff' : 'transparent',
                        }}>
                          {min === 0 ? fmt(hour, 0) : ''}
                        </td>
                        {DAYS.map((_, di) => {
                          const key = `${di}-${hour}-${min}`
                          const who = slotData.get(key)
                          const available = who?.filter(w => w.type === 'available') ?? []
                          const busyPeople = who?.filter(w => w.type === 'busy') ?? []
                          return (
                            <td
                              key={di}
                              style={{ height: 13, padding: '1px', borderBottom: isHourEnd ? '1px solid #c8d3de' : '1px solid #f8fafc' }}
                              onMouseEnter={() => setHovered(key)}
                              onMouseLeave={() => setHovered(null)}
                            >
                              {(available.length > 0 || busyPeople.length > 0) && (
                                <div style={{ display: 'flex', height: '100%', gap: '1px', borderRadius: '2px', overflow: 'hidden' }}>
                                  {available.map((w, i) => (
                                    <div key={`a${i}`} style={{ flex: 1, background: w.color, opacity: 0.75, minWidth: 0 }} />
                                  ))}
                                  {busyPeople.map((_w, i) => (
                                    <div key={`b${i}`} style={{ flex: 1, background: '#fca5a5', opacity: 0.85, minWidth: 0, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)` }} />
                                  ))}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: '0.625rem', fontSize: '0.72rem', color: '#94a3b8' }}>
            {filtered.length} member{filtered.length !== 1 ? 's' : ''}
            {selectedTeam !== 'all' ? ` on team "${selectedTeam}"` : ''}
            &nbsp;— colored slots = available · hatched = busy
          </p>
        </>
      )}
    </div>
  )
}
