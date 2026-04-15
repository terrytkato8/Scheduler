'use client'

import { useEffect, useState, FormEvent } from 'react'
import MeetingBooker from './MeetingBooker'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DNAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7)
const MINS = [0, 15, 30, 45]

interface CalEvent {
  id: string
  title: string
  date: string
  start_hour?: number
  end_hour?: number
}

interface CalTask {
  id: string
  title: string
  priority: string
  due_date: string
  status: string
  project_id: string
  projects?: { name: string } | null
}

interface Meeting {
  id: string
  title: string
  description?: string
  date?: string
  start_hour?: number
  start_minute?: number
  end_hour?: number
  end_minute?: number
  organizer_id: string
  is_organizer: boolean
  meeting_invites?: { user_id: string; display_name: string; status: string }[]
}

function pad(n: number) { return String(n).padStart(2, '0') }
function toDateStr(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}` }
function fmtHour(h: number, m = 0) {
  const ap = h < 12 ? 'am' : 'pm'
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hh}${ap}` : `${hh}:${pad(m)}${ap}`
}

export default function MonthCalendar({ userId: _userId }: { userId: string; displayName: string }) {
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [events, setEvents] = useState<CalEvent[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [myTasks, setMyTasks] = useState<CalTask[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [sh, setSh] = useState<number | ''>('')
  const [eh, setEh] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [showBooker, setShowBooker] = useState(false)

  const { y, m } = view
  const monthStr = `${y}-${pad(m + 1)}`

  const loadData = () => {
    fetch(`/api/events?month=${monthStr}`)
      .then(r => r.json()).then(d => setEvents(d.events ?? [])).catch(() => {})
    fetch(`/api/meetings?month=${monthStr}`)
      .then(r => r.json()).then(d => setMeetings(d.meetings ?? [])).catch(() => {})
    fetch('/api/my-tasks')
      .then(r => r.json()).then(d => setMyTasks(d.tasks ?? [])).catch(() => {})
  }

  useEffect(() => { loadData() }, [monthStr]) // eslint-disable-line react-hooks/exhaustive-deps

  const firstDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate())
  const eventsOn = (ds: string) => events.filter(e => e.date === ds)
  const meetingsOn = (ds: string) => meetings.filter(mt => mt.date === ds)
  const tasksOn = (ds: string) => myTasks.filter(t => t.due_date === ds)
  const selEvents = sel ? eventsOn(sel) : []
  const selMeetings = sel ? meetingsOn(sel) : []
  const selTasks = sel ? tasksOn(sel) : []

  const prevMonth = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })
  const nextMonth = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })

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
    if (await fetch(`/api/events/${id}`, { method: 'DELETE' }).then(r => r.ok))
      setEvents(prev => prev.filter(ev => ev.id !== id))
  }

  const deleteMeeting = async (id: string) => {
    if (await fetch(`/api/meetings/${id}`, { method: 'DELETE' }).then(r => r.ok))
      setMeetings(prev => prev.filter(mt => mt.id !== id))
  }

  const selLabel = sel
    ? new Date(sel + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  return (
    <div>
      {/* Meeting booker modal */}
      {showBooker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '1rem',
        }}>
          <MeetingBooker
            initialDate={sel ?? undefined}
            onCreated={() => { setShowBooker(false); loadData() }}
            onCancel={() => setShowBooker(false)}
          />
        </div>
      )}

      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          onClick={() => setShowBooker(true)}
          style={{ padding: '0.5rem 1.25rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Book a meeting
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Calendar grid */}
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <button onClick={prevMonth} style={navBtn}>&#8249;</button>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{MONTHS[m]} {y}</span>
              <button onClick={nextMonth} style={navBtn}>&#8250;</button>
            </div>
            {/* Day names */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #e2e8f0' }}>
              {DNAMES.map(d => (
                <div key={d} style={{ padding: '0.5rem 0', textAlign: 'center', fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
              ))}
            </div>
            {/* Days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} style={{ height: 82, borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }} />
                const ds = toDateStr(y, m, day)
                const dayEvs = eventsOn(ds)
                const dayMts = meetingsOn(ds)
                const dayTasks = tasksOn(ds)
                const total = dayEvs.length + dayMts.length + dayTasks.length
                const isToday = ds === todayStr
                const isSel = ds === sel
                return (
                  <div
                    key={idx}
                    onClick={() => setSel(isSel ? null : ds)}
                    style={{
                      height: 82, padding: '0.375rem',
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
                    {dayEvs.slice(0, 1).map(ev => (
                      <div key={ev.id} style={{ fontSize: '0.63rem', background: '#667eea', color: 'white', borderRadius: '3px', padding: '1px 4px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.title}
                      </div>
                    ))}
                    {dayMts.slice(0, 1).map(mt => (
                      <div key={mt.id} style={{ fontSize: '0.63rem', background: '#f59e0b', color: 'white', borderRadius: '3px', padding: '1px 4px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📅 {mt.title}
                      </div>
                    ))}
                    {dayTasks.slice(0, 1).map(t => (
                      <div key={t.id} style={{ fontSize: '0.63rem', background: TASK_PRIORITY_COLOR[t.priority] ?? '#8b5cf6', color: 'white', borderRadius: '3px', padding: '1px 4px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        ✓ {t.title}
                      </div>
                    ))}
                    {total > 2 && <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>+{total - 2} more</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ flex: '0 0 272px', minWidth: '220px' }}>
          {sel ? (
            <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selLabel}</h3>

              {/* Meetings on this day */}
              {selMeetings.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Meetings</div>
                  {selMeetings.map(mt => (
                    <div key={mt.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.5rem 0.625rem', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#1e293b' }}>{mt.title}</div>
                          {mt.start_hour && (
                            <div style={{ fontSize: '0.72rem', color: '#92400e' }}>
                              {fmtHour(mt.start_hour, mt.start_minute)}{mt.end_hour ? ` – ${fmtHour(mt.end_hour, mt.end_minute)}` : ''}
                            </div>
                          )}
                          {mt.meeting_invites && mt.meeting_invites.length > 0 && (
                            <div style={{ fontSize: '0.68rem', color: '#b45309', marginTop: '2px' }}>
                              {mt.meeting_invites.map(i => i.display_name || 'Member').join(', ')}
                            </div>
                          )}
                          {!mt.is_organizer && (
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>You&apos;re invited</div>
                          )}
                        </div>
                        {mt.is_organizer && (
                          <button onClick={() => deleteMeeting(mt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1, padding: 0, flexShrink: 0 }}>&times;</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Events on this day */}
              {selEvents.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Events</div>
                  {selEvents.map(ev => (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '0.5rem', padding: '0.4rem 0.625rem', marginBottom: '0.375rem' }}>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b' }}>{ev.title}</div>
                        {ev.start_hour && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{fmtHour(ev.start_hour)}{ev.end_hour ? ` – ${fmtHour(ev.end_hour)}` : ''}</div>}
                      </div>
                      <button onClick={() => deleteEvent(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1, padding: 0, flexShrink: 0 }}>&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks due on this day */}
              {selTasks.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Tasks Due</div>
                  {selTasks.map(t => (
                    <div key={t.id} style={{ background: TASK_PRIORITY_BG[t.priority] ?? '#f5f3ff', border: `1px solid ${TASK_PRIORITY_COLOR[t.priority] ?? '#8b5cf6'}30`, borderLeft: `3px solid ${TASK_PRIORITY_COLOR[t.priority] ?? '#8b5cf6'}`, borderRadius: '0.375rem', padding: '0.4rem 0.625rem', marginBottom: '0.35rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{t.title}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                        {t.projects?.name && <span>{t.projects.name} · </span>}
                        <span style={{ color: TASK_PRIORITY_COLOR[t.priority] ?? '#8b5cf6', fontWeight: 700 }}>{t.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selEvents.length === 0 && selMeetings.length === 0 && selTasks.length === 0 && (
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>No events or meetings</p>
              )}

              {/* Quick add event */}
              <form onSubmit={addEvent} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add event</div>
                <input
                  required type="text" placeholder="Event title"
                  value={title} onChange={e => setTitle(e.target.value)}
                  style={{ padding: '0.45rem 0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.84rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <select value={sh} onChange={e => setSh(e.target.value ? +e.target.value : '')} style={selSt}>
                    <option value="">Start</option>
                    {HOURS.flatMap(h => MINS.map(mn => <option key={`${h}-${mn}`} value={h}>{fmtHour(h, mn)}</option>))}
                  </select>
                  <select value={eh} onChange={e => setEh(e.target.value ? +e.target.value : '')} style={selSt}>
                    <option value="">End</option>
                    {HOURS.flatMap(h => MINS.map(mn => <option key={`${h}-${mn}`} value={h}>{fmtHour(h, mn)}</option>))}
                  </select>
                </div>
                <button type="submit" disabled={saving} style={{ padding: '0.45rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Adding…' : 'Add event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBooker(true)}
                  style={{ padding: '0.45rem', background: 'white', color: '#667eea', border: '1px solid #667eea', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Book a meeting instead
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
    </div>
  )
}

const TASK_PRIORITY_COLOR: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
}
const TASK_PRIORITY_BG: Record<string, string> = {
  low: '#f0fdf4', medium: '#fffbeb', high: '#fff7ed', critical: '#fef2f2',
}

const navBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.375rem',
  padding: '0.25rem 0.625rem', cursor: 'pointer', fontSize: '1.25rem',
  color: '#475569', lineHeight: 1, fontFamily: 'inherit',
}
const selSt: React.CSSProperties = {
  flex: 1, padding: '0.45rem 0.375rem', border: '1px solid #d1d5db',
  borderRadius: '0.375rem', fontSize: '0.75rem', fontFamily: 'inherit',
  color: '#475569', background: 'white',
}
