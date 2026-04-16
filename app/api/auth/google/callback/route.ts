import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const userId = req.nextUrl.searchParams.get('state')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!code || !userId || !appUrl) {
    return NextResponse.redirect(`${appUrl}/dashboard/calendar?gcal=error`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${appUrl}/api/auth/google/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/dashboard/calendar?gcal=error`)
  }

  const tokens = await tokenRes.json()
  const expiry = Date.now() + tokens.expires_in * 1000

  const supabase = createClient()
  await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token ?? null,
      google_token_expiry: expiry,
    }, { onConflict: 'user_id' })

  return NextResponse.redirect(`${appUrl}/dashboard/calendar?gcal=connected`)
}
