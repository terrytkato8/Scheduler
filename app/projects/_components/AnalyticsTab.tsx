'use client'

import { useEffect, useState } from 'react'

interface CapacityRow {
  user_id: string
  display_name: string
  assigned: number
  in_progress: number
  done: number
  assigned_pts: number
  in_progress_pts: number
  done_pts: number
}

interface VelocityWeek { week: string; points: number }

interface ContribVelocity {
  user_id: string
  display_name: string
  weeks: VelocityWeek[]
}

interface CycleTime {
  id: string
  title: string
  size_estimate: string | null
  display_name: string
  days: number
}

interface AnalyticsData {
  capacity: CapacityRow[]
  teamVelocity: VelocityWeek[]
  contribVelocity: ContribVelocity[]
  cycleTimes: CycleTime[]
  weeks: string[]
}

const SIZE_COLOR: Record<string, string> = { XS: '#86efac', S: '#6ee7b7', M: '#fde68a', L: '#fca5a5', XL: '#f87171' }

function fmtWeek(iso: string) {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default function AnalyticsTab({ projectId }: { projectId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [velocityView, setVelocityView] = useState<'team' | 'individual'>('team')

  useEffect(() => {
    fetch(`/api/projects/${projectId}/analytics`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load analytics'); setLoading(false) })
  }, [projectId])

  if (loading) return <p style={{ color: '#64748b' }}>Loading analytics…</p>
  if (error) return <p style={{ color: '#ef4444' }}>{error}</p>
  if (!data) return null

  const maxPts = Math.max(...data.teamVelocity.map(w => w.points), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Capacity Table ── */}
      <section>
        <h3 style={sectionHead}>Capacity</h3>
        <p style={subText}>Points assigned, in-flight, and completed per contributor.</p>
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Contributor', 'Assigned', 'In Progress', 'Done', 'Done pts'].map(h => (
                  <th key={h} style={{ padding: '0.625rem 1rem', textAlign: h === 'Contributor' ? 'left' : 'center', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.capacity.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>No tasks yet</td></tr>
              ) : data.capacity.map((row, i) => (
                <tr key={row.user_id} style={{ borderBottom: i < data.capacity.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '0.625rem 1rem', fontWeight: 600, color: '#172b4d' }}>{row.display_name}</td>
                  <td style={{ padding: '0.625rem 1rem', textAlign: 'center', color: '#475569' }}>{row.assigned} <span style={ptsBadge}>{row.assigned_pts}pt</span></td>
                  <td style={{ padding: '0.625rem 1rem', textAlign: 'center', color: '#d97706' }}>{row.in_progress} <span style={ptsBadge}>{row.in_progress_pts}pt</span></td>
                  <td style={{ padding: '0.625rem 1rem', textAlign: 'center', color: '#16a34a' }}>{row.done} <span style={ptsBadge}>{row.done_pts}pt</span></td>
                  <td style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>
                    <ProgressBar value={row.done_pts} max={row.assigned_pts || 1} color="#667eea" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Velocity Chart ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.375rem' }}>
          <h3 style={{ ...sectionHead, margin: 0 }}>Velocity</h3>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {(['team', 'individual'] as const).map(v => (
              <button key={v} onClick={() => setVelocityView(v)} style={{
                padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                border: velocityView === v ? '2px solid #667eea' : '1px solid #e2e8f0',
                background: velocityView === v ? '#eef2ff' : 'white', color: velocityView === v ? '#4338ca' : '#64748b',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {v === 'team' ? 'Team' : 'Individual'}
              </button>
            ))}
          </div>
        </div>
        <p style={subText}>Story points completed per week (last 8 weeks).</p>

        {velocityView === 'team' ? (
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: '1.25rem' }}>
            <VelocityChart weeks={data.teamVelocity} maxPts={maxPts} color="#667eea" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.contribVelocity.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0' }}>
                No completed tasks with size estimates yet.
              </div>
            ) : data.contribVelocity.map((cv, idx) => {
              const COLORS = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']
              const color = COLORS[idx % COLORS.length]
              const cvMax = Math.max(...cv.weeks.map(w => w.points), 1)
              return (
                <div key={cv.user_id} style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: '1rem 1.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#172b4d', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    {cv.display_name}
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#94a3b8' }}>
                      {cv.weeks.reduce((s, w) => s + w.points, 0)} total pts
                    </span>
                  </div>
                  <VelocityChart weeks={cv.weeks} maxPts={cvMax} color={color} />
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Cycle Time ── */}
      <section>
        <h3 style={sectionHead}>Cycle Time</h3>
        <p style={subText}>How long completed tasks took from start to done.</p>
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Task', 'Size', 'Contributor', 'Cycle Time'].map(h => (
                  <th key={h} style={{ padding: '0.625rem 1rem', textAlign: h === 'Task' ? 'left' : 'center', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cycleTimes.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>No completed tasks with cycle time data yet.</td></tr>
              ) : data.cycleTimes.sort((a, b) => a.days - b.days).map((ct, i) => (
                <tr key={ct.id} style={{ borderBottom: i < data.cycleTimes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '0.625rem 1rem', color: '#172b4d', fontWeight: 500, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ct.title}</td>
                  <td style={{ padding: '0.625rem 1rem', textAlign: 'center' }}>
                    {ct.size_estimate ? (
                      <span style={{ fontWeight: 800, fontSize: '0.72rem', color: '#4338ca', background: SIZE_COLOR[ct.size_estimate] ?? '#eef2ff', padding: '2px 7px', borderRadius: '4px' }}>{ct.size_estimate}</span>
                    ) : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.625rem 1rem', textAlign: 'center', color: '#475569' }}>{ct.display_name}</td>
                  <td style={{ padding: '0.625rem 1rem', textAlign: 'center', fontWeight: 700, color: ct.days <= 1 ? '#16a34a' : ct.days <= 3 ? '#d97706' : '#ef4444' }}>
                    {ct.days === 0 ? '<1d' : `${ct.days}d`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function VelocityChart({ weeks, maxPts, color }: { weeks: VelocityWeek[]; maxPts: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.375rem', height: 120 }}>
      {weeks.map(w => {
        const pct = maxPts > 0 ? (w.points / maxPts) * 100 : 0
        return (
          <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: w.points > 0 ? color : '#94a3b8' }}>{w.points > 0 ? w.points : ''}</span>
            <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '4px 4px 0 0', position: 'relative', height: '80px', display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%', background: color, borderRadius: '4px 4px 0 0', opacity: 0.85,
                height: `${Math.max(pct, w.points > 0 ? 4 : 0)}%`,
                transition: 'height 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.6rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtWeek(w.week)}</span>
          </div>
        )
      })}
    </div>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
      <div style={{ width: 80, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: '0.68rem', color: '#94a3b8', minWidth: 28 }}>{Math.round(pct)}%</span>
    </div>
  )
}

const sectionHead: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }
const subText: React.CSSProperties = { fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.875rem' }
const ptsBadge: React.CSSProperties = { fontSize: '0.65rem', color: '#64748b', background: '#f1f5f9', padding: '1px 4px', borderRadius: 3, marginLeft: '2px' }

// Needed for React.CSSProperties usage
import React from 'react'
