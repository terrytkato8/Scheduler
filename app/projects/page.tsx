'use client'

import React, { useState, useEffect } from 'react'
import KanbanBoard from './_components/KanbanBoard'
import ArtPipeline from './_components/ArtPipeline'
import StandardBoard from './_components/StandardBoard'

interface Project {
  id: string
  name: string
  description: string | null
  team: string | null
  type: string
  owner_id: string
  created_at: string
}

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

const BOARD_TYPES = [
  { id: 'kanban',       label: 'Kanban',       desc: 'For Engineers — columns with drag-and-drop', emoji: '⬛' },
  { id: 'art_pipeline', label: 'Art Pipeline', desc: 'For Artists — stage-based asset workflow',   emoji: '🎨' },
  { id: 'standard',     label: 'Standard PM',  desc: 'Roadmap, milestones, sprints, task table',   emoji: '📋' },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState('standard')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => { setProjects(d.projects ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeProject) { setTasks([]); return }
    fetch(`/api/projects/${activeProject.id}/tasks`)
      .then(r => r.json())
      .then(d => setTasks(d.tasks ?? []))
      .catch(() => {})
  }, [activeProject])

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null, type: newType }),
    })
    if (res.ok) {
      const d = await res.json()
      setProjects(prev => [d.project, ...prev])
      setNewName(''); setNewDesc(''); setCreating(false)
      setActiveProject(d.project)
    }
  }

  if (activeProject) {
    const Board = activeProject.type === 'kanban' ? KanbanBoard
      : activeProject.type === 'art_pipeline' ? ArtPipeline
      : StandardBoard

    return (
      <div>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveProject(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667eea', fontSize: '0.875rem', fontFamily: 'inherit', padding: 0, fontWeight: 600 }}
          >
            ← Projects
          </button>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>{activeProject.name}</span>
          <span style={{
            padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, marginLeft: '0.25rem',
            background: activeProject.type === 'kanban' ? '#eef2ff' : activeProject.type === 'art_pipeline' ? '#fdf4ff' : '#f0fdf4',
            color: activeProject.type === 'kanban' ? '#4338ca' : activeProject.type === 'art_pipeline' ? '#7c3aed' : '#16a34a',
          }}>
            {BOARD_TYPES.find(b => b.id === activeProject.type)?.label ?? activeProject.type}
          </span>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{activeProject.name}</h2>
        {activeProject.description && (
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{activeProject.description}</p>
        )}

        <Board projectId={activeProject.id} tasks={tasks} onTasksChange={setTasks} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Projects</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage production work with role-based views.</p>
        </div>
        <button
          onClick={() => setCreating(c => !c)}
          style={{ padding: '0.5rem 1.25rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + New project
        </button>
      </div>

      {/* New project form */}
      {creating && (
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '1.5rem', maxWidth: 520 }}>
          <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>New Project</h3>
            <label style={lbl}>
              Project name *
              <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="My awesome project" style={inp} />
            </label>
            <label style={lbl}>
              Description
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional" style={inp} />
            </label>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Board type</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {BOARD_TYPES.map(bt => (
                  <label
                    key={bt.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer',
                      padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
                      border: newType === bt.id ? '2px solid #667eea' : '1px solid #e2e8f0',
                      background: newType === bt.id ? '#f5f7ff' : 'white',
                    }}
                  >
                    <input type="radio" name="boardType" value={bt.id} checked={newType === bt.id} onChange={() => setNewType(bt.id)} style={{ marginTop: '2px', accentColor: '#667eea' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{bt.emoji} {bt.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{bt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button type="submit" style={{ padding: '0.5rem 1.25rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project list */}
      {loading ? (
        <p style={{ color: '#64748b' }}>Loading…</p>
      ) : projects.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>No projects yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
          {projects.map(p => {
            const bt = BOARD_TYPES.find(b => b.id === p.type)
            return (
              <div
                key={p.id}
                onClick={() => setActiveProject(p)}
                style={{
                  background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  padding: '1.25rem', cursor: 'pointer', border: '1px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#667eea')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{p.name}</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0,
                    background: p.type === 'kanban' ? '#eef2ff' : p.type === 'art_pipeline' ? '#fdf4ff' : '#f0fdf4',
                    color: p.type === 'kanban' ? '#4338ca' : p.type === 'art_pipeline' ? '#7c3aed' : '#16a34a',
                  }}>
                    {bt?.emoji} {bt?.label ?? p.type}
                  </span>
                </div>
                {p.description && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem' }}>{p.description}</p>}
                {p.team && <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Team: {p.team}</span>}
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
                  Created {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }
const inp: React.CSSProperties = { padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none' }
