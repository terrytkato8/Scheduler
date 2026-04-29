import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

function extractDriveFileId(url: string): string | null {
  // https://drive.google.com/file/d/{id}/view
  const fileMatch = url.match(/\/file\/d\/([^/]+)/)
  if (fileMatch) return fileMatch[1]
  // https://docs.google.com/document/d/{id}/edit
  const docMatch = url.match(/\/document\/d\/([^/]+)/)
  if (docMatch) return docMatch[1]
  // https://docs.google.com/spreadsheets/d/{id}/edit
  const sheetMatch = url.match(/\/spreadsheets\/d\/([^/]+)/)
  if (sheetMatch) return sheetMatch[1]
  // Direct ID (no slashes)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(url.trim())) return url.trim()
  return null
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { url: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const fileId = extractDriveFileId(body.url ?? '')
  if (!fileId) return NextResponse.json({ error: 'Could not extract Google Drive file ID from URL' }, { status: 400 })

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('user_id', userId)
    .single()

  if (!profile?.google_access_token && !profile?.google_refresh_token) {
    return NextResponse.json({ error: 'Google Drive not connected. Please connect Google Calendar first.' }, { status: 400 })
  }

  let accessToken = profile.google_access_token

  // Refresh if needed
  if (profile.google_refresh_token && Date.now() > (profile.google_token_expiry ?? 0) - 60000) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: profile.google_refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
      }),
    })
    if (refreshRes.ok) {
      const tokens = await refreshRes.json()
      accessToken = tokens.access_token
      await supabase.from('profiles').update({ google_access_token: accessToken, google_token_expiry: Date.now() + tokens.expires_in * 1000 }).eq('user_id', userId)
    }
  }

  // Get file metadata to determine type and name
  const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!metaRes.ok) {
    return NextResponse.json({ error: 'Could not access this file. Make sure it is shared or the link is correct.' }, { status: 400 })
  }

  const meta = await metaRes.json()
  const mimeType: string = meta.mimeType ?? ''
  const fileName: string = meta.name ?? 'Imported Document'

  let content = ''

  if (mimeType === 'application/vnd.google-apps.document') {
    // Export Google Doc as plain text
    const exportRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!exportRes.ok) return NextResponse.json({ error: 'Failed to export Google Doc content' }, { status: 500 })
    content = await exportRes.text()
  } else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!downloadRes.ok) return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    content = await downloadRes.text()
  } else {
    return NextResponse.json({ error: `File type "${mimeType}" is not supported. Please use a Google Doc or plain text file.` }, { status: 400 })
  }

  return NextResponse.json({ content, fileName, sourceUrl: body.url })
}
