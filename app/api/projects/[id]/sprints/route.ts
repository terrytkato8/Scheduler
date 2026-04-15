import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', id)
    .order('start_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sprints: data ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  let body: { name: string; start_date?: string; end_date?: string; goal?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('sprints')
    .insert({
      project_id: projectId,
      name: body.name.trim(),
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      goal: body.goal ?? null,
      status: 'planned',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sprint: data })
}
