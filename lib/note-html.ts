function browserHtmlHeaders() {
  return {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ja,en;q=0.9',
    Referer: 'https://note.com/',
  }
}

export interface HtmlFetchResult {
  ok: boolean
  status: number
  html: string | null
  error?: string
}

export async function fetchHtml(url: string): Promise<HtmlFetchResult> {
  try {
    const r = await fetch(url, { headers: browserHtmlHeaders(), cache: 'no-store' })
    if (!r.ok) {
      const body = await r.text().catch(() => '')
      return { ok: false, status: r.status, html: null, error: `http ${r.status}: ${body.slice(0, 120)}` }
    }
    const html = await r.text()
    return { ok: true, status: r.status, html }
  } catch (e: any) {
    return { ok: false, status: 0, html: null, error: e?.message || 'network' }
  }
}

function extractNuxtJsonBlocks(html: string): string[] {
  const out: string[] = []
  const re = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    out.push(m[1])
  }
  return out
}

function extractNuxtWindowBlock(html: string): string | null {
  const m = /window\.__NUXT__\s*=\s*([\s\S]*?)<\/script>/i.exec(html)
  return m ? m[1] : null
}

export function urlnamesFromHtml(html: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const patterns = [
    /"urlname"\s*:\s*"([A-Za-z0-9_\-]+)"/g,
    /\\"urlname\\":\\"([A-Za-z0-9_\-]+)\\"/g,
    /href="\/([A-Za-z0-9_\-]+)"\s/g,
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      const u = m[1]
      if (!seen.has(u) && !RESERVED.has(u)) {
        seen.add(u)
        out.push(u)
      }
    }
  }
  return out
}

const RESERVED = new Set([
  'search',
  'hashtag',
  'login',
  'signup',
  'help',
  'terms',
  'about',
  'privacy',
  'guidelines',
  'jobs',
  'pro',
  'magazines',
  'notes',
  'creators',
  'api',
  'static',
  'images',
  'logo',
  'membership',
  'campaign',
  'plan',
  'business',
])

export function noteKeysFromHtml(html: string): { urlname: string; key: string }[] {
  const out: { urlname: string; key: string }[] = []
  const seen = new Set<string>()
  const patterns = [
    /\/([A-Za-z0-9_\-]+)\/n\/([A-Za-z0-9]+)/g,
    /\\"key\\"\s*:\s*\\"([A-Za-z0-9]+)\\"[^}]*?\\"urlname\\":\\"([A-Za-z0-9_\-]+)\\"/g,
  ]
  let m: RegExpExecArray | null
  while ((m = patterns[0].exec(html)) !== null) {
    if (RESERVED.has(m[1])) continue
    const k = `${m[1]}/${m[2]}`
    if (!seen.has(k)) {
      seen.add(k)
      out.push({ urlname: m[1], key: m[2] })
    }
  }
  while ((m = patterns[1].exec(html)) !== null) {
    const k = `${m[2]}/${m[1]}`
    if (!seen.has(k)) {
      seen.add(k)
      out.push({ urlname: m[2], key: m[1] })
    }
  }
  return out
}

export interface HtmlSearchResult {
  source: 'nuxt' | 'regex' | 'none'
  urlnames: string[]
  notes: { urlname: string; key: string }[]
  raw_summary: string
  html_preview: string
}

