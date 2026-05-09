const NOTE_BASE = "https://note.com";
const USER_AGENT = "kashikin-analytics/0.1";
const SLEEP_MS = 600;

// View/Like 比の参考レンジ。note公式値ではなく、公開実例から逆算した経験則。
// data/reference/README.md 参照。
const EST_VIEWS_LOW = 10;   // 高スキ率寄り (約10%)
const EST_VIEWS_MID = 20;   // 中央推定 (約5%)
const EST_VIEWS_HIGH = 33;  // 低スキ率寄り (約3%)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson<T = unknown>(
  url: string,
  retries = 3,
): Promise<T | null> {
  let backoff = 1500;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        cache: "no-store",
      });
      if (r.status === 404) return null;
      if (r.status === 429 || r.status >= 500) {
        if (i === retries) return null;
        await sleep(backoff);
        backoff *= 2;
        continue;
      }
      if (!r.ok) return null;
      return (await r.json()) as T;
    } catch {
      if (i === retries) return null;
      await sleep(backoff);
      backoff *= 2;
    }
  }
  return null;
}

type AnyDict = Record<string, any>;

function get<T = any>(obj: AnyDict | null | undefined, ...keys: string[]): T | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

function listFromData<T = AnyDict>(payload: AnyDict | null, key: string): T[] {
  if (!payload) return [];
  const inData = payload?.data?.[key];
  if (Array.isArray(inData)) return inData as T[];
  const flat = payload[key];
  return Array.isArray(flat) ? (flat as T[]) : [];
}

function isLastPage(payload: AnyDict | null): boolean {
  return Boolean(payload?.data?.is_last_page);
}

function noteUrl(note: AnyDict, urlname?: string): string {
  const key = get<string>(note, "key", "note_id", "id");
  const user = urlname || get<string>(note?.user || {}, "urlname") || get<string>(note, "urlname");
  if (user && key) return `${NOTE_BASE}/${user}/n/${key}`;
  if (key) return `${NOTE_BASE}/n/${key}`;
  return "";
}

