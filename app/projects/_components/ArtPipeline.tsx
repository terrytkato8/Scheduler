'use client'

import React, { useState, useRef } from 'react'
import TaskDrawer, { Task } from './TaskDrawer'

interface Props {
  projectId: string
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
}

const STAGES = [
  { id: 'concept',     label: 'Concept',     emoji: '💡', color: '#8b5cf6', desc: 'Ideas & references' },
  { id: 'rough_draft', label: 'Rough Draft', emoji: '✏️', color: '#3b82f6', desc: 'Initial sketches' },
  { id: 'wip',         label: 'WIP',         emoji: '🎨', color: '#f59e0b', desc: 'Active creation' },
  { id: 'review',      label: 'Review',      emoji: '👁️', color: '#e85d7b', desc: 'Feedback needed' },
  { id: 'final',       label: 'Final',       emoji: '✅', color: '#10b981', desc: 'Approved & done' },
]

const PRIORITY_COLOR: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
}

export default function ArtPipeline({ projectId, tasks, onTasksChange }: Props) {
  const [drawerTask, setDrawerTask] = useState<Task | null>(null)
  const [inlineCreate, setInlineCreate] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  const byStage = (stage: string) => tasks.filter(t => (t.stage ?? 'concept') === stage)

  const moveStage = async (taskId: string, newStage: string) => {
    onTasksChange(tasks.map(t => t.id === taskId ? { ...t, stage: newStage } : t))
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
  }

  const createInline = async (stage: string) => {
    if (!newTitle.trim()) { setInlineCreate(null); return }
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), stage, status: 'in_progress', priority: 'medium' }),
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
      {/* Pipeline flow indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {STAGES.map((s, i) => (
          <React.Fragment key={s.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{s.emoji}</div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: s.color }}>{s.label}</div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{s.desc}</div>
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${s.color}, ${STAGES[i+1].color})`, margin: '0 0.5rem', minWidth: 20, opacity: 0.4 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Stage columns */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start', minHeight: 360 }}>
        {STAGES.map(stage => {
          const stageTasks = byStage(stage.id)
          const isOver = dragOverStage === stage.id

          return (
            <div
              key={stage.id}
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id) }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={e => {
                e.preventDefault(); setDragOverStage(null)
                if (dragId.current) moveStage(dragId.current, stage.id)
                dragId.current = null
              }}
              style={{
                width: 230, minWidth: 230, flexShrink: 0,
                background: isOver ? stage.color + '0d' : '#f8fafc',
                borderRadius: '0.75rem',
                border: `2px solid ${isOver ? stage.color : '#e2e8f0'}`,
                display: 'flex', flexDirection: 'column',
                transition: 'all 0.15s',
              }}
            >
              {/* Stage header */}
              <div style={{ background: stage.color, padding: '0.625rem 0.875rem', borderRadius: '0.5rem 0.5rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{stage.emoji}</span>
                <span style={{ fontWeight: 800, fontSize: '0.78rem', color: 'white', flex: 1 }}>{stage.label}</span>
                <span style={{ background: 'rgba(255,255,255,0.25)', color: 'white', borderRadius: '999px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 800 }}>
                  {stageTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
                {stageTasks.map(task => (
                  <ArtTaskCard
                    key={task.id}
                    task={task}
                    stageColor={stage.color}
                    stageIdx={STAGES.findIndex(s => s.id === stage.id)}
                    totalStages={STAGES.length}
                    onClick={() => setDrawerTask(task)}
                    onDragStart={() => { dragId.current = task.id }}
                    onMove={(dir) => {
                      const idx = STAGES.findIndex(s => s.id === stage.id)
                      const target = STAGES[idx + dir]
                      if (target) moveStage(task.id, target.id)
                    }}
                  />
                ))}

                {inlineCreate === stage.id ? (
                  <div style={{ background: 'white', borderRadius: '0.5rem', padding: '0.5rem', border: `2px solid ${stage.color}` }}>
                    <textarea
                      autoFocus
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createInline(stage.id) }
                        if (e.key === 'Escape') { setInlineCreate(null); setNewTitle('') }
                      }}
                      placeholder="Asset name…"
                      rows={2}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.84rem', fontFamily: 'inherit', color: '#172b4d', resize: 'none', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                      <button onClick={() => createInline(stage.id)} style={{ padding: '0.3rem 0.75rem', background: stage.color, color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                      <button onClick={() => { setInlineCreate(null); setNewTitle('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem' }}>×</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setInlineCreate(stage.id); setNewTitle('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: `1px dashed ${stage.color}55`, borderRadius: '0.5rem', padding: '0.4rem 0.625rem', cursor: 'pointer', color: stage.color + '88', fontSize: '0.75rem', fontFamily: 'inherit', width: '100%', transition: 'all 0.1s' }}
                  >
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Add asset
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <TaskDrawer
        task={drawerTask}
        projectId={projectId}
        onUpdate={updated => { onTasksChange(tasks.map(t => t.id === updated.id ? updated : t)); setDrawerTask(updated) }}
        onDelete={id => { onTasksChange(tasks.filter(t => t.id !== id)); setDrawerTask(null) }}
        onClose={() => setDrawerTask(null)}
      />
    </>
  )
}

function ArtTaskCard({ task, stageColor, stageIdx, totalStages, onClick, onDragStart, onMove }: {
  task: Task; stageColor: string; stageIdx: number; totalStages: number
  onClick: () => void; onDragStart: () => void; onMove: (dir: 1 | -1) => void
}) {
  const [hov, setHov] = useState(false)
  const pc = PRIORITY_COLOR[task.priority] ?? '#94a3b8'
  return (
    <div
      draggable
      onDragStart={e => { onDragStart(); e.dataTransfer.effectAllowed = 'move' }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'white', borderRadius: '0.5rem',
        border: '1px solid #e2e8f0', borderTop: `3px solid ${stageColor}`,
        padding: '0.625rem 0.75rem', cursor: 'pointer',
        boxShadow: hov ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-1px)' : 'none',
        transition: 'all 0.12s',
      }}
    >
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#172b4d', lineHeight: 1.35, marginBottom: '0.5rem' }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: pc, background: pc + '18', padding: '1px 5px', borderRadius: '3px' }}>{task.priority}</span>
        {task.due_date && <span style={{ fontSize: '0.62rem', color: '#6b778c', background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px' }}>📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
        {task.external_url && <a href={task.external_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '0.62rem', color: '#667eea', background: '#eef2ff', padding: '1px 5px', borderRadius: '3px', textDecoration: 'none', fontWeight: 600 }}>↗</a>}
      </div>
      {/* Stage nav */}
      <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
        {stageIdx > 0 && (
          <button onClick={() => onMove(-1)} style={{ padding: '2px 6px', fontSize: '0.62rem', background: '#f1f5f9', border: 'none', borderRadius: '3px', cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}>← Back</button>
        )}
        {stageIdx < totalStages - 1 && (
          <button onClick={() => onMove(1)} style={{ padding: '2px 6px', fontSize: '0.62rem', background: stageColor + '22', border: 'none', borderRadius: '3px', cursor: 'pointer', color: stageColor, fontFamily: 'inherit', fontWeight: 700 }}>Next →</button>
        )}
      </div>
    </div>
  )
}
