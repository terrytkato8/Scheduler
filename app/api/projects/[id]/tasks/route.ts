import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', id)
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  let body: {
    title: string
    description?: string
    status?: string
    priority?: string  // 'low' | 'medium' | 'high' | 'critical'
    assignee_id?: string
    due_date?: string
    sprint_id?: string
    milestone_id?: string
    stage?: string     // art pipeline stage
    external_url?: string
    embed_url?: string
    position?: number
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const supabase = createClient()

  // Get max position for ordering
  const { data: existing } = await supabase
    .from('tasks')
    .select('position')
    .eq('project_id', projectId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = body.position ?? ((existing?.position ?? -1) + 1)

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      status: body.status ?? 'backlog',
      priority: body.priority ?? 'medium',
      assignee_id: body.assignee_id ?? null,
      due_date: body.due_date ?? null,
      sprint_id: body.sprint_id ?? null,
      milestone_id: body.milestone_id ?? null,
      stage: body.stage ?? null,
      external_url: body.external_url ?? null,
      embed_url: body.embed_url ?? null,
      creator_id: userId,
      position,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data })
}
