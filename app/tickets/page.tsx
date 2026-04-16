'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Ticket {
  id: string
  ticket_number: number
  project_id: string | null
  game: string
  type: 'bug' | 'feature' | 'improvement' | 'task'
  status: 'open' | 'in_progress' | 'in_review' | 'resolved' | 'closed' | 'wont_fix'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string | null
  steps_to_reproduce: string | null
  expected_behavior: string | null
  actual_behavior: string | null
  environment: string | null
  build_version: string | null
  user_story: string | null
  acceptance_criteria: string | null
  reporter_id: string
  reporter_name: string | null
  assignee_id: string | null
  assignee_name: string | null
  labels: string[]
  created_at: string
  updated_at: string
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e',
}
const PRIORITY_BG: Record<string, string> = {
  critical: '#fef2f2', high: '#fff7ed', medium: '#fffbeb', low: '#f0fdf4',
}
const STATUS_COLOR: Record<string, string> = {
  open: '#6366f1', in_progress: '#3b82f6', in_review: '#8b5cf6',
  resolved: '#10b981', closed: '#64748b', wont_fix: '#94a3b8',
}
const TYPE_COLOR: Record<string, string> = {
  bug: '#ef4444', feature: '#3b82f6', improvement: '#8b5cf6', task: '#64748b',
}
const TYPE_ICON: Record<string, string> = {
  bug: '🐛', feature: '✨', improvement: '⬆️', task: '✓',
}

const STATUSES = ['open', 'in_progress', 'in_review', 'resolved', 'closed', 'wont_fix']
const PRIORITIES = ['critical', 'high', 'medium', 'low']
const TYPES = ['bug', 'feature', 'improvement', 'task']

function fmtId(type: string, num: number) {
  const prefix = type === 'bug' ? 'BUG' : type === 'feature' ? 'FEAT' : type === 'improvement' ? 'IMP' : 'TASK'
  return `${prefix}-${String(num).padStart(4, '0')}`
}

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [gameFilter, setGameFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [creating, setCreating] = useState(false)
  const [gameTitles, setGameTitles] = useState<string[]>([])

  const loadTickets = useCallback(async () => {
    const params = new URLSearchParams()
    if (gameFilter !== 'all') params.set('game', gameFilter)
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const res = await fetch(`/api/tickets?${params}`)
    const d = await res.json()
    setTickets(d.tickets ?? [])
    setLoading(false)
  }, [gameFilter, typeFilter, statusFilter])

  useEffect(() => { loadTickets() }, [loadTickets])

  useEffect(() => {
    fetch('/api/admin/game-titles').then(r => r.json()).then(d => {
      setGameTitles((d.gameTitles ?? []).map((g: { name: string }) => g.name))
    })
  }, [])

  const filtered = tickets.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    fmtId(t.type, t.ticket_number).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ background: '#0d0d14', borderBottom: '1px solid rgba(232,93,123,0.15)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button onClick={() => router.push('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontFamily: 'inherit', padding: 0, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ← Projects
            </button>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg,#e85d7b,#ff8fab)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              All Tickets
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>
              {filtered.length} ticket{filtered.length !== 1 ? 's' : ''} across all projects
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            style={{ padding: '0.55rem 1.25rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(232,93,123,0.4)' }}
          >
            + New Ticket
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 2rem' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <input
            type="text" placeholder="Search tickets…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.5rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', background: 'white', minWidth: 200, outline: 'none' }}
          />
          <select value={gameFilter} onChange={e => setGameFilter(e.target.value)} style={selSt}>
            <option value="all">All Games</option>
            {gameTitles.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selSt}>
            <option value="all">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selSt}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            No tickets found. <button onClick={() => setCreating(true)} style={{ background: 'none', border: 'none', color: '#e85d7b', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Create one.</button>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px 90px 100px 130px', gap: '1rem', padding: '0.625rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div>ID</div><div>Title</div><div>Type</div><div>Priority</div><div>Status</div><div>Game</div>
            </div>
            {filtered.map((t, i) => (
              <div
                key={t.id}
                onClick={() => setSelected(t)}
                style={{
                  display: 'grid', gridTemplateColumns: '120px 1fr 90px 90px 100px 130px',
                  gap: '1rem', padding: '0.75rem 1.25rem', cursor: 'pointer',
                  borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: 'white', transition: 'background 0.1s',
                  alignItems: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TYPE_COLOR[t.type], fontFamily: 'monospace' }}>
                  {fmtId(t.type, t.ticket_number)}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.title}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TYPE_COLOR[t.type], background: TYPE_COLOR[t.type] + '15', padding: '2px 7px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', width: 'fit-content' }}>
                  {TYPE_ICON[t.type]} {t.type}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: PRIORITY_COLOR[t.priority], background: PRIORITY_BG[t.priority], padding: '2px 7px', borderRadius: '4px', width: 'fit-content' }}>
                  {t.priority}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: STATUS_COLOR[t.status], background: STATUS_COLOR[t.status] + '18', padding: '2px 7px', borderRadius: '4px', width: 'fit-content' }}>
                  {t.status.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#6b778c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.game}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket detail drawer */}
      {selected && (
        <TicketDrawer
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdate={updated => {
            setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))
            setSelected(updated)
          }}
          onDelete={id => {
            setTickets(prev => prev.filter(t => t.id !== id))
            setSelected(null)
          }}
        />
      )}

      {/* Create ticket modal */}
      {creating && (
        <CreateTicketModal
          gameTitles={gameTitles}
          onClose={() => setCreating(false)}
          onCreate={ticket => {
            setTickets(prev => [ticket, ...prev])
            setCreating(false)
            setSelected(ticket)
          }}
        />
      )}
    </div>
  )
}

