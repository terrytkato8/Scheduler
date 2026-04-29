'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7)
const MINS = [0, 15, 30, 45]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Mode = 'available' | 'busy'
type DragAction = 'set-available' | 'set-busy' | 'clear-available' | 'clear-busy'

function sk(d: number, h: number, m: number) { return `${d}-${h}-${m}` }

function fmt(h: number, m: number) {
  const ap = h < 12 ? 'am' : 'pm'
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hh}${ap}` : `${hh}:${String(m).padStart(2, '0')}${ap}`
}

function getMondayOf(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1))
  r.setHours(0, 0, 0, 0)
  return r
}

function toWeekKey(monday: Date): string {
  return monday.toISOString().split('T')[0]
}

function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function ScheduleView({ userId: _userId, displayName }: { userId: string; displayName: string }) {
  const [mode, setMode] = useState<Mode>('available')
  const [avail, setAvail] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [loading, setLoading] = useState(true)
  const [hasOverride, setHasOverride] = useState(false)

  // null = default schedule, Date = specific week (monday)
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null)
  const [navWeek, setNavWeek] = useState<Date>(getMondayOf(new Date()))

  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const dragAction = useRef<DragAction>('set-available')
  const lastSlot = useRef<string | null>(null)

  // Refs so pointer event handlers always see current values
  const availRef = useRef(avail)
  const busyRef = useRef(busy)
  const modeRef = useRef(mode)
  availRef.current = avail
  busyRef.current = busy
  modeRef.current = mode

  // Load data whenever selected week changes
  useEffect(() => {
    setLoading(true)
    const url = selectedWeek
      ? `/api/availability?week=${toWeekKey(selectedWeek)}`
      : '/api/availability'
    fetch(url)
      .then(r => r.json())
      .then(d => {
        setAvail(new Set(d.available_slots ?? []))
        setBusy(new Set(d.busy_slots ?? []))
        setHasOverride(d.has_override ?? false)
        setSaveStatus('idle')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedWeek])

  const applySlot = useCallback((key: string, action: DragAction) => {
    if (action === 'set-available') {
      setAvail(p => new Set([...p, key]))
      setBusy(p => { const n = new Set(p); n.delete(key); return n })
    } else if (action === 'set-busy') {
      setBusy(p => new Set([...p, key]))
      setAvail(p => { const n = new Set(p); n.delete(key); return n })
    } else if (action === 'clear-available') {
      setAvail(p => { const n = new Set(p); n.delete(key); return n })
    } else {
      setBusy(p => { const n = new Set(p); n.delete(key); return n })
    }
    setSaveStatus('idle')
  }, [])

  // Smooth pointer-based drag: tracks cursor position via elementFromPoint
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const getSlot = (x: number, y: number): string | null => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null
      return el?.dataset?.slot ?? (el?.closest('[data-slot]') as HTMLElement | null)?.dataset?.slot ?? null
    }

    const onDown = (e: PointerEvent) => {
      const slot = getSlot(e.clientX, e.clientY)
      if (!slot) return
      e.preventDefault()
      const isA = availRef.current.has(slot)
      const isB = busyRef.current.has(slot)
      dragAction.current = modeRef.current === 'available'
        ? (isA ? 'clear-available' : 'set-available')
        : (isB ? 'clear-busy' : 'set-busy')
      dragging.current = true
      lastSlot.current = slot
      applySlot(slot, dragAction.current)
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const slot = getSlot(e.clientX, e.clientY)
      if (!slot || slot === lastSlot.current) return
      lastSlot.current = slot
      applySlot(slot, dragAction.current)
    }

    const onUp = () => { dragging.current = false; lastSlot.current = null }

    container.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      container.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [applySlot])

  const save = async () => {
    setSaveStatus('saving')
    try {
      const body: Record<string, unknown> = {
        available_slots: [...avail],
        busy_slots: [...busy],
        displayName,
      }
      if (selectedWeek) body.week = toWeekKey(selectedWeek)

      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setSaveStatus('saved')
        if (selectedWeek) setHasOverride(true)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
  }

  const clearWeekOverride = async () => {
    if (!selectedWeek || !confirm('Clear this week\'s override? The default schedule will be used.')) return
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week: toWeekKey(selectedWeek), clear: true }),
    })
    // Reload default data for this week
    const res = await fetch(`/api/availability?week=${toWeekKey(selectedWeek)}`)
    const d = await res.json()
    setAvail(new Set(d.available_slots ?? []))
    setBusy(new Set(d.busy_slots ?? []))
    setHasOverride(false)
  }

  const selectWeek = (monday: Date) => {
    const w = new Date(monday)
    setSelectedWeek(w)
    setNavWeek(w)
  }

  const today = new Date()
  const weekDates = selectedWeek ? getWeekDates(selectedWeek) : null

  const navWeekEnd = new Date(navWeek)
  navWeekEnd.setDate(navWeekEnd.getDate() + 6)
  const navLabel = navWeek.getMonth() === navWeekEnd.getMonth()
    ? `${MONTHS[navWeek.getMonth()]} ${navWeek.getDate()}–${navWeekEnd.getDate()}, ${navWeek.getFullYear()}`
    : `${MONTHS[navWeek.getMonth()]} ${navWeek.getDate()} – ${MONTHS[navWeekEnd.getMonth()]} ${navWeekEnd.getDate()}, ${navWeek.getFullYear()}`

  const isNavSelected = selectedWeek && toWeekKey(selectedWeek) === toWeekKey(navWeek)
  const isCurrentWeek = toWeekKey(navWeek) === toWeekKey(getMondayOf(today))

  const btnBg = { idle: '#667eea', saving: '#667eea', saved: '#22c55e', error: '#ef4444' }[saveStatus]
  const btnLabel = { idle: 'Save', saving: 'Saving…', saved: 'Saved!', error: 'Retry' }[saveStatus]

  return (
    <div style={{ userSelect: 'none' }}>

      {/* ── Week / Schedule Selector ── */}
      <div style={{ background: 'white', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '0.875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>

        {/* Default Schedule pill */}
        <button
          onClick={() => setSelectedWeek(null)}
          style={{
            padding: '0.35rem 0.875rem', borderRadius: '0.375rem', border: 'none',
            fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
            background: !selectedWeek ? '#667eea' : '#f1f5f9',
            color: !selectedWeek ? 'white' : '#64748b',
            transition: 'all 0.12s', flexShrink: 0,
          }}
        >
          📋 Default Schedule
        </button>

        <div style={{ width: 1, height: 20, background: '#e2e8f0', flexShrink: 0 }} />

        {/* Week navigator */}
        <button
          onClick={() => { const p = new Date(navWeek); p.setDate(p.getDate() - 7); setNavWeek(p) }}
          style={{ padding: '0.3rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', background: 'white', cursor: 'pointer', color: '#475569', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}
        >‹</button>

        <button
          onClick={() => selectWeek(navWeek)}
          title="Click to view/edit this week"
          style={{
            padding: '0.35rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '0.8rem', fontWeight: 600, minWidth: 170, textAlign: 'center',
            border: isNavSelected ? '2px solid #667eea' : '1px solid #e2e8f0',
            background: isNavSelected ? '#eef2ff' : 'white',
            color: isNavSelected ? '#4338ca' : '#1e293b',
          }}
        >
          {navLabel}
          {isCurrentWeek && <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', fontWeight: 700, color: '#667eea', background: '#eef2ff', borderRadius: '999px', padding: '1px 5px' }}>This week</span>}
        </button>

        <button
          onClick={() => { const n = new Date(navWeek); n.setDate(n.getDate() + 7); setNavWeek(n) }}
          style={{ padding: '0.3rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', background: 'white', cursor: 'pointer', color: '#475569', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}
        >›</button>

        {!isCurrentWeek && (
          <button
            onClick={() => { setNavWeek(getMondayOf(today)) }}
            style={{ padding: '0.3rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem', color: '#667eea', fontWeight: 600 }}
          >Today</button>
        )}

        {/* Override status */}
        {selectedWeek && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: 'auto' }}>
            {hasOverride ? (
              <>
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '999px', padding: '2px 10px' }}>
                  ✓ Week override saved
                </span>
                <button onClick={clearWeekOverride} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.72rem', fontFamily: 'inherit', padding: 0 }}>
                  Reset to default
                </button>
              </>
            ) : (
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>Using default schedule</span>
            )}
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '0.5rem', padding: '3px', gap: '2px' }}>
          {(['available', 'busy'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '0.35rem 1rem', borderRadius: '0.375rem', border: 'none',
              fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
              background: mode === m ? (m === 'available' ? '#22c55e' : '#f87171') : 'transparent',
              color: mode === m ? 'white' : '#64748b', transition: 'all 0.12s',
            }}>
              {m === 'available' ? '✓ Available' : '✕ Busy'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.875rem', fontSize: '0.72rem', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 11, height: 11, borderRadius: 2, background: '#86efac', border: '1px solid #4ade80', display: 'inline-block' }} />
            Available ({avail.size})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 11, height: 11, borderRadius: 2, background: '#fca5a5', border: '1px solid #f87171', display: 'inline-block' }} />
            Busy ({busy.size})
          </span>
        </div>

        <span style={{ fontSize: '0.72rem', color: '#94a3b8', flexShrink: 0 }}>Click or drag slots</span>

        <button
          onClick={save}
          disabled={saveStatus === 'saving' || loading}
          style={{
            marginLeft: 'auto', padding: '0.5rem 1.25rem',
            background: btnBg, color: 'white', border: 'none', borderRadius: '0.5rem',
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
            opacity: saveStatus === 'saving' || loading ? 0.7 : 1, transition: 'background 0.2s',
          }}
        >{btnLabel}</button>
      </div>

      {/* ── Grid with sticky header ── */}
      <div
        ref={containerRef}
        style={{
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 310px)',
          minHeight: 280,
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          touchAction: 'none',
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 0.15s',
          cursor: mode === 'available' ? 'cell' : 'not-allowed',
        }}
      >
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '520px', tableLayout: 'fixed' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{
                width: 58, padding: '0.625rem 0.5rem',
                borderBottom: '2px solid #e2e8f0', textAlign: 'left',
                color: '#94a3b8', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: '#f8fafc',
              }}>Time</th>
              {DAYS.map((d, di) => {
                const date = weekDates?.[di]
                const isToday = date ? isSameDay(date, today) : false
                return (
                  <th key={d} style={{ padding: '0.5rem 0', borderBottom: '2px solid #e2e8f0', textAlign: 'center', background: '#f8fafc' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.78rem', color: isToday ? '#667eea' : '#475569' }}>{d}</div>
                    {date && (
                      <div style={{
                        fontSize: '0.68rem', marginTop: '2px',
                        fontWeight: isToday ? 700 : 400,
                        color: isToday ? 'white' : '#94a3b8',
                        background: isToday ? '#667eea' : 'transparent',
                        borderRadius: '999px',
                        padding: isToday ? '1px 6px' : 0,
                        display: 'inline-block',
                      }}>
                        {MONTHS[date.getMonth()]} {date.getDate()}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {HOURS.flatMap(hour =>
              MINS.map(min => {
                const isHourStart = min === 0
                const isHourEnd = min === 45
                return (
                  <tr key={`${hour}-${min}`}>
                    <td style={{
                      padding: '0 0.5rem', height: 14,
                      fontSize: '0.63rem', color: '#94a3b8', whiteSpace: 'nowrap', verticalAlign: 'middle',
                      borderRight: '1px solid #f1f5f9',
                      borderBottom: isHourEnd ? '1px solid #c8d3de' : '1px solid #f1f5f9',
                      background: isHourStart ? '#fafcff' : 'transparent',
                    }}>
                      {isHourStart ? fmt(hour, 0) : ''}
                    </td>
                    {DAYS.map((_, di) => {
                      const key = sk(di, hour, min)
                      const isA = avail.has(key)
                      const isB = busy.has(key)
                      return (
                        <td
                          key={di}
                          data-slot={key}
                          style={{
                            height: 14, padding: '1px',
                            borderBottom: isHourEnd ? '1px solid #c8d3de' : '1px solid #f8fafc',
                            background: isA ? '#86efac' : isB ? '#fca5a5' : 'transparent',
                            outline: isA ? '1px solid #4ade8066' : isB ? '1px solid #f8717166' : 'none',
                            borderRadius: '1px',
                            transition: 'background 0.04s',
                          }}
                        />
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedWeek && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#94a3b8' }}>
          Editing week of {MONTHS[selectedWeek.getMonth()]} {selectedWeek.getDate()}, {selectedWeek.getFullYear()} —{' '}
          {hasOverride ? 'this week has a custom override' : 'changes will create a week-specific override'}
        </p>
      )}
    </div>
  )
}
