import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

async function requireAdmin(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('is_admin, is_super_admin')
    .eq('user_id', userId)
    .single()
  return data?.is_admin || data?.is_super_admin
}

// GET: fetch game titles, departments, lead requests
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createClient()
  const [
    { data: gameTitles },
    { data: departments },
    { data: leadRequests },
  ] = await Promise.all([
    supabase.from('game_titles').select('*').order('sort_order'),
    supabase.from('departments').select('*').order('sort_order'),
    supabase.from('team_lead_requests').select('*, profiles!team_lead_requests_user_id_fkey(display_name, role)').order('created_at', { ascending: false }),
  ])

  return NextResponse.json({
    gameTitles:   gameTitles ?? [],
    departments:  departments ?? [],
    leadRequests: leadRequests ?? [],
  })
}

// POST: add game title or department, or approve/reject lead request
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireAdmin(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const supabase = createClient()

  if (body.action === 'add_game') {
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const { data, error } = await supabase
      .from('game_titles')
      .insert({ name: body.name, sort_order: body.sort_order ?? 99 })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ gameTitle: data })
  }

  if (body.action === 'delete_game') {
    await supabase.from('game_titles').delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'archive_game') {
    await supabase.from('game_titles').update({ status: 'archived' }).eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'add_department') {
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const { data, error } = await supabase
      .from('departments')
      .insert({ name: body.name, sort_order: body.sort_order ?? 99 })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ department: data })
  }

  if (body.action === 'delete_department') {
    await supabase.from('departments').delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'approve_lead') {
    await supabase.from('team_lead_requests').update({ status: 'approved' }).eq('id', body.id)
    if (body.user_id) {
      await supabase.from('profiles').update({ is_admin: true }).eq('user_id', body.user_id)
    }
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'reject_lead') {
    await supabase.from('team_lead_requests').update({ status: 'rejected' }).eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'set_super_admin') {
    await supabase.from('profiles').update({ is_super_admin: true }).eq('user_id', body.user_id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
