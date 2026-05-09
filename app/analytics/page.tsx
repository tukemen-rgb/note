'use client'

import { useMemo, useState } from 'react'
import Papa from 'papaparse'
import type { CreatorRow } from '@/lib/analytics/types'
import { rankRows, RANKING_WEIGHTS_LABEL } from '@/lib/ranking'

type Mode = 'user' | 'note' | 'tag' | 'urlnames'

type Diagnostics = {
  matched_urlnames: number
  analyzed_rows: number
  errors: string[]
  response_summaries: string[]
  html_previews: string[]
  nuxt_previews: string[]
  sample_url: string
}

const MODE_LABELS: Record<Mode, string> = {
  user: 'プロフィール検索 (Google経由)',
  note: '投稿本文検索 (Google経由)',
  tag: 'ハッシュタグ (Google経由)',
  urlnames: 'urlname を直接入力',
}

const NUMERIC_FIELDS: (keyof CreatorRow)[] = [
  'follower_count',
  'following_count',
  'note_count',
  'posts_in_window',
  'posts_per_week',
  'total_likes_in_window',
  'avg_likes_in_window',
  'engagement_rate_pct',
  'top_post_likes',
  'top_post_estimated_views_low',
  'top_post_estimated_views',
  'top_post_estimated_views_high',
  'bottom_post_likes',
  'bottom_post_estimated_views_low',
  'bottom_post_estimated_views',
  'bottom_post_estimated_views_high',
]

function coerce(row: Record<string, string>): CreatorRow {
  const out = { ...row } as Record<string, unknown>
  for (const key of NUMERIC_FIELDS) {
    const v = row[key]
    out[key] = v === '' || v === undefined ? 0 : Number(v)
  }
  return out as unknown as CreatorRow
}

function toCsv(rows: CreatorRow[]): string {
  if (!rows.length) return ''
  const fields = Object.keys(rows[0]) as (keyof CreatorRow)[]
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [fields.join(',')]
  for (const r of rows) lines.push(fields.map((f) => escape(r[f])).join(','))
  return '﻿' + lines.join('\n')
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full border px-3 py-1 text-xs transition ' +
        (active
          ? 'border-[#14584c] bg-[#14584c] text-white'
          : 'border-[#e7e5e0] bg-white text-[#1f1f1f] hover:border-[#14584c]')
      }
    >
      {children}
    </button>
  )
}

