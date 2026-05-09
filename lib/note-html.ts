// note.com の HTML ページを取得して、
//   1) Nuxt が埋め込む JSON (__NUXT_DATA__ / window.__NUXT__) からデータ抽出
//   2) ダメだったら HTML 本文から urlname / ノートキーを正規表現で拾う
// という 2 段構え。API は 403 で動かないケースのフォールバック。

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

// Nuxt 3 スタイルの埋め込み JSON を全部拾う
// <script type="application/json" id="__NUXT_DATA__">[...]</script>
function extractNuxtJsonBlocks(html: string): string[] {
  const out: string[] = []
  const re = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    out.push(m[1])
  }
  return out
}

// HTML 中の "urlname":"xxx" パターンを拾う
export function urlnamesFromHtml(html: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const re = /"urlname"\s*:\s*"([A-Za-z0-9_\-]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const u = m[1]
    if (!seen.has(u)) {
      seen.add(u)
      out.push(u)
    }
  }
  return out
}

// HTML 中の /<urlname>/n/<key> リンクを拾う (ノート ID)
export function noteKeysFromHtml(html: string): { urlname: string; key: string }[] {
  const out: { urlname: string; key: string }[] = []
  const seen = new Set<string>()
  const re = /\/([A-Za-z0-9_\-]+)\/n\/([a-z0-9]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const k = `${m[1]}/${m[2]}`
    if (!seen.has(k)) {
      seen.add(k)
      out.push({ urlname: m[1], key: m[2] })
    }
  }
  return out
}

export interface HtmlSearchResult {
  source: 'nuxt' | 'regex' | 'none'
  urlnames: string[]
  notes: { urlname: string; key: string }[]
  raw_summary: string
}

// 使用例: searchUsersByHtml("副業")
export async function searchUsersByHtml(keyword: string): Promise<HtmlFetchResult & { result?: HtmlSearchResult }> {
  const url = `https://note.com/search?context=user&q=${encodeURIComponent(keyword)}`
  const f = await fetchHtml(url)
  if (!f.ok || !f.html) return f
  const blocks = extractNuxtJsonBlocks(f.html)
  const combined = blocks.join('\n')
  const fromNuxt = urlnamesFromHtml(combined)
  if (fromNuxt.length) {
    return {
      ...f,
      result: { source: 'nuxt', urlnames: fromNuxt, notes: [], raw_summary: `nuxt blocks=${blocks.length} urlnames=${fromNuxt.length}` },
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
    },
  }
}

export async function searchNotesByHtml(keyword: string): Promise<HtmlFetchResult & { result?: HtmlSearchResult }> {
  const url = `https://note.com/search?context=note&q=${encodeURIComponent(keyword)}`
  const f = await fetchHtml(url)
  if (!f.ok || !f.html) return f
  const notes = noteKeysFromHtml(f.html)
  const urlnames = Array.from(new Set(notes.map((n) => n.urlname)))
  return {
    ...f,
    result: {
      source: notes.length ? 'regex' : 'none',
      urlnames,
      notes,
      raw_summary: `regex notes=${notes.length} unique_users=${urlnames.length} html_len=${f.html.length}`,
    },
  }
}

export async function searchHashtagByHtml(tag: string): Promise<HtmlFetchResult & { result?: HtmlSearchResult }> {
  const url = `https://note.com/hashtag/${encodeURIComponent(tag)}`
  const f = await fetchHtml(url)
  if (!f.ok || !f.html) return f
  const notes = noteKeysFromHtml(f.html)
  const urlnames = Array.from(new Set(notes.map((n) => n.urlname)))
  return {
    ...f,
    result: {
      source: notes.length ? 'regex' : 'none',
      urlnames,
      notes,
      raw_summary: `regex notes=${notes.length} unique_users=${urlnames.length} html_len=${f.html.length}`,
    },
  }
}

// クリエイター個人ページ (https://note.com/{urlname}) から
// プロフィール + 最近の投稿を引っ張る
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

  // ノート一覧を JSON ブロックから拾う
  const blocks = extractNuxtJsonBlocks(html)
  const combined = blocks.join('\n') + '\n' + html
  const noteRe = /"key"\s*:\s*"([a-z0-9]+)"[^}]*?"name"\s*:\s*"([^"]*)"[^}]*?"like_count"\s*:\s*(\d+)/g
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
      raw_summary: `nuxt_blocks=${blocks.length} notes_in_html=${notes.length} html_len=${html.length}`,
    },
  }
}
