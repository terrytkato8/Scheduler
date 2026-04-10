import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = req.nextUrl.searchParams.get('month') // YYYY-MM

  try {
    const supabase = createClient()
    let query = supabase.from('events').select('*').eq('user_id', userId).order('date')

    if (month) {
      query = query.gte('date', `${month}-01`).lte('date', `${month}-31`)
    }

    const { data, error } = await query
    if (error) {
      console.error('Events fetch error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ events: data ?? [] })
  } catch (err) {
    console.error('Events fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { title: string; date: string; start_hour?: number | null; end_hour?: number | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.title?.trim() || !body.date) {
    return NextResponse.json({ error: 'title and date are required' }, { status: 400 })
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        title: body.title.trim(),
        date: body.date,
        start_hour: body.start_hour ?? null,
        end_hour: body.end_hour ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Event create error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ event: data })
  } catch (err) {
    console.error('Event create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
