'use client'

import React, { useState, useEffect } from 'react'

const TEAMS = ['Corebound', 'Last Light', 'BBCU', 'Studio']
const ROLES = ['Designer', 'Engineer', 'Artist', 'Sound Designer', 'Other']

interface Profile {
  display_name: string | null
  role: string | null
  team: string | null
  teams: string[] | null
  team_lead_requested: boolean
  team_lead_approved: boolean
  discord_username: string | null
  discord_user_id: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('')
  const [teams, setTeams] = useState<string[]>([])
  const [discordUsername, setDiscordUsername] = useState('')
  const [discordUserId, setDiscordUserId] = useState('')
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
        const t = p.teams ?? (p.team ? [p.team] : [])
        setTeams(t)
        setDiscordUsername(p.discord_username ?? '')
        setDiscordUserId(p.discord_user_id ?? '')
      })
  }, [])

  const toggleTeam = (t: string) =>
    setTeams(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

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
          role: role || null,
          teams,
          discord_username: discordUsername.trim() || null,
          discord_user_id: discordUserId.trim() || null,
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
            <select value={role} onChange={e => setRole(e.target.value)} style={inp}>
              <option value="">— Select a role —</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>

          {/* Multi-team selection */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Team(s)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {TEAMS.map(t => {
                const sel = teams.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTeam(t)}
                    style={{
                      padding: '0.35rem 0.875rem', borderRadius: '999px', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600,
                      border: sel ? '2px solid #667eea' : '1px solid #e2e8f0',
                      background: sel ? '#eef2ff' : 'white',
                      color: sel ? '#4338ca' : '#475569',
                      transition: 'all 0.1s',
                    }}
                  >
                    {sel && '✓ '}{t}
                  </button>
                )
              })}
            </div>
            {teams.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>Select at least one team.</p>
            )}
          </div>

          {/* Discord */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#374151', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1rem' }}>🎮</span> Discord (for meeting alerts)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={lbl}>
                Discord username
                <input
                  type="text"
                  value={discordUsername}
                  onChange={e => setDiscordUsername(e.target.value)}
                  placeholder="e.g. username (no @ needed)"
                  style={inp}
                />
              </label>
              <label style={lbl}>
                Discord user ID
                <input
                  type="text"
                  value={discordUserId}
                  onChange={e => setDiscordUserId(e.target.value)}
                  placeholder="e.g. 123456789012345678"
                  style={inp}
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>
                  Enables direct @mention pings. Find yours in Discord › Settings › Advanced › Developer Mode, then right-click your name.
                </span>
              </label>
            </div>
          </div>

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
