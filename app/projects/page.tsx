'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Project {
  id: string
  name: string
  description: string | null
  game: string | null
  team: string | null
  type: string
  color: string
  owner_id: string
  created_at: string
}

const GAMES = ['Corebound', 'Last Light', 'BBCU', 'Studio / General']

const BOARD_TYPES = [
  {
    id: 'kanban',
    label: 'Kanban Board',
    shortLabel: 'Kanban',
    emoji: '⬛',
    desc: 'Columns for each stage — Backlog, To Do, In Progress, Review, Done. Drag tasks across. Best for engineers.',
    color: '#3b82f6',
  },
  {
    id: 'art_pipeline',
    label: 'Art Pipeline',
    shortLabel: 'Art Pipeline',
    emoji: '🎨',
    desc: 'Stage-based flow — Concept → Rough Draft → WIP → Review → Final. Built for artists & creative work.',
    color: '#8b5cf6',
  },
  {
    id: 'standard',
    label: 'Standard PM',
    shortLabel: 'Standard PM',
    emoji: '📋',
    desc: 'Task list, milestones, and sprint planning. Flexible for any role — designers, producers, sound designers.',
    color: '#10b981',
  },
]

const PROJECT_COLORS = ['#e85d7b', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Form state
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [game, setGame] = useState('')
  const [type, setType] = useState('standard')
  const [color, setColor] = useState('#e85d7b')
  const [team, setTeam] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => {
        if (d.error) setApiError(d.error)
        else setProjects(d.projects ?? [])
        setLoading(false)
      })
      .catch(() => { setApiError('Could not connect to database'); setLoading(false) })
  }, [])

  const openCreate = () => { setCreating(true); setStep(1); setName(''); setDesc(''); setGame(''); setType('standard'); setColor('#e85d7b'); setTeam(''); setFormError(null) }
  const closeCreate = () => { setCreating(false); setFormError(null) }

  const createProject = async () => {
    if (!name.trim()) { setFormError('Project name is required'); return }
    if (!game) { setFormError('Please select a game / title'); return }
    setSubmitting(true); setFormError(null)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || null, game: game || null, type, color, team: team || null }),
      })
      const d = await res.json()
      if (!res.ok) {
        setFormError(d.error ?? 'Failed to create project')
        return
      }
      setProjects(prev => [d.project, ...prev])
      closeCreate()
      router.push(`/projects/${d.project.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)', background: '#f0f2f5' }}>
      {/* Hero header */}
      <div style={{ background: '#0d0d14', borderBottom: '1px solid rgba(232,93,123,0.15)', padding: '2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Image src="/art/avatar.png" alt="Kato.8" width={48} height={48} style={{ imageRendering: 'pixelated' }} />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #e85d7b 0%, #ff8fab 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Projects
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', margin: 0 }}>
                {projects.length} project{projects.length !== 1 ? 's' : ''} · Production management for Kato.8 Studios
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            style={{ padding: '0.625rem 1.5rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.625rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(232,93,123,0.4)' }}
          >
            <span style={{ fontSize: '1.1rem' }}>+</span> New Project
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        {/* DB setup warning */}
        {apiError && (
          <div style={{ background: '#fff8f1', border: '1px solid #fed7aa', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Database not set up</div>
              <div style={{ color: '#b45309', fontSize: '0.82rem' }}>
                Run <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: '3px', fontFamily: 'monospace' }}>supabase/migrations/002_projects_and_teams.sql</code> in your Supabase SQL editor to create the projects tables.
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b778c', fontSize: '0.875rem' }}>Loading…</div>
        ) : projects.length === 0 && !apiError ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Image src="/art/avatar.png" alt="Kato" width={80} height={80} style={{ imageRendering: 'pixelated', marginBottom: '1rem', opacity: 0.7 }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#172b4d', marginBottom: '0.5rem' }}>No projects yet</h2>
            <p style={{ color: '#6b778c', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>
              Create your first project and pick a board type built for your role.
            </p>
            <button onClick={openCreate} style={{ padding: '0.625rem 1.5rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.625rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(232,93,123,0.3)' }}>
              Create your first project
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {projects.map(p => <ProjectCard key={p.id} project={p} onClick={() => router.push(`/projects/${p.id}`)} />)}
          </div>
        )}
      </div>

      {/* Create project modal */}
      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ background: '#0d0d14', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
                  {step === 1 ? 'Create a project' : 'Choose your board type'}
                </h2>
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                  {[1, 2].map(s => (
                    <div key={s} style={{ height: 3, width: 32, borderRadius: '999px', background: step >= s ? '#e85d7b' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s' }} />
                  ))}
                </div>
              </div>
              <button onClick={closeCreate} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '1.3rem', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                  <label style={lbl}>
                    Project name *
                    <input
                      autoFocus
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
                      placeholder="e.g. Season 2 Art Assets"
                      style={inp}
                    />
                  </label>
                  <label style={lbl}>
                    Game / Title *
                    <select value={game} onChange={e => setGame(e.target.value)} style={{ ...inp, color: game ? '#172b4d' : '#94a3b8' }}>
                      <option value="">— Select a game —</option>
                      {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </label>
                  <label style={lbl}>
                    Description
                    <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this project about?" style={inp} />
                  </label>
                  <label style={lbl}>
                    Department (optional)
                    <select value={team} onChange={e => setTeam(e.target.value)} style={inp}>
                      <option value="">— No department —</option>
                      {['Engineering', 'Development', 'Art', 'Sound', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Project color</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {PROJECT_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid white' : '3px solid transparent', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none', cursor: 'pointer', transition: 'all 0.1s', padding: 0 }}
                        />
                      ))}
                    </div>
                  </div>
                  {formError && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{formError}</p>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                    <button onClick={() => { if (!name.trim()) { setFormError('Project name is required'); return }; if (!game) { setFormError('Please select a game / title'); return }; setFormError(null); setStep(2) }} style={pinkBtn}>
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ color: '#6b778c', fontSize: '0.82rem', margin: 0 }}>
                    Choose how you want to organize work. You can always switch later.
                  </p>
                  {BOARD_TYPES.map(bt => (
                    <label
                      key={bt.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer',
                        padding: '0.875rem 1rem', borderRadius: '0.75rem',
                        border: type === bt.id ? `2px solid ${bt.color}` : '2px solid #e2e8f0',
                        background: type === bt.id ? bt.color + '0a' : 'white',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input type="radio" name="bt" value={bt.id} checked={type === bt.id} onChange={() => setType(bt.id)} style={{ accentColor: bt.color, marginTop: '3px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '1rem' }}>{bt.emoji}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#172b4d' }}>{bt.label}</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: bt.color, background: bt.color + '18', padding: '1px 6px', borderRadius: '3px' }}>
                            {bt.id === 'kanban' ? 'Engineers' : bt.id === 'art_pipeline' ? 'Artists' : 'All roles'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#6b778c', margin: 0, lineHeight: 1.4 }}>{bt.desc}</p>
                      </div>
                    </label>
                  ))}

                  {formError && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{formError}</p>}

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                    <button onClick={() => setStep(1)} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
                      ← Back
                    </button>
                    <button
                      onClick={createProject}
                      disabled={submitting}
                      style={{ ...pinkBtn, opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      {submitting ? 'Creating…' : `Create ${BOARD_TYPES.find(b => b.id === type)?.shortLabel ?? 'Project'} →`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const bt = BOARD_TYPES.find(b => b.id === project.type)
  const col = project.color ?? '#e85d7b'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'white',
        borderRadius: '0.875rem',
        border: `2px solid ${hov ? col : '#e2e8f0'}`,
        padding: 0,
        cursor: 'pointer',
        boxShadow: hov ? `0 8px 24px ${col}20` : '0 1px 3px rgba(0,0,0,0.06)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all 0.15s',
        overflow: 'hidden',
      }}
    >
      {/* Color band */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${col}, ${col}88)` }} />

      <div style={{ padding: '1.125rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.625rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: col + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
            {bt?.emoji ?? '📋'}
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: bt ? '#6b778c' : '#94a3b8', background: '#f1f5f9', padding: '2px 7px', borderRadius: '999px', alignSelf: 'flex-start' }}>
            {bt?.shortLabel ?? project.type}
          </span>
        </div>

        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#172b4d', marginBottom: '0.375rem', lineHeight: 1.3 }}>
          {project.name}
        </div>
        {project.description && (
          <p style={{ fontSize: '0.78rem', color: '#6b778c', margin: '0 0 0.625rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {project.game && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: col, background: col + '12', padding: '2px 7px', borderRadius: '4px' }}>
              🎮 {project.game}
            </span>
          )}
          {project.team && (
            <span style={{ fontSize: '0.68rem', color: '#6b778c', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{project.team}</span>
          )}
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 'auto' }}>
            {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.82rem', fontWeight: 700, color: '#374151' }
const inp: React.CSSProperties = { padding: '0.625rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#172b4d', outline: 'none', width: '100%', boxSizing: 'border-box' }
const pinkBtn: React.CSSProperties = { padding: '0.5rem 1.25rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(232,93,123,0.3)' }
