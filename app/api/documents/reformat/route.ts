import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Anthropic API not configured' }, { status: 503 })

  let body: { content: string; title?: string; category?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const prompt = `You are a professional technical writer. Reformat the following document into a clean, well-structured Markdown document.

Guidelines:
- Add clear headings and subheadings where appropriate
- Fix grammar, spelling, and punctuation
- Improve clarity and professional tone
- Preserve all original information — do not add or remove facts
- Use Markdown formatting: headers (##, ###), bullet lists, bold for key terms, code blocks where relevant
- If the document is a ${body.category ?? 'general'} document, follow conventions for that doc type
- Return ONLY the reformatted Markdown — no preamble or explanation

Document title: ${body.title ?? 'Untitled'}

Original content:
${body.content}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Anthropic error:', err)
    return NextResponse.json({ error: 'Reformatting failed' }, { status: 500 })
  }

  const data = await res.json()
  const reformatted = data.content?.[0]?.text ?? ''
  return NextResponse.json({ reformatted })
}