function makePreview(html: string): string {
  const noScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '<script/>')
  const text = noScripts.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const slashN = (html.match(/\/n\//g) || []).length
  const nuxtData = /__NUXT_DATA__/.test(html) ? 'yes' : 'no'
  const nuxtWindow = /window\.__NUXT__/.test(html) ? 'yes' : 'no'
  const noteCount = (html.match(/\"note_count\"/g) || []).length
  return `slashN=${slashN} __NUXT_DATA__=${nuxtData} __NUXT__=${nuxtWindow} noteCountKeys=${noteCount} text_head="${text.slice(0, 220)}"`
}

export async function searchUsersByHtml(keyword: string): Promise<HtmlFetchResult & { result?: HtmlSearchResult }> {
  const url = `https://note.com/search?context=user&q=${encodeURIComponent(keyword)}`
  const f = await fetchHtml(url)
  if (!f.ok || !f.html) return f
  const preview = makePreview(f.html)
  const blocks = extractNuxtJsonBlocks(f.html)
  const win = extractNuxtWindowBlock(f.html)
  const combined = blocks.join('\n') + (win || '')
  const fromNuxt = urlnamesFromHtml(combined)
  if (fromNuxt.length) {
    return {
      ...f,
      result: { source: 'nuxt', urlnames: fromNuxt, notes: [], raw_summary: `nuxt blocks=${blocks.length} urlnames=${fromNuxt.length}`, html_preview: preview },
    }
  }
  const fromHtml = urlnamesFromHtml(f.html)
  return {
    ...f,
    result: {
      source: fromHtml.length ? 'regex' : 'none',
      urlnames: fromHtml,
      notes: [],
      raw_summary: `nuxt blocks=${blocks.length} regex urlnames=${fromHtml.length} html_len=${f.html.length}`,
      html_preview: preview,
    },
  }
}

export async function searchNotesByHtml(keyword: string): Promise<HtmlFetchResult & { result?: HtmlSearchResult }> {
  const url = `https://note.com/search?context=note&q=${encodeURIComponent(keyword)}`
  const f = await fetchHtml(url)
  if (!f.ok || !f.html) return f
  const preview = makePreview(f.html)
  const notes = noteKeysFromHtml(f.html)
  const urlnames = Array.from(new Set(notes.map((n) => n.urlname)))
  return {
    ...f,
    result: {
      source: notes.length ? 'regex' : 'none',
      urlnames,
      notes,
      raw_summary: `regex notes=${notes.length} unique_users=${urlnames.length} html_len=${f.html.length}`,
      html_preview: preview,
    },
  }
}

export async function searchHashtagByHtml(tag: string): Promise<HtmlFetchResult & { result?: HtmlSearchResult }> {
  const url = `https://note.com/hashtag/${encodeURIComponent(tag)}`
  const f = await fetchHtml(url)
  if (!f.ok || !f.html) return f
  const preview = makePreview(f.html)
  const notes = noteKeysFromHtml(f.html)
  const urlnames = Array.from(new Set(notes.map((n) => n.urlname)))
  return {
    ...f,
    result: {
      source: notes.length ? 'regex' : 'none',
      urlnames,
      notes,
      raw_summary: `regex notes=${notes.length} unique_users=${urlnames.length} html_len=${f.html.length}`,
      html_preview: preview,
    },
  }
}

export interface HtmlCreator {
  urlname: string
  nickname: string
  profile: string
  follower_count: number
  following_count: number
  note_count: number
  notes: HtmlNote[]
  raw_summary: string
}

export interface HtmlNote {
  key: string
  title: string
  url: string
  like_count: number
  body: string
  publish_at: string | null
}

function firstMatch(html: string, re: RegExp): string | null {
  const m = re.exec(html)
  return m ? m[1] : null
}

function firstNumber(html: string, re: RegExp): number {
  const s = firstMatch(html, re)
  if (!s) return 0
  return Number(s.replace(/,/g, '')) || 0
}

export async function fetchCreatorByHtml(urlname: string): Promise<HtmlFetchResult & { creator?: HtmlCreator }> {
  const url = `https://note.com/${urlname}`
  const f = await fetchHtml(url)
  if (!f.ok || !f.html) return f
  const html = f.html

  const nickname =
    firstMatch(html, /<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
    firstMatch(html, /"nickname"\s*:\s*"([^"]+)"/) ||
    urlname
  const profile =
    firstMatch(html, /<meta\s+name="description"\s+content="([^"]+)"/i) ||
    firstMatch(html, /"profile"\s*:\s*"([^"]*)"/) ||
    ''
  const followerCount = firstNumber(html, /"follower_count"\s*:\s*(\d+)/)
  const followingCount = firstNumber(html, /"following_count"\s*:\s*(\d+)/)
  const noteCount = firstNumber(html, /"note_count"\s*:\s*(\d+)/)

  const blocks = extractNuxtJsonBlocks(html)
  const win = extractNuxtWindowBlock(html)
  const combined = blocks.join('\n') + (win || '') + '\n' + html
  const noteRe = /"key"\s*:\s*"([A-Za-z0-9]+)"[^}]*?"name"\s*:\s*"([^"]*)"[^}]*?"like_count"\s*:\s*(\d+)/g
  const notes: HtmlNote[] = []
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = noteRe.exec(combined)) !== null) {
    const key = m[1]
    if (seen.has(key)) continue
    seen.add(key)
    const title = m[2]
    const likes = Number(m[3]) || 0
    const publishM = new RegExp(`"key"\\s*:\\s*"${key}"[^}]*?"publish_at"\\s*:\\s*"([^"]+)"`).exec(combined)
    const bodyM = new RegExp(`"key"\\s*:\\s*"${key}"[^}]*?"body"\\s*:\\s*"([^"]+)"`).exec(combined)
    notes.push({
      key,
      title,
      url: `https://note.com/${urlname}/n/${key}`,
      like_count: likes,
      body: bodyM ? bodyM[1].slice(0, 500) : '',
      publish_at: publishM ? publishM[1] : null,
    })
  }

  return {
    ...f,
    creator: {
      urlname,
      nickname,
      profile,
      follower_count: followerCount,
      following_count: followingCount,
      note_count: noteCount,
      notes,
      raw_summary: `nuxt_blocks=${blocks.length} __NUXT__=${win ? 'yes' : 'no'} notes_in_html=${notes.length} html_len=${html.length}`,
    },
  }
}
