'use client'

import React, { useState, useEffect } from 'react'

interface Profile {
  display_name: string | null
  role: string | null
  team: string | null
  team_lead_requested: boolean
  team_lead_approved: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('')
  const [team, setTeam] = useState('')
  const [requestLead, setRequestLead] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        const p: Profile = d.profile ?? {}
        setProfile(p)
        setDisplayName(p.display_name ?? '')
        setRole(p.role ?? '')
        setTeam(p.team ?? '')
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          role: role.trim() || null,
          team: team.trim() || null,
          request_team_lead: requestLead,
        }),
      })
      if (res.ok) {
        const d = await res.json()
        setProfile(d.profile)
        setStatus('saved')
        setRequestLead(false)
      } else {
        setStatus('error')
      }
    } finally {
      setSaving(false)
    }
  }

  const alreadyRequested = profile?.team_lead_requested || profile?.team_lead_approved

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>My Profile</h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        Set your name, role, and team so teammates can identify you.
      </p>

      <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '2rem', maxWidth: 480 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <label style={lbl}>
            Display name
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your full name"
              style={inp}
            />
          </label>

          <label style={lbl}>
            Role
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Software Engineer, Designer…"
              style={inp}
            />
          </label>

          <label style={lbl}>
            Team
            <select
              value={team}
              onChange={e => setTeam(e.target.value)}
              style={inp}
            >
              <option value="">— Select a team —</option>
              <option value="Corebound">Corebound</option>
              <option value="Last Light">Last Light</option>
              <option value="BBCU">BBCU</option>
              <option value="Studio">Studio</option>
            </select>
          </label>

          {/* Team lead request */}
          <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.875rem', border: '1px solid #e2e8f0' }}>
            {profile?.team_lead_approved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>
                <span style={{ fontSize: '1.1rem' }}>⭐</span> You are an approved Team Lead
              </div>
            ) : profile?.team_lead_requested ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontWeight: 600, fontSize: '0.875rem' }}>
                <span>⏳</span> Team Lead request pending admin approval
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requestLead}
                  onChange={e => setRequestLead(e.target.checked)}
                  disabled={!!alreadyRequested}
                  style={{ accentColor: '#667eea', marginTop: '2px', flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Request Team Lead status</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Submits an approval request to the admin. Once approved, a ⭐ will appear on your profile, your availability grid, and team calendar.
                  </div>
                </div>
              </label>
            )}
          </div>

          {status === 'saved' && <p style={{ color: '#16a34a', fontSize: '0.85rem', margin: 0 }}>Profile saved!</p>}
          {status === 'error' && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>Failed to save. Please try again.</p>}

          <button
            type="submit"
            disabled={saving}
            style={{ padding: '0.625rem 1.5rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, alignSelf: 'flex-start' }}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }
const inp: React.CSSProperties = { padding: '0.625rem 0.875rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.9rem', fontFamily: 'inherit', color: '#1e293b', outline: 'none' }