/* ─── Ticket Detail Drawer ─── */
function TicketDrawer({ ticket, onClose, onUpdate, onDelete }: {
  ticket: Ticket
  onClose: () => void
  onUpdate: (t: Ticket) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(ticket.status)
  const [priority, setPriority] = useState(ticket.priority)
  const [saving, setSaving] = useState(false)

  const save = async (patch: Partial<Ticket>) => {
    setSaving(true)
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const d = await res.json()
    if (d.ticket) onUpdate(d.ticket)
    setSaving(false)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this ticket? This cannot be undone.')) return
    await fetch(`/api/tickets/${ticket.id}`, { method: 'DELETE' })
    onDelete(ticket.id)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex' }}>
      <div style={{ flex: 1, background: 'rgba(15,23,42,0.5)' }} onClick={onClose} />
      <div style={{ width: 580, background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Drawer header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TYPE_COLOR[ticket.type], fontFamily: 'monospace' }}>
                {fmtId(ticket.type, ticket.ticket_number)}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TYPE_COLOR[ticket.type], background: TYPE_COLOR[ticket.type] + '15', padding: '2px 7px', borderRadius: '4px' }}>
                {TYPE_ICON[ticket.type]} {ticket.type}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{ticket.game}</span>
            </div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.3 }}>{ticket.title}</h2>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Reported by {ticket.reporter_name ?? 'Unknown'} · {new Date(ticket.created_at).toLocaleDateString()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            <button onClick={handleDelete} style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '0.375rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '0.375rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>✕ Close</button>
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
          {/* Status + Priority quick-edit */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Status</div>
              <select
                value={status}
                onChange={async e => { setStatus(e.target.value as Ticket['status']); await save({ status: e.target.value as Ticket['status'] }) }}
                disabled={saving}
                style={{ padding: '0.375rem 0.625rem', border: `2px solid ${STATUS_COLOR[status]}`, borderRadius: '0.375rem', fontSize: '0.8rem', color: STATUS_COLOR[status], fontWeight: 600, fontFamily: 'inherit', background: STATUS_COLOR[status] + '12', cursor: 'pointer', outline: 'none' }}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Priority</div>
              <select
                value={priority}
                onChange={async e => { setPriority(e.target.value as Ticket['priority']); await save({ priority: e.target.value as Ticket['priority'] }) }}
                disabled={saving}
                style={{ padding: '0.375rem 0.625rem', border: `2px solid ${PRIORITY_COLOR[priority]}`, borderRadius: '0.375rem', fontSize: '0.8rem', color: PRIORITY_COLOR[priority], fontWeight: 600, fontFamily: 'inherit', background: PRIORITY_BG[priority], cursor: 'pointer', outline: 'none' }}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <Section label="Description">{ticket.description}</Section>
          )}

          {/* Bug fields */}
          {ticket.type === 'bug' && (
            <>
              {ticket.steps_to_reproduce && <Section label="Steps to Reproduce"><pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: '0.84rem', color: '#374151' }}>{ticket.steps_to_reproduce}</pre></Section>}
              {ticket.expected_behavior  && <Section label="Expected Behavior">{ticket.expected_behavior}</Section>}
              {ticket.actual_behavior    && <Section label="Actual Behavior"><span style={{ color: '#ef4444' }}>{ticket.actual_behavior}</span></Section>}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {ticket.environment   && <MetaItem label="Environment"   value={ticket.environment} />}
                {ticket.build_version && <MetaItem label="Build Version" value={ticket.build_version} />}
              </div>
            </>
          )}

          {/* Feature fields */}
          {ticket.type === 'feature' && (
            <>
              {ticket.user_story          && <Section label="User Story">{ticket.user_story}</Section>}
              {ticket.acceptance_criteria && <Section label="Acceptance Criteria"><pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: '0.84rem', color: '#374151' }}>{ticket.acceptance_criteria}</pre></Section>}
            </>
          )}

          {/* Labels */}
          {ticket.labels?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Labels</div>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {ticket.labels.map(l => (
                  <span key={l} style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit full ticket */}
        {editing && (
          <TicketEditForm ticket={ticket} onSave={save} onCancel={() => setEditing(false)} />
        )}
        {!editing && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <button onClick={() => setEditing(true)} style={{ width: '100%', padding: '0.5rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.84rem', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
              Edit ticket details
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, background: '#f8fafc', borderRadius: '0.5rem', padding: '0.625rem 0.875rem' }}>{children}</div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '0.82rem', color: '#374151', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>{value}</div>
    </div>
  )
}

/* ─── Edit Form (inline) ─── */
function TicketEditForm({ ticket, onSave, onCancel }: {
  ticket: Ticket
  onSave: (patch: Partial<Ticket>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    title: ticket.title,
    description: ticket.description ?? '',
    steps_to_reproduce: ticket.steps_to_reproduce ?? '',
    expected_behavior: ticket.expected_behavior ?? '',
    actual_behavior: ticket.actual_behavior ?? '',
    environment: ticket.environment ?? '',
    build_version: ticket.build_version ?? '',
    user_story: ticket.user_story ?? '',
    acceptance_criteria: ticket.acceptance_criteria ?? '',
  })

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div style={{ padding: '1.25rem 1.5rem', borderTop: '2px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <ELabel label="Title"><EInput value={form.title} onChange={f('title')} /></ELabel>
      <ELabel label="Description"><ETextarea value={form.description} onChange={f('description')} rows={3} /></ELabel>
      {ticket.type === 'bug' && (<>
        <ELabel label="Steps to Reproduce"><ETextarea value={form.steps_to_reproduce} onChange={f('steps_to_reproduce')} rows={4} placeholder="1. Go to..&#10;2. Click...&#10;3. See error" /></ELabel>
        <ELabel label="Expected Behavior"><ETextarea value={form.expected_behavior} onChange={f('expected_behavior')} rows={2} /></ELabel>
        <ELabel label="Actual Behavior"><ETextarea value={form.actual_behavior} onChange={f('actual_behavior')} rows={2} /></ELabel>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <ELabel label="Environment"><EInput value={form.environment} onChange={f('environment')} placeholder="Windows 11, Chrome 120" /></ELabel>
          <ELabel label="Build Version"><EInput value={form.build_version} onChange={f('build_version')} placeholder="v0.4.2" /></ELabel>
        </div>
      </>)}
      {ticket.type === 'feature' && (<>
        <ELabel label="User Story"><ETextarea value={form.user_story} onChange={f('user_story')} rows={2} placeholder="As a [user], I want to [action] so that [benefit]" /></ELabel>
        <ELabel label="Acceptance Criteria"><ETextarea value={form.acceptance_criteria} onChange={f('acceptance_criteria')} rows={4} placeholder="- [ ] Criteria 1&#10;- [ ] Criteria 2" /></ELabel>
      </>)}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '0.45rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={() => onSave(form)} style={{ padding: '0.45rem 1rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>Save changes</button>
      </div>
    </div>
  )
}

function ELabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: '#374151', flex: 1 }}>{label}{children}</label>
}
function EInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ padding: '0.45rem 0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.84rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none' }} />
}
function ETextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ padding: '0.45rem 0.625rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.84rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
}

/* ─── Create Ticket Modal ─── */
function CreateTicketModal({ gameTitles, onClose, onCreate }: {
  gameTitles: string[]
  onClose: () => void
  onCreate: (t: Ticket) => void
}) {
  const [type, setType] = useState<'bug' | 'feature' | 'improvement' | 'task'>('bug')
  const [game, setGame] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [description, setDescription] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [expectedBehavior, setExpectedBehavior] = useState('')
  const [actualBehavior, setActualBehavior] = useState('')
  const [environment, setEnvironment] = useState('')
  const [buildVersion, setBuildVersion] = useState('')
  const [userStory, setUserStory] = useState('')
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!game) { setError('Please select a game.'); return }
    setSubmitting(true); setError('')
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type, game, title, priority, description: description || null,
        steps_to_reproduce: stepsToReproduce || null,
        expected_behavior: expectedBehavior || null,
        actual_behavior: actualBehavior || null,
        environment: environment || null,
        build_version: buildVersion || null,
        user_story: userStory || null,
        acceptance_criteria: acceptanceCriteria || null,
      }),
    })
    const d = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(d.error ?? 'Failed to create ticket'); return }
    onCreate(d.ticket)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        {/* Modal header */}
        <div style={{ background: '#0d0d14', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '1rem 1rem 0 0' }}>
          <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>Create Ticket</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={submit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {/* Type selector */}
          <div>
            <div style={lbl}>Ticket Type</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {TYPES.map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setType(t as typeof type)}
                  style={{ flex: 1, padding: '0.5rem 0.25rem', border: `2px solid ${type === t ? TYPE_COLOR[t] : '#e2e8f0'}`, borderRadius: '0.5rem', background: type === t ? TYPE_COLOR[t] + '12' : 'white', color: type === t ? TYPE_COLOR[t] : '#6b778c', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s' }}
                >
                  {TYPE_ICON[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <label style={{ ...lblSt, flex: 1 }}>
              Game / Title *
              <select required value={game} onChange={e => setGame(e.target.value)} style={inp}>
                <option value="">— Select —</option>
                {gameTitles.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label style={{ ...lblSt, flex: 1 }}>
              Priority
              <select value={priority} onChange={e => setPriority(e.target.value)} style={inp}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <label style={lblSt}>
            Title *
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder={type === 'bug' ? 'Short description of the bug' : 'Feature or improvement title'} style={inp} />
          </label>

          <label style={lblSt}>
            Description
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Provide context and details…" style={{ ...inp, resize: 'vertical' }} />
          </label>

          {type === 'bug' && (<>
            <label style={lblSt}>
              Steps to Reproduce
              <textarea value={stepsToReproduce} onChange={e => setStepsToReproduce(e.target.value)} rows={4} placeholder={'1. Navigate to...\n2. Click...\n3. Observe...'} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <label style={{ ...lblSt, flex: 1 }}>
                Expected Behavior
                <textarea value={expectedBehavior} onChange={e => setExpectedBehavior(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
              </label>
              <label style={{ ...lblSt, flex: 1 }}>
                Actual Behavior
                <textarea value={actualBehavior} onChange={e => setActualBehavior(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <label style={{ ...lblSt, flex: 1 }}>
                Environment
                <input value={environment} onChange={e => setEnvironment(e.target.value)} placeholder="OS, browser, device…" style={inp} />
              </label>
              <label style={{ ...lblSt, flex: 1 }}>
                Build / Version
                <input value={buildVersion} onChange={e => setBuildVersion(e.target.value)} placeholder="v0.4.2" style={inp} />
              </label>
            </div>
          </>)}

          {(type === 'feature' || type === 'improvement') && (<>
            <label style={lblSt}>
              User Story
              <textarea value={userStory} onChange={e => setUserStory(e.target.value)} rows={2} placeholder="As a [user], I want to [action] so that [benefit]…" style={{ ...inp, resize: 'vertical' }} />
            </label>
            <label style={lblSt}>
              Acceptance Criteria
              <textarea value={acceptanceCriteria} onChange={e => setAcceptanceCriteria(e.target.value)} rows={4} placeholder={'- [ ] Criterion 1\n- [ ] Criterion 2'} style={{ ...inp, resize: 'vertical' }} />
            </label>
          </>)}

          {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.25rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.55rem 1.125rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '0.55rem 1.25rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Creating…' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const selSt: React.CSSProperties = {
  padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
  fontSize: '0.82rem', fontFamily: 'inherit', color: '#374151', background: 'white', cursor: 'pointer', outline: 'none',
}
const lbl: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.375rem' }
const lblSt: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }
const inp: React.CSSProperties = { padding: '0.55rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box' }
