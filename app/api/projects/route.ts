import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .or(`owner_id.eq.${userId},member_ids.cs.{${userId}}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    name: string
    description?: string
    team?: string
    type?: string   // 'kanban' | 'art_pipeline' | 'standard'
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      team: body.team ?? null,
      type: body.type ?? 'standard',
      owner_id: userId,
      member_ids: [userId],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data })
}
