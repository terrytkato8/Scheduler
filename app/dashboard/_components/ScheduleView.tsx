'use client'

import { useState, useCallback } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7 am – 9 pm

function formatHour(h: number) {
  if (h === 12) return '12 pm'
  if (h < 12) return `${h} am`
  return `${h - 12} pm`
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function ScheduleView({ userId }: { userId: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const toggle = useCallback((day: number, hour: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      const key = `${day}-${hour}`
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
    setSaveStatus('idle')
  }, [])

  const save = async () => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: Array.from(selected) }),
      })
      setSaveStatus(res.ok ? 'saved' : 'error')
    } catch {
      setSaveStatus('error')
    }
  }

  const saveLabel = { idle: 'Save', saving: 'Saving…', saved: 'Saved!', error: 'Error — retry' }[saveStatus]

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>My Availability</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Click slots to mark when you&apos;re available, then save.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saveStatus === 'saving'}
          style={{
            padding: '0.625rem 1.5rem',
            background: saveStatus === 'error' ? '#ef4444' : saveStatus === 'saved' ? '#22c55e' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            opacity: saveStatus === 'saving' ? 0.7 : 1,
            transition: 'background 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {saveLabel}
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#667eea', display: 'inline-block' }} />
          Available
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#e2e8f0', display: 'inline-block', border: '1px solid #cbd5e1' }} />
          Unavailable
        </span>
      </div>

      {/* Grid */}
      <div
        style={{
          overflowX: 'auto',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          background: 'white',
        }}
      >
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '540px' }}>
          <thead>
            <tr>
              <th
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  borderBottom: '2px solid #e2e8f0',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  width: '64px',
                }}
              />
              {DAYS.map(day => (
                <th
                  key={day}
                  style={{
                    padding: '0.75rem 0.25rem',
                    textAlign: 'center',
                    borderBottom: '2px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, rowIdx) => (
              <tr key={hour} style={{ background: rowIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                <td
                  style={{
                    padding: '0.375rem 1rem',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    borderRight: '1px solid #f1f5f9',
                  }}
                >
                  {formatHour(hour)}
                </td>
                {DAYS.map((_, dayIdx) => {
                  const key = `${dayIdx}-${hour}`
                  const on = selected.has(key)
                  return (
                    <td key={dayIdx} style={{ padding: '3px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggle(dayIdx, hour)}
                        aria-label={`${DAYS[dayIdx]} ${formatHour(hour)} — ${on ? 'available' : 'unavailable'}`}
                        aria-pressed={on}
                        style={{
                          width: '100%',
                          height: '28px',
                          border: on ? 'none' : '1px solid #e2e8f0',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          background: on ? '#667eea' : '#f8fafc',
                          transition: 'background 0.12s, transform 0.08s',
                        }}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
        {selected.size} slot{selected.size !== 1 ? 's' : ''} selected &mdash; user ID: {userId.slice(0, 8)}&hellip;
      </p>
    </div>
  )
}
