'use client'

import React, { useState, useEffect } from 'react'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7)
const MINS = [0, 15, 30, 45]

interface Member {
  user_id: string
  display_name: string | null
  role: string | null
  team: string | null
  team_lead_approved: boolean
}

interface Suggestion {
  dayName: string
  startHour: number
  startMin: number
  endHour: number
  endMin: number
  availableCount: number
  totalMembers: number
  label: string
}

interface Props {
  onCreated: () => void
  onCancel: () => void
  initialDate?: string
}

export default function MeetingBooker({ onCreated, onCancel, initialDate }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [guests, setGuests] = useState<string[]>([])
  const [guestFilter, setGuestFilter] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(initialDate ?? '')
  const [startH, setStartH] = useState<number | ''>('')
  const [startM, setStartM] = useState<number>(0)
  const [endH, setEndH] = useState<number | ''>('')
  const [endM, setEndM] = useState<number>(0)
  const [duration, setDuration] = useState(4) // in 15-min slots
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loadingSugg, setLoadingSugg] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/members')
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => {})
  }, [])

  const toggleGuest = (uid: string) =>
    setGuests(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid])

  const findBestTimes = async () => {
    if (guests.length === 0) return
    setLoadingSugg(true)
    setSuggestions([])
    try {
      const params = new URLSearchParams({
        guests: guests.join(','),
        duration: String(duration),
      })
      const res = await fetch(`/api/best-times?${params}`)
      const d = await res.json()
      setSuggestions(d.suggestions ?? [])
    } finally {
      setLoadingSugg(false)
    }
  }

  const applySuggestion = (s: Suggestion) => {
    setStartH(s.startHour)
    setStartM(s.startMin)
    setEndH(s.endHour)
    setEndM(s.endMin)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          date: date || null,
          start_hour: startH || null,
          start_minute: startM,
          end_hour: endH || null,
          end_minute: endM,
          invitee_ids: guests,
        }),
      })
      if (res.ok) onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', maxWidth: 560, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Book a Meeting</h3>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.3rem', lineHeight: 1, padding: 0 }}>&times;</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Title */}
        <label style={lbl}>
          Meeting title *
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sprint planning" style={inp} />
        </label>

        {/* Description */}
        <label style={lbl}>
          Description
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional agenda or notes"
            rows={2}
            style={{ ...inp, resize: 'vertical' }}
          />
        </label>

        {/* Date */}
        <label style={lbl}>
          Date
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
        </label>

        {/* Time */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ ...lbl, flex: 1, minWidth: 120 }}>
            Start time
            <div style={{ display: 'flex', gap: '4px' }}>
              <select value={startH} onChange={e => setStartH(e.target.value ? +e.target.value : '')} style={{ ...inp, flex: 2 }}>
                <option value="">Hour</option>
                {HOURS.map(h => <option key={h} value={h}>{h > 12 ? h - 12 : h}{h < 12 ? 'am' : 'pm'}</option>)}
              </select>
              <select value={startM} onChange={e => setStartM(+e.target.value)} style={{ ...inp, flex: 1 }}>
                {MINS.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
              </select>
            </div>
          </label>
          <label style={{ ...lbl, flex: 1, minWidth: 120 }}>
            End time
            <div style={{ display: 'flex', gap: '4px' }}>
              <select value={endH} onChange={e => setEndH(e.target.value ? +e.target.value : '')} style={{ ...inp, flex: 2 }}>
                <option value="">Hour</option>
                {HOURS.map(h => <option key={h} value={h}>{h > 12 ? h - 12 : h}{h < 12 ? 'am' : 'pm'}</option>)}
              </select>
              <select value={endM} onChange={e => setEndM(+e.target.value)} style={{ ...inp, flex: 1 }}>
                {MINS.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
              </select>
            </div>
          </label>
        </div>

        {/* Guest list */}
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
            Invite team members
          </div>
          {members.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No other members have profiles yet.</p>
          ) : (
            <>
              <input
                type="text"
                value={guestFilter}
                onChange={e => setGuestFilter(e.target.value)}
                placeholder="Filter members…"
                style={{ ...inp, marginBottom: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {members.filter(m => {
                const q = guestFilter.toLowerCase()
                return !q || (m.display_name ?? '').toLowerCase().includes(q) || (m.role ?? '').toLowerCase().includes(q) || (m.team ?? '').toLowerCase().includes(q)
              }).map(m => {
                const sel = guests.includes(m.user_id)
                return (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => toggleGuest(m.user_id)}
                    style={{
                      padding: '0.3rem 0.75rem', borderRadius: '999px', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600,
                      border: sel ? '2px solid #667eea' : '1px solid #e2e8f0',
                      background: sel ? '#eef2ff' : 'white',
                      color: sel ? '#4338ca' : '#475569',
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      transition: 'all 0.1s',
                    }}
                  >
                    {sel && <span style={{ color: '#667eea' }}>✓</span>}
                    {m.display_name || 'Member'}
                    {m.team_lead_approved && <span title="Team Lead">⭐</span>}
                  </button>
                )
              })}
            </div>
            </>
          )}
        </div>

        {/* Best times finder */}
        {guests.length > 0 && (
          <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.875rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Find best times</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Duration:</label>
                <select
                  value={duration}
                  onChange={e => setDuration(+e.target.value)}
                  style={{ padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.75rem', fontFamily: 'inherit', color: '#374151' }}
                >
                  {[1, 2, 4, 6, 8].map(d => (
                    <option key={d} value={d}>{d * 15} min</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={findBestTimes}
                  disabled={loadingSugg}
                  style={{ padding: '0.3rem 0.75rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', opacity: loadingSugg ? 0.7 : 1 }}
                >
                  {loadingSugg ? 'Searching…' : 'Suggest'}
                </button>
              </div>
            </div>
            {suggestions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.4rem 0.625rem', background: 'white', border: '1px solid #e2e8f0',
                      borderRadius: '0.375rem', cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'border-color 0.1s',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{s.label}</span>
                    <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 600, marginLeft: '0.5rem', flexShrink: 0 }}>
                      {s.availableCount}/{s.totalMembers} free
                    </span>
                  </button>
                ))}
                <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>Click a suggestion to apply it to the time fields above.</p>
              </div>
            ) : !loadingSugg && (
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Click Suggest to find times when {guests.length === 1 ? 'this person is' : 'everyone is'} available.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.875rem' }}>
          <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.25rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Booking…' : 'Book meeting'}
          </button>
        </div>
      </form>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }
const inp: React.CSSProperties = { padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box' }
