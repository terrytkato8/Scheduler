'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import KanbanBoard from '../_components/KanbanBoard'
import ArtPipeline from '../_components/ArtPipeline'
import StandardBoard from '../_components/StandardBoard'
import AnalyticsTab from '../_components/AnalyticsTab'
import { Task } from '../_components/TaskDrawer'

interface Project {
  id: string
  name: string
  description: string | null
  game: string | null
  team: string | null
  type: string
  color: string
  owner_id: string
  created_at: string
}

interface Ticket {
  id: string
  ticket_number: number
  game: string
  type: 'bug' | 'feature' | 'improvement' | 'task'
  status: string
  priority: string
  title: string
  description: string | null
  reporter_name: string | null
  created_at: string
}

interface DevLog {
  id: string
  title: string
  content: string
  version: string | null
  log_type: string
  author_name: string | null
  created_at: string
}

const BOARD_TYPES: Record<string, { label: string; emoji: string }> = {
  kanban:       { label: 'Kanban',       emoji: '⬛' },
  art_pipeline: { label: 'Art Pipeline', emoji: '🎨' },
  standard:     { label: 'Standard PM',  emoji: '📋' },
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e',
}
const STATUS_COLOR: Record<string, string> = {
  open: '#6366f1', in_progress: '#3b82f6', in_review: '#8b5cf6',
  resolved: '#10b981', closed: '#64748b', wont_fix: '#94a3b8',
}
const TYPE_ICON: Record<string, string> = {
  bug: '🐛', feature: '✨', improvement: '⬆️', task: '✓',
}
const LOG_TYPE_COLOR: Record<string, string> = {
  feature: '#3b82f6', fix: '#10b981', update: '#6366f1',
  release: '#e85d7b', breaking: '#ef4444', hotfix: '#f97316',
}
const LOG_TYPE_ICON: Record<string, string> = {
  feature: '✨', fix: '🔧', update: '📝', release: '🚀', breaking: '⚠️', hotfix: '🔥',
}

type Tab = 'board' | 'tickets' | 'devlog' | 'analytics'

