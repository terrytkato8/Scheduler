'use client'

import React, { useState, useEffect, useRef } from 'react'

interface Member {
  user_id: string
  display_name: string | null
  role: string | null
}

export interface Task {
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
  depends_on: string[] | null
  project_id: string
  created_at?: string
  size_estimate: string | null
  started_at: string | null
  completed_at: string | null
}

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL'] as const
const SIZE_POINTS: Record<string, number> = { XS: 1, S: 2, M: 3, L: 5, XL: 8 }

interface Props {
  task: Task | null
  projectId: string
  allTasks: Task[]
  onUpdate: (task: Task) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done']
const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
}
const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  backlog:     { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  todo:        { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe' },
  in_progress: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  in_review:   { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe' },
  done:        { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
}
const PRIORITIES = ['low', 'medium', 'high', 'critical']
const PRIORITY_COLOR: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
}
const PRIORITY_ICON: Record<string, string> = {
  low: '↓', medium: '→', high: '↑', critical: '⚡',
}

export default function TaskDrawer({ task, projectId, allTasks, onUpdate, onDelete, onClose }: Props) {
  const [editTitle, setEditTitle] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('backlog')
  const [priority, setPriority] = useState('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [sizeEstimate, setSizeEstimate] = useState<string | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [showEmbed, setShowEmbed] = useState(false)
  const [dependsOn, setDependsOn] = useState<string[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [saving, setSaving] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/members').then(r => r.json()).then(d => setMembers(d.members ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setStatus(task.status)
    setPriority(task.priority)
    setAssigneeId(task.assignee_id ?? '')
    setDueDate(task.due_date ?? '')
    setSizeEstimate(task.size_estimate ?? null)
    setExternalUrl(task.external_url ?? '')
    setEmbedUrl(task.embed_url ?? '')
    setDependsOn(task.depends_on ?? [])
    setEditTitle(false)
    setShowEmbed(false)
  }, [task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editTitle && titleRef.current) titleRef.current.focus()
  }, [editTitle])

  const save = async (patch: Partial<Task>) => {
    if (!task) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        const d = await res.json()
        onUpdate(d.task)
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!task || !confirm('Delete this task? This cannot be undone.')) return
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    onDelete(task.id)
  }

  const addDep = (depId: string) => {
    if (!depId || dependsOn.includes(depId)) return
    const next = [...dependsOn, depId]
    setDependsOn(next)
    save({ depends_on: next })
  }

  const removeDep = (depId: string) => {
    const next = dependsOn.filter(d => d !== depId)
    setDependsOn(next)
    save({ depends_on: next })
  }

  if (!task) return null

  const sc = STATUS_COLOR[status] ?? STATUS_COLOR.backlog
  const assignee = members.find(m => m.user_id === assigneeId)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 299 }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(520px, 100vw)',
        background: 'white',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            {/* Status */}
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); save({ status: e.target.value }) }}
              style={{
                padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
              }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            {/* Priority */}
            <select
              value={priority}
              onChange={e => { setPriority(e.target.value); save({ priority: e.target.value }) }}
              style={{
                padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
                background: PRIORITY_COLOR[priority] + '18', color: PRIORITY_COLOR[priority],
                border: `1px solid ${PRIORITY_COLOR[priority]}40`,
                cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
              }}
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_ICON[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            {saving && <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Saving…</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={handleDelete} title="Delete task" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', fontSize: '1rem', padding: '0.25rem', borderRadius: '4px' }}>🗑</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.3rem', lineHeight: 1, padding: '0.25rem' }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>

          {/* Title */}
          {editTitle ? (
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => { setEditTitle(false); if (title.trim() && title !== task.title) save({ title: title.trim() }) }}
              onKeyDown={e => { if (e.key === 'Enter') { setEditTitle(false); if (title.trim() && title !== task.title) save({ title: title.trim() }) } }}
              style={{ fontSize: '1.2rem', fontWeight: 700, color: '#172b4d', border: 'none', borderBottom: '2px solid #e85d7b', outline: 'none', width: '100%', fontFamily: 'inherit', padding: '0.125rem 0', background: 'transparent' }}
            />
          ) : (
            <h2
              onClick={() => setEditTitle(true)}
              style={{ fontSize: '1.2rem', fontWeight: 700, color: '#172b4d', margin: 0, cursor: 'text', lineHeight: 1.4 }}
              title="Click to edit"
            >
              {title}
            </h2>
          )}

          {/* Description */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b778c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Description</div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={() => { if (description !== (task.description ?? '')) save({ description: description || null }) }}
              placeholder="Add details, acceptance criteria, notes…"
              rows={4}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#172b4d', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Size estimate */}
          <div>
            <div style={metaLabel}>Size estimate</div>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {SIZE_OPTIONS.map(s => {
                const sel = sizeEstimate === s
                return (
                  <button
                    key={s} type="button"
                    onClick={() => {
                      const next = sel ? null : s
                      setSizeEstimate(next)
                      save({ size_estimate: next })
                    }}
                    style={{
                      padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit', border: sel ? '2px solid #667eea' : '1px solid #e2e8f0',
                      background: sel ? '#eef2ff' : 'white', color: sel ? '#4338ca' : '#64748b',
                      transition: 'all 0.1s',
                    }}
                    title={`${SIZE_POINTS[s]} point${SIZE_POINTS[s] > 1 ? 's' : ''}`}
                  >
                    {s}
                  </button>
                )
              })}
              {sizeEstimate && (
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', alignSelf: 'center' }}>
                  = {SIZE_POINTS[sizeEstimate]} pt{SIZE_POINTS[sizeEstimate] > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {/* Assignee */}
            <div>
              <div style={metaLabel}>Assignee</div>
              <select
                value={assigneeId}
                onChange={e => { setAssigneeId(e.target.value); save({ assignee_id: e.target.value || null }) }}
                style={metaSelect}
              >
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user_id} value={m.user_id}>{m.display_name || 'Member'}</option>)}
              </select>
              {assignee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e85d7b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {(assignee.display_name ?? '?')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#172b4d', fontWeight: 500 }}>{assignee.display_name}</span>
                </div>
              )}
            </div>

            {/* Due date */}
            <div>
              <div style={metaLabel}>Due date</div>
              <input
                type="date"
                value={dueDate}
                onChange={e => { setDueDate(e.target.value); save({ due_date: e.target.value || null }) }}
                style={metaSelect}
              />
            </div>
          </div>

          {/* Dependencies */}
          <div>
            <div style={metaLabel}>Depends on</div>
            {/* Chips for existing dependencies */}
            {dependsOn.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                {dependsOn.map(depId => {
                  const depTask = allTasks.find(t => t.id === depId)
                  if (!depTask) return null
                  const pc = PRIORITY_COLOR[depTask.priority] ?? '#94a3b8'
                  return (
                    <span key={depId} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem 0.2rem 0.625rem', background: '#f8fafc', border: `1px solid ${pc}40`, borderLeft: `3px solid ${pc}`, borderRadius: '0.375rem', fontSize: '0.75rem', color: '#172b4d', maxWidth: 220 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{depTask.title}</span>
                      <button
                        onClick={() => removeDep(depId)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1, padding: '0 1px', flexShrink: 0 }}
                        title="Remove dependency"
                      >×</button>
                    </span>
                  )
                })}
              </div>
            )}
            {/* Add dependency select */}
            <select
              value=""
              onChange={e => { addDep(e.target.value); e.target.value = '' }}
              style={{ ...metaSelect, color: '#94a3b8' }}
            >
              <option value="">+ Add dependency…</option>
              {allTasks
                .filter(t => t.id !== task.id && !dependsOn.includes(t.id))
                .map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
            </select>
            {dependsOn.length > 0 && (
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '0.3rem 0 0' }}>
                This task is blocked until the above tasks are complete.
              </p>
            )}
          </div>

          {/* External link */}
          <div>
            <div style={metaLabel}>External resource</div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="url"
                value={externalUrl}
                onChange={e => setExternalUrl(e.target.value)}
                onBlur={() => { if (externalUrl !== (task.external_url ?? '')) save({ external_url: externalUrl.trim() || null }) }}
                placeholder="https://…"
                style={{ ...metaSelect, flex: 1 }}
              />
              {externalUrl && (
                <a href={externalUrl} target="_blank" rel="noreferrer" style={{ flexShrink: 0, padding: '0.375rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>
                  Open ↗
                </a>
              )}
            </div>
          </div>

          {/* Embed */}
          <div>
            <div style={metaLabel}>Embed (Figma, Notion, etc.)</div>
            <input
              type="url"
              value={embedUrl}
              onChange={e => setEmbedUrl(e.target.value)}
              onBlur={() => { if (embedUrl !== (task.embed_url ?? '')) save({ embed_url: embedUrl.trim() || null }) }}
              placeholder="https://…"
              style={metaSelect}
            />
            {embedUrl && (
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  onClick={() => setShowEmbed(e => !e)}
                  style={{ fontSize: '0.75rem', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 600 }}
                >
                  {showEmbed ? '▲ Hide preview' : '▼ Show preview'}
                </button>
                {showEmbed && (
                  <iframe
                    src={embedUrl}
                    style={{ width: '100%', height: 320, border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.5rem' }}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                )}
              </div>
            )}
          </div>

          {/* Cycle time / timestamps */}
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {task.created_at && (
              <span>Created {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            )}
            {task.started_at && (
              <span>Started {new Date(task.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            )}
            {task.completed_at && task.started_at && (() => {
              const days = Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 86400000)
              return (
                <span style={{ color: '#16a34a', fontWeight: 700 }}>
                  ✓ Completed in {days === 0 ? 'less than a day' : `${days} day${days !== 1 ? 's' : ''}`}
                </span>
              )
            })()}
          </div>
        </div>
      </div>
    </>
  )
}

const metaLabel: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: '#6b778c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }
const metaSelect: React.CSSProperties = { width: '100%', padding: '0.4rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.82rem', fontFamily: 'inherit', color: '#172b4d', outline: 'none', background: 'white', boxSizing: 'border-box' }
