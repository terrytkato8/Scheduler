import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, role, team, team_lead_approved')
    .order('display_name')

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  // Exclude self
  const members = (data ?? []).filter(m => m.user_id !== userId)
  return NextResponse.json({ members })
}
