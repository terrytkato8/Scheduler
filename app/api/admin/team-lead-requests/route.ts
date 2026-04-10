import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { isAdminUser } from '@/lib/auth'

export async function GET() {
  const { userId } = await auth()
  if (!userId || !isAdminUser(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('team_lead_requests')
    .select('*')
    .order('requested_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId || !isAdminUser(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { id: string; status: 'approved' | 'rejected' }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!['approved', 'rejected'].includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = createClient()

  const { data: request } = await supabase
    .from('team_lead_requests')
    .select('user_id')
    .eq('id', body.id)
    .single()

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase
    .from('team_lead_requests')
    .update({ status: body.status, reviewed_at: new Date().toISOString() })
    .eq('id', body.id)

  if (body.status === 'approved') {
    await supabase
      .from('profiles')
      .update({ team_lead_approved: true })
      .eq('user_id', request.user_id)
  } else {
    await supabase
      .from('profiles')
      .update({ team_lead_requested: false })
      .eq('user_id', request.user_id)
  }

  return NextResponse.json({ success: true })
}
