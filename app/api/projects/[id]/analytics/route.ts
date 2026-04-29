import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const SIZE_POINTS: Record<string, number> = { XS: 1, S: 2, M: 3, L: 5, XL: 8 }

function getMondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  const supabase = createClient()

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, status, assignee_id, size_estimate, started_at, completed_at, created_at')
    .eq('project_id', projectId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch member display names
  const { data: members } = await supabase
    .from('profiles')
    .select('user_id, display_name')

  const nameMap = new Map((members ?? []).map(m => [m.user_id, m.display_name ?? 'Unknown']))

  // ── Capacity per contributor ──
  const capacityMap = new Map<string, { assigned: number; in_progress: number; done: number; assigned_pts: number; in_progress_pts: number; done_pts: number }>()

  for (const t of tasks ?? []) {
    const uid = t.assignee_id ?? '__unassigned__'
    if (!capacityMap.has(uid)) capacityMap.set(uid, { assigned: 0, in_progress: 0, done: 0, assigned_pts: 0, in_progress_pts: 0, done_pts: 0 })
    const c = capacityMap.get(uid)!
    const pts = t.size_estimate ? (SIZE_POINTS[t.size_estimate] ?? 0) : 0
    c.assigned++
    c.assigned_pts += pts
    if (t.status === 'in_progress') { c.in_progress++; c.in_progress_pts += pts }
    if (t.status === 'done') { c.done++; c.done_pts += pts }
  }

  const capacity = Array.from(capacityMap.entries()).map(([uid, c]) => ({
    user_id: uid,
    display_name: uid === '__unassigned__' ? 'Unassigned' : (nameMap.get(uid) ?? 'Unknown'),
    ...c,
  }))

  // ── Velocity: points completed per week (last 8 weeks) ──
  const now = new Date()
  const weeks: string[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i * 7)
    weeks.push(getMondayOf(d))
  }

  // Per-team velocity (all contributors)
  const teamVelocity = new Map<string, number>(weeks.map(w => [w, 0]))

  // Per-contributor velocity
  const contribVelocity = new Map<string, Map<string, number>>()

  for (const t of tasks ?? []) {
    if (t.status !== 'done' || !t.completed_at || !t.size_estimate) continue
    const pts = SIZE_POINTS[t.size_estimate] ?? 0
    const week = getMondayOf(new Date(t.completed_at))
    if (teamVelocity.has(week)) teamVelocity.set(week, (teamVelocity.get(week) ?? 0) + pts)

    const uid = t.assignee_id ?? '__unassigned__'
    if (!contribVelocity.has(uid)) contribVelocity.set(uid, new Map(weeks.map(w => [w, 0])))
    const cv = contribVelocity.get(uid)!
    if (cv.has(week)) cv.set(week, (cv.get(week) ?? 0) + pts)
  }

  const teamVelocityData = weeks.map(w => ({ week: w, points: teamVelocity.get(w) ?? 0 }))

  const contribVelocityData = Array.from(contribVelocity.entries()).map(([uid, wm]) => ({
    user_id: uid,
    display_name: uid === '__unassigned__' ? 'Unassigned' : (nameMap.get(uid) ?? 'Unknown'),
    weeks: weeks.map(w => ({ week: w, points: wm.get(w) ?? 0 })),
  }))

  // ── Cycle time stats (done tasks with both started + completed) ──
  const cycleTimes = (tasks ?? [])
    .filter(t => t.status === 'done' && t.started_at && t.completed_at)
    .map(t => ({
      id: t.id,
      title: t.title,
      size_estimate: t.size_estimate,
      assignee_id: t.assignee_id,
      display_name: t.assignee_id ? (nameMap.get(t.assignee_id) ?? 'Unknown') : 'Unassigned',
      days: Math.round((new Date(t.completed_at!).getTime() - new Date(t.started_at!).getTime()) / 86400000),
    }))

  return NextResponse.json({ capacity, teamVelocity: teamVelocityData, contribVelocity: contribVelocityData, cycleTimes, weeks })
}
