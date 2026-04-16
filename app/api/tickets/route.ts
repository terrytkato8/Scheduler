import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const game       = searchParams.get('game')
  const projectId  = searchParams.get('project_id')
  const type       = searchParams.get('type')
  const status     = searchParams.get('status')

  const supabase = createClient()
  let query = supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (game)      query = query.eq('game', game)
  if (projectId) query = query.eq('project_id', projectId)
  if (type)      query = query.eq('type', type)
  if (status)    query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tickets: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.title || !body.game || !body.type) {
    return NextResponse.json({ error: 'title, game, and type are required' }, { status: 400 })
  }

  // Get reporter name from profile
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', userId)
    .single()

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      title:               body.title,
      game:                body.game,
      type:                body.type,
      priority:            body.priority ?? 'medium',
      description:         body.description ?? null,
      project_id:          body.project_id ?? null,
      steps_to_reproduce:  body.steps_to_reproduce ?? null,
      expected_behavior:   body.expected_behavior ?? null,
      actual_behavior:     body.actual_behavior ?? null,
      environment:         body.environment ?? null,
      build_version:       body.build_version ?? null,
      user_story:          body.user_story ?? null,
      acceptance_criteria: body.acceptance_criteria ?? null,
      labels:              body.labels ?? [],
      reporter_id:         userId,
      reporter_name:       profile?.display_name ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ticket: data })
}
