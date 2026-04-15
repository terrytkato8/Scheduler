'use client'

import React, { useState, useEffect } from 'react'

interface Member {
  user_id: string
  display_name: string | null
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
}

interface Props {
  task?: Task | null
  projectId: string
  defaultStatus?: string
  defaultStage?: string
  onSave: (task: Task) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

const PRIORITIES = ['low', 'medium', 'high', 'critical']
const PRIORITY_COLOR: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
}

export default function TaskModal({ task, projectId, defaultStatus, defaultStage, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState(task?.priority ?? 'medium')
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [externalUrl, setExternalUrl] = useState(task?.external_url ?? '')
  const [embedUrl, setEmbedUrl] = useState(task?.embed_url ?? '')
  const [members, setMembers] = useState<Member[]>([])
  const [saving, setSaving] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)

  useEffect(() => {
    fetch('/api/members')
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      let res: Response
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        external_url: externalUrl.trim() || null,
        embed_url: embedUrl.trim() || null,
        ...(defaultStatus && !task ? { status: defaultStatus } : {}),
        ...(defaultStage && !task ? { stage: defaultStage } : {}),
      }
      if (task) {
        res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/projects/${projectId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (res.ok) {
        const d = await res.json()
        onSave(d.task)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !onDelete) return
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    onDelete(task.id)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {task ? 'Edit Task' : 'New Task'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.3rem', lineHeight: 1, padding: 0 }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <label style={lbl}>
            Title *
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" style={inp} />
          </label>

          <label style={lbl}>
            Description
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Details, acceptance criteria…"
              rows={3}
              style={{ ...inp, resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ ...lbl, flex: 1, minWidth: 120 }}>
              Priority
              <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...inp, color: PRIORITY_COLOR[priority] }}>
                {PRIORITIES.map(p => <option key={p} value={p} style={{ color: PRIORITY_COLOR[p] }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </label>

            <label style={{ ...lbl, flex: 1, minWidth: 120 }}>
              Due date
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} />
            </label>
          </div>

          <label style={lbl}>
            Assignee
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={inp}>
              <option value="">— Unassigned —</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.display_name || 'Member'}</option>
              ))}
            </select>
          </label>

          <label style={lbl}>
            External link
            <input
              type="url"
              value={externalUrl}
              onChange={e => setExternalUrl(e.target.value)}
              placeholder="https://…"
              style={inp}
            />
          </label>

          <label style={lbl}>
            Embed URL
            <input
              type="url"
              value={embedUrl}
              onChange={e => setEmbedUrl(e.target.value)}
              placeholder="https://… (Figma, Notion, etc.)"
              style={inp}
            />
          </label>

          {embedUrl && (
            <div>
              <button
                type="button"
                onClick={() => setShowEmbed(e => !e)}
                style={{ fontSize: '0.78rem', color: '#667eea', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              >
                {showEmbed ? 'Hide embed' : 'Preview embed'}
              </button>
              {showEmbed && (
                <iframe
                  src={embedUrl}
                  style={{ width: '100%', height: 300, border: '1px solid #e2e8f0', borderRadius: '0.375rem', marginTop: '0.5rem' }}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
            <div>
              {task && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{ padding: '0.5rem 0.875rem', background: 'white', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Delete
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.25rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : task ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }
const inp: React.CSSProperties = { padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box' }
