'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface GameTitle {
  id: string
  name: string
  status: 'active' | 'archived'
  sort_order: number
}

interface Department {
  id: string
  name: string
  sort_order: number
}

interface LeadRequest {
  id: string
  user_id: string
  status: string
  created_at: string
  profiles?: {
    display_name: string
    role: string
  }
}

type Tab = 'games' | 'departments' | 'leads' | 'users'

export default function SettingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('games')
  const [gameTitles, setGameTitles] = useState<GameTitle[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [leadRequests, setLeadRequests] = useState<LeadRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Game title form
  const [newGame, setNewGame] = useState('')
  const [addingGame, setAddingGame] = useState(false)

  // Department form
  const [newDept, setNewDept] = useState('')
  const [addingDept, setAddingDept] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/settings')
    if (!res.ok) {
      if (res.status === 403) setError('You do not have admin access to this page.')
      else setError('Failed to load settings.')
      setLoading(false)
      return
    }
    const d = await res.json()
    setGameTitles(d.gameTitles ?? [])
    setDepartments(d.departments ?? [])
    setLeadRequests(d.leadRequests ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const post = async (action: string, extra: Record<string, unknown> = {}) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    return res.json()
  }

  const addGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGame.trim()) return
    setAddingGame(true)
    const d = await post('add_game', { name: newGame.trim() })
    if (d.gameTitle) { setGameTitles(prev => [...prev, d.gameTitle]); setNewGame('') }
    setAddingGame(false)
  }

  const archiveGame = async (id: string) => {
    await post('archive_game', { id })
    setGameTitles(prev => prev.map(g => g.id === id ? { ...g, status: 'archived' } : g))
  }

  const deleteGame = async (id: string) => {
    if (!confirm('Remove this game title? This will not affect existing tickets or projects.')) return
    await post('delete_game', { id })
    setGameTitles(prev => prev.filter(g => g.id !== id))
  }

  const addDept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDept.trim()) return
    setAddingDept(true)
    const d = await post('add_department', { name: newDept.trim() })
    if (d.department) { setDepartments(prev => [...prev, d.department]); setNewDept('') }
    setAddingDept(false)
  }

  const deleteDept = async (id: string) => {
    if (!confirm('Remove this department?')) return
    await post('delete_department', { id })
    setDepartments(prev => prev.filter(d => d.id !== id))
  }

  const approveLead = async (req: LeadRequest) => {
    await post('approve_lead', { id: req.id, user_id: req.user_id })
    setLeadRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
  }

  const rejectLead = async (id: string) => {
    await post('reject_lead', { id })
    setLeadRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r))
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'games',       label: 'Game Titles',  icon: '🎮' },
    { id: 'departments', label: 'Departments',  icon: '🏢' },
    { id: 'leads',       label: 'Lead Requests', icon: '🛡️' },
    { id: 'users',       label: 'Users',         icon: '👥' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      Loading settings…
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ fontSize: '2rem' }}>🔒</div>
      <div style={{ color: '#ef4444', fontWeight: 600 }}>{error}</div>
    </div>
  )

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ background: '#0d0d14', borderBottom: '1px solid rgba(232,93,123,0.15)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontFamily: 'inherit', padding: 0, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ← Dashboard
          </button>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem', background: 'linear-gradient(135deg,#e85d7b,#ff8fab)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Settings
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', margin: 0 }}>
            Admin &amp; studio configuration
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Sidebar nav */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.75rem 1rem', background: tab === t.id ? '#eef2ff' : 'white',
                  border: 'none', borderLeft: tab === t.id ? '3px solid #6366f1' : '3px solid transparent',
                  fontWeight: tab === t.id ? 700 : 500, fontSize: '0.875rem',
                  color: tab === t.id ? '#4338ca' : '#374151',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all 0.1s',
                }}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div style={{ flex: 1 }}>
          {tab === 'games' && (
            <SettingsSection title="Game Titles" description="Manage which game titles appear in project, ticket, and document creation forms.">
              <form onSubmit={addGame} style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem' }}>
                <input
                  value={newGame} onChange={e => setNewGame(e.target.value)}
                  placeholder="New game title…"
                  style={inp}
                />
                <button type="submit" disabled={addingGame || !newGame.trim()} style={addBtn}>
                  {addingGame ? '…' : '+ Add'}
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {gameTitles.map(g => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: g.status === 'archived' ? '#f8fafc' : 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', opacity: g.status === 'archived' ? 0.6 : 1 }}>
                    <span style={{ fontSize: '1.1rem' }}>🎮</span>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{g.name}</span>
                    {g.status === 'archived' && (
                      <span style={{ fontSize: '0.68rem', background: '#f1f5f9', color: '#94a3b8', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>Archived</span>
                    )}
                    {g.status === 'active' && (
                      <button onClick={() => archiveGame(g.id)} style={ghostBtn}>Archive</button>
                    )}
                    <button onClick={() => deleteGame(g.id)} style={dangerBtn}>Remove</button>
                  </div>
                ))}
              </div>
            </SettingsSection>
          )}

          {tab === 'departments' && (
            <SettingsSection title="Departments" description="Manage the departments available when creating or assigning projects.">
              <form onSubmit={addDept} style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem' }}>
                <input
                  value={newDept} onChange={e => setNewDept(e.target.value)}
                  placeholder="New department…"
                  style={inp}
                />
                <button type="submit" disabled={addingDept || !newDept.trim()} style={addBtn}>
                  {addingDept ? '…' : '+ Add'}
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {departments.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🏢</span>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{d.name}</span>
                    <button onClick={() => deleteDept(d.id)} style={dangerBtn}>Remove</button>
                  </div>
                ))}
              </div>
            </SettingsSection>
          )}

          {tab === 'leads' && (
            <SettingsSection title="Team Lead Requests" description="Review and approve requests from team members who want lead/admin access.">
              {leadRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.875rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  No pending lead requests.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {leadRequests.map(req => (
                    <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                        👤
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>
                          {req.profiles?.display_name ?? 'Unknown User'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {req.profiles?.role ?? 'No role'} · Requested {new Date(req.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button onClick={() => approveLead(req)} style={{ padding: '0.35rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                            ✓ Approve
                          </button>
                          <button onClick={() => rejectLead(req.id)} style={{ padding: '0.35rem 0.75rem', background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '0.375rem', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SettingsSection>
          )}

          {tab === 'users' && (
            <SettingsSection title="User Management" description="Manage roles and permissions for team members.">
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.84rem', color: '#92400e' }}>
                <strong>Super Admin Access:</strong> To grant super admin access to a user, run the following in your Supabase SQL editor:
                <pre style={{ background: '#fef3c7', padding: '0.625rem', borderRadius: '0.375rem', marginTop: '0.5rem', fontSize: '0.78rem', overflowX: 'auto' }}>
                  {`UPDATE profiles SET is_super_admin = true\nWHERE user_id = '<clerk_user_id>';`}
                </pre>
              </div>

              <div style={{ marginTop: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem', fontSize: '0.84rem', color: '#166534' }}>
                <strong>Admin Access:</strong> Granted automatically when a Team Lead Request is approved. Can also be set manually via the Lead Requests tab or SQL.
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.625rem' }}>Default Roles</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['Programmer', 'Artist', 'Designer', 'Sound Engineer', 'Producer', 'QA Tester', 'Writer', 'Marketing'].map(role => (
                    <span key={role} style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>{role}</span>
                  ))}
                </div>
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: '0.875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>{title}</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{description}</p>
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending:  { bg: '#fffbeb', text: '#92400e' },
    approved: { bg: '#f0fdf4', text: '#166534' },
    rejected: { bg: '#fef2f2', text: '#991b1b' },
  }
  const c = colors[status] ?? { bg: '#f1f5f9', text: '#475569' }
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: c.bg, color: c.text, padding: '2px 8px', borderRadius: '999px' }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const inp: React.CSSProperties = { flex: 1, padding: '0.55rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none' }
const addBtn: React.CSSProperties = { padding: '0.55rem 1rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }
const ghostBtn: React.CSSProperties = { padding: '0.3rem 0.625rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }
const dangerBtn: React.CSSProperties = { padding: '0.3rem 0.625rem', background: 'white', border: '1px solid #fca5a5', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', color: '#ef4444', fontFamily: 'inherit' }
