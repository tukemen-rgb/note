// Google Custom Search JSON API クライアント
// note.com の検索ページが Vercel から取れないため、
// Google に代わりに note.com を検索してもらい urlname を拾う。
// 要環境変数: GOOGLE_API_KEY, GOOGLE_CSE_ID
// 無料枠: 一日 100 クエリ (1クエリあたり最大 10 件)

const GOOGLE_API = 'https://customsearch.googleapis.com/customsearch/v1'

export interface GoogleSearchItem {
  title: string
  link: string
  snippet: string
}

export interface GoogleSearchOutput {
  results: GoogleSearchItem[]
  errors: string[]
  attempted_queries: string[]
}

export async function googleSearch(query: string, max: number): Promise<GoogleSearchOutput> {
  const apiKey = process.env.GOOGLE_API_KEY?.trim()
　const cseId = process.env.GOOGLE_CSE_ID?.trim()
  const out: GoogleSearchOutput = { results: [], errors: [], attempted_queries: [] }

  if (!apiKey || !cseId) {
    out.errors.push('GOOGLE_API_KEY または GOOGLE_CSE_ID が Vercel の環境変数に設定されていません')
    return out
  }

  const target = Math.min(Math.max(max, 1), 30)
  const pages = Math.ceil(target / 10)

  for (let p = 0; p < pages && out.results.length < target; p++) {
    const start = p * 10 + 1
    const num = Math.min(10, target - out.results.length)
    const url = `${GOOGLE_API}?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=${num}&start=${start}`
    out.attempted_queries.push(query)
    try {
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) {
        const body = await r.text().catch(() => '')
        out.errors.push(`google ${r.status}: ${body.slice(0, 200)}`)
        break
      }
      const data = (await r.json()) as { items?: GoogleSearchItem[] }
      const items = data.items || []
      out.results.push(...items)
      if (items.length < num) break
    } catch (e: any) {
      out.errors.push(`google fetch: ${e?.message || 'unknown'}`)
      break
    }
  }

  return out
}

// Google 検索結果のリンクから note.com の urlname を抽出
const RESERVED = new Set([
  'hashtag', 'search', 'login', 'signup', 'help', 'terms', 'about', 'privacy',
  'guidelines', 'jobs', 'pro', 'magazines', 'creators', 'api', 'static',
  'images', 'logo', 'membership', 'campaign', 'plan', 'business', 'topics',
  'topic', 'category', 'tags', 'tag', 'mobile', 'app', 'pricing', 'sitemap',
  'press', 'news', 'support',
])

export function urlnamesFromGoogle(items: GoogleSearchItem[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const it of items) {
    const m = /^https?:\/\/(?:www\.)?note\.com\/([A-Za-z0-9_\-]+)(?:\/|\?|#|$)/.exec(it.link || '')
    if (m && !RESERVED.has(m[1]) && m[1].length > 1 && !seen.has(m[1])) {
      seen.add(m[1])
      out.push(m[1])
    }
  }
  return out
}
