'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Document {
  id: string
  title: string
  content: string
  game: string | null
  parent_id: string | null
  tags: string[]
  author_name: string | null
  last_editor_name: string | null
  linked_project_ids: string[]
  linked_ticket_ids: string[]
  created_at: string
  updated_at: string
}

export default function DocEditorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/documents/${id}`)
    const d = await res.json()
    if (d.document) {
      setDoc(d.document)
      setTitle(d.document.title)
      setContent(d.document.content)
      setTags(d.document.tags?.join(', ') ?? '')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      }),
    })
    const d = await res.json()
    if (d.document) {
      setDoc(d.document)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Archive this page? It will be hidden from the docs list.')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    router.push('/docs')
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>Loading…</div>
  if (!doc) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#ef4444', fontWeight: 600 }}>Page not found</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 52px)', background: '#f8fafc' }}>
      {/* Top toolbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button onClick={() => router.push('/docs')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.82rem', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ← Docs
          </button>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{doc.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {saved && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>✓ Saved</span>}
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setTitle(doc.title); setContent(doc.content); setTags(doc.tags.join(', ')) }}
                style={{ padding: '0.4rem 0.875rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                style={{ padding: '0.4rem 0.875rem', background: '#e85d7b', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                style={{ padding: '0.4rem 0.875rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>
                ✏️ Edit
              </button>
              <button onClick={handleDelete}
                style={{ padding: '0.4rem 0.875rem', background: 'white', border: '1px solid #fca5a5', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', color: '#ef4444', fontFamily: 'inherit' }}>
                Archive
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', width: '100%', padding: '2rem 2rem' }}>
        {editing ? (
          /* Edit mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', border: 'none', borderBottom: '2px solid #6366f1', outline: 'none', background: 'transparent', fontFamily: 'inherit', width: '100%', paddingBottom: '0.5rem' }}
            />
            <input
              value={tags} onChange={e => setTags(e.target.value)}
              placeholder="Tags (comma-separated): design, gameplay, art…"
              style={{ padding: '0.45rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.82rem', fontFamily: 'inherit', color: '#374151', outline: 'none' }}
            />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Content (Markdown supported)
              </div>
              <textarea
                value={content} onChange={e => setContent(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', minHeight: 480, padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', fontFamily: "'Courier New', monospace", color: '#1e293b', lineHeight: 1.7, outline: 'none', resize: 'vertical', background: 'white' }}
                placeholder={'# Heading 1\n## Heading 2\n\nParagraph text...\n\n- Bullet item\n- Another item\n\n**Bold** and *italic* text\n\n```\nCode block\n```'}
              />
            </div>
          </div>
        ) : (
          /* View mode */
          <div>
            {/* Page header */}
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.75rem' }}>{doc.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {doc.game && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
                    🎮 {doc.game}
                  </span>
                )}
                {doc.tags.map(t => (
                  <span key={t} style={{ fontSize: '0.68rem', color: '#64748b', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px' }}>{t}</span>
                ))}
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  Last edited by {doc.last_editor_name ?? doc.author_name ?? 'Unknown'} · {new Date(doc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Content */}
            {doc.content ? (
              <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', minHeight: 200 }}>
                <MarkdownRenderer content={doc.content} />
              </div>
            ) : (
              <div
                onClick={() => setEditing(true)}
                style={{ background: 'white', borderRadius: '0.75rem', padding: '3rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', textAlign: 'center', cursor: 'pointer', border: '2px dashed #e2e8f0', color: '#94a3b8', fontSize: '0.875rem' }}
              >
                📝 This page is empty. Click to start writing.
              </div>
            )}

            {/* Linked items */}
            {(doc.linked_project_ids?.length > 0 || doc.linked_ticket_ids?.length > 0) && (
              <div style={{ marginTop: '1.5rem', background: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Linked Items</div>
                {doc.linked_project_ids?.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{doc.linked_project_ids.length} linked project{doc.linked_project_ids.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {doc.linked_ticket_ids?.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{doc.linked_ticket_ids.length} linked ticket{doc.linked_ticket_ids.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* Simple markdown-to-HTML renderer */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontSize: '1.625rem', fontWeight: 800, color: '#1e293b', margin: '1.5rem 0 0.75rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>{inlineFormat(line.slice(2))}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '1.25rem 0 0.5rem' }}>{inlineFormat(line.slice(3))}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: '1rem 0 0.375rem' }}>{inlineFormat(line.slice(4))}</h3>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(<ul key={`ul-${i}`} style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>{items.map((it, j) => <li key={j}>{inlineFormat(it)}</li>)}</ul>)
      continue
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      elements.push(<ol key={`ol-${i}`} style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>{items.map((it, j) => <li key={j}>{inlineFormat(it)}</li>)}</ol>)
      continue
    } else if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(<pre key={i} style={{ background: '#1e293b', color: '#e2e8f0', borderRadius: '0.5rem', padding: '1rem', overflowX: 'auto', fontSize: '0.85rem', margin: '0.75rem 0', lineHeight: 1.5 }}><code>{codeLines.join('\n')}</code></pre>)
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem', margin: '0.5rem 0', color: '#475569', fontStyle: 'italic', fontSize: '0.95rem' }}>{inlineFormat(line.slice(2))}</blockquote>)
    } else if (line.startsWith('---') || line.startsWith('***')) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1.5rem 0' }} />)
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '0.5rem' }} />)
    } else {
      elements.push(<p key={i} style={{ color: '#374151', lineHeight: 1.7, margin: '0.25rem 0', fontSize: '0.95rem' }}>{inlineFormat(line)}</p>)
    }
    i++
  }

  return <div>{elements}</div>
}

function inlineFormat(text: string): React.ReactNode {
  // Bold + italic + inline code + links
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', fontSize: '0.88em', fontFamily: 'monospace', color: '#e85d7b' }}>{part.slice(1, -1)}</code>
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/)
    if (linkMatch) return <a key={i} href={linkMatch[2]} style={{ color: '#6366f1', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>
    return part
  })
}
