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
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    fetch('/api/team-availability')
      .then(r => r.json())
      .then(d => { setMembers(d.members ?? []); setLoading(false) })
      .catch(() => { setError('Failed to load team data.'); setLoading(false) })
  }, [])

  if (loading) return <p style={{ color: '#64748b' }}>Loading team data…</p>
  if (error) return <p style={{ color: '#ef4444' }}>{error}</p>

  const teams = ['all', ...Array.from(new Set(members.map(m => m.team).filter(Boolean) as string[])).sort()]

  // Team-filtered members
  const teamFiltered = selectedTeam === 'all'
    ? members
    : members.filter(m => m.team === selectedTeam)

  // Individual-filtered members (final display set)
  const filtered = selectedMember
    ? teamFiltered.filter(m => m.user_id === selectedMember)
    : teamFiltered

  const colorMap = new Map(members.map((m, i) => [m.user_id, PALETTE[i % PALETTE.length]]))

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

  const selectTeam = (t: string) => {
    setSelectedTeam(t)
    setSelectedMember(null)
  }

  const selectMember = (uid: string) => {
    setSelectedMember(prev => prev === uid ? null : uid)
  }

  const viewingLabel = selectedMember
    ? (members.find(m => m.user_id === selectedMember)?.display_name ?? 'Member')
    : selectedTeam === 'all' ? 'All Teams' : selectedTeam

  return (
    <div>
      {/* ── Level 1: Team filter ── */}
      <div style={{ marginBottom: '0.625rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 48 }}>Team</span>
          {teams.map(t => (
            <button
              key={t}
              onClick={() => selectTeam(t)}
              style={{
                padding: '0.3rem 0.875rem', borderRadius: '999px', border: 'none',
                fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
                background: selectedTeam === t && !selectedMember ? '#667eea' : selectedTeam === t ? '#667eea22' : '#f1f5f9',
                color: selectedTeam === t && !selectedMember ? 'white' : selectedTeam === t ? '#667eea' : '#475569',
                outline: selectedTeam === t ? '2px solid #667eea40' : 'none',
                transition: 'all 0.12s',
              }}
            >
              {t === 'all' ? 'All Teams' : t}
              <span style={{ marginLeft: '0.3rem', fontSize: '0.68rem', opacity: 0.65 }}>
                {t === 'all' ? members.length : members.filter(m => m.team === t).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Level 2: Member filter ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 48 }}>Member</span>
          <button
            onClick={() => setSelectedMember(null)}
            style={{
              padding: '0.25rem 0.75rem', borderRadius: '999px', border: 'none',
              fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
              background: !selectedMember ? '#1e293b' : '#f1f5f9',
              color: !selectedMember ? 'white' : '#475569',
              transition: 'all 0.12s',
            }}
          >
            All
          </button>
          {teamFiltered.map(m => {
            const color = colorMap.get(m.user_id)!
            const isSelected = selectedMember === m.user_id
            return (
              <button
                key={m.user_id}
                onClick={() => selectMember(m.user_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.25rem 0.75rem', borderRadius: '999px',
                  border: `2px solid ${isSelected ? color : 'transparent'}`,
                  background: isSelected ? color + '18' : '#f1f5f9',
                  color: isSelected ? color : '#475569',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.12s',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {m.display_name || 'Team Member'}
                {m.team_lead_approved && <span style={{ fontSize: '0.65rem' }}>⭐</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Breadcrumb / viewing label ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.875rem', fontSize: '0.8rem', color: '#64748b' }}>
        <span style={{ fontWeight: 600, color: '#1e293b' }}>Viewing:</span>
        {selectedTeam !== 'all' && (
          <>
            <button onClick={() => selectTeam('all')} style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0, fontFamily: 'inherit' }}>
              All Teams
            </button>
            <span style={{ color: '#cbd5e1' }}>›</span>
            <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', color: selectedMember ? '#667eea' : '#1e293b', fontWeight: 600, cursor: selectedMember ? 'pointer' : 'default', fontSize: '0.8rem', padding: 0, fontFamily: 'inherit' }}>
              {selectedTeam}
            </button>
          </>
        )}
        {selectedMember && selectedTeam === 'all' && (
          <>
            <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0, fontFamily: 'inherit' }}>
              All Teams
            </button>
            <span style={{ color: '#cbd5e1' }}>›</span>
          </>
        )}
        {selectedMember && (
          <>
            {selectedTeam !== 'all' && <span style={{ color: '#cbd5e1' }}>›</span>}
            <span style={{ fontWeight: 700, color: '#1e293b' }}>{viewingLabel}</span>
          </>
        )}
        {!selectedMember && selectedTeam === 'all' && (
          <span style={{ fontWeight: 700, color: '#1e293b' }}>All Teams</span>
        )}
        {!selectedMember && selectedTeam !== 'all' && (
          <span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedTeam}</span>
        )}
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.72rem' }}>
          {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '0.75rem', padding: '3rem 2rem',
          textAlign: 'center', border: '1px dashed #cbd5e1',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📅</div>
          <p style={{ color: '#475569', fontWeight: 600, marginBottom: '0.5rem' }}>No availability saved yet</p>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Team members need to save their availability in <strong>My Availability</strong> for it to appear here.
          </p>
        </div>
      ) : (
        <>
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
            <div
              style={{
                position: 'fixed', pointerEvents: 'none', zIndex: 50,
                left: tooltipPos.x + 14, top: tooltipPos.y - 10,
                background: '#1e293b', color: 'white', borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem', fontSize: '0.78rem', maxWidth: 220,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
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
                              onMouseEnter={e => { setHovered(key); setTooltipPos({ x: e.clientX, y: e.clientY }) }}
                              onMouseMove={e => setTooltipPos({ x: e.clientX, y: e.clientY })}
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
        </>
      )}
    </div>
  )
}
