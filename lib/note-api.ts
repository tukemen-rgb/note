const NOTE_BASE = 'https://note.com'
const SLEEP_MS = 600

const EST_VIEWS_LOW = 10
const EST_VIEWS_MID = 20
const EST_VIEWS_HIGH = 33

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function browserHeaders() {
  return {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'ja,en;q=0.9',
    Referer: 'https://note.com/',
    Origin: 'https://note.com',
    'X-Requested-With': 'XMLHttpRequest',
  }
}

async function fetchJson<T = unknown>(url: string, retries = 2): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  let backoff = 1500
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, { headers: browserHeaders(), cache: 'no-store' })
      if (r.status === 404) return { ok: false, status: 404, data: null }
      if (r.status === 429 || r.status >= 500) {
        if (i === retries) return { ok: false, status: r.status, data: null, error: `http ${r.status}` }
        await sleep(backoff)
        backoff *= 2
        continue
      }
      if (!r.ok) {
        const body = await r.text().catch(() => '')
        return { ok: false, status: r.status, data: null, error: `http ${r.status}: ${body.slice(0, 200)}` }
      }
      try {
        const data = (await r.json()) as T
        return { ok: true, status: r.status, data }
      } catch (e) {
        return { ok: false, status: r.status, data: null, error: 'invalid json' }
      }
    } catch (e: any) {
      if (i === retries) return { ok: false, status: 0, data: null, error: e?.message || 'network' }
      await sleep(backoff)
      backoff *= 2
    }
  }
  return { ok: false, status: 0, data: null, error: 'unknown' }
}

type AnyDict = Record<string, any>

function getValue<T = any>(obj: AnyDict | null | undefined, ...keys: string[]): T | undefined {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T
  }
  return undefined
}

function listFromData<T = AnyDict>(payload: AnyDict | null, key: string): T[] {
  if (!payload) return []
  const inData = payload?.data?.[key]
  if (Array.isArray(inData)) return inData as T[]
  const flat = payload[key]
  return Array.isArray(flat) ? (flat as T[]) : []
}

function noteUrl(note: AnyDict, urlname?: string): string {
  const key = getValue<string>(note, 'key', 'note_id', 'id')
  const user = urlname || getValue<string>(note?.user || {}, 'urlname') || getValue<string>(note, 'urlname')
  if (user && key) return `${NOTE_BASE}/${user}/n/${key}`
  if (key) return `${NOTE_BASE}/n/${key}`
  return ''
}

function excerpt(text: string | undefined, n = 400): string {
  if (!text) return ''
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n)
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export interface SearchDiagnostics {
  attempted_urls: string[]
  errors: string[]
}

export async function searchCreators(
  keyword: string,
  max: number,
  diag: SearchDiagnostics,
): Promise<string[]> {
  const out: string[] = []
  const seen = new Set<string>()
  let page = 1
  while (out.length < max && page <= 5) {
    const url = `${NOTE_BASE}/api/v2/searches?context=user&q=${encodeURIComponent(keyword)}&page=${page}&size=20`
    diag.attempted_urls.push(url)
    const result = await fetchJson<AnyDict>(url)
    if (!result.ok) {
      if (result.error) diag.errors.push(`searchCreators page=${page}: ${result.error}`)
      break
    }
    const users = listFromData<AnyDict>(result.data, 'users')
    if (!users.length) break
    for (const u of users) {
      const urlname = getValue<string>(u, 'urlname', 'url_name') || getValue<string>(u?.user || {}, 'urlname')
      if (urlname && !seen.has(urlname)) {
        seen.add(urlname)
        out.push(urlname)
        if (out.length >= max) break
      }
    }
    if (users.length < 20) break
    page++
    await sleep(SLEEP_MS)
  }
  return out
}

export async function searchNotes(keyword: string, max: number, diag: SearchDiagnostics): Promise<AnyDict[]> {
  const out: AnyDict[] = []
  let page = 1
  while (out.length < max && page <= 5) {
    const url = `${NOTE_BASE}/api/v2/searches?context=note&q=${encodeURIComponent(keyword)}&page=${page}&size=20`
    diag.attempted_urls.push(url)
    const result = await fetchJson<AnyDict>(url)
    if (!result.ok) {
      if (result.error) diag.errors.push(`searchNotes page=${page}: ${result.error}`)
      break
    }
    const items = listFromData<AnyDict>(result.data, 'notes')
    if (!items.length) break
    out.push(...items)
    if (items.length < 20) break
    page++
    await sleep(SLEEP_MS)
  }
  return out.slice(0, max)
}

