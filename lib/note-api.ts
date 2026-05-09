import {
  fetchCreatorByHtml,
  searchHashtagByHtml,
  searchNotesByHtml,
  searchUsersByHtml,
} from '@/lib/note-html'

const SLEEP_MS = 600

const EST_VIEWS_LOW = 10
const EST_VIEWS_MID = 20
const EST_VIEWS_HIGH = 33

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface SearchDiagnostics {
  attempted_urls: string[]
  errors: string[]
  response_summaries: string[]
  html_previews: string[]
}

import type { CreatorRow } from '@/lib/analytics/types'

function excerpt(text: string | undefined, n = 400): string {
  if (!text) return ''
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n)
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function searchCreators(keyword: string, max: number, diag: SearchDiagnostics): Promise<string[]> {
  diag.attempted_urls.push(`https://note.com/search?context=user&q=${encodeURIComponent(keyword)}`)
  const f = await searchUsersByHtml(keyword)
  if (!f.ok) {
    diag.errors.push(`searchCreators html: ${f.error || 'unknown'}`)
    return []
  }
  if (f.result) {
    diag.response_summaries.push(`html users: ${f.result.raw_summary}`)
    diag.html_previews.push(`users: ${f.result.html_preview}`)
  }
  return (f.result?.urlnames || []).slice(0, max)
}

export async function searchNotes(keyword: string, max: number, diag: SearchDiagnostics) {
  diag.attempted_urls.push(`https://note.com/search?context=note&q=${encodeURIComponent(keyword)}`)
  const f = await searchNotesByHtml(keyword)
  if (!f.ok) {
    diag.errors.push(`searchNotes html: ${f.error || 'unknown'}`)
    return [] as { urlname: string; key: string }[]
  }
  if (f.result) {
    diag.response_summaries.push(`html notes: ${f.result.raw_summary}`)
    diag.html_previews.push(`notes: ${f.result.html_preview}`)
  }
  return (f.result?.notes || []).slice(0, max)
}

export async function searchHashtag(tag: string, max: number, diag: SearchDiagnostics) {
  diag.attempted_urls.push(`https://note.com/hashtag/${encodeURIComponent(tag)}`)
  const f = await searchHashtagByHtml(tag)
  if (!f.ok) {
    diag.errors.push(`searchHashtag html: ${f.error || 'unknown'}`)
    return [] as { urlname: string; key: string }[]
  }
  if (f.result) {
    diag.response_summaries.push(`html tag: ${f.result.raw_summary}`)
    diag.html_previews.push(`tag: ${f.result.html_preview}`)
  }
  return (f.result?.notes || []).slice(0, max)
}

export function urlnamesFromNotes(notes: { urlname: string; key: string }[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const n of notes) {
    if (n.urlname && !seen.has(n.urlname)) {
      seen.add(n.urlname)
      out.push(n.urlname)
    }
  }
  return out
}

export async function analyzeCreator(urlname: string, days: number, diag: SearchDiagnostics): Promise<CreatorRow | null> {
  diag.attempted_urls.push(`https://note.com/${urlname}`)
  const f = await fetchCreatorByHtml(urlname)
  if (!f.ok) {
    diag.errors.push(`analyzeCreator ${urlname}: ${f.error || 'unknown'}`)
    return null
  }
  const c = f.creator
  if (!c) return null
  diag.response_summaries.push(`html creator ${urlname}: ${c.raw_summary}`)

  const cutoff = new Date(Date.now() - days * 86_400_000)
  const recent = c.notes.filter((n) => {
    const d = parseDate(n.publish_at)
    return d && d >= cutoff
  })
  const considered = recent.length ? recent : c.notes

  const postsInWindow = considered.length
  const postsPerWeek = days ? Number(((postsInWindow / days) * 7).toFixed(2)) : 0
  const totalLikes = considered.reduce((a, n) => a + (n.like_count || 0), 0)
  const avgLikes = postsInWindow ? Number((totalLikes / postsInWindow).toFixed(2)) : 0
  const engagement =
    c.follower_count && postsInWindow
      ? Number(((totalLikes / (c.follower_count * postsInWindow)) * 100).toFixed(3))
      : 0

  const sorted = [...considered].sort((a, b) => b.like_count - a.like_count)
  const top = sorted[0]
  const bottom = sorted[sorted.length - 1]

  const fields = (n: typeof top | undefined) => ({
    title: n?.title || '',
    url: n?.url || '',
    likes: n?.like_count || 0,
    body: excerpt(n?.body || ''),
  })
  const t = fields(top)
  const b = fields(bottom === top ? undefined : bottom)

  return {
    urlname,
    nickname: c.nickname,
    profile: excerpt(c.profile, 200),
    follower_count: c.follower_count,
    following_count: c.following_count,
    note_count: c.note_count,
    posts_in_window: postsInWindow,
    posts_per_week: postsPerWeek,
    total_likes_in_window: totalLikes,
    avg_likes_in_window: avgLikes,
    engagement_rate_pct: engagement,
    top_post_title: t.title,
    top_post_url: t.url,
    top_post_likes: t.likes,
    top_post_estimated_views_low: t.likes * EST_VIEWS_LOW,
    top_post_estimated_views: t.likes * EST_VIEWS_MID,
    top_post_estimated_views_high: t.likes * EST_VIEWS_HIGH,
    top_post_excerpt: t.body,
    bottom_post_title: b.title,
    bottom_post_url: b.url,
    bottom_post_likes: b.likes,
    bottom_post_estimated_views_low: b.likes * EST_VIEWS_LOW,
    bottom_post_estimated_views: b.likes * EST_VIEWS_MID,
    bottom_post_estimated_views_high: b.likes * EST_VIEWS_HIGH,
    bottom_post_excerpt: b.body,
  }
}

export async function analyzeMany(urlnames: string[], days: number, diag: SearchDiagnostics): Promise<CreatorRow[]> {
  const out: CreatorRow[] = []
  for (const u of urlnames) {
    const row = await analyzeCreator(u, days, diag)
    if (row) out.push(row)
    await sleep(SLEEP_MS)
  }
  return out
}
