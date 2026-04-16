import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expiry: number } | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return { access_token: data.access_token, expiry: Date.now() + data.expires_in * 1000 }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = req.nextUrl.searchParams.get('month') // YYYY-MM

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('user_id', userId)
    .single()

  if (!profile?.google_access_token && !profile?.google_refresh_token) {
    return NextResponse.json({ connected: false, events: [] })
  }

  let accessToken = profile.google_access_token
  let expiry = profile.google_token_expiry ?? 0

  // Refresh if expired or about to expire (within 60s)
  if (Date.now() > expiry - 60000 && profile.google_refresh_token) {
    const refreshed = await refreshAccessToken(profile.google_refresh_token)
    if (refreshed) {
      accessToken = refreshed.access_token
      expiry = refreshed.expiry
      await supabase
        .from('profiles')
        .update({ google_access_token: accessToken, google_token_expiry: expiry })
        .eq('user_id', userId)
    } else {
      // Refresh failed — tokens revoked
      await supabase
        .from('profiles')
        .update({ google_access_token: null, google_refresh_token: null, google_token_expiry: null })
        .eq('user_id', userId)
      return NextResponse.json({ connected: false, events: [] })
    }
  }

  // Build time range for the month
  const [year, mon] = month ? month.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1]
  const timeMin = new Date(year, mon - 1, 1).toISOString()
  const timeMax = new Date(year, mon, 0, 23, 59, 59).toISOString()

  const gcalUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  gcalUrl.searchParams.set('timeMin', timeMin)
  gcalUrl.searchParams.set('timeMax', timeMax)
  gcalUrl.searchParams.set('singleEvents', 'true')
  gcalUrl.searchParams.set('orderBy', 'startTime')
  gcalUrl.searchParams.set('maxResults', '250')

  const evRes = await fetch(gcalUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!evRes.ok) {
    return NextResponse.json({ connected: true, events: [], error: 'Failed to fetch Google Calendar' })
  }

  const data = await evRes.json()

  // Normalize to our CalEvent shape
  const events = (data.items ?? []).map((item: {
    id: string
    summary?: string
    start?: { date?: string; dateTime?: string }
    end?: { date?: string; dateTime?: string }
  }) => {
    const startRaw = item.start?.dateTime ?? item.start?.date ?? ''
    const endRaw = item.end?.dateTime ?? item.end?.date ?? ''
    const startDate = startRaw.substring(0, 10)
    const startHour = item.start?.dateTime ? new Date(item.start.dateTime).getHours() : undefined
    const endHour = item.end?.dateTime ? new Date(item.end.dateTime).getHours() : undefined
    return {
      id: `gcal-${item.id}`,
      title: item.summary ?? '(No title)',
      date: startDate,
      start_hour: startHour,
      end_hour: endHour,
      end_raw: endRaw,
      source: 'google',
    }
  })

  return NextResponse.json({ connected: true, events })
}

export async function DELETE(req: NextRequest) {
  // Disconnect Google Calendar
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  void req
  const supabase = createClient()
  await supabase
    .from('profiles')
    .update({ google_access_token: null, google_refresh_token: null, google_token_expiry: null })
    .eq('user_id', userId)
  return NextResponse.json({ ok: true })
}
