'use client'

import { useEffect, useState, FormEvent } from 'react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DNAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7 am – 9 pm

interface CalEvent {
  id: string
  title: string
  date: string       // YYYY-MM-DD
  start_hour?: number
  end_hour?: number
}

function pad(n: number) { return String(n).padStart(2, '0') }
function toDateStr(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}` }
function fmtHour(h: number) { return h === 12 ? '12 pm' : h < 12 ? `${h} am` : `${h - 12} pm` }
function fmtRange(s?: number, e?: number) {
  if (!s) return ''
  return e ? `${fmtHour(s)} – ${fmtHour(e)}` : fmtHour(s)
}

export default function MonthCalendar({ userId, displayName }: { userId: string; displayName: string }) {
  const now = new Date()
  const [view, setView]   = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [events, setEvents] = useState<CalEvent[]>([])
  const [sel, setSel]     = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [sh, setSh]       = useState<number | ''>('')
  const [eh, setEh]       = useState<number | ''>('')
  const [saving, setSaving] = useState(false)

  const { y, m } = view
  const monthStr = `${y}-${pad(m + 1)}`

  useEffect(() => {
    fetch(`/api/events?month=${monthStr}`)
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .catch(() => {})
  }, [monthStr])

  const firstDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const eventsOn = (ds: string) => events.filter(e => e.date === ds)
  const selEvents = sel ? eventsOn(sel) : []
  const todayStr  = toDateStr(now.getFullYear(), now.getMonth(), now.getDate())

  const prevMonth = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })
  const nextMonth = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 }  : { y: v.y, m: v.m + 1 })

  const addEvent = async (e: FormEvent) => {
    e.preventDefault()
    if (!sel || !title.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), date: sel, start_hour: sh || null, end_hour: eh || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(prev => [...prev, data.event])
        setTitle(''); setSh(''); setEh('')
      }
    } finally { setSaving(false) }
  }

  const deleteEvent = async (id: string) => {
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (res.ok) setEvents(prev => prev.filter(ev => ev.id !== id))
  }

  const selLabel = sel
    ? new Date(sel + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* ── Calendar grid ── */}
      <div style={{ flex: '1 1 420px', minWidth: 0 }}>
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* Month header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
            <button onClick={prevMonth} style={navBtn}>&#8249;</button>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{MONTHS[m]} {y}</span>
            <button onClick={nextMonth} style={navBtn}>&#8250;</button>
          </div>

          {/* Day-name row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #e2e8f0' }}>
            {DNAMES.map(d => (
              <div key={d} style={{ padding: '0.5rem 0', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} style={{ height: 78, borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }} />
              const ds = toDateStr(y, m, day)
              const dayEvs = eventsOn(ds)
              const isToday = ds === todayStr
              const isSel   = ds === sel
              return (
                <div
                  key={idx}
                  onClick={() => setSel(isSel ? null : ds)}
                  style={{
                    height: 78, padding: '0.375rem',
                    borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer', overflow: 'hidden',
                    background: isSel ? '#eef2ff' : 'white',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '0.2rem',
                    background: isToday ? '#667eea' : 'transparent',
                    color: isToday ? 'white' : isSel ? '#667eea' : '#475569',
                    fontWeight: isToday || isSel ? 700 : 400,
                    fontSize: '0.78rem',
                  }}>
                    {day}
                  </div>
                  {dayEvs.slice(0, 2).map(ev => (
                    <div key={ev.id} style={{
                      fontSize: '0.66rem', background: '#667eea', color: 'white',
                      borderRadius: '3px', padding: '1px 4px', marginBottom: '2px',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvs.length > 2 && <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>+{dayEvs.length - 2} more</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Side panel ── */}
      <div style={{ flex: '0 0 268px', minWidth: '220px' }}>
        {sel ? (
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>{selLabel}</h3>

            {/* Existing events */}
            {selEvents.length === 0
              ? <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1rem' }}>No events</p>
              : (
                <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selEvents.map(ev => (
                    <div key={ev.id} style={{
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      background: '#f8fafc', borderRadius: '0.5rem', padding: '0.5rem 0.625rem', gap: '0.5rem',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{ev.title}</div>
                        {ev.start_hour && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{fmtRange(ev.start_hour, ev.end_hour)}</div>}
                      </div>
                      <button onClick={() => deleteEvent(ev.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1, padding: 0, flexShrink: 0 }}>&times;</button>
                    </div>
                  ))}
                </div>
              )
            }

            {/* Add form */}
            <form onSubmit={addEvent} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <input
                required
                type="text"
                placeholder="Event title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select value={sh} onChange={e => setSh(e.target.value ? +e.target.value : '')} style={selStyle}>
                  <option value="">Start</option>
                  {HOURS.map(h => <option key={h} value={h}>{fmtHour(h)}</option>)}
                </select>
                <select value={eh} onChange={e => setEh(e.target.value ? +e.target.value : '')} style={selStyle}>
                  <option value="">End</option>
                  {HOURS.map(h => <option key={h} value={h}>{fmtHour(h)}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving} style={{
                padding: '0.5rem', background: '#667eea', color: 'white', border: 'none',
                borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Adding…' : 'Add event'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
            Click a day to view or add events
          </div>
        )}
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.375rem',
  padding: '0.25rem 0.625rem', cursor: 'pointer', fontSize: '1.25rem',
  color: '#475569', lineHeight: 1, fontFamily: 'inherit',
}

const selStyle: React.CSSProperties = {
  flex: 1, padding: '0.5rem 0.375rem', border: '1px solid #d1d5db',
  borderRadius: '0.375rem', fontSize: '0.78rem', fontFamily: 'inherit',
  color: '#475569', background: 'white',
}