export default function AnalyticsPage() {
  const [mode, setMode] = useState<Mode>('user')
  const [keyword, setKeyword] = useState('')
  const [urlnamesInput, setUrlnamesInput] = useState('')
  const [max, setMax] = useState(10)
  const [days, setDays] = useState(90)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [diag, setDiag] = useState<Diagnostics | null>(null)
  const [rows, setRows] = useState<CreatorRow[]>([])
  const [filename, setFilename] = useState('')
  const [query, setQuery] = useState('')

  const ranked = useMemo(() => rankRows(rows), [rows])
  const filtered = useMemo(() => {
    if (!query) return ranked
    const q = query.toLowerCase()
    return ranked.filter(
      (r) =>
        r.urlname?.toLowerCase().includes(q) ||
        r.nickname?.toLowerCase().includes(q) ||
        r.profile?.toLowerCase().includes(q),
    )
  }, [ranked, query])

  const summary = useMemo(() => {
    if (!filtered.length) return null
    const sum = (k: keyof CreatorRow) => filtered.reduce((a, r) => a + (Number(r[k]) || 0), 0)
    const avg = (k: keyof CreatorRow) => sum(k) / filtered.length
    return {
      count: filtered.length,
      avgFollowers: avg('follower_count'),
      avgPostsPerWeek: avg('posts_per_week'),
      avgEngagement: avg('engagement_rate_pct'),
      totalLikes: sum('total_likes_in_window'),
      avgLikes: avg('avg_likes_in_window'),
      avgNoteCount: avg('note_count'),
      avgPosts: avg('posts_in_window'),
    }
  }, [filtered])

  async function runAnalyze(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'urlnames' && !urlnamesInput.trim()) return
    if (mode !== 'urlnames' && !keyword.trim()) return
    setRunning(true)
    setError('')
    setDiag(null)
    try {
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          keyword: keyword.trim(),
          urlnames: urlnamesInput,
          max,
          days,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || `http ${r.status}`)
      setRows(j.rows || [])
      setFilename(mode === 'urlnames' ? 'urlnames' : `${mode}_${keyword.trim()}`)
      setDiag(j.diagnostics || null)
      if ((j.rows || []).length === 0) {
        const errs = j.diagnostics?.errors || []
        setError(
          errs.length
            ? `データを取得できませんでした: ${errs[0]}`
            : '該当するクリエイターが見つかりませんでした。',
        )
      }
    } catch (e: any) {
      setError(e?.message || 'failed')
    } finally {
      setRunning(false)
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFilename(file.name)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => setRows(result.data.map(coerce)),
    })
  }

  function downloadCsv() {
    if (!rows.length) return
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename || 'note_analysis'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function resetFilters() {
    setKeyword('')
    setUrlnamesInput('')
    setMode('user')
    setMax(10)
    setDays(90)
    setQuery('')
    setError('')
    setDiag(null)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#f7f6f3',
        color: '#1f1f1f',
        fontFamily:
          '"Meiryo UI", "メイリオ", Meiryo, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Yu Gothic", sans-serif',
      }}
    >
      <header className="border-b border-[#e7e5e0] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <p className="text-xs tracking-widest text-[#6b6b6b]">NOTE ANALYTICS</p>
          <h1 className="mt-1 text-2xl font-bold">note クリエイター分析ダッシュボード</h1>
          <p className="mt-1 text-sm text-[#6b6b6b]">
            Google 検索で note.com 上の URL を取得 → 個人ページをスクレイピングして集計します。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-base font-bold">検索条件</h2>
              <p className="text-xs text-[#6b6b6b]">
                キーワード検索を使うには Vercel の環境変数に GOOGLE_API_KEY と GOOGLE_CSE_ID を設定してください。未設定の場合は「urlname を直接入力」モードをご利用ください。
              </p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-[#6b6b6b] underline-offset-2 hover:underline"
            >
              リセット
            </button>
          </div>

          <div className="rounded-md border border-[#e7e5e0] bg-white p-5">
            <form onSubmit={runAnalyze} className="space-y-5">
              <div>
                <p className="mb-2 text-xs text-[#6b6b6b]">モード</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                    <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
                      {MODE_LABELS[m]}
                    </Chip>
                  ))}
                </div>
              </div>

              {mode === 'urlnames' ? (
                <div className="grid gap-4 md:grid-cols-[1fr_140px_140px_auto]">
                  <label className="block text-sm md:col-span-4">
                    <span className="text-xs text-[#6b6b6b]">urlname リスト（改行・カンマ・スペース区切り / @ や https://note.com/ は除去されます）</span>
                    <textarea
                      placeholder={'例:\nyu_shiro_h\nshirokuro3215\nlush_whale7372'}
                      rows={4}
                      value={urlnamesInput}
                      onChange={(e) => setUrlnamesInput(e.target.value)}
                      className="mt-1 w-full rounded border border-[#e7e5e0] bg-white px-3 py-2 text-sm outline-none focus:border-[#14584c] font-mono"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-xs text-[#6b6b6b]">取得件数 (1-25)</span>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={max}
                      onChange={(e) => setMax(Number(e.target.value))}
                      className="mt-1 w-full rounded border border-[#e7e5e0] bg-white px-3 py-2 text-sm outline-none focus:border-[#14584c]"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-xs text-[#6b6b6b]">分析期間 (日)</span>
                    <input
                      type="number"
                      min={7}
                      max={365}
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="mt-1 w-full rounded border border-[#e7e5e0] bg-white px-3 py-2 text-sm outline-none focus:border-[#14584c]"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={running}
                    className="self-end rounded bg-[#14584c] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {running ? '分析中' : '分析を実行'}
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-[1fr_140px_140px_auto]">
                  <label className="block text-sm">
                    <span className="text-xs text-[#6b6b6b]">キーワード</span>
                    <input
                      type="text"
                      placeholder="例: 副業 / 投資 / 子育て / 採用"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="mt-1 w-full rounded border border-[#e7e5e0] bg-white px-3 py-2 text-sm outline-none focus:border-[#14584c]"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-xs text-[#6b6b6b]">取得件数 (1-25)</span>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={max}
                      onChange={(e) => setMax(Number(e.target.value))}
                      className="mt-1 w-full rounded border border-[#e7e5e0] bg-white px-3 py-2 text-sm outline-none focus:border-[#14584c]"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-xs text-[#6b6b6b]">分析期間 (日)</span>
                    <input
                      type="number"
                      min={7}
                      max={365}
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="mt-1 w-full rounded border border-[#e7e5e0] bg-white px-3 py-2 text-sm outline-none focus:border-[#14584c]"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={running}
                    className="self-end rounded bg-[#14584c] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {running ? '分析中' : '分析を実行'}
                  </button>
                </div>
              )}

              {error && (
                <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              {diag && rows.length === 0 && (
                <div className="rounded border border-[#e7e5e0] bg-[#fafaf7] p-3 text-xs text-[#6b6b6b] space-y-2">
                  <p className="font-semibold">診断ログ</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>マッチした urlname: {diag.matched_urlnames}</li>
                    <li>分析できたロウ: {diag.analyzed_rows}</li>
                    {diag.sample_url && <li className="break-all">サンプルURL: {diag.sample_url}</li>}
                  </ul>
                  {diag.response_summaries.length > 0 && (
                    <div>
                      <p>レスポンス:</p>
                      <ul className="ml-3 list-disc">
                        {diag.response_summaries.map((s, i) => (
                          <li key={i} className="break-all">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {diag.errors.length > 0 && (
                    <div>
                      <p>エラー:</p>
                      <ul className="ml-3 list-disc">
                        {diag.errors.map((er, i) => (
                          <li key={i} className="break-all">{er}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          <details className="rounded-md border border-[#e7e5e0] bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium">
              CSV を読み込む（オプション：以前保存したデータを見る用）
            </summary>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-[#6b6b6b]">note_analyzer.py で生成した CSV をアップロードして表示させるためのオプションです。</p>
              <input type="file" accept=".csv,text/csv" onChange={onFile} className="block w-full text-sm" />
              {filename && <p className="text-xs text-[#6b6b6b]">読み込み中: {filename}</p>}
            </div>
          </details>
        </section>

        {summary && (
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-bold">サマリー指標</h2>
              <p className="text-xs text-[#6b6b6b]">絞り込み後 {summary.count} 件のクリエイターをもとに算出しています。</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card label="クリエイター数" value={summary.count.toLocaleString()} />
              <Card label="平均フォロワー数" value={Math.round(summary.avgFollowers).toLocaleString()} />
              <Card label="平均投稿数 / 週" value={summary.avgPostsPerWeek.toFixed(2)} />
              <Card label="平均エンゲージメント率" value={`${summary.avgEngagement.toFixed(3)}%`} />
              <Card label="累計スキ数" value={summary.totalLikes.toLocaleString()} />
              <Card label="平均スキ数 / 投稿" value={summary.avgLikes.toFixed(1)} />
              <Card label="平均累計投稿数" value={Math.round(summary.avgNoteCount).toLocaleString()} />
              <Card label="平均期間内投稿数" value={summary.avgPosts.toFixed(1)} />
            </div>
          </section>
        )}

        {ranked.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-base font-bold">アカウント検索</h2>
                <p className="text-xs text-[#6b6b6b]">下の総合ランキングをユーザー名・ニックネーム・プロフィールで絞り込みます。</p>
              </div>
              <button
                type="button"
                onClick={downloadCsv}
                className="rounded border border-[#e7e5e0] bg-white px-3 py-2 text-xs hover:border-[#14584c]"
              >
                CSV を保存
              </button>
            </div>
            <div className="rounded-md border border-[#e7e5e0] bg-white p-3">
              <input
                type="search"
                placeholder="urlname / nickname / profile で検索"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded border border-[#e7e5e0] bg-white px-3 py-2 text-sm outline-none focus:border-[#14584c]"
              />
              <p className="mt-2 text-[11px] text-[#6b6b6b]">総合スコア配点: {RANKING_WEIGHTS_LABEL}</p>
            </div>
          </section>
        )}

        {filtered.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-base font-bold">総合ランキング</h2>
                <p className="text-xs text-[#6b6b6b]">順位は検索前のものを保持します。</p>
              </div>
              <p className="text-xs text-[#6b6b6b] tabular-nums">{ranked.length} 件中 {filtered.length} 件</p>
            </div>
            <div className="overflow-x-auto rounded-md border border-[#e7e5e0] bg-white">
              <table className="min-w-full text-sm">
                <thead className="border-b border-[#e7e5e0] bg-[#fafaf7] text-xs text-[#6b6b6b]">
                  <tr>
                    <th className="px-3 py-2 text-right">順位</th>
                    <th className="px-3 py-2 text-left">クリエイター</th>
                    <th className="px-3 py-2 text-right">総合スコア</th>
                    <th className="px-3 py-2 text-right">フォロワー</th>
                    <th className="px-3 py-2 text-right">投稿 / 週</th>
                    <th className="px-3 py-2 text-right">平均スキ</th>
                    <th className="px-3 py-2 text-right">累計スキ</th>
                    <th className="px-3 py-2 text-right">エンゲージ率</th>
                    <th className="px-3 py-2 text-left">最高反応の投稿</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.urlname} className="border-t border-[#e7e5e0] align-top">
                      <td className="px-3 py-3 text-right tabular-nums font-bold">{r.rank}</td>
                      <td className="px-3 py-3">
                        <a href={`https://note.com/${r.urlname}`} target="_blank" rel="noreferrer" className="font-medium underline-offset-2 hover:underline">
                          {r.nickname || r.urlname}
                        </a>
                        <div className="mt-0.5 text-xs text-[#6b6b6b]">@{r.urlname}</div>
                        {r.profile && <div className="mt-1 line-clamp-2 text-[11px] text-[#6b6b6b]">{r.profile}</div>}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-bold">{r.composite_score.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.follower_count.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.posts_per_week.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.avg_likes_in_window.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.total_likes_in_window.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.engagement_rate_pct.toFixed(3)}%</td>
                      <td className="px-3 py-3">
                        {r.top_post_url ? (
                          <a href={r.top_post_url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                            {r.top_post_title || '(タイトルなし)'}
                          </a>
                        ) : (
                          <span className="text-[#6b6b6b]">—</span>
                        )}
                        <div className="mt-1 text-xs text-[#6b6b6b] tabular-nums">
                          スキ {r.top_post_likes.toLocaleString()}
                          {r.top_post_estimated_views > 0 && (
                            <>
                              {' '}/ 推定ビュー {r.top_post_estimated_views_low.toLocaleString()}〜{r.top_post_estimated_views_high.toLocaleString()}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!summary && !error && (
          <p className="text-center text-sm text-[#6b6b6b]">キーワードを入力して「分析を実行」を押してください。</p>
        )}
      </main>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e7e5e0] bg-white px-4 py-4">
      <div className="text-xs text-[#6b6b6b]">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
