'use client'

import { useState, useEffect } from 'react'

interface Request {
  id: string
  user_id: string
  display_name: string | null
  team: string | null
  role: string | null
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  reviewed_at: string | null
}

export default function AdminPanel() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [testingDiscord, setTestingDiscord] = useState(false)
  const [discordTestResult, setDiscordTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const sendTestAlert = async () => {
    setTestingDiscord(true)
    setDiscordTestResult(null)
    try {
      const res = await fetch('/api/discord/test-alert', { method: 'POST' })
      const d = await res.json()
      setDiscordTestResult({ ok: res.ok, msg: d.message ?? d.error ?? String(res.status) })
    } catch (e) {
      setDiscordTestResult({ ok: false, msg: String(e) })
    } finally {
      setTestingDiscord(false)
    }
  }

  const load = () => {
    fetch('/api/admin/team-lead-requests')
      .then(r => r.json())
      .then(d => { setRequests(d.requests ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const action = async (id: string, status: 'approved' | 'rejected') => {
    setActing(id)
    try {
      await fetch('/api/admin/team-lead-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      load()
    } finally {
      setActing(null)
    }
  }

  const pending = requests.filter(r => r.status === 'pending')
  const reviewed = requests.filter(r => r.status !== 'pending')

  if (loading) return <p style={{ color: '#64748b' }}>Loading…</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 640 }}>
      {/* Discord alerts */}
      <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>🎮 Discord Meeting Alerts</span>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem' }}>
            Sends a test message to your configured Discord webhook. Make sure <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', fontSize: '0.8rem' }}>DISCORD_WEBHOOK_URL</code> is set in your Vercel environment variables.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
            <button
              onClick={sendTestAlert}
              disabled={testingDiscord}
              style={{ padding: '0.5rem 1.125rem', background: '#5865f2', border: 'none', color: 'white', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', opacity: testingDiscord ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {testingDiscord ? '⏳ Sending…' : '🔔 Send test alert'}
            </button>
            {discordTestResult && (
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: discordTestResult.ok ? '#16a34a' : '#dc2626' }}>
                {discordTestResult.ok ? '✅' : '❌'} {discordTestResult.msg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pending */}
      <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Pending requests</span>
          {pending.length > 0 && (
            <span style={{ background: '#fde68a', color: '#92400e', borderRadius: '999px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <p style={{ padding: '1.5rem 1.25rem', color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>No pending requests</p>
        ) : (
          pending.map(r => (
            <div key={r.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                  {r.display_name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unnamed user</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {r.role && <span>Role: {r.role}</span>}
                  {r.team && <span>Team: {r.team}</span>}
                  <span>Requested: {new Date(r.requested_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => action(r.id, 'rejected')}
                  disabled={acting === r.id}
                  style={{ padding: '0.4rem 0.875rem', background: 'white', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', opacity: acting === r.id ? 0.6 : 1 }}
                >
                  Reject
                </button>
                <button
                  onClick={() => action(r.id, 'approved')}
                  disabled={acting === r.id}
                  style={{ padding: '0.4rem 0.875rem', background: '#667eea', border: 'none', color: 'white', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', opacity: acting === r.id ? 0.6 : 1 }}
                >
                  {acting === r.id ? '…' : 'Approve ⭐'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reviewed history */}
      {reviewed.length > 0 && (
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Reviewed</span>
          </div>
          {reviewed.map(r => (
            <div key={r.id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                  {r.display_name || 'Unnamed user'}
                </div>
                {r.team && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Team: {r.team}</div>}
              </div>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, borderRadius: '999px', padding: '2px 10px',
                background: r.status === 'approved' ? '#dcfce7' : '#fee2e2',
                color: r.status === 'approved' ? '#16a34a' : '#dc2626',
              }}>
                {r.status === 'approved' ? '⭐ Approved' : 'Rejected'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
