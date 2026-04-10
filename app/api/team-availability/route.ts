import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createClient()

    const { data: avData, error } = await supabase
      .from('availability')
      .select('user_id, display_name, available_slots, busy_slots')
      .order('updated_at', { ascending: true })

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

    const userIds = (avData ?? []).map(a => a.user_id)

    let profileMap: Record<string, { team: string | null; role: string | null; team_lead_approved: boolean }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, team, role, team_lead_approved')
        .in('user_id', userIds)

      profileMap = Object.fromEntries(
        (profiles ?? []).map(p => [p.user_id, p])
      )
    }

    const members = (avData ?? []).map(a => ({
      user_id: a.user_id,
      display_name: a.display_name,
      available_slots: a.available_slots ?? [],
      busy_slots: a.busy_slots ?? [],
      team: profileMap[a.user_id]?.team ?? null,
      role: profileMap[a.user_id]?.role ?? null,
      team_lead_approved: profileMap[a.user_id]?.team_lead_approved ?? false,
    }))

    return NextResponse.json({ members })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
