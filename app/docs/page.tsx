'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Doc {
  id: string
  title: string
  game: string | null
  parent_id: string | null
  category: string
  subcategory: string | null
  tags: string[]
  author_name: string | null
  updated_at: string
}

const DOC_CATEGORIES = ['All', 'GDD', 'TDD', 'Art Doc', 'Design Doc', 'Process Doc', 'General']

const CATEGORY_META: Record<string, { icon: string; color: string; desc: string }> = {
  'All':         { icon: '📚', color: '#6366f1', desc: 'All documents' },
  'GDD':         { icon: '🎮', color: '#e85d7b', desc: 'Game Design Documents' },
  'TDD':         { icon: '⚙️', color: '#3b82f6', desc: 'Technical Design Documents' },
  'Art Doc':     { icon: '🎨', color: '#8b5cf6', desc: 'Art direction & style guides' },
  'Design Doc':  { icon: '✏️', color: '#f59e0b', desc: 'Feature & UX design specs' },
  'Process Doc': { icon: '📋', color: '#10b981', desc: 'Pipelines, workflows & SOPs' },
  'General':     { icon: '📄', color: '#64748b', desc: 'General documentation' },
}

export default function DocsPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [gameFilter, setGameFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [gameTitles, setGameTitles] = useState<string[]>([])

  // Create modal state
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newGame, setNewGame] = useState('')
  const [newCategory, setNewCategory] = useState('General')
  const [newSubcategory, setNewSubcategory] = useState('')
  const [newParent, setNewParent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadDocs = useCallback(async () => {
    const params = new URLSearchParams()
    if (gameFilter !== 'all') params.set('game', gameFilter)
    if (activeCategory !== 'All') params.set('category', activeCategory)
    const res = await fetch(`/api/documents?${params}`)
    const d = await res.json()
    setDocs(d.documents ?? [])
    setLoading(false)
  }, [gameFilter, activeCategory])

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
        category: newCategory,
        subcategory: newSubcategory.trim() || null,
        content: '',
      }),
    })
    const d = await res.json()
    setSubmitting(false)
    if (d.document) {
      setCreating(false)
      setNewTitle(''); setNewGame(''); setNewParent(''); setNewSubcategory('')
      router.push(`/docs/${d.document.id}`)
    }
  }

  const filtered = docs.filter(d =>
    !search ||
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.subcategory ?? '').toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  // Count per category across ALL docs (not filtered)
  const countsByCategory = (cat: string) => {
    if (cat === 'All') return docs.length
    return docs.filter(d => d.category === cat).length
  }

  // Group filtered docs by subcategory within the active category view
  const subcategories = [...new Set(filtered.map(d => d.subcategory ?? ''))].sort()

  const rootDocs = docs.filter(d => !d.parent_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 52px)', background: '#f0f2f5' }}>
      {/* Portal header */}
      <div style={{ background: '#0d0d14', borderBottom: '1px solid rgba(99,102,241,0.2)', padding: '1.5rem 2rem', flexShrink: 0 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.2rem', background: 'linear-gradient(135deg, #818cf8 0%, #c7d2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Docs
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', margin: 0 }}>
              {docs.length} document{docs.length !== 1 ? 's' : ''} · Team knowledge base
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            style={{ padding: '0.6rem 1.375rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span style={{ fontSize: '1rem' }}>+</span> New Document
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', padding: '1.5rem 2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flex: 1 }}>
        {/* Left sidebar */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1.5rem' }}>
          {/* Search */}
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: '0.875rem' }}>
            <input
              type="text" placeholder="Search docs…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', color: '#374151' }}
            />
          </div>

          {/* Categories */}
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Categories
            </div>
            {DOC_CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat] ?? { icon: '📄', color: '#64748b', desc: '' }
              const count = countsByCategory(cat)
              const active = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.625rem 0.875rem', background: active ? meta.color + '12' : 'white',
                    border: 'none', borderLeft: active ? `3px solid ${meta.color}` : '3px solid transparent',
                    color: active ? meta.color : '#374151', fontWeight: active ? 700 : 400,
                    fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'all 0.1s',
                  }}
                >
                  <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{meta.icon}</span>
                  <span style={{ flex: 1 }}>{cat}</span>
                  {count > 0 && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: active ? meta.color : '#94a3b8', background: active ? meta.color + '18' : '#f1f5f9', padding: '1px 6px', borderRadius: '999px' }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Game filter */}
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: '0.875rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Game</div>
            <select
              value={gameFilter} onChange={e => setGameFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.82rem', fontFamily: 'inherit', background: 'white', color: '#374151', outline: 'none' }}
            >
              <option value="all">All Games</option>
              {gameTitles.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Page tree — top-level roots */}
          {rootDocs.length > 0 && (
            <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Pages
              </div>
              <nav style={{ padding: '0.375rem 0' }}>
                {rootDocs.slice(0, 12).map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => router.push(`/docs/${doc.id}`)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.875rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#475569', textAlign: 'left', fontFamily: 'inherit', overflow: 'hidden' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ flexShrink: 0, fontSize: '0.75rem' }}>📄</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Category hero */}
          {activeCategory !== 'All' && (
            <div style={{ background: 'white', borderRadius: '0.875rem', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${CATEGORY_META[activeCategory]?.color ?? '#6366f1'}` }}>
              <span style={{ fontSize: '1.75rem' }}>{CATEGORY_META[activeCategory]?.icon}</span>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{activeCategory}</h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>{CATEGORY_META[activeCategory]?.desc}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '0.875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                No {activeCategory !== 'All' ? activeCategory : ''} documents yet
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.84rem', marginBottom: '1.5rem' }}>
                Create your first document to start building your knowledge base.
              </p>
              <button onClick={() => { setNewCategory(activeCategory !== 'All' ? activeCategory : 'General'); setCreating(true) }}
                style={{ padding: '0.55rem 1.25rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Create document
              </button>
            </div>
          ) : (
            /* Group by subcategory */
            subcategories.map(sub => {
              const group = filtered.filter(d => (d.subcategory ?? '') === sub)
              if (group.length === 0) return null
              return (
                <div key={sub} style={{ marginBottom: '1.75rem' }}>
                  {sub && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sub}</span>
                      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: '0.875rem' }}>
                    {group.map(doc => (
                      <DocCard key={doc.id} doc={doc} onClick={() => router.push(`/docs/${doc.id}`)} />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Create document modal */}
      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ background: '#0d0d14', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '1rem 1rem 0 0' }}>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1rem', margin: 0 }}>New Document</h2>
              <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={createDoc} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={lbl}>
                Title *
                <input autoFocus required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Art Style Guide" style={inp} />
              </label>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label style={{ ...lbl, flex: 1 }}>
                  Category
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={inp}>
                    {DOC_CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{CATEGORY_META[c]?.icon} {c}</option>
                    ))}
                  </select>
                </label>
                <label style={{ ...lbl, flex: 1 }}>
                  Subcategory
                  <input value={newSubcategory} onChange={e => setNewSubcategory(e.target.value)} placeholder="e.g. Character Design" style={inp} />
                </label>
              </div>

              <label style={lbl}>
                Game / Section
                <select value={newGame} onChange={e => setNewGame(e.target.value)} style={inp}>
                  <option value="">— Studio-wide —</option>
                  {gameTitles.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>

              <label style={lbl}>
                Parent Page <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                <select value={newParent} onChange={e => setNewParent(e.target.value)} style={inp}>
                  <option value="">— Top level —</option>
                  {rootDocs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </label>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                <button type="button" onClick={() => setCreating(false)} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1.25rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Creating…' : 'Create & Edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function DocCard({ doc, onClick }: { doc: Doc; onClick: () => void }) {
  const meta = CATEGORY_META[doc.category] ?? CATEGORY_META['General']
  return (
    <div
      onClick={onClick}
      style={{ background: 'white', borderRadius: '0.875rem', padding: '1.125rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', cursor: 'pointer', border: '1px solid #e2e8f0', borderTop: `3px solid ${meta.color}`, transition: 'all 0.12s' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; el.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)'; el.style.transform = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.625rem' }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0, lineHeight: 1 }}>{meta.icon}</span>
        <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', margin: 0, lineHeight: 1.3, flex: 1 }}>{doc.title}</h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: meta.color, background: meta.color + '15', padding: '2px 7px', borderRadius: '4px' }}>
          {doc.category}
        </span>
        {doc.subcategory && (
          <span style={{ fontSize: '0.65rem', color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
            {doc.subcategory}
          </span>
        )}
        {doc.game && (
          <span style={{ fontSize: '0.65rem', color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
            🎮 {doc.game}
          </span>
        )}
      </div>

      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
        {doc.author_name} · {new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#374151' }
const inp: React.CSSProperties = { padding: '0.55rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none', width: '100%', boxSizing: 'border-box' }
