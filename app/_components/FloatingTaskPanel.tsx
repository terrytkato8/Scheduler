'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

type PersonalTask = {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  position: number
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

const PANEL_W = 340
const PANEL_H = 540
const DRAG_THRESHOLD = 5

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export default function FloatingTaskPanel() {
  const { isSignedIn, isLoaded } = useAuth()
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  // Separate persisted positions for the panel and collapsed button
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 })

  // Panel drag
  const [panelDragging, setPanelDragging] = useState(false)
  const panelDragOffset = useRef({ x: 0, y: 0 })
  const panelDragStart = useRef({ x: 0, y: 0 })
  const panelDidDrag = useRef(false)

  // Button drag
  const [btnDragging, setBtnDragging] = useState(false)
  const btnDragOffset = useRef({ x: 0, y: 0 })
  const btnDragStart = useRef({ x: 0, y: 0 })
  const btnDidDrag = useRef(false)

  // Task data
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([])
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([])
  const personalTasksRef = useRef(personalTasks)
  personalTasksRef.current = personalTasks

  // Add-task form
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Task reorder drag
  const [taskDragIdx, setTaskDragIdx] = useState<number | null>(null)
  const [taskDropIdx, setTaskDropIdx] = useState<number | null>(null)
  const taskListRef = useRef<HTMLUListElement>(null)
  const taskDragIdxRef = useRef<number | null>(null)
  const taskDropIdxRef = useRef<number | null>(null)

  const [showCompleted, setShowCompleted] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Init positions after mount (window not available during SSR)
  useEffect(() => {
    try {
      const sp = localStorage.getItem('ftp-panel-pos')
      const sb = localStorage.getItem('ftp-btn-pos')
      setPanelPos(sp
        ? JSON.parse(sp)
        : { x: 24, y: Math.max(20, window.innerHeight - PANEL_H - 24) }
      )
      setBtnPos(sb
        ? JSON.parse(sb)
        : { x: 24, y: window.innerHeight - 56 }
      )
    } catch {
      setPanelPos({ x: 24, y: Math.max(20, window.innerHeight - PANEL_H - 24) })
      setBtnPos({ x: 24, y: window.innerHeight - 56 })
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

  // Panel drag effect
  useEffect(() => {
    if (!panelDragging) return
    function onMove(e: MouseEvent) {
      if (Math.hypot(e.clientX - panelDragStart.current.x, e.clientY - panelDragStart.current.y) > DRAG_THRESHOLD)
        panelDidDrag.current = true
      setPanelPos({
        x: clamp(e.clientX - panelDragOffset.current.x, 0, window.innerWidth - PANEL_W),
        y: clamp(e.clientY - panelDragOffset.current.y, 0, window.innerHeight - 50),
      })
    }
    function onUp() {
      setPanelDragging(false)
      setPanelPos(prev => { localStorage.setItem('ftp-panel-pos', JSON.stringify(prev)); return prev })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [panelDragging])

  // Button drag effect
  useEffect(() => {
    if (!btnDragging) return
    function onMove(e: MouseEvent) {
      if (Math.hypot(e.clientX - btnDragStart.current.x, e.clientY - btnDragStart.current.y) > DRAG_THRESHOLD)
        btnDidDrag.current = true
      setBtnPos({
        x: clamp(e.clientX - btnDragOffset.current.x, 0, window.innerWidth - 160),
        y: clamp(e.clientY - btnDragOffset.current.y, 0, window.innerHeight - 44),
      })
    }
    function onUp() {
      setBtnDragging(false)
      setBtnPos(prev => { localStorage.setItem('ftp-btn-pos', JSON.stringify(prev)); return prev })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [btnDragging])

  // Task reorder drag effect
  useEffect(() => {
    if (taskDragIdx === null) return
    function onMove(e: MouseEvent) {
      if (!taskListRef.current) return
      const rows = Array.from(taskListRef.current.querySelectorAll<HTMLElement>('[data-task-row]'))
      let newDrop = rows.length - 1
      for (let i = 0; i < rows.length; i++) {
        const rect = rows[i].getBoundingClientRect()
        if (e.clientY <= rect.top + rect.height / 2) { newDrop = i; break }
      }
      taskDropIdxRef.current = newDrop
      setTaskDropIdx(newDrop)
    }
    function onUp() {
      const from = taskDragIdxRef.current
      const to = taskDropIdxRef.current
      if (from !== null && to !== null && from !== to) {
        const incomplete = personalTasksRef.current.filter(t => !t.completed)
        const completed = personalTasksRef.current.filter(t => t.completed)
        const next = [...incomplete]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        const updated = next.map((t, i) => ({ ...t, position: i }))
        setPersonalTasks([...updated, ...completed])
        updated.forEach(t =>
          fetch(`/api/personal-tasks/${t.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: t.position }),
          })
        )
      }
      setTaskDragIdx(null); setTaskDropIdx(null)
      taskDragIdxRef.current = null; taskDropIdxRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [taskDragIdx])

  function startPanelDrag(e: React.MouseEvent) {
    e.preventDefault()
    panelDragOffset.current = { x: e.clientX - panelPos.x, y: e.clientY - panelPos.y }
    panelDragStart.current = { x: e.clientX, y: e.clientY }
    panelDidDrag.current = false
    setPanelDragging(true)
  }

  function startBtnDrag(e: React.MouseEvent) {
    e.preventDefault()
    btnDragOffset.current = { x: e.clientX - btnPos.x, y: e.clientY - btnPos.y }
    btnDragStart.current = { x: e.clientX, y: e.clientY }
    btnDidDrag.current = false
    setBtnDragging(true)
  }

  function startTaskDrag(e: React.MouseEvent, idx: number) {
    e.preventDefault()
    e.stopPropagation()
    taskDragIdxRef.current = idx
    taskDropIdxRef.current = idx
    setTaskDragIdx(idx)
    setTaskDropIdx(idx)
  }

  async function fetchPersonal() {
    try {
      const res = await fetch('/api/personal-tasks')
      const json = await res.json()
      if (res.ok) { setPersonalTasks(json.tasks); setApiError(null) }
      else setApiError(json.error ?? `HTTP ${res.status}`)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Network error')
    }
  }

  async function fetchAssigned() {
    try {
      const res = await fetch('/api/assigned-tasks')
      if (res.ok) { const j = await res.json(); setAssignedTasks(j.tasks) }
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
    if (res.ok)
      setPersonalTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/personal-tasks/${id}`, { method: 'DELETE' })
    if (res.ok) setPersonalTasks(prev => prev.filter(t => t.id !== id))
  }

  async function setDueDate(task: PersonalTask, date: string | null) {
    const res = await fetch(`/api/personal-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ due_date: date }),
    })
    if (res.ok)
      setPersonalTasks(prev => prev.map(t => t.id === task.id ? { ...t, due_date: date } : t))
  }

  if (!isLoaded || !isSignedIn || !ready) return null

  const incomplete = personalTasks.filter(t => !t.completed)
  const completed = personalTasks.filter(t => t.completed)
  const totalPending = incomplete.length + assignedTasks.length

  // ── Collapsed button ──
  if (!open) {
    return (
      <div style={{ position: 'fixed', left: btnPos.x, top: btnPos.y, zIndex: 9999, userSelect: 'none' }}>
        <button
          onMouseDown={startBtnDrag}
          onClick={() => { if (!btnDidDrag.current) setOpen(true) }}
          title="Click to open · Drag to reposition"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 16px', borderRadius: '9999px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid #475569',
            color: '#f1f5f9', fontSize: '13px', fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2)',
            cursor: btnDragging ? 'grabbing' : 'grab',
            position: 'relative',
          }}
        >
          {/* Grip dots — signal draggability */}
          <svg width="10" height="14" viewBox="0 0 10 14" fill="#6366f1">
            <circle cx="2.5" cy="2" r="1.5"/><circle cx="7.5" cy="2" r="1.5"/>
            <circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/>
            <circle cx="2.5" cy="12" r="1.5"/><circle cx="7.5" cy="12" r="1.5"/>
          </svg>
          <svg width="14" height="14" fill="none" stroke="#a5b4fc" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          My Tasks
          {totalPending > 0 && (
            <span style={{
              position: 'absolute', top: '-8px', right: '-8px',
              minWidth: '20px', height: '20px', borderRadius: '9999px',
              background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              border: '2px solid #0f172a',
            }}>
              {totalPending > 99 ? '99+' : totalPending}
            </span>
          )}
        </button>
      </div>
    )
  }

  // ── Open panel ──
  return (
    <div
      style={{
        position: 'fixed', left: panelPos.x, top: panelPos.y, zIndex: 9999,
        width: `${PANEL_W}px`, maxHeight: `${PANEL_H}px`,
        display: 'flex', flexDirection: 'column',
        borderRadius: '14px', overflow: 'hidden',
        background: '#1e293b', border: '1px solid #334155',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
        userSelect: panelDragging ? 'none' : undefined,
      }}
    >
      {/* ── Header / drag handle ── */}
      <div
        onMouseDown={startPanelDrag}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px 10px 14px', flexShrink: 0,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderBottom: '1px solid #334155',
          cursor: panelDragging ? 'grabbing' : 'grab',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Prominent drag grip */}
          <div
            title="Drag to reposition"
            style={{
              padding: '5px 4px', borderRadius: '5px',
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <svg width="12" height="10" viewBox="0 0 12 10" fill="#818cf8">
              <circle cx="2" cy="2" r="1.5"/><circle cx="6" cy="2" r="1.5"/><circle cx="10" cy="2" r="1.5"/>
              <circle cx="2" cy="8" r="1.5"/><circle cx="6" cy="8" r="1.5"/><circle cx="10" cy="8" r="1.5"/>
            </svg>
          </div>
          <svg width="14" height="14" fill="none" stroke="#a5b4fc" strokeWidth="2" viewBox="0 0 24 24">
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
        {/* Collapse — chevron down, not × */}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => setOpen(false)}
          title="Collapse"
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px', color: '#94a3b8', cursor: 'pointer',
            padding: '5px 7px', display: 'flex', alignItems: 'center',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ overflowY: 'auto', flex: 1, scrollbarWidth: 'thin' }}>

        {apiError && (
          <div style={{
            margin: '12px 12px 0', padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)',
            color: '#fde68a', fontSize: '11px',
          }}>
            <strong>DB error:</strong> {apiError}
          </div>
        )}

        {/* ── Personal tasks ── */}
        <div style={{ padding: '12px 14px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
              Personal
            </span>
            {!apiError && (
              <button
                onClick={() => setAdding(v => !v)}
                style={{
                  fontSize: '11px', color: '#a5b4fc',
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '5px', cursor: 'pointer', padding: '2px 8px',
                }}
              >
                + Add task
              </button>
            )}
          </div>

          {adding && !apiError && (
            <form onSubmit={addTask} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                ref={inputRef}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Task name…"
                style={{
                  flex: 1, minWidth: 0, padding: '7px 10px', borderRadius: '7px',
                  background: '#0f172a', border: '1px solid #475569',
                  color: '#f1f5f9', fontSize: '13px', outline: 'none',
                }}
                onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setNewTitle('') } }}
              />
              <button
                type="submit"
                title="Add task"
                style={{
                  flexShrink: 0, width: '33px', height: '33px', borderRadius: '7px',
                  background: '#6366f1', border: 'none', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          )}

          {!apiError && incomplete.length === 0 && !adding && (
            <p style={{ fontSize: '12px', color: '#475569', margin: '2px 0 8px' }}>No tasks yet — add one!</p>
          )}

          {!apiError && (
            <ul
              ref={taskListRef}
              style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}
            >
              {incomplete.map((task, idx) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  idx={idx}
                  isDragging={taskDragIdx === idx}
                  isDropTarget={taskDropIdx === idx && taskDragIdx !== null && taskDragIdx !== idx}
                  checked={false}
                  onCheck={() => toggleComplete(task)}
                  onDelete={() => deleteTask(task.id)}
                  onSetDueDate={date => setDueDate(task, date)}
                  onDragStart={startTaskDrag}
                />
              ))}
            </ul>
          )}

          {!apiError && completed.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <button
                onClick={() => setShowCompleted(v => !v)}
                style={{ fontSize: '11px', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showCompleted ? '▾' : '▸'} {completed.length} completed
              </button>
              {showCompleted && (
                <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {completed.map((task, idx) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      idx={idx}
                      isDragging={false}
                      isDropTarget={false}
                      checked={true}
                      onCheck={() => toggleComplete(task)}
                      onDelete={() => deleteTask(task.id)}
                      onSetDueDate={date => setDueDate(task, date)}
                      onDragStart={() => {}}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Assigned to me ── */}
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #334155', background: 'rgba(15,23,42,0.4)' }}>
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
                    marginTop: '5px', flexShrink: 0, width: '7px', height: '7px', borderRadius: '50%',
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

// ── Task row sub-component ──

function formatRelativeDate(d: string) {
  const date = new Date(d + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.floor((date.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TaskRow({
  task, idx, isDragging, isDropTarget, checked, onCheck, onDelete, onSetDueDate, onDragStart,
}: {
  task: PersonalTask
  idx: number
  isDragging: boolean
  isDropTarget: boolean
  checked: boolean
  onCheck: () => void
  onDelete: () => void
  onSetDueDate: (date: string | null) => void
  onDragStart: (e: React.MouseEvent, idx: number) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const isOverdue = !checked && task.due_date
    && new Date(task.due_date + 'T00:00:00') < new Date(new Date().setHours(0, 0, 0, 0))

  return (
    <li
      data-task-row
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowDatePicker(false) }}
      style={{
        display: 'flex', flexDirection: 'column', gap: '4px',
        padding: '5px 6px', borderRadius: '7px',
        background: isDragging
          ? 'rgba(99,102,241,0.12)'
          : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: isDropTarget
          ? '1px solid #6366f1'
          : isDragging ? '1px dashed rgba(99,102,241,0.4)' : '1px solid transparent',
        opacity: isDragging ? 0.55 : 1,
        transition: 'background 0.1s',
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

        {/* Drag handle (incomplete tasks only) */}
        {!checked ? (
          <div
            onMouseDown={e => onDragStart(e, idx)}
            title="Drag to reorder"
            style={{
              flexShrink: 0, cursor: 'grab', padding: '1px 2px',
              opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', color: '#64748b',
            }}
          >
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <circle cx="2.5" cy="1.5" r="1.2"/><circle cx="7.5" cy="1.5" r="1.2"/>
              <circle cx="2.5" cy="6" r="1.2"/><circle cx="7.5" cy="6" r="1.2"/>
              <circle cx="2.5" cy="10.5" r="1.2"/><circle cx="7.5" cy="10.5" r="1.2"/>
            </svg>
          </div>
        ) : (
          <div style={{ width: '14px', flexShrink: 0 }} />
        )}

        {/* Checkbox */}
        <button
          onClick={onCheck}
          style={{
            flexShrink: 0, width: '16px', height: '16px', borderRadius: '4px',
            border: checked ? 'none' : '1.5px solid #475569',
            background: checked ? '#6366f1' : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {checked && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Title */}
        <span style={{
          flex: 1, fontSize: '13px', lineHeight: '1.4', wordBreak: 'break-word',
          color: checked ? '#475569' : '#cbd5e1',
          textDecoration: checked ? 'line-through' : 'none',
        }}>
          {task.title}
        </span>

        {/* Due date badge — click to edit */}
        {task.due_date && !showDatePicker && (
          <button
            onClick={() => setShowDatePicker(true)}
            style={{
              flexShrink: 0, fontSize: '10px', whiteSpace: 'nowrap',
              padding: '2px 6px', borderRadius: '4px', cursor: 'pointer',
              color: isOverdue ? '#f87171' : '#94a3b8',
              background: isOverdue ? 'rgba(248,113,113,0.1)' : 'rgba(148,163,184,0.08)',
              border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.3)' : 'rgba(148,163,184,0.2)'}`,
            }}
          >
            {formatRelativeDate(task.due_date)}
          </button>
        )}

        {/* "Set date" ghost button — shows on hover if no date */}
        {!task.due_date && hovered && !showDatePicker && !checked && (
          <button
            onClick={() => setShowDatePicker(true)}
            style={{
              flexShrink: 0, fontSize: '10px', color: '#475569', whiteSpace: 'nowrap',
              background: 'none', border: '1px solid #334155',
              borderRadius: '4px', padding: '2px 6px', cursor: 'pointer',
            }}
          >
            + ETA
          </button>
        )}

        {/* Delete */}
        <button
          onClick={onDelete}
          title="Delete"
          style={{
            flexShrink: 0, background: 'none', border: 'none',
            color: '#ef4444', cursor: 'pointer', padding: '0 1px', lineHeight: 1,
            opacity: hovered ? 0.7 : 0, transition: 'opacity 0.15s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Inline date picker */}
      {showDatePicker && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingLeft: '36px' }}>
          <input
            type="date"
            defaultValue={task.due_date ?? ''}
            autoFocus
            onChange={e => { onSetDueDate(e.target.value || null); setShowDatePicker(false) }}
            onKeyDown={e => { if (e.key === 'Escape') setShowDatePicker(false) }}
            style={{
              fontSize: '12px', padding: '3px 7px', borderRadius: '5px',
              background: '#0f172a', border: '1px solid #475569',
              color: '#f1f5f9', outline: 'none', cursor: 'pointer',
            }}
          />
          {task.due_date && (
            <button
              onClick={() => { onSetDueDate(null); setShowDatePicker(false) }}
              style={{ fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </li>
  )
}
