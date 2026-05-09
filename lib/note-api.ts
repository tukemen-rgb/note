import { fetchCreatorByHtml } from '@/lib/note-html'
import { googleSearch, urlnamesFromGoogle } from '@/lib/google-search'

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
  nuxt_previews: string[]
}

import type { CreatorRow } from '@/lib/analytics/types'

function excerpt(text: string | undefined, n = 400): string {
  if (!text) return ''
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n)
}

export async function searchCreators(keyword: string, max: number, diag: SearchDiagnostics): Promise<string[]> {
  // プロフィール検索: 記事もプロフィールも含めて取得して urlname を拾う
  const query = `site:note.com ${keyword}`
  const g = await googleSearch(query, max * 3) // 重複を見越して多めに
  diag.attempted_urls.push(`google: ${query}`)
  diag.response_summaries.push(`google results=${g.results.length} errors=${g.errors.length}`)
  for (const e of g.errors) diag.errors.push(e)
  return urlnamesFromGoogle(g.results).slice(0, max)
}

export async function searchNotes(keyword: string, max: number, diag: SearchDiagnostics) {
  // 投稿本文検索: 記事 URL (/n/) に限定
  const query = `site:note.com ${keyword} inurl:/n/`
  const g = await googleSearch(query, max * 3)
  diag.attempted_urls.push(`google: ${query}`)
  diag.response_summaries.push(`google notes results=${g.results.length} errors=${g.errors.length}`)
  for (const e of g.errors) diag.errors.push(e)
  return g.results.slice(0, max).map((r) => {
    const m = /^https?:\/\/(?:www\.)?note\.com\/([A-Za-z0-9_\-]+)\/n\/([A-Za-z0-9]+)/.exec(r.link || '')
    return m ? { urlname: m[1], key: m[2] } : { urlname: '', key: '' }
  }).filter((n) => n.urlname)
}

export async function searchHashtag(tag: string, max: number, diag: SearchDiagnostics) {
  const query = `site:note.com/hashtag/${tag} OR site:note.com "${tag}"`
  const g = await googleSearch(query, max * 3)
  diag.attempted_urls.push(`google: ${query}`)
  diag.response_summaries.push(`google tag results=${g.results.length} errors=${g.errors.length}`)
  for (const e of g.errors) diag.errors.push(e)
  return g.results.slice(0, max).map((r) => {
    const m = /^https?:\/\/(?:www\.)?note\.com\/([A-Za-z0-9_\-]+)\/n\/([A-Za-z0-9]+)/.exec(r.link || '')
    return m ? { urlname: m[1], key: m[2] } : { urlname: '', key: '' }
  }).filter((n) => n.urlname)
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

  const considered = c.notes
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
