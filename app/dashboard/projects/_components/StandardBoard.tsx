'use client'

import React, { useState, useEffect } from 'react'
import TaskModal from './TaskModal'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  assignee_id: string | null
  due_date: string | null
  stage: string | null
  external_url: string | null
  embed_url: string | null
  sprint_id: string | null
  milestone_id: string | null
}

interface Sprint {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  status: string
  goal: string | null
}

interface Milestone {
  id: string
  name: string
  due_date: string | null
  status: string
  description: string | null
}

interface Props {
  projectId: string
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
}

const PRIORITY_COLOR: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
}
const PRIORITY_ROW_BG: Record<string, string> = {
  low: '#f0fdf4', medium: '#fffbeb', high: '#fff7ed', critical: '#fef2f2',
}
const STATUS_COLOR: Record<string, string> = {
  backlog: '#94a3b8', todo: '#667eea', in_progress: '#f59e0b', in_review: '#8b5cf6', done: '#22c55e',
}
const STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done']

export default function StandardBoard({ projectId, tasks, onTasksChange }: Props) {
  const [tab, setTab] = useState<'roadmap' | 'sprints'>('roadmap')
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [modal, setModal] = useState<{ task?: Task | null } | null>(null)
  const [newSprintName, setNewSprintName] = useState('')
  const [newMilestoneName, setNewMilestoneName] = useState('')
  const [showNewSprint, setShowNewSprint] = useState(false)
  const [showNewMilestone, setShowNewMilestone] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/sprints`).then(r => r.json()).then(d => setSprints(d.sprints ?? []))
    fetch(`/api/projects/${projectId}/milestones`).then(r => r.json()).then(d => setMilestones(d.milestones ?? []))
  }, [projectId])

  const handleSave = (saved: Task) => {
    onTasksChange(
      tasks.some(t => t.id === saved.id)
        ? tasks.map(t => t.id === saved.id ? saved : t)
        : [...tasks, saved]
    )
    setModal(null)
  }

  const handleDelete = (id: string) => {
    onTasksChange(tasks.filter(t => t.id !== id))
    setModal(null)
  }

  const updateTaskStatus = async (task: Task, newStatus: string) => {
    const updated = { ...task, status: newStatus }
    onTasksChange(tasks.map(t => t.id === task.id ? updated : t))
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const createSprint = async () => {
    if (!newSprintName.trim()) return
    const res = await fetch(`/api/projects/${projectId}/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSprintName.trim() }),
    })
    if (res.ok) {
      const d = await res.json()
      setSprints(prev => [...prev, d.sprint])
      setNewSprintName('')
      setShowNewSprint(false)
    }
  }

  const createMilestone = async () => {
    if (!newMilestoneName.trim()) return
    const res = await fetch(`/api/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newMilestoneName.trim() }),
    })
    if (res.ok) {
      const d = await res.json()
      setMilestones(prev => [...prev, d.milestone])
      setNewMilestoneName('')
      setShowNewMilestone(false)
    }
  }

  const activeSprint = sprints.find(s => s.status === 'active') ?? sprints[0] ?? null
  const sprintTasks = activeSprint ? tasks.filter(t => t.sprint_id === activeSprint.id) : tasks.filter(t => !t.sprint_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', borderRadius: '0.5rem', padding: '3px', alignSelf: 'flex-start' }}>
        {(['roadmap', 'sprints'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.375rem 0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600,
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? '#1e293b' : '#64748b',
              boxShadow: tab === t ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'roadmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Milestones */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Milestones</span>
              <button onClick={() => setShowNewMilestone(s => !s)} style={addBtn}>+ Milestone</button>
            </div>
            {showNewMilestone && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input value={newMilestoneName} onChange={e => setNewMilestoneName(e.target.value)} placeholder="Milestone name" style={smallInp} onKeyDown={e => e.key === 'Enter' && createMilestone()} />
                <button onClick={createMilestone} style={saveBtn}>Add</button>
              </div>
            )}
            {milestones.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No milestones yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {milestones.map(m => (
                  <div key={m.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>🏁</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{m.name}</div>
                      {m.due_date && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(m.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All tasks table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>All Tasks</span>
              <button onClick={() => setModal({})} style={addBtn}>+ Task</button>
            </div>
            <TaskTable tasks={tasks} onEdit={task => setModal({ task })} onStatusChange={updateTaskStatus} />
          </div>
        </div>
      )}

      {tab === 'sprints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>
              {activeSprint ? `Active: ${activeSprint.name}` : 'No active sprint'}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setModal({})} style={addBtn}>+ Task</button>
              <button onClick={() => setShowNewSprint(s => !s)} style={addBtn}>+ Sprint</button>
            </div>
          </div>

          {showNewSprint && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={newSprintName} onChange={e => setNewSprintName(e.target.value)} placeholder="Sprint name" style={smallInp} onKeyDown={e => e.key === 'Enter' && createSprint()} />
              <button onClick={createSprint} style={saveBtn}>Create</button>
            </div>
          )}

          {sprints.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
              {sprints.map(s => (
                <span key={s.id} style={{
                  padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                  background: s.status === 'active' ? '#eef2ff' : '#f1f5f9',
                  color: s.status === 'active' ? '#4338ca' : '#64748b',
                  border: s.status === 'active' ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                }}>
                  {s.name}
                  {s.end_date && <span style={{ fontWeight: 400, marginLeft: 4 }}>· {new Date(s.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                </span>
              ))}
            </div>
          )}

          <TaskTable tasks={sprintTasks} onEdit={task => setModal({ task })} onStatusChange={updateTaskStatus} />
        </div>
      )}

      {modal && (
        <TaskModal
          task={modal.task}
          projectId={projectId}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function TaskTable({ tasks, onEdit, onStatusChange }: {
  tasks: Task[]
  onEdit: (t: Task) => void
  onStatusChange: (t: Task, s: string) => void
}) {
  if (tasks.length === 0) {
    return <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No tasks yet. Click "+ Task" to add one.</p>
  }

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', padding: '0.5rem 0.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', gap: '0.5rem' }}>
        <span>Title</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Due</span>
        <span></span>
      </div>
      {tasks.map(task => (
        <div
          key={task.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
            padding: '0.5rem 0.75rem',
            borderBottom: '1px solid #f1f5f9',
            background: PRIORITY_ROW_BG[task.priority] ?? 'white',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.82rem',
          }}
          onClick={() => onEdit(task)}
        >
          <span style={{ fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.title}
            {task.external_url && <a href={task.external_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ marginLeft: '0.25rem', color: '#667eea', fontSize: '0.7rem' }}>↗</a>}
          </span>
          <span style={{ color: PRIORITY_COLOR[task.priority], fontWeight: 700, fontSize: '0.75rem' }}>{task.priority}</span>
          <select
            value={task.status}
            onChange={e => { e.stopPropagation(); onStatusChange(task, e.target.value) }}
            onClick={e => e.stopPropagation()}
            style={{
              border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '0.75rem',
              color: STATUS_COLOR[task.status] ?? '#64748b', cursor: 'pointer', fontWeight: 600, outline: 'none',
            }}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          </span>
          <button onClick={e => { e.stopPropagation(); onEdit(task) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 4px', fontSize: '0.8rem' }}>✏️</button>
        </div>
      ))}
    </div>
  )
}

const PRIORITY_ROW_BG: Record<string, string> = {
  low: '#f0fdf4', medium: '#fffbeb', high: '#fff7ed', critical: '#fef2f2',
}

const addBtn: React.CSSProperties = { padding: '0.3rem 0.75rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }
const saveBtn: React.CSSProperties = { padding: '0.35rem 0.75rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600 }
const smallInp: React.CSSProperties = { flex: 1, padding: '0.35rem 0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.82rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none' }
