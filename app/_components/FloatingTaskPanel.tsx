'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

type PersonalTask = {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
}

type AssignedTask = {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: string
  due_date: string | null
  project_id: string
  projects: { name: string } | null
}

const PRIORITY_COLOR: Record<string, string> = {
  low: '#94a3b8',
  medium: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
}

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
}

const DRAG_THRESHOLD = 5
const PANEL_W = 320
const PANEL_H = 500

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function getDefaultPos() {
  if (typeof window === 'undefined') return { x: 40, y: 40 }
  return {
    x: window.innerWidth - PANEL_W - 24,
    y: window.innerHeight - PANEL_H - 24,
  }
}

export default function FloatingTaskPanel() {
  const { isSignedIn, isLoaded } = useAuth()

  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [ready, setReady] = useState(false)
  const [dragging, setDragging] = useState(false)

  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([])
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const dragStartMouse = useRef({ x: 0, y: 0 })
  const didDrag = useRef(false)

  // Set position client-side only
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ftp-pos')
      if (saved) {
        const p = JSON.parse(saved) as { x: number; y: number }
        setPos(p)
      } else {
        setPos(getDefaultPos())
      }
    } catch {
      setPos(getDefaultPos())
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!isSignedIn) return
    fetchPersonal()
    fetchAssigned()
  }, [isSignedIn])

  useEffect(() => {
    if (open && adding) inputRef.current?.focus()
  }, [open, adding])

  // Drag logic
  useEffect(() => {
    if (!dragging) return
    function onMove(e: MouseEvent) {
      const dx = e.clientX - dragStartMouse.current.x
      const dy = e.clientY - dragStartMouse.current.y
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) didDrag.current = true

      const x = clamp(e.clientX - dragOffset.current.x, 0, window.innerWidth - PANEL_W)
      const y = clamp(e.clientY - dragOffset.current.y, 0, window.innerHeight - 40)
      setPos({ x, y })
    }
    function onUp() {
      setDragging(false)
      setPos(prev => {
        localStorage.setItem('ftp-pos', JSON.stringify(prev))
        return prev
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  function startDrag(e: React.MouseEvent) {
    e.preventDefault()
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    dragStartMouse.current = { x: e.clientX, y: e.clientY }
    didDrag.current = false
    setDragging(true)
  }

  async function fetchPersonal() {
    try {
      const res = await fetch('/api/personal-tasks')
      const json = await res.json()
      if (res.ok) {
        setPersonalTasks(json.tasks)
        setApiError(null)
      } else {
        setApiError(json.error ?? `HTTP ${res.status}`)
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Network error')
    }
  }

  async function fetchAssigned() {
    try {
      const res = await fetch('/api/assigned-tasks')
      if (res.ok) {
        const json = await res.json()
        setAssignedTasks(json.tasks)
      }
    } catch {}
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    const res = await fetch('/api/personal-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    })
    if (res.ok) {
      const json = await res.json()
      setPersonalTasks(prev => [...prev, json.task])
      setNewTitle('')
      setApiError(null)
    } else {
      const json = await res.json().catch(() => ({}))
      setApiError(json.error ?? `HTTP ${res.status}`)
    }
  }

  async function toggleComplete(task: PersonalTask) {
    const res = await fetch(`/api/personal-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    })
    if (res.ok) {
      setPersonalTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, completed: !t.completed } : t))
      )
    }
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/personal-tasks/${id}`, { method: 'DELETE' })
    if (res.ok) setPersonalTasks(prev => prev.filter(t => t.id !== id))
  }

  if (!isLoaded || !isSignedIn || !ready) return null

  const incomplete = personalTasks.filter(t => !t.completed)
  const completed = personalTasks.filter(t => t.completed)
  const totalPending = incomplete.length + assignedTasks.length

  if (!open) {
    return (
      <div
        style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, userSelect: 'none' }}
      >
        <button
          onMouseDown={startDrag}
          onClick={() => { if (!didDrag.current) setOpen(true) }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '9999px',
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#f1f5f9',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            cursor: dragging ? 'grabbing' : 'pointer',
            position: 'relative',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          My Tasks
          {totalPending > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              minWidth: '18px', height: '18px', borderRadius: '9999px',
              background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            }}>
              {totalPending > 99 ? '99+' : totalPending}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
        width: `${PANEL_W}px`,
        userSelect: dragging ? 'none' : undefined,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        background: '#1e293b',
        border: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: `${PANEL_H}px`,
      }}
    >
      {/* Header — drag handle */}
      <div
        onMouseDown={startDrag}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: '#0f172a',
          borderBottom: '1px solid #334155',
          cursor: dragging ? 'grabbing' : 'grab',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Drag grip dots */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="#475569">
            <circle cx="3" cy="3" r="1.2"/><circle cx="9" cy="3" r="1.2"/>
            <circle cx="3" cy="6" r="1.2"/><circle cx="9" cy="6" r="1.2"/>
            <circle cx="3" cy="9" r="1.2"/><circle cx="9" cy="9" r="1.2"/>
          </svg>
          <svg width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>My Tasks</span>
          {totalPending > 0 && (
            <span style={{
              minWidth: '18px', height: '18px', borderRadius: '9999px',
              background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            }}>
              {totalPending}
            </span>
          )}
        </div>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => setOpen(false)}
          style={{
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', padding: '2px 4px', fontSize: '16px', lineHeight: 1,
          }}
          title="Close"
        >
          ×
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ overflowY: 'auto', flex: 1, scrollbarWidth: 'thin' }}>

        {/* Error banner */}
        {apiError && (
          <div style={{
            margin: '12px 12px 0', padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)',
            color: '#fde68a', fontSize: '11px',
          }}>
            <strong>DB error:</strong> {apiError}
          </div>
        )}

        {/* ── Personal ── */}
        <div style={{ padding: '12px 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
              Personal
            </span>
            {!apiError && (
              <button
                onClick={() => setAdding(v => !v)}
                style={{ fontSize: '11px', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                + Add
              </button>
            )}
          </div>

          {adding && !apiError && (
            <form onSubmit={addTask} style={{ marginBottom: '8px' }}>
              <input
                ref={inputRef}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Task name…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '6px 10px', borderRadius: '6px',
                  background: '#0f172a', border: '1px solid #475569',
                  color: '#f1f5f9', fontSize: '13px', outline: 'none',
                }}
                onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setNewTitle('') } }}
              />
            </form>
          )}

          {!apiError && incomplete.length === 0 && !adding && (
            <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0' }}>No personal tasks — add one!</p>
          )}

          {!apiError && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {incomplete.map(task => (
                <TaskRow
                  key={task.id}
                  title={task.title}
                  priorityColor={PRIORITY_COLOR[task.priority] ?? '#94a3b8'}
                  onCheck={() => toggleComplete(task)}
                  onDelete={() => deleteTask(task.id)}
                  checked={false}
                />
              ))}
            </ul>
          )}

          {!apiError && completed.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <button
                onClick={() => setShowCompleted(v => !v)}
                style={{ fontSize: '11px', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showCompleted ? '▾' : '▸'} {completed.length} completed
              </button>
              {showCompleted && (
                <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {completed.map(task => (
                    <TaskRow
                      key={task.id}
                      title={task.title}
                      priorityColor={PRIORITY_COLOR[task.priority] ?? '#94a3b8'}
                      onCheck={() => toggleComplete(task)}
                      onDelete={() => deleteTask(task.id)}
                      checked={true}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Assigned to me ── */}
        <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #334155', background: 'rgba(15,23,42,0.4)' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', display: 'block', marginBottom: '8px' }}>
            Assigned to me
          </span>

          {assignedTasks.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>No open tasks assigned to you.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {assignedTasks.map(task => (
                <li key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{
                    marginTop: '5px', flexShrink: 0,
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: PRIORITY_COLOR[task.priority] ?? '#94a3b8',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.projects?.name ?? 'Unknown'} · {STATUS_LABEL[task.status] ?? task.status}
                    </p>
                  </div>
                  {task.due_date && (
                    <span style={{ flexShrink: 0, fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskRow({
  title, priorityColor, checked, onCheck, onDelete,
}: {
  title: string
  priorityColor: string
  checked: boolean
  onCheck: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <li
      style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onCheck}
        style={{
          marginTop: '2px', flexShrink: 0,
          width: '15px', height: '15px', borderRadius: '3px',
          border: checked ? 'none' : '1.5px solid #475569',
          background: checked ? '#6366f1' : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {checked && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span style={{
        flex: 1, fontSize: '13px', lineHeight: '1.4',
        color: checked ? '#475569' : '#cbd5e1',
        textDecoration: checked ? 'line-through' : 'none',
      }}>
        {title}
      </span>
      <span style={{
        marginTop: '5px', flexShrink: 0,
        width: '7px', height: '7px', borderRadius: '50%',
        background: priorityColor,
      }} />
      <button
        onClick={onDelete}
        style={{
          flexShrink: 0, background: 'none', border: 'none',
          color: '#64748b', cursor: 'pointer', fontSize: '13px',
          padding: '0 2px', lineHeight: 1,
          opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
        }}
      >
        ✕
      </button>
    </li>
  )
}