function excerpt(text: string | undefined, n = 400): string {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function searchCreators(keyword: string, max: number): Promise<string[]> {
  const out: string[] = [];
  const seen = new Set<string>();
  let page = 1;
  while (out.length < max && page <= 10) {
    const url = `${NOTE_BASE}/api/v2/searches?context=user&q=${encodeURIComponent(keyword)}&page=${page}&size=20`;
    const data = await fetchJson<AnyDict>(url);
    if (!data) break;
    const users = listFromData<AnyDict>(data, "users");
    if (!users.length) break;
    for (const u of users) {
      const urlname = get<string>(u, "urlname", "url_name") || get<string>(u?.user || {}, "urlname");
      if (urlname && !seen.has(urlname)) {
        seen.add(urlname);
        out.push(urlname);
        if (out.length >= max) break;
      }
    }
    if (users.length < 20 || isLastPage(data)) break;
    page++;
    await sleep(SLEEP_MS);
  }
  return out;
}

export async function searchNotes(keyword: string, max: number): Promise<AnyDict[]> {
  const out: AnyDict[] = [];
  let page = 1;
  while (out.length < max && page <= 10) {
    const url = `${NOTE_BASE}/api/v2/searches?context=note&q=${encodeURIComponent(keyword)}&page=${page}&size=20`;
    const data = await fetchJson<AnyDict>(url);
    if (!data) break;
    const items = listFromData<AnyDict>(data, "notes");
    if (!items.length) break;
    out.push(...items);
    if (items.length < 20) break;
    page++;
    await sleep(SLEEP_MS);
  }
  return out.slice(0, max);
}

export async function searchHashtag(tag: string, max: number): Promise<AnyDict[]> {
  const out: AnyDict[] = [];
  let page = 1;
  while (out.length < max && page <= 10) {
    const url = `${NOTE_BASE}/api/v2/hashtags/${encodeURIComponent(tag)}/notes?page=${page}&size=20`;
    const data = await fetchJson<AnyDict>(url);
    if (!data) break;
    const items = listFromData<AnyDict>(data, "notes");
    if (!items.length) break;
    out.push(...items);
    if (items.length < 20) break;
    page++;
    await sleep(SLEEP_MS);
  }
  return out.slice(0, max);
}

export function urlnamesFromNotes(notes: AnyDict[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of notes) {
    const u = get<string>(n?.user || {}, "urlname") || get<string>(n, "urlname");
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

async function fetchCreator(urlname: string): Promise<AnyDict | null> {
  return await fetchJson<AnyDict>(`${NOTE_BASE}/api/v2/creators/${urlname}`);
}

async function fetchCreatorNotes(urlname: string, maxPages = 3): Promise<AnyDict[]> {
  const out: AnyDict[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = `${NOTE_BASE}/api/v2/creators/${urlname}/contents?kind=note&page=${page}`;
    const data = await fetchJson<AnyDict>(url);
    if (!data) break;
    const items = listFromData<AnyDict>(data, "contents");
    if (!items.length) break;
    out.push(...items);
    if (isLastPage(data)) break;
    await sleep(SLEEP_MS);
  }
  return out;
}

export type CreatorRow = {
  urlname: string;
  nickname: string;
  profile: string;
  follower_count: number;
  following_count: number;
  note_count: number;
  posts_in_window: number;
  posts_per_week: number;
  total_likes_in_window: number;
  avg_likes_in_window: number;
  engagement_rate_pct: number;
  top_post_title: string;
  top_post_url: string;
  top_post_likes: number;
  top_post_estimated_views_low: number;
  top_post_estimated_views: number;
  top_post_estimated_views_high: number;
  top_post_excerpt: string;
  bottom_post_title: string;
  bottom_post_url: string;
  bottom_post_likes: number;
  bottom_post_estimated_views_low: number;
  bottom_post_estimated_views: number;
  bottom_post_estimated_views_high: number;
  bottom_post_excerpt: string;
};

export async function analyzeCreator(
  urlname: string,
  days: number,
): Promise<CreatorRow | null> {
  const profileResp = await fetchCreator(urlname);
  if (!profileResp) return null;
  const p = (profileResp.data || profileResp) as AnyDict;
  const nickname = get<string>(p, "nickname", "name") || urlname;
  const bio = get<string>(p, "profile", "description") || "";
  const followerCount = Number(get(p, "follower_count", "followerCount") ?? 0);
  const followingCount = Number(get(p, "following_count", "followingCount") ?? 0);
  const noteCount = Number(get(p, "note_count", "noteCount") ?? 0);

  const notes = await fetchCreatorNotes(urlname);
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const recent: AnyDict[] = [];
  for (const n of notes) {
    const d = parseDate(get<string>(n, "publish_at", "published_at", "created_at"));
    if (d && d >= cutoff) recent.push(n);
  }

  const postsInWindow = recent.length;
  const postsPerWeek = days ? Number(((postsInWindow / days) * 7).toFixed(2)) : 0;
  const likesList = recent.map((n) => Number(get(n, "like_count", "likeCount") ?? 0));
  const totalLikes = likesList.reduce((a, b) => a + b, 0);
  const avgLikes = postsInWindow ? Number((totalLikes / postsInWindow).toFixed(2)) : 0;
  const engagement =
    followerCount && postsInWindow
      ? Number(((totalLikes / (followerCount * postsInWindow)) * 100).toFixed(3))
      : 0;

  const sorted = [...recent].sort(
    (a, b) => Number(get(b, "like_count") ?? 0) - Number(get(a, "like_count") ?? 0),
  );
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  const fields = (n: AnyDict | undefined) => ({
    title: (n && (get<string>(n, "name", "title") || "")) || "",
    url: n ? noteUrl(n, urlname) : "",
    likes: n ? Number(get(n, "like_count") ?? 0) : 0,
    body: n ? excerpt(get<string>(n, "body", "description")) : "",
  });
  const t = fields(top);
  const b = fields(bottom === top ? undefined : bottom);

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
  };
}

export async function analyzeMany(
  urlnames: string[],
  days: number,
  onProgress?: (done: number, total: number) => void,
): Promise<CreatorRow[]> {
  const out: CreatorRow[] = [];
  for (let i = 0; i < urlnames.length; i++) {
    const row = await analyzeCreator(urlnames[i], days);
    if (row) out.push(row);
    onProgress?.(i + 1, urlnames.length);
    await sleep(SLEEP_MS);
  }
  return out;
}