export default function ProjectWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'board')

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [devLogs, setDevLogs] = useState<DevLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ticket creation
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [tType, setTType] = useState<'bug' | 'feature' | 'improvement' | 'task'>('bug')
  const [tTitle, setTTitle] = useState('')
  const [tPriority, setTPriority] = useState('medium')
  const [tDesc, setTDesc] = useState('')
  const [tSteps, setTSteps] = useState('')
  const [tExpected, setTExpected] = useState('')
  const [tActual, setTActual] = useState('')
  const [tEnv, setTEnv] = useState('')
  const [tBuild, setTBuild] = useState('')
  const [tUserStory, setTUserStory] = useState('')
  const [tAC, setTAC] = useState('')
  const [tSubmitting, setTSubmitting] = useState(false)

  // Dev log creation
  const [creatingLog, setCreatingLog] = useState(false)
  const [lTitle, setLTitle] = useState('')
  const [lContent, setLContent] = useState('')
  const [lVersion, setLVersion] = useState('')
  const [lType, setLType] = useState('update')
  const [lSubmitting, setLSubmitting] = useState(false)

  const loadTickets = useCallback(async () => {
    if (!project) return
    const res = await fetch(`/api/tickets?project_id=${id}`)
    const d = await res.json()
    setTickets(d.tickets ?? [])
  }, [id, project])

  const loadDevLogs = useCallback(async () => {
    if (!project) return
    const res = await fetch(`/api/dev-logs?project_id=${id}`)
    const d = await res.json()
    setDevLogs(d.logs ?? [])
  }, [id, project])

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch(`/api/projects/${id}/tasks`).then(r => r.json()),
    ]).then(([pData, tData]) => {
      if (pData.error) { setError(pData.error); setLoading(false); return }
      setProject(pData.project)
      setTasks(tData.tasks ?? [])
      setLoading(false)
    }).catch(() => { setError('Failed to load project'); setLoading(false) })
  }, [id])

  useEffect(() => { if (project && tab === 'tickets') loadTickets() }, [project, tab, loadTickets])
  useEffect(() => { if (project && tab === 'devlog') loadDevLogs() }, [project, tab, loadDevLogs])

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    setTSubmitting(true)
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: tType, game: project.game ?? 'Studio / General',
        title: tTitle, priority: tPriority,
        description: tDesc || null, project_id: id,
        steps_to_reproduce: tSteps || null,
        expected_behavior: tExpected || null,
        actual_behavior: tActual || null,
        environment: tEnv || null,
        build_version: tBuild || null,
        user_story: tUserStory || null,
        acceptance_criteria: tAC || null,
      }),
    })
    const d = await res.json()
    if (d.ticket) {
      setTickets(prev => [d.ticket, ...prev])
      setCreatingTicket(false)
      setTTitle(''); setTDesc(''); setTSteps(''); setTExpected(''); setTActual(''); setTEnv(''); setTBuild(''); setTUserStory(''); setTAC('')
    }
    setTSubmitting(false)
  }

  const submitLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    setLSubmitting(true)
    const res = await fetch('/api/dev-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: lTitle, content: lContent,
        version: lVersion || null, log_type: lType,
        game: project.game ?? 'Studio / General', project_id: id,
      }),
    })
    const d = await res.json()
    if (d.log) {
      setDevLogs(prev => [d.log, ...prev])
      setCreatingLog(false)
      setLTitle(''); setLContent(''); setLVersion(''); setLType('update')
    }
    setLSubmitting(false)
  }

  const deleteLog = async (logId: string) => {
    if (!confirm('Delete this log entry?')) return
    await fetch(`/api/dev-logs/${logId}`, { method: 'DELETE' })
    setDevLogs(prev => prev.filter(l => l.id !== logId))
  }

  const deleteTicket = async (ticketId: string) => {
    if (!confirm('Delete this ticket?')) return
    await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' })
    setTickets(prev => prev.filter(t => t.id !== ticketId))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '2rem' }}>🐙</div>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading project…</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: '#ef4444', fontWeight: 600 }}>{error ?? 'Project not found'}</p>
        <button onClick={() => router.push('/projects')} style={{ padding: '0.5rem 1.25rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Back to Projects
        </button>
      </div>
    )
  }

  const bt = BOARD_TYPES[project.type] ?? { label: project.type, emoji: '📋' }
  const Board = project.type === 'kanban' ? KanbanBoard
    : project.type === 'art_pipeline' ? ArtPipeline
    : StandardBoard
  const doneCount = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0
  const col = project.color ?? '#e85d7b'

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'board', label: `${bt.emoji} Board` },
    { id: 'tickets', label: '🐛 Tickets', count: tickets.length },
    { id: 'devlog', label: '📋 Dev Log', count: devLogs.length },
    { id: 'analytics', label: '📊 Analytics' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: 'calc(100vh - 52px)' }}>
      {/* Workspace header */}
      <div style={{ padding: '1.25rem 2rem 0', background: 'white', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
          <button onClick={() => router.push('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.82rem', fontFamily: 'inherit', padding: 0 }}>
            ← All Projects
          </button>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#172b4d' }}>{project.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '0.625rem', background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
              {bt.emoji}
            </div>
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#172b4d', margin: 0, lineHeight: 1.2 }}>{project.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: col, background: col + '18', padding: '2px 8px', borderRadius: '999px', border: `1px solid ${col}40` }}>{bt.label}</span>
                {project.game && <span style={{ fontSize: '0.72rem', color: '#6b778c', background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px' }}>🎮 {project.game}</span>}
                {project.team && <span style={{ fontSize: '0.72rem', color: '#6b778c', background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px' }}>Dept: {project.team}</span>}
              </div>
            </div>
          </div>
          {tasks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.72rem', color: '#6b778c', fontWeight: 600 }}>{doneCount}/{tasks.length} done · {progress}%</span>
              <div style={{ width: 160, height: 6, background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#10b981' : col, borderRadius: '999px', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: '0.25rem' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '0.625rem 1.125rem', background: 'none', border: 'none',
                borderBottom: tab === t.id ? `2px solid ${col}` : '2px solid transparent',
                fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? '#1e293b' : '#94a3b8',
                fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                transition: 'all 0.1s',
              }}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span style={{ fontSize: '0.65rem', background: col + '20', color: col, fontWeight: 700, padding: '1px 5px', borderRadius: '999px' }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'board' && (
        <div style={{ flex: 1, padding: '1.5rem 2rem', overflowX: 'auto' }}>
          <Board projectId={project.id} tasks={tasks} onTasksChange={setTasks} />
        </div>
      )}

      {tab === 'tickets' && (
        <div style={{ flex: 1, padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setCreatingTicket(true)} style={{ padding: '0.5rem 1.125rem', background: col, color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              + New Ticket
            </button>
          </div>

          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              No tickets yet. <button onClick={() => setCreatingTicket(true)} style={{ background: 'none', border: 'none', color: col, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Create the first one.</button>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              {tickets.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1.25rem', borderBottom: i < tickets.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', fontFamily: 'monospace', flexShrink: 0, minWidth: 80 }}>
                    {t.type === 'bug' ? 'BUG' : t.type === 'feature' ? 'FEAT' : t.type === 'improvement' ? 'IMP' : 'TASK'}-{String(t.ticket_number).padStart(4, '0')}
                  </span>
                  <span style={{ fontSize: '0.78rem' }}>{TYPE_ICON[t.type]}</span>
                  <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{t.title}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: PRIORITY_COLOR[t.priority], background: PRIORITY_COLOR[t.priority] + '18', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>{t.priority}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: STATUS_COLOR[t.status] ?? '#64748b', background: (STATUS_COLOR[t.status] ?? '#64748b') + '18', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>{t.status.replace('_', ' ')}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>{new Date(t.created_at).toLocaleDateString()}</span>
                  <button onClick={() => deleteTicket(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem', padding: 0, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'devlog' && (
        <div style={{ flex: 1, padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setCreatingLog(true)} style={{ padding: '0.5rem 1.125rem', background: col, color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add Entry
            </button>
          </div>

          {devLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              No dev log entries yet. <button onClick={() => setCreatingLog(true)} style={{ background: 'none', border: 'none', color: col, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Add the first entry.</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 800 }}>
              {devLogs.map(log => (
                <div key={log.id} style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: '1.25rem', borderLeft: `4px solid ${LOG_TYPE_COLOR[log.log_type] ?? col}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.625rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: LOG_TYPE_COLOR[log.log_type] ?? col, background: (LOG_TYPE_COLOR[log.log_type] ?? col) + '15', padding: '2px 8px', borderRadius: '4px' }}>
                          {LOG_TYPE_ICON[log.log_type]} {log.log_type}
                        </span>
                        {log.version && (
                          <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                            {log.version}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{log.title}</h3>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        {log.author_name ?? 'Unknown'} · {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <button onClick={() => deleteLog(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '0.9rem', padding: 0, flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>🗑</button>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{log.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'analytics' && (
        <div style={{ flex: 1, padding: '1.5rem 2rem', maxWidth: 960 }}>
          <AnalyticsTab projectId={project.id} />
        </div>
      )}

      {/* Create ticket inline modal */}
      {creatingTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 580, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ background: '#0d0d14', padding: '1.125rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '1rem 1rem 0 0' }}>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1rem', margin: 0 }}>New Ticket — {project.name}</h2>
              <button onClick={() => setCreatingTicket(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={submitTicket} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {(['bug', 'feature', 'improvement', 'task'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setTType(t)} style={{ flex: 1, padding: '0.45rem 0.25rem', border: `2px solid ${tType === t ? col : '#e2e8f0'}`, borderRadius: '0.375rem', background: tType === t ? col + '12' : 'white', color: tType === t ? col : '#6b778c', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {TYPE_ICON[t]} {t}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label style={fLbl}>Priority<select value={tPriority} onChange={e => setTPriority(e.target.value)} style={fInp}>
                  <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select></label>
              </div>
              <label style={fLbl}>Title *<input required value={tTitle} onChange={e => setTTitle(e.target.value)} style={fInp} placeholder="Describe the issue or feature…" /></label>
              <label style={fLbl}>Description<textarea value={tDesc} onChange={e => setTDesc(e.target.value)} rows={2} style={{ ...fInp, resize: 'vertical' }} /></label>
              {tType === 'bug' && (<>
                <label style={fLbl}>Steps to Reproduce<textarea value={tSteps} onChange={e => setTSteps(e.target.value)} rows={3} placeholder={'1. ...\n2. ...'} style={{ ...fInp, resize: 'vertical' }} /></label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <label style={{ ...fLbl, flex: 1 }}>Expected<textarea value={tExpected} onChange={e => setTExpected(e.target.value)} rows={2} style={{ ...fInp, resize: 'vertical' }} /></label>
                  <label style={{ ...fLbl, flex: 1 }}>Actual<textarea value={tActual} onChange={e => setTActual(e.target.value)} rows={2} style={{ ...fInp, resize: 'vertical' }} /></label>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <label style={{ ...fLbl, flex: 1 }}>Environment<input value={tEnv} onChange={e => setTEnv(e.target.value)} placeholder="Win 11, Chrome 120" style={fInp} /></label>
                  <label style={{ ...fLbl, flex: 1 }}>Build<input value={tBuild} onChange={e => setTBuild(e.target.value)} placeholder="v0.4.2" style={fInp} /></label>
                </div>
              </>)}
              {(tType === 'feature' || tType === 'improvement') && (<>
                <label style={fLbl}>User Story<textarea value={tUserStory} onChange={e => setTUserStory(e.target.value)} rows={2} placeholder="As a user, I want to…" style={{ ...fInp, resize: 'vertical' }} /></label>
                <label style={fLbl}>Acceptance Criteria<textarea value={tAC} onChange={e => setTAC(e.target.value)} rows={3} placeholder={'- [ ] ...'} style={{ ...fInp, resize: 'vertical' }} /></label>
              </>)}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button type="button" onClick={() => setCreatingTicket(false)} style={{ padding: '0.45rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={tSubmitting} style={{ padding: '0.45rem 1.125rem', background: col, color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', opacity: tSubmitting ? 0.7 : 1 }}>{tSubmitting ? 'Creating…' : 'Create Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create dev log modal */}
      {creatingLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ background: '#0d0d14', padding: '1.125rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '1rem 1rem 0 0' }}>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1rem', margin: 0 }}>New Dev Log Entry</h2>
              <button onClick={() => setCreatingLog(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={submitLog} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label style={{ ...fLbl, flex: 1 }}>
                  Type
                  <select value={lType} onChange={e => setLType(e.target.value)} style={fInp}>
                    {['feature', 'fix', 'update', 'release', 'breaking', 'hotfix'].map(t => (
                      <option key={t} value={t}>{LOG_TYPE_ICON[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </label>
                <label style={{ ...fLbl, flex: 1 }}>
                  Version
                  <input value={lVersion} onChange={e => setLVersion(e.target.value)} placeholder="v1.0.0" style={fInp} />
                </label>
              </div>
              <label style={fLbl}>
                Title *
                <input required value={lTitle} onChange={e => setLTitle(e.target.value)} placeholder="What changed?" style={fInp} />
              </label>
              <label style={fLbl}>
                Details *
                <textarea required value={lContent} onChange={e => setLContent(e.target.value)} rows={5} placeholder="Describe what was added, fixed, or changed…" style={{ ...fInp, resize: 'vertical' }} />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setCreatingLog(false)} style={{ padding: '0.45rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={lSubmitting} style={{ padding: '0.45rem 1.125rem', background: col, color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', opacity: lSubmitting ? 0.7 : 1 }}>{lSubmitting ? 'Saving…' : 'Add Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const fLbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: '#374151' }
const fInp: React.CSSProperties = { padding: '0.5rem 0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.84rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box' }
