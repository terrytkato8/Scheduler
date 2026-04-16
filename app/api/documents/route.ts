import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const game     = searchParams.get('game')
  const parentId = searchParams.get('parent_id')

  const supabase = createClient()
  let query = supabase
    .from('documents')
    .select('id, title, game, parent_id, tags, author_name, created_at, updated_at, is_published')
    .eq('is_published', true)
    .order('updated_at', { ascending: false })

  if (game)           query = query.eq('game', game)
  if (parentId === 'root') query = query.is('parent_id', null)
  else if (parentId)  query = query.eq('parent_id', parentId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', userId)
    .single()

  const { data, error } = await supabase
    .from('documents')
    .insert({
      title:              body.title,
      content:            body.content ?? '',
      game:               body.game ?? null,
      parent_id:          body.parent_id ?? null,
      tags:               body.tags ?? [],
      linked_project_ids: body.linked_project_ids ?? [],
      linked_ticket_ids:  body.linked_ticket_ids ?? [],
      author_id:          userId,
      author_name:        profile?.display_name ?? null,
      last_editor_id:     userId,
      last_editor_name:   profile?.display_name ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ document: data })
}
