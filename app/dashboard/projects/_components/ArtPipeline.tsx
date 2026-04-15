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

const STAGES = [
  { id: 'concept',     label: 'Concept',     emoji: '💡', color: '#8b5cf6' },
  { id: 'rough_draft', label: 'Rough Draft', emoji: '✏️', color: '#667eea' },
  { id: 'wip',         label: 'WIP',         emoji: '🎨', color: '#f59e0b' },
  { id: 'review',      label: 'Review',      emoji: '👁️', color: '#f97316' },
  { id: 'final',       label: 'Final',       emoji: '✅', color: '#22c55e' },
]

const PRIORITY_COLOR: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
}

export default function ArtPipeline({ projectId, tasks, onTasksChange }: Props) {
  const [modal, setModal] = useState<{ task?: Task | null; stage?: string } | null>(null)

  const byStage = (stage: string) => tasks.filter(t => (t.stage ?? 'concept') === stage)

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

  const moveStage = async (task: Task, newStage: string) => {
    const updated = { ...task, stage: newStage }
    onTasksChange(tasks.map(t => t.id === task.id ? updated : t))
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
  }

  return (
    <div>
      {/* Pipeline flow: horizontal swim lanes */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', alignItems: 'flex-start' }}>
        {STAGES.map((stage, stageIdx) => {
          const stageTasks = byStage(stage.id)
          return (
            <div
              key={stage.id}
              style={{ minWidth: 210, flex: '0 0 210px', background: '#fafafa', borderRadius: '0.625rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const taskId = e.dataTransfer.getData('taskId')
                const task = tasks.find(t => t.id === taskId)
                if (task && (task.stage ?? 'concept') !== stage.id) moveStage(task, stage.id)
              }}
            >
              {/* Stage header */}
              <div style={{ background: stage.color, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem' }}>{stage.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'white' }}>{stage.label}</span>
                <span style={{ background: 'rgba(255,255,255,0.25)', color: 'white', borderRadius: '999px', padding: '0px 6px', fontSize: '0.68rem', fontWeight: 700, marginLeft: 'auto' }}>
                  {stageTasks.length}
                </span>
              </div>

              {/* Arrow between stages */}
              {stageIdx < STAGES.length - 1 && (
                <div style={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1', fontSize: '1.2rem', pointerEvents: 'none', zIndex: 1 }}>›</div>
              )}

              <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: 80 }}>
                {stageTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
                    onClick={() => setModal({ task })}
                    style={{
                      background: 'white',
                      border: `1px solid ${PRIORITY_COLOR[task.priority]}30`,
                      borderLeft: `3px solid ${PRIORITY_COLOR[task.priority]}`,
                      borderRadius: '0.375rem',
                      padding: '0.5rem 0.625rem',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.82rem', lineHeight: 1.3, marginBottom: '0.25rem' }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
                    {/* Stage navigation buttons */}
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.375rem' }}>
                      {stageIdx > 0 && (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); moveStage(task, STAGES[stageIdx - 1].id) }}
                          style={{ padding: '1px 6px', fontSize: '0.65rem', background: '#f1f5f9', border: 'none', borderRadius: '3px', cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}
                        >
                          ← Back
                        </button>
                      )}
                      {stageIdx < STAGES.length - 1 && (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); moveStage(task, STAGES[stageIdx + 1].id) }}
                          style={{ padding: '1px 6px', fontSize: '0.65rem', background: stage.color + '22', border: 'none', borderRadius: '3px', cursor: 'pointer', color: stage.color, fontFamily: 'inherit', fontWeight: 600 }}
                        >
                          Next →
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setModal({ stage: stage.id })}
                  style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '0.375rem', padding: '0.35rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'inherit', width: '100%', textAlign: 'center', marginTop: 2 }}
                >
                  + Add asset
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
          defaultStage={modal.stage ?? 'concept'}
          defaultStatus="in_progress"
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
