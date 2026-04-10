import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('availability')
      .select('user_id, display_name, slots')
      .order('updated_at', { ascending: true })

    if (error) {
      console.error('Team availability error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ members: data ?? [] })
  } catch (err) {
    console.error('Team availability error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
