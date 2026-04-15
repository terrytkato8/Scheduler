'use client'

import React, { useState, useEffect } from 'react'
import TaskDrawer, { Task } from './TaskDrawer'

interface Sprint {
  id: string; name: string; start_date: string | null; end_date: string | null; status: string; goal: string | null
}
interface Milestone {
  id: string; name: string; due_date: string | null; status: string; description: string | null
}

interface Props {
  projectId: string
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
}

const PRIORITY_COLOR: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
}
const PRIORITY_ROW_BG: Record<string, string> = {
  low: '#f0fdf4', medium: '#fffbeb', high: '#fff7ed', critical: '#fef2f2',
}
const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
}
const STATUS_COLOR: Record<string, string> = {
  backlog: '#94a3b8', todo: '#3b82f6', in_progress: '#f59e0b', in_review: '#8b5cf6', done: '#10b981',
}
const STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done']

export default function StandardBoard({ projectId, tasks, onTasksChange }: Props) {
  const [tab, setTab] = useState<'list' | 'roadmap' | 'sprints'>('list')
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [drawerTask, setDrawerTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showSprintForm, setShowSprintForm] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [sprintName, setSprintName] = useState('')
  const [sprintEnd, setSprintEnd] = useState('')
  const [milestoneName, setMilestoneName] = useState('')
  const [milestoneDate, setMilestoneDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  useEffect(() => {
    fetch(`/api/projects/${projectId}/sprints`).then(r => r.json()).then(d => setSprints(d.sprints ?? []))
    fetch(`/api/projects/${projectId}/milestones`).then(r => r.json()).then(d => setMilestones(d.milestones ?? []))
  }, [projectId])

  const handleUpdate = (updated: Task) => {
    onTasksChange(tasks.map(t => t.id === updated.id ? updated : t))
    setDrawerTask(updated)
  }
  const handleDelete = (id: string) => {
    onTasksChange(tasks.filter(t => t.id !== id))
    setDrawerTask(null)
  }

  const updateStatus = async (task: Task, s: string) => {
    onTasksChange(tasks.map(t => t.id === task.id ? { ...t, status: s } : t))
    await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) })
  }

  const quickCreate = async () => {
    if (!newTaskTitle.trim()) { setNewTask(false); return }
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle.trim(), status: 'backlog', priority: 'medium' }),
    })
    if (res.ok) {
      const d = await res.json()
      onTasksChange([...tasks, d.task])
    }
    setNewTaskTitle(''); setNewTask(false)
  }

  const createSprint = async () => {
    if (!sprintName.trim()) return
    const res = await fetch(`/api/projects/${projectId}/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sprintName, end_date: sprintEnd || null }),
    })
    if (res.ok) { const d = await res.json(); setSprints(p => [...p, d.sprint]) }
    setSprintName(''); setSprintEnd(''); setShowSprintForm(false)
  }

  const createMilestone = async () => {
    if (!milestoneName.trim()) return
    const res = await fetch(`/api/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: milestoneName, due_date: milestoneDate || null }),
    })
    if (res.ok) { const d = await res.json(); setMilestones(p => [...p, d.milestone]) }
    setMilestoneName(''); setMilestoneDate(''); setShowMilestoneForm(false)
  }

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    return true
  })

  const activeSprint = sprints.find(s => s.status === 'active') ?? sprints[0]
  const sprintTasks = activeSprint ? tasks.filter(t => t.sprint_id === activeSprint.id) : tasks

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', background: '#f1f5f9', borderRadius: '0.5rem', padding: '3px' }}>
          {(['list', 'roadmap', 'sprints'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.3rem 0.75rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: tab === t ? 700 : 400,
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? '#172b4d' : '#64748b',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {tab === 'list' && (
          <>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={filterSel}>
              <option value="all">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={filterSel}>
              <option value="all">All priorities</option>
              {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </>
        )}

        <button
          onClick={() => setNewTask(true)}
          style={{ marginLeft: 'auto', padding: '0.375rem 0.875rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          + New task
        </button>
      </div>

      {/* Quick create row */}
      {newTask && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.625rem', background: 'white', borderRadius: '0.5rem', border: '2px solid #e85d7b' }}>
          <input
            autoFocus
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') quickCreate(); if (e.key === 'Escape') { setNewTask(false); setNewTaskTitle('') } }}
            placeholder="Task title… (Enter to create)"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem', fontFamily: 'inherit', color: '#172b4d' }}
          />
          <button onClick={quickCreate} style={{ padding: '0.3rem 0.75rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
          <button onClick={() => { setNewTask(false); setNewTaskTitle('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem' }}>×</button>
        </div>
      )}

      {/* List view */}
      {tab === 'list' && (
        <TaskTable tasks={filtered} onEdit={t => setDrawerTask(t)} onStatusChange={updateStatus} />
      )}

      {/* Roadmap view */}
      {tab === 'roadmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Milestones */}
          <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#172b4d' }}>🏁 Milestones</span>
              <button onClick={() => setShowMilestoneForm(s => !s)} style={ghostBtn}>+ Milestone</button>
            </div>
            {showMilestoneForm && (
              <div style={{ padding: '0.75rem 1.125rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input value={milestoneName} onChange={e => setMilestoneName(e.target.value)} placeholder="Milestone name" style={{ ...smallInp, flex: 2, minWidth: 160 }} />
                <input type="date" value={milestoneDate} onChange={e => setMilestoneDate(e.target.value)} style={{ ...smallInp, flex: 1, minWidth: 130 }} />
                <button onClick={createMilestone} style={pinkBtn}>Add</button>
              </div>
            )}
            {milestones.length === 0 ? (
              <p style={{ padding: '1.25rem', color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>No milestones yet.</p>
            ) : (
              <div style={{ padding: '0.75rem 1.125rem', display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                {milestones.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 0.875rem' }}>
                    <span>🏁</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#172b4d' }}>{m.name}</div>
                      {m.due_date && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(m.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All tasks in roadmap view */}
          <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#172b4d' }}>📋 All Tasks</span>
            </div>
            <TaskTable tasks={tasks} onEdit={t => setDrawerTask(t)} onStatusChange={updateStatus} />
          </div>
        </div>
      )}

      {/* Sprints view */}
      {tab === 'sprints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#172b4d', flex: 1 }}>
                ⚡ {activeSprint ? activeSprint.name : 'Sprint Backlog'}
              </span>
              {sprints.length > 1 && (
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {sprints.map(s => (
                    <span key={s.id} style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: s.id === activeSprint?.id ? '#fce4ec' : '#f1f5f9', color: s.id === activeSprint?.id ? '#e85d7b' : '#64748b', border: s.id === activeSprint?.id ? '1px solid #f48fb1' : '1px solid #e2e8f0' }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
              <button onClick={() => setShowSprintForm(s => !s)} style={ghostBtn}>+ Sprint</button>
            </div>

            {showSprintForm && (
              <div style={{ padding: '0.75rem 1.125rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input value={sprintName} onChange={e => setSprintName(e.target.value)} placeholder="Sprint name" style={{ ...smallInp, flex: 2, minWidth: 160 }} />
                <input type="date" value={sprintEnd} onChange={e => setSprintEnd(e.target.value)} style={{ ...smallInp, flex: 1, minWidth: 130 }} />
                <button onClick={createSprint} style={pinkBtn}>Create</button>
              </div>
            )}

            <TaskTable tasks={sprintTasks} onEdit={t => setDrawerTask(t)} onStatusChange={updateStatus} />
          </div>
        </div>
      )}

      <TaskDrawer
        task={drawerTask}
        projectId={projectId}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onClose={() => setDrawerTask(null)}
      />
    </>
  )
}

function TaskTable({ tasks, onEdit, onStatusChange }: { tasks: Task[]; onEdit: (t: Task) => void; onStatusChange: (t: Task, s: string) => void }) {
  if (tasks.length === 0) {
    return <p style={{ padding: '1.5rem', color: '#94a3b8', fontSize: '0.82rem', margin: 0, textAlign: 'center' }}>No tasks yet. Click &quot;+ New task&quot; to get started.</p>
  }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', padding: '0.4rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', gap: '1rem', alignItems: 'center' }}>
        <span>Title</span><span>Priority</span><span>Status</span><span>Due</span><span></span>
      </div>
      {tasks.map(task => (
        <div
          key={task.id}
          onClick={() => onEdit(task)}
          style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', padding: '0.6rem 1rem', borderBottom: '1px solid #f8fafc', background: PRIORITY_ROW_BG[task.priority] ?? 'white', alignItems: 'center', gap: '1rem', cursor: 'pointer', fontSize: '0.84rem', transition: 'background 0.1s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.background = PRIORITY_ROW_BG[task.priority] ?? 'white')}
        >
          <span style={{ fontWeight: 500, color: '#172b4d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.title}
            {task.external_url && <a href={task.external_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ marginLeft: '0.25rem', color: '#667eea', fontSize: '0.7rem' }}>↗</a>}
          </span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: PRIORITY_COLOR[task.priority], background: PRIORITY_COLOR[task.priority] + '18', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
            {task.priority}
          </span>
          <select
            value={task.status}
            onChange={e => { e.stopPropagation(); onStatusChange(task, e.target.value) }}
            onClick={e => e.stopPropagation()}
            style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '0.75rem', color: STATUS_COLOR[task.status] ?? '#64748b', cursor: 'pointer', fontWeight: 700, outline: 'none' }}
          >
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          </span>
          <button onClick={e => { e.stopPropagation(); onEdit(task) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px 4px', fontSize: '0.8rem' }}>✏️</button>
        </div>
      ))}
    </div>
  )
}

const ghostBtn: React.CSSProperties = { padding: '0.3rem 0.75rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }
const pinkBtn: React.CSSProperties = { padding: '0.35rem 0.875rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700 }
const smallInp: React.CSSProperties = { padding: '0.35rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.82rem', fontFamily: 'inherit', color: '#172b4d', outline: 'none' }
const filterSel: React.CSSProperties = { padding: '0.3rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.75rem', fontFamily: 'inherit', color: '#475569', outline: 'none', background: 'white' }
