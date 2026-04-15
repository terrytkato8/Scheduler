'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import KanbanBoard from '../_components/KanbanBoard'
import ArtPipeline from '../_components/ArtPipeline'
import StandardBoard from '../_components/StandardBoard'
import { Task } from '../_components/TaskDrawer'

interface Project {
  id: string
  name: string
  description: string | null
  team: string | null
  type: string
  color: string
  owner_id: string
  created_at: string
}

const BOARD_TYPES: Record<string, { label: string; emoji: string }> = {
  kanban:       { label: 'Kanban',       emoji: '⬛' },
  art_pipeline: { label: 'Art Pipeline', emoji: '🎨' },
  standard:     { label: 'Standard PM',  emoji: '📋' },
}

export default function ProjectWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '2rem', animation: 'spin 1.5s linear infinite' }}>🐙</div>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: 'calc(100vh - 52px)' }}>
      {/* Workspace header */}
      <div style={{ padding: '1.25rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
          <button
            onClick={() => router.push('/projects')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.82rem', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            ← All Projects
          </button>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#172b4d' }}>{project.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            {/* Project color dot */}
            <div style={{ width: 40, height: 40, borderRadius: '0.625rem', background: project.color ?? '#e85d7b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
              {bt.emoji}
            </div>
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#172b4d', margin: 0, lineHeight: 1.2 }}>
                {project.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: project.color, background: project.color + '18', padding: '2px 8px', borderRadius: '999px', border: `1px solid ${project.color}40` }}>
                  {bt.label}
                </span>
                {project.team && <span style={{ fontSize: '0.72rem', color: '#6b778c', background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px' }}>{project.team}</span>}
                {project.description && <span style={{ fontSize: '0.78rem', color: '#6b778c' }}>{project.description}</span>}
              </div>
            </div>
          </div>

          {/* Progress */}
          {tasks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.72rem', color: '#6b778c', fontWeight: 600 }}>{doneCount}/{tasks.length} done · {progress}%</span>
              <div style={{ width: 160, height: 6, background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#10b981' : '#e85d7b', borderRadius: '999px', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Board content */}
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowX: 'auto' }}>
        <Board projectId={project.id} tasks={tasks} onTasksChange={setTasks} />
      </div>
    </div>
  )
}
