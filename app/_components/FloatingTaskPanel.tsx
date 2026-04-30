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

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-400',
  critical: 'bg-red-500',
}

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
}

export default function FloatingTaskPanel() {
  const { isSignedIn, isLoaded } = useAuth()
  const [open, setOpen] = useState(false)
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([])
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [apiError, setApiError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isSignedIn) return
    fetchPersonal()
    fetchAssigned()
  }, [isSignedIn])

  useEffect(() => {
    if (open && adding) inputRef.current?.focus()
  }, [open, adding])

  async function fetchPersonal() {
    try {
      const res = await fetch('/api/personal-tasks')
      if (res.ok) {
        const json = await res.json()
        setPersonalTasks(json.tasks)
        setApiError(false)
      } else {
        setApiError(true)
      }
    } catch {
      setApiError(true)
    }
  }

  async function fetchAssigned() {
    try {
      const res = await fetch('/api/assigned-tasks')
      if (res.ok) {
        const json = await res.json()
        setAssignedTasks(json.tasks)
      }
    } catch {
      // silently fail — assigned tasks section just stays empty
    }
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
      setApiError(false)
    } else {
      setApiError(true)
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

  // Don't render anything until Clerk has finished loading
  if (!isLoaded || !isSignedIn) return null

  const incomplete = personalTasks.filter(t => !t.completed)
  const completed = personalTasks.filter(t => t.completed)
  const totalPending = incomplete.length + assignedTasks.length

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Expanded panel */}
      {open && (
        <div
          className="w-80 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ background: '#1e293b', border: '1px solid #334155', maxHeight: '520px' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
            style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}
            onClick={() => setOpen(false)}
          >
            <span className="text-sm font-semibold text-white">My Tasks</span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
            {/* Migration warning */}
            {apiError && (
              <div className="mx-3 mt-3 px-3 py-2 rounded-lg text-xs text-yellow-300" style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)' }}>
                Personal tasks table not found — run migration{' '}
                <code className="font-mono">014_personal_tasks.sql</code> in Supabase.
              </div>
            )}

            {/* ── Personal Tasks ── */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Personal
                </span>
                {!apiError && (
                  <button
                    onClick={() => setAdding(v => !v)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    + Add
                  </button>
                )}
              </div>

              {adding && !apiError && (
                <form onSubmit={addTask} className="mb-2">
                  <input
                    ref={inputRef}
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Task name…"
                    className="w-full rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500"
                    style={{ background: '#0f172a', border: '1px solid #475569' }}
                    onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setNewTitle('') } }}
                  />
                </form>
              )}

              {!apiError && incomplete.length === 0 && !adding && (
                <p className="text-xs text-slate-500 py-1">No personal tasks — add one!</p>
              )}

              {!apiError && (
                <ul className="space-y-1">
                  {incomplete.map(task => (
                    <li key={task.id} className="flex items-start gap-2 group">
                      <button
                        onClick={() => toggleComplete(task)}
                        className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-slate-500 hover:border-indigo-400 transition-colors flex items-center justify-center"
                      />
                      <span className="flex-1 text-sm text-slate-200 leading-snug">{task.title}</span>
                      <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-slate-400'}`} />
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 text-xs flex-shrink-0"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!apiError && completed.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowCompleted(v => !v)}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showCompleted ? '▾' : '▸'} {completed.length} completed
                  </button>
                  {showCompleted && (
                    <ul className="mt-1 space-y-1">
                      {completed.map(task => (
                        <li key={task.id} className="flex items-start gap-2 group">
                          <button
                            onClick={() => toggleComplete(task)}
                            className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-indigo-500 bg-indigo-500 flex items-center justify-center"
                          >
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <span className="flex-1 text-sm text-slate-500 line-through leading-snug">{task.title}</span>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 text-xs flex-shrink-0"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* ── Assigned Tasks (project) ── */}
            <div
              className="px-4 pt-3 pb-3 mt-1"
              style={{ borderTop: '1px solid #334155', background: 'rgba(15,23,42,0.4)' }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Assigned to me
              </span>

              {assignedTasks.length === 0 ? (
                <p className="text-xs text-slate-500">No open tasks assigned to you.</p>
              ) : (
                <ul className="space-y-2">
                  {assignedTasks.map(task => (
                    <li key={task.id} className="flex items-start gap-2">
                      <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200 leading-snug truncate">{task.title}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {task.projects?.name ?? 'Unknown project'} · {STATUS_LABEL[task.status] ?? task.status}
                        </p>
                      </div>
                      {task.due_date && (
                        <span className="flex-shrink-0 text-xs text-slate-400 whitespace-nowrap">
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
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-white shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: open ? '#4f46e5' : '#1e293b', border: '1px solid #334155' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        My Tasks
        {totalPending > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center px-1"
            style={{ background: '#ef4444' }}
          >
            {totalPending > 99 ? '99+' : totalPending}
          </span>
        )}
      </button>
    </div>
  )
}
