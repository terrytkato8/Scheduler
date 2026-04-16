import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// Public GET — used by project/ticket creation forms to get dynamic list
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('game_titles')
    .select('id, name, status')
    .eq('status', 'active')
    .order('sort_order')

  if (error) {
    // Table may not exist yet — return hardcoded fallback
    return NextResponse.json({ gameTitles: [
      { id: '1', name: 'Corebound',        status: 'active' },
      { id: '2', name: 'Last Light',        status: 'active' },
      { id: '3', name: 'BBCU',              status: 'active' },
      { id: '4', name: 'Studio / General',  status: 'active' },
    ]})
  }

  return NextResponse.json({ gameTitles: data ?? [] })
}
