import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient()

  // Two separate queries to avoid PostgREST array-contains syntax issues
  const [{ data: owned }, { data: membered }] = await Promise.all([
    supabase.from('projects').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
    supabase.from('projects').select('*').contains('member_ids', [userId]).order('created_at', { ascending: false }),
  ])

  const seen = new Set<string>()
  const projects = [...(owned ?? []), ...(membered ?? [])].filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    name: string
    description?: string
    team?: string
    type?: string
    color?: string
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      team: body.team ?? null,
      type: body.type ?? 'standard',
      color: body.color ?? '#e85d7b',
      owner_id: userId,
      member_ids: [userId],
    })
    .select()
    .single()

  if (error) {
    console.error('Project create error:', error)
    // Surface a friendly message if table doesn't exist yet
    if (error.code === '42P01') {
      return NextResponse.json({
        error: 'DB tables not set up. Run the SQL in supabase/migrations/002_projects_and_teams.sql in your Supabase dashboard.',
        code: 'TABLE_MISSING',
      }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ project: data })
}
