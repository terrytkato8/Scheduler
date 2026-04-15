import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isAdminUser } from '@/lib/auth'

// Admin-only endpoint to send a test Discord alert immediately
export async function POST() {
  const { userId } = await auth()
  if (!userId || !isAdminUser(userId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'DISCORD_WEBHOOK_URL not set in environment variables' }, { status: 503 })
  }

  const payload = {
    embeds: [
      {
        title: '✅ Discord alerts are working!',
        description: 'Your Kato.8 Team Scheduler is connected to this Discord channel. Meeting reminders will appear here 30 minutes and 10 minutes before each meeting.',
        color: 0xe85d7b,
        fields: [
          { name: '⏰ Alert timing', value: '30 min before + 10 min before', inline: true },
          { name: '🔁 Cron frequency', value: 'Every 15 minutes', inline: true },
        ],
        footer: { text: 'Kato.8 Studios · Team Scheduler' },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `Discord returned ${res.status}: ${text}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true, message: 'Test alert sent to Discord!' })
}
