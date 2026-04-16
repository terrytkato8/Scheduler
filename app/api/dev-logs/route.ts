import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const game      = searchParams.get('game')
  const projectId = searchParams.get('project_id')

  const supabase = createClient()
  let query = supabase
    .from('dev_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (game)      query = query.eq('game', game)
  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.title || !body.game || !body.content) {
    return NextResponse.json({ error: 'title, game, and content are required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', userId)
    .single()

  const { data, error } = await supabase
    .from('dev_logs')
    .insert({
      title:       body.title,
      game:        body.game,
      content:     body.content,
      version:     body.version ?? null,
      log_type:    body.log_type ?? 'update',
      project_id:  body.project_id ?? null,
      author_id:   userId,
      author_name: profile?.display_name ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}