export async function searchHashtag(tag: string, max: number, diag: SearchDiagnostics): Promise<AnyDict[]> {
  const out: AnyDict[] = []
  let page = 1
  while (out.length < max && page <= 5) {
    const url = `${NOTE_BASE}/api/v2/hashtags/${encodeURIComponent(tag)}/notes?page=${page}&size=20`
    diag.attempted_urls.push(url)
    const result = await fetchJson<AnyDict>(url)
    if (!result.ok) {
      if (result.error) diag.errors.push(`searchHashtag page=${page}: ${result.error}`)
      break
    }
    const items = listFromData<AnyDict>(result.data, 'notes')
    if (!items.length) break
    out.push(...items)
    if (items.length < 20) break
    page++
    await sleep(SLEEP_MS)
  }
  return out.slice(0, max)
}

export function urlnamesFromNotes(notes: AnyDict[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const n of notes) {
    const u = getValue<string>(n?.user || {}, 'urlname') || getValue<string>(n, 'urlname')
    if (u && !seen.has(u)) {
      seen.add(u)
      out.push(u)
    }
  }
  return out
}

async function fetchCreator(urlname: string, diag: SearchDiagnostics): Promise<AnyDict | null> {
  const url = `${NOTE_BASE}/api/v2/creators/${urlname}`
  diag.attempted_urls.push(url)
  const result = await fetchJson<AnyDict>(url)
  if (!result.ok && result.error) diag.errors.push(`fetchCreator ${urlname}: ${result.error}`)
  return result.data
}

async function fetchCreatorNotes(urlname: string, diag: SearchDiagnostics, maxPages = 3): Promise<AnyDict[]> {
  const out: AnyDict[] = []
  for (let page = 1; page <= maxPages; page++) {
    const url = `${NOTE_BASE}/api/v2/creators/${urlname}/contents?kind=note&page=${page}`
    diag.attempted_urls.push(url)
    const result = await fetchJson<AnyDict>(url)
    if (!result.ok) {
      if (result.error) diag.errors.push(`fetchCreatorNotes ${urlname} page=${page}: ${result.error}`)
      break
    }
    const items = listFromData<AnyDict>(result.data, 'contents')
    if (!items.length) break
    out.push(...items)
    await sleep(SLEEP_MS)
  }
  return out
}

import type { CreatorRow } from '@/lib/analytics/types'

export async function analyzeCreator(urlname: string, days: number, diag: SearchDiagnostics): Promise<CreatorRow | null> {
  const profileResp = await fetchCreator(urlname, diag)
  if (!profileResp) return null
  const p = (profileResp.data || profileResp) as AnyDict
  const nickname = getValue<string>(p, 'nickname', 'name') || urlname
  const bio = getValue<string>(p, 'profile', 'description') || ''
  const followerCount = Number(getValue(p, 'follower_count', 'followerCount') ?? 0)
  const followingCount = Number(getValue(p, 'following_count', 'followingCount') ?? 0)
  const noteCount = Number(getValue(p, 'note_count', 'noteCount') ?? 0)

  const notes = await fetchCreatorNotes(urlname, diag)
  const cutoff = new Date(Date.now() - days * 86_400_000)
  const recent: AnyDict[] = []
  for (const n of notes) {
    const d = parseDate(getValue<string>(n, 'publish_at', 'published_at', 'created_at'))
    if (d && d >= cutoff) recent.push(n)
  }

  const postsInWindow = recent.length
  const postsPerWeek = days ? Number(((postsInWindow / days) * 7).toFixed(2)) : 0
  const likesList = recent.map((n) => Number(getValue(n, 'like_count', 'likeCount') ?? 0))
  const totalLikes = likesList.reduce((a, b) => a + b, 0)
  const avgLikes = postsInWindow ? Number((totalLikes / postsInWindow).toFixed(2)) : 0
  const engagement =
    followerCount && postsInWindow
      ? Number(((totalLikes / (followerCount * postsInWindow)) * 100).toFixed(3))
      : 0

  const sorted = [...recent].sort((a, b) => Number(getValue(b, 'like_count') ?? 0) - Number(getValue(a, 'like_count') ?? 0))
  const top = sorted[0]
  const bottom = sorted[sorted.length - 1]

  const fields = (n: AnyDict | undefined) => ({
    title: (n && (getValue<string>(n, 'name', 'title') || '')) || '',
    url: n ? noteUrl(n, urlname) : '',
    likes: n ? Number(getValue(n, 'like_count') ?? 0) : 0,
    body: n ? excerpt(getValue<string>(n, 'body', 'description')) : '',
  })
  const t = fields(top)
  const b = fields(bottom === top ? undefined : bottom)

  return {
    urlname,
    nickname,
    profile: excerpt(bio, 200),
    follower_count: followerCount,
    following_count: followingCount,
    note_count: noteCount,
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
