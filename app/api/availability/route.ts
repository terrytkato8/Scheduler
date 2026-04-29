import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const week = req.nextUrl.searchParams.get('week') // e.g. "2026-04-28"

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('availability')
      .select('available_slots, busy_slots, weekly_overrides')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!week) {
      return NextResponse.json({
        available_slots: data?.available_slots ?? [],
        busy_slots: data?.busy_slots ?? [],
      })
    }

    // Return week-specific override, falling back to default schedule
    const overrides = (data?.weekly_overrides ?? {}) as Record<string, { available: string[]; busy: string[] }>
    const weekData = overrides[week]

    return NextResponse.json({
      available_slots: weekData?.available ?? data?.available_slots ?? [],
      busy_slots: weekData?.busy ?? data?.busy_slots ?? [],
      has_override: !!weekData,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    available_slots?: string[]
    busy_slots?: string[]
    displayName?: string
    week?: string
    clear?: boolean
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  try {
    const supabase = createClient()

    if (body.week) {
      // Save or clear a specific week override
      const { data: existing } = await supabase
        .from('availability')
        .select('weekly_overrides')
        .eq('user_id', userId)
        .single()

      const overrides = { ...((existing?.weekly_overrides ?? {}) as Record<string, unknown>) }

      if (body.clear) {
        delete overrides[body.week]
      } else {
        overrides[body.week] = {
          available: body.available_slots ?? [],
          busy: body.busy_slots ?? [],
        }
      }

      const { error } = await supabase
        .from('availability')
        .upsert(
          { user_id: userId, weekly_overrides: overrides, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )

      if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Save default schedule
    const { error } = await supabase.from('availability').upsert(
      {
        user_id: userId,
        available_slots: body.available_slots ?? [],
        busy_slots: body.busy_slots ?? [],
        display_name: body.displayName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      console.error('Supabase error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
