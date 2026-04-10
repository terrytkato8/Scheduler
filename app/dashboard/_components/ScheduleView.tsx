'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7 am – 9 pm
const MINS = [0, 15, 30, 45]

type Mode = 'available' | 'busy'
type DragAction = 'set-available' | 'set-busy' | 'clear-available' | 'clear-busy'

function sk(d: number, h: number, m: number) { return `${d}-${h}-${m}` }

function fmt(h: number, m: number) {
  const ap = h < 12 ? 'am' : 'pm'
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${hh} ${ap}` : `${hh}:${String(m).padStart(2, '0')} ${ap}`
}

export default function ScheduleView({ userId: _userId, displayName }: { userId: string; displayName: string }) {
  const [mode, setMode] = useState<Mode>('available')
  const [avail, setAvail] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [loading, setLoading] = useState(true)

  const dragging = useRef(false)
  const dragAction = useRef<DragAction>('set-available')

  // Load existing availability
  useEffect(() => {
    fetch('/api/availability')
      .then(r => r.json())
      .then(d => {
        setAvail(new Set(d.available_slots ?? []))
        setBusy(new Set(d.busy_slots ?? []))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // End drag on global mouseup
  useEffect(() => {
    const stop = () => { dragging.current = false }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

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

  const onMouseDown = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault()
    const isA = avail.has(key)
    const isB = busy.has(key)
    let action: DragAction
    if (mode === 'available') {
      action = isA ? 'clear-available' : 'set-available'
    } else {
      action = isB ? 'clear-busy' : 'set-busy'
    }
    dragAction.current = action
    dragging.current = true
    applySlot(key, action)
  }, [avail, busy, mode, applySlot])

  const onMouseEnter = useCallback((key: string) => {
    if (!dragging.current) return
    applySlot(key, dragAction.current)
  }, [applySlot])

  const save = async () => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          available_slots: [...avail],
          busy_slots: [...busy],
          displayName,
        }),
      })
      setSaveStatus(res.ok ? 'saved' : 'error')
    } catch {
      setSaveStatus('error')
    }
  }

  if (loading) return <p style={{ color: '#64748b', padding: '2rem 0' }}>Loading your availability…</p>

  const btnBg = { idle: '#667eea', saving: '#667eea', saved: '#22c55e', error: '#ef4444' }[saveStatus]
  const btnLabel = { idle: 'Save availability', saving: 'Saving…', saved: 'Saved!', error: 'Retry' }[saveStatus]

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '0.5rem', padding: '3px', gap: '2px' }}>
          {(['available', 'busy'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '0.35rem 1rem', borderRadius: '0.375rem', border: 'none',
                fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
                background: mode === m ? (m === 'available' ? '#22c55e' : '#f87171') : 'transparent',
                color: mode === m ? 'white' : '#64748b',
                transition: 'all 0.12s',
              }}
            >
              {m === 'available' ? '✓ Available' : '✕ Busy'}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0 }}>
          Click or drag to mark slots
        </span>

        {/* Legend */}
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

        <button
          onClick={save}
          disabled={saveStatus === 'saving'}
          style={{
            marginLeft: 'auto', padding: '0.5rem 1.25rem',
            background: btnBg, color: 'white', border: 'none', borderRadius: '0.5rem',
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
            opacity: saveStatus === 'saving' ? 0.7 : 1, transition: 'background 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {btnLabel}
        </button>
      </div>

      {/* Grid */}
      <div style={{
        overflowX: 'auto',
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '520px', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{
                width: 58, padding: '0.625rem 0.625rem',
                borderBottom: '2px solid #e2e8f0', textAlign: 'left',
                color: '#94a3b8', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Time
              </th>
              {DAYS.map(d => (
                <th key={d} style={{
                  padding: '0.625rem 0', borderBottom: '2px solid #e2e8f0',
                  textAlign: 'center', color: '#475569', fontSize: '0.78rem', fontWeight: 600,
                }}>
                  {d}
                </th>
              ))}
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
                      padding: '0 0.625rem', height: 13,
                      fontSize: '0.63rem', color: '#94a3b8', whiteSpace: 'nowrap',
                      verticalAlign: 'middle',
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
                          style={{
                            height: 13, padding: '1px',
                            borderBottom: isHourEnd ? '1px solid #c8d3de' : '1px solid #f8fafc',
                          }}
                        >
                          <div
                            onMouseDown={e => onMouseDown(e, key)}
                            onMouseEnter={() => onMouseEnter(key)}
                            onDragStart={e => e.preventDefault()}
                            style={{
                              height: '100%', borderRadius: '2px', cursor: 'pointer',
                              background: isA ? '#86efac' : isB ? '#fca5a5' : 'transparent',
                              border: isA ? '1px solid #4ade80' : isB ? '1px solid #f87171' : '1px solid transparent',
                              transition: 'background 0.06s',
                            }}
                          />
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
    </div>
  )
}
