import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const supabase = createClient()

  const updates: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() }
  const now = new Date().toISOString()

  if (body.status === 'in_progress' && !body.started_at) {
    // Only set started_at if not already set
    const { data: existing } = await supabase.from('tasks').select('started_at').eq('id', id).single()
    if (!existing?.started_at) updates.started_at = now
  }
  if (body.status === 'done') {
    updates.completed_at = now
  } else if (body.status && body.status !== 'done') {
    updates.completed_at = null
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire Discord notification when a task is marked done
  if (body.status === 'done' && data) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (webhookUrl) {
      // Get assignee name from profiles
      let assigneeName = 'Someone'
      if (data.assignee_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', data.assignee_id)
          .single()
        if (profile?.display_name) assigneeName = profile.display_name
      }
      const cycleDays = data.started_at && data.completed_at
        ? Math.round((new Date(data.completed_at).getTime() - new Date(data.started_at).getTime()) / 86400000)
        : null

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '✅ Task Completed',
            description: `**${data.title}**`,
            color: 0x10b981,
            fields: [
              { name: 'Completed by', value: assigneeName, inline: true },
              ...(data.size_estimate ? [{ name: 'Size', value: data.size_estimate, inline: true }] : []),
              ...(cycleDays !== null ? [{ name: 'Cycle time', value: cycleDays === 0 ? '<1 day' : `${cycleDays} day${cycleDays !== 1 ? 's' : ''}`, inline: true }] : []),
            ],
            timestamp: new Date().toISOString(),
          }],
        }),
      }).catch(() => {}) // fire-and-forget
    }
  }

  return NextResponse.json({ task: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createClient()
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
