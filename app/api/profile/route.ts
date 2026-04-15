import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ profile: data ?? null })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    display_name?: string
    role?: string
    teams?: string[]
    request_team_lead?: boolean
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const supabase = createClient()

  // Check current profile to avoid duplicate team lead requests
  const { data: existing } = await supabase
    .from('profiles')
    .select('team_lead_requested, team_lead_approved')
    .eq('user_id', userId)
    .single()

  const alreadyRequested = existing?.team_lead_requested || existing?.team_lead_approved
  const shouldRequest = body.request_team_lead && !alreadyRequested

  // Primary team = first selected team (for backwards compat with single-team columns)
  const primaryTeam = body.teams?.[0] ?? null

  if (shouldRequest) {
    await supabase.from('team_lead_requests').insert({
      user_id: userId,
      display_name: body.display_name ?? null,
      team: primaryTeam,
      role: body.role ?? null,
      status: 'pending',
    })
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        display_name: body.display_name ?? null,
        role: body.role ?? null,
        team: primaryTeam,
        teams: body.teams ?? [],
        team_lead_requested: body.request_team_lead ?? existing?.team_lead_requested ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Profile save error:', error.message)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
