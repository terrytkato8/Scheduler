import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// Returns tasks assigned to the current user that have a due_date (for calendar display)
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, priority, due_date, status, project_id, projects(name)')
    .eq('assignee_id', userId)
    .not('due_date', 'is', null)
    .neq('status', 'done')
    .order('due_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data ?? [] })
}
