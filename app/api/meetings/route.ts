import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = req.nextUrl.searchParams.get('month') // YYYY-MM

  try {
    const supabase = createClient()

    // Meetings the user organized
    let orgQ = supabase
      .from('meetings')
      .select('*, meeting_invites(user_id, display_name, status)')
      .eq('organizer_id', userId)
    if (month) orgQ = orgQ.gte('date', `${month}-01`).lte('date', `${month}-31`)
    const { data: orgMeetings } = await orgQ

    // Meetings the user was invited to
    const { data: invites } = await supabase
      .from('meeting_invites')
      .select('meeting_id')
      .eq('user_id', userId)

    const invitedIds = (invites ?? []).map(i => i.meeting_id)
    let invitedMeetings: typeof orgMeetings = []

    if (invitedIds.length > 0) {
      let invQ = supabase
        .from('meetings')
        .select('*, meeting_invites(user_id, display_name, status)')
        .in('id', invitedIds)
        .neq('organizer_id', userId) // avoid duplicates
      if (month) invQ = invQ.gte('date', `${month}-01`).lte('date', `${month}-31`)
      const { data } = await invQ
      invitedMeetings = data ?? []
    }

    const all = [
      ...(orgMeetings ?? []).map(m => ({ ...m, is_organizer: true })),
      ...(invitedMeetings ?? []).map(m => ({ ...m, is_organizer: false })),
    ]

    return NextResponse.json({ meetings: all })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    title: string
    description?: string
    date?: string
    start_hour?: number
    start_minute?: number
    end_hour?: number
    end_minute?: number
    invitee_ids?: string[]
  }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  try {
    const supabase = createClient()

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        organizer_id: userId,
        title: body.title.trim(),
        description: body.description ?? null,
        date: body.date ?? null,
        start_hour: body.start_hour ?? null,
        start_minute: body.start_minute ?? 0,
        end_hour: body.end_hour ?? null,
        end_minute: body.end_minute ?? 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Meeting create error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (body.invitee_ids && body.invitee_ids.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', body.invitee_ids)

      const nameMap = Object.fromEntries(
        (profiles ?? []).map(p => [p.user_id, p.display_name])
      )

      await supabase.from('meeting_invites').insert(
        body.invitee_ids.map((uid: string) => ({
          meeting_id: meeting.id,
          user_id: uid,
          display_name: nameMap[uid] ?? null,
          status: 'pending',
        }))
      )
    }

    return NextResponse.json({ meeting })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
