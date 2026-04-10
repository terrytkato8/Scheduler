import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MINS = [0, 15, 30, 45]

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const guestParam = req.nextUrl.searchParams.get('guests') ?? ''
  const guestIds = guestParam ? guestParam.split(',').filter(Boolean) : []
  const durationSlots = Math.max(1, parseInt(req.nextUrl.searchParams.get('duration') ?? '4')) // 15-min slots

  const allIds = [userId, ...guestIds]
  const totalMembers = allIds.length

  const supabase = createClient()
  const { data } = await supabase
    .from('availability')
    .select('user_id, available_slots, busy_slots')
    .in('user_id', allIds)

  if (!data || data.length === 0) return NextResponse.json({ suggestions: [] })

  // Map slot → { avail, busy }
  const scoreMap = new Map<string, { avail: number; busy: number }>()

  for (const row of data) {
    for (const slot of (row.available_slots ?? [])) {
      const s = scoreMap.get(slot) ?? { avail: 0, busy: 0 }
      scoreMap.set(slot, { ...s, avail: s.avail + 1 })
    }
    for (const slot of (row.busy_slots ?? [])) {
      const s = scoreMap.get(slot) ?? { avail: 0, busy: 0 }
      scoreMap.set(slot, { ...s, busy: s.busy + 1 })
    }
  }

  type Suggestion = {
    day: number
    dayName: string
    startHour: number
    startMin: number
    endHour: number
    endMin: number
    availableCount: number
    totalMembers: number
    label: string
  }

  const suggestions: Suggestion[] = []

  for (let day = 0; day < 7; day++) {
    // Build ordered list of slot keys for this day
    const daySlots: string[] = []
    for (let hi = 0; hi < 15; hi++) {
      for (const min of MINS) {
        daySlots.push(`${day}-${7 + hi}-${min}`)
      }
    }

    // Sliding window of durationSlots
    for (let i = 0; i <= daySlots.length - durationSlots; i++) {
      const window = daySlots.slice(i, i + durationSlots)
      let totalAvail = 0
      let totalBusy = 0

      for (const slot of window) {
        const s = scoreMap.get(slot)
        if (s) { totalAvail += s.avail; totalBusy += s.busy }
      }

      // Require at least half attendees available, and no one is marked busy in all slots
      const avgAvail = totalAvail / durationSlots
      if (avgAvail < 1 || totalBusy > durationSlots) continue

      const [, sh, sm] = window[0].split('-').map(Number)
      const [, lh, lm] = window[durationSlots - 1].split('-').map(Number)
      let endH = lh, endM = lm + 15
      if (endM >= 60) { endH += 1; endM = 0 }

      const fmtT = (h: number, m: number) => {
        const ap = h < 12 ? 'am' : 'pm'
        const hh = h > 12 ? h - 12 : h === 0 ? 12 : h
        return m === 0 ? `${hh}${ap}` : `${hh}:${String(m).padStart(2, '0')}${ap}`
      }

      suggestions.push({
        day,
        dayName: DAYS[day],
        startHour: sh,
        startMin: sm,
        endHour: endH,
        endMin: endM,
        availableCount: Math.round(avgAvail),
        totalMembers,
        label: `${DAYS[day]} ${fmtT(sh, sm)} – ${fmtT(endH, endM)}`,
      })
    }
  }

  // Score: most available, fewest busy — deduplicate overlapping windows by keeping best per day/hour
  suggestions.sort((a, b) => b.availableCount - a.availableCount)

  // Remove overlapping windows (keep highest-scored first)
  const used = new Set<string>()
  const deduped: Suggestion[] = []
  for (const s of suggestions) {
    const key = `${s.day}-${s.startHour}`
    if (!used.has(key)) {
      used.add(key)
      deduped.push(s)
    }
    if (deduped.length >= 5) break
  }

  return NextResponse.json({ suggestions: deduped })
}
