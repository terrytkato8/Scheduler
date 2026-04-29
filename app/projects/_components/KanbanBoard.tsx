'use client'

import React, { useState, useRef } from 'react'
import TaskDrawer, { Task } from './TaskDrawer'

interface Props {
  projectId: string
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
}

const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',     color: '#94a3b8', light: '#f8fafc' },
  { id: 'todo',        label: 'To Do',       color: '#3b82f6', light: '#eff6ff' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b', light: '#fffbeb' },
  { id: 'in_review',   label: 'In Review',   color: '#8b5cf6', light: '#faf5ff' },
  { id: 'done',        label: 'Done',        color: '#10b981', light: '#f0fdf4' },
]

const PRIORITY_COLOR: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
}
const PRIORITY_ICON: Record<string, string> = {
  low: '▼', medium: '►', high: '▲', critical: '⚡',
}

export default function KanbanBoard({ projectId, tasks, onTasksChange }: Props) {
  const [drawerTask, setDrawerTask] = useState<Task | null>(null)
  const [inlineCreate, setInlineCreate] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  const byStatus = (status: string) => tasks.filter(t => t.status === status)

  const moveTask = async (taskId: string, newStatus: string) => {
    onTasksChange(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const createInline = async (status: string) => {
    if (!newTitle.trim()) { setInlineCreate(null); return }
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), status, priority: 'medium' }),
    })
    if (res.ok) {
      const d = await res.json()
      onTasksChange([...tasks, d.task])
    }
    setNewTitle('')
    setInlineCreate(null)
  }

  const handleUpdate = (updated: Task) => {
    onTasksChange(tasks.map(t => t.id === updated.id ? updated : t))
    setDrawerTask(updated)
  }

  const handleDelete = (id: string) => {
    onTasksChange(tasks.filter(t => t.id !== id))
    setDrawerTask(null)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start', minHeight: 400 }}>
        {COLUMNS.map(col => {
          const colTasks = byStatus(col.id)
          const isOver = dragOverCol === col.id
          return (
            <div
              key={col.id}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.id) }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => {
                e.preventDefault(); setDragOverCol(null)
                if (dragId.current) moveTask(dragId.current, col.id)
                dragId.current = null
              }}
              style={{
                width: 256, minWidth: 256, flexShrink: 0,
                background: isOver ? col.light : '#f8fafc',
                borderRadius: '0.75rem',
                border: `2px solid ${isOver ? col.color : '#e2e8f0'}`,
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {/* Column header */}
              <div style={{ padding: '0.75rem 0.875rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: `2px solid ${col.color}` }}>
                <span style={{ fontWeight: 800, fontSize: '0.72rem', color: '#172b4d', letterSpacing: '0.05em', textTransform: 'uppercase', flex: 1 }}>
                  {col.label}
                </span>
                <span style={{ background: col.color + '22', color: col.color, borderRadius: '999px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 800 }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setDrawerTask(task)}
                    onDragStart={() => { dragId.current = task.id }}
                  />
                ))}

                {inlineCreate === col.id ? (
                  <div style={{ background: 'white', borderRadius: '0.5rem', padding: '0.5rem', border: '2px solid #e85d7b' }}>
                    <textarea
                      autoFocus
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createInline(col.id) }
                        if (e.key === 'Escape') { setInlineCreate(null); setNewTitle('') }
                      }}
                      placeholder="Task title…"
                      rows={2}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.84rem', fontFamily: 'inherit', color: '#172b4d', resize: 'none', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                      <button onClick={() => createInline(col.id)} style={addBtnStyle}>Add</button>
                      <button onClick={() => { setInlineCreate(null); setNewTitle('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem' }}>×</button>
                    </div>
                  </div>
                ) : (
                  <AddTaskBtn colColor={col.color} onClick={() => { setInlineCreate(col.id); setNewTitle('') }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TaskDrawer
        task={drawerTask}
        projectId={projectId}
        allTasks={tasks}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onClose={() => setDrawerTask(null)}
      />
    </>
  )
}

function TaskCard({ task, onClick, onDragStart }: { task: Task; onClick: () => void; onDragStart: () => void }) {
  const [hovered, setHovered] = useState(false)
  const pc = PRIORITY_COLOR[task.priority] ?? '#94a3b8'
  return (
    <div
      draggable
      onDragStart={e => { onDragStart(); e.dataTransfer.effectAllowed = 'move' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white', borderRadius: '0.5rem',
        border: '1px solid #e2e8f0', borderLeft: `3px solid ${pc}`,
        padding: '0.625rem 0.75rem', cursor: 'pointer',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        transition: 'all 0.12s',
      }}
    >
      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#172b4d', lineHeight: 1.35, marginBottom: '0.45rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.63rem', fontWeight: 700, color: pc, background: pc + '18', padding: '1px 5px', borderRadius: '3px' }}>
          {PRIORITY_ICON[task.priority]} {task.priority}
        </span>
        {task.due_date && (
          <span style={{ fontSize: '0.63rem', color: '#6b778c', background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px' }}>
            📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {task.size_estimate && (
          <span style={{ fontSize: '0.63rem', fontWeight: 800, color: '#4338ca', background: '#eef2ff', padding: '1px 5px', borderRadius: '3px' }}>
            {task.size_estimate}
          </span>
        )}
        {task.external_url && (
          <a href={task.external_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            style={{ fontSize: '0.63rem', color: '#667eea', background: '#eef2ff', padding: '1px 5px', borderRadius: '3px', textDecoration: 'none', fontWeight: 600 }}>↗</a>
        )}
      </div>
    </div>
  )
}

function AddTaskBtn({ colColor, onClick }: { colColor: string; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        background: 'none', border: `1px dashed ${hov ? colColor : '#d1d5db'}`,
        borderRadius: '0.5rem', padding: '0.4rem 0.625rem', cursor: 'pointer',
        color: hov ? colColor : '#94a3b8', fontSize: '0.75rem', fontFamily: 'inherit',
        width: '100%', transition: 'all 0.1s',
      }}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Add task
    </button>
  )
}

const addBtnStyle: React.CSSProperties = { padding: '0.3rem 0.75rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }
