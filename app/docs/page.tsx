'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Doc {
  id: string
  title: string
  game: string | null
  parent_id: string | null
  tags: string[]
  author_name: string | null
  updated_at: string
  is_published: boolean
}

export default function DocsPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [gameFilter, setGameFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [gameTitles, setGameTitles] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newGame, setNewGame] = useState('')
  const [newParent, setNewParent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadDocs = useCallback(async () => {
    const params = new URLSearchParams()
    if (gameFilter !== 'all') params.set('game', gameFilter)
    const res = await fetch(`/api/documents?${params}`)
    const d = await res.json()
    setDocs(d.documents ?? [])
    setLoading(false)
  }, [gameFilter])

  useEffect(() => { loadDocs() }, [loadDocs])

  useEffect(() => {
    fetch('/api/admin/game-titles').then(r => r.json()).then(d => {
      setGameTitles((d.gameTitles ?? []).map((g: { name: string }) => g.name))
    })
  }, [])

  const createDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(),
        game: newGame || null,
        parent_id: newParent || null,
        content: '',
      }),
    })
    const d = await res.json()
    if (d.document) {
      setCreating(false)
      setNewTitle(''); setNewGame(''); setNewParent('')
      router.push(`/docs/${d.document.id}`)
    }
    setSubmitting(false)
  }

  const filtered = docs.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  // Build tree: top-level and children
  const roots = filtered.filter(d => !d.parent_id)
  const childrenOf = (id: string) => filtered.filter(d => d.parent_id === id)

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ background: '#0d0d14', borderBottom: '1px solid rgba(232,93,123,0.15)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg,#e85d7b,#ff8fab)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Docs
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>
              Team knowledge base & documentation
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            style={{ padding: '0.55rem 1.25rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(232,93,123,0.4)' }}
          >
            + New Page
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left sidebar — page tree */}
        <div style={{ width: 260, flexShrink: 0, background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: '1rem', position: 'sticky', top: '1rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Pages
          </div>
          <input
            type="text" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.425rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.8rem', fontFamily: 'inherit', marginBottom: '0.625rem', outline: 'none' }}
          />
          <select value={gameFilter} onChange={e => setGameFilter(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.78rem', fontFamily: 'inherit', marginBottom: '0.875rem', background: 'white', color: '#374151' }}>
            <option value="all">All Games</option>
            {gameTitles.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          {loading ? (
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>Loading…</div>
          ) : roots.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No pages yet</div>
          ) : (
            <nav>
              {roots.map(doc => (
                <TreeNode
                  key={doc.id}
                  doc={doc}
                  children={childrenOf(doc.id)}
                  onClick={id => router.push(`/docs/${id}`)}
                />
              ))}
            </nav>
          )}

          <button
            onClick={() => setCreating(true)}
            style={{ width: '100%', marginTop: '0.875rem', padding: '0.45rem', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '0.5rem', fontSize: '0.78rem', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
          >
            + New Page
          </button>
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>No pages yet</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first page to start documenting.</p>
              <button onClick={() => setCreating(true)} style={{ padding: '0.55rem 1.25rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Create first page
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
              {filtered.map(doc => (
                <DocCard key={doc.id} doc={doc} onClick={() => router.push(`/docs/${doc.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create page modal */}
      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ background: '#0d0d14', padding: '1.125rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '1rem 1rem 0 0' }}>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1rem', margin: 0 }}>New Page</h2>
              <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={createDoc} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <label style={lbl}>
                Page Title *
                <input autoFocus required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Art Style Guide" style={inp} />
              </label>
              <label style={lbl}>
                Game / Section
                <select value={newGame} onChange={e => setNewGame(e.target.value)} style={inp}>
                  <option value="">— General —</option>
                  {gameTitles.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label style={lbl}>
                Parent Page (optional)
                <select value={newParent} onChange={e => setNewParent(e.target.value)} style={inp}>
                  <option value="">— Top level —</option>
                  {docs.filter(d => !d.parent_id).map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button type="button" onClick={() => setCreating(false)} style={{ padding: '0.45rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '0.45rem 1.125rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Creating…' : 'Create Page'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function TreeNode({ doc, children, onClick }: { doc: Doc; children: Doc[]; onClick: (id: string) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}
        onClick={() => onClick(doc.id)}
        onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {children.length > 0 && (
          <span onClick={e => { e.stopPropagation(); setOpen(!open) }} style={{ color: '#94a3b8', fontSize: '0.7rem', width: 12 }}>{open ? '▼' : '▶'}</span>
        )}
        {children.length === 0 && <span style={{ width: 12 }} />}
        <span>📄</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span>
      </div>
      {open && children.length > 0 && (
        <div style={{ paddingLeft: '1.125rem' }}>
          {children.map(child => (
            <TreeNode key={child.id} doc={child} children={[]} onClick={onClick} />
          ))}
        </div>
      )}
    </div>
  )
}

function DocCard({ doc, onClick }: { doc: Doc; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ background: 'white', borderRadius: '0.75rem', padding: '1.125rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.1s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#c7d2fe' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>📄</span>
        <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', margin: 0, lineHeight: 1.3, flex: 1 }}>{doc.title}</h3>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {doc.game && (
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px' }}>
            🎮 {doc.game}
          </span>
        )}
        {doc.tags.slice(0, 2).map(t => (
          <span key={t} style={{ fontSize: '0.65rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{t}</span>
        ))}
      </div>
      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.5rem' }}>
        {doc.author_name} · Updated {new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#374151' }
const inp: React.CSSProperties = { padding: '0.55rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box' }
