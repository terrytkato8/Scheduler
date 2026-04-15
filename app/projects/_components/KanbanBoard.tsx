'use client'

import React, { useState } from 'react'
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
}

interface Props {
  projectId: string
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
}

const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',     color: '#94a3b8' },
  { id: 'todo',        label: 'To Do',       color: '#667eea' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { id: 'in_review',   label: 'In Review',   color: '#8b5cf6' },
  { id: 'done',        label: 'Done',        color: '#22c55e' },
]

const PRIORITY_COLOR: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
}
const PRIORITY_BG: Record<string, string> = {
  low: '#f0fdf4', medium: '#fffbeb', high: '#fff7ed', critical: '#fef2f2',
}

export default function KanbanBoard({ projectId, tasks, onTasksChange }: Props) {
  const [modal, setModal] = useState<{ task?: Task | null; status?: string } | null>(null)

  const byStatus = (status: string) => tasks.filter(t => t.status === status)

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

  const moveTask = async (task: Task, newStatus: string) => {
    const updated = { ...task, status: newStatus }
    onTasksChange(tasks.map(t => t.id === task.id ? updated : t))
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.875rem', overflowX: 'auto', paddingBottom: '0.5rem', alignItems: 'flex-start' }}>
        {COLUMNS.map(col => {
          const colTasks = byStatus(col.id)
          return (
            <div
              key={col.id}
              style={{ minWidth: 220, flex: '0 0 220px', background: '#f8fafc', borderRadius: '0.625rem', border: '1px solid #e2e8f0' }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const taskId = e.dataTransfer.getData('taskId')
                const task = tasks.find(t => t.id === taskId)
                if (task && task.status !== col.id) moveTask(task, col.id)
              }}
            >
              {/* Column header */}
              <div style={{ padding: '0.625rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid ' + col.color }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>{col.label}</span>
                <span style={{ background: col.color, color: 'white', borderRadius: '999px', padding: '0px 6px', fontSize: '0.68rem', fontWeight: 700 }}>{colTasks.length}</span>
              </div>

              {/* Tasks */}
              <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: 80 }}>
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
                    onClick={() => setModal({ task })}
                    style={{
                      background: PRIORITY_BG[task.priority] ?? 'white',
                      border: `1px solid ${PRIORITY_COLOR[task.priority]}30`,
                      borderLeft: `3px solid ${PRIORITY_COLOR[task.priority]}`,
                      borderRadius: '0.375rem',
                      padding: '0.5rem 0.625rem',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.2rem', lineHeight: 1.3 }}>{task.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', background: PRIORITY_COLOR[task.priority] + '22', color: PRIORITY_COLOR[task.priority], borderRadius: '3px', padding: '1px 5px', fontWeight: 700 }}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {task.external_url && (
                        <a href={task.external_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '0.68rem', color: '#667eea' }}>↗</a>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setModal({ status: col.id })}
                  style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '0.375rem', padding: '0.35rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'inherit', width: '100%', textAlign: 'center', marginTop: 2 }}
                >
                  + Add task
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <TaskModal
          task={modal.task}
          projectId={projectId}
          defaultStatus={modal.status}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
