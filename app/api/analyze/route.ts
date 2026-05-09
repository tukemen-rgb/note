import { NextResponse } from 'next/server'
import {
  analyzeMany,
  searchCreators,
  searchHashtag,
  searchNotes,
  urlnamesFromNotes,
  type SearchDiagnostics,
} from '@/lib/note-api'

export const runtime = 'nodejs'
export const maxDuration = 60

const ALLOWED_MODES = new Set(['user', 'note', 'tag'])

export async function POST(req: Request) {
  let body: { mode?: string; keyword?: string; max?: number; days?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const mode = (body.mode || '').toLowerCase()
  const keyword = (body.keyword || '').trim()
  const max = Math.min(Math.max(Number(body.max) || 10, 1), 25)
  const days = Math.min(Math.max(Number(body.days) || 90, 7), 365)

  if (!ALLOWED_MODES.has(mode)) return NextResponse.json({ error: 'invalid mode' }, { status: 400 })
  if (!keyword) return NextResponse.json({ error: 'keyword is required' }, { status: 400 })

  const diag: SearchDiagnostics = { attempted_urls: [], errors: [] }

  let urlnames: string[] = []
  if (mode === 'user') {
    urlnames = await searchCreators(keyword, max, diag)
  } else if (mode === 'note') {
    const notes = await searchNotes(keyword, max, diag)
    urlnames = urlnamesFromNotes(notes).slice(0, max)
  } else {
    const notes = await searchHashtag(keyword, max, diag)
    urlnames = urlnamesFromNotes(notes).slice(0, max)
  }

  const rows = await analyzeMany(urlnames, days, diag)

  return NextResponse.json({
    mode,
    keyword,
    days,
    rows,
    diagnostics: {
      matched_urlnames: urlnames.length,
      analyzed_rows: rows.length,
      errors: diag.errors.slice(0, 10),
      sample_url: diag.attempted_urls[0] || '',
    },
  })
}
