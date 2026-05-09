"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import CreatorTable, { CreatorRow } from "@/components/CreatorTable";
import SummaryCards from "@/components/SummaryCards";
import { rankRows, RANKING_WEIGHTS_LABEL } from "@/lib/ranking";

type Mode = "user" | "note" | "tag";

const MODE_LABELS: Record<Mode, string> = {
  user: "プロフィール検索",
  note: "投稿本文検索",
  tag: "ハッシュタグ",
};

const NUMERIC_FIELDS: (keyof CreatorRow)[] = [
  "follower_count",
  "following_count",
  "note_count",
  "posts_in_window",
  "posts_per_week",
  "total_likes_in_window",
  "avg_likes_in_window",
  "engagement_rate_pct",
  "top_post_likes",
  "top_post_estimated_views_low",
  "top_post_estimated_views",
  "top_post_estimated_views_high",
  "bottom_post_likes",
  "bottom_post_estimated_views_low",
  "bottom_post_estimated_views",
  "bottom_post_estimated_views_high",
];

function coerce(row: Record<string, string>): CreatorRow {
  const out = { ...row } as Record<string, unknown>;
  for (const key of NUMERIC_FIELDS) {
    const v = row[key];
    out[key] = v === "" || v === undefined ? 0 : Number(v);
  }
  return out as unknown as CreatorRow;
}

function toCsv(rows: CreatorRow[]): string {
  if (!rows.length) return "";
  const fields = Object.keys(rows[0]) as (keyof CreatorRow)[];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [fields.join(",")];
  for (const r of rows) lines.push(fields.map((f) => escape(r[f])).join(","));
  return "﻿" + lines.join("\n");
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1 text-xs transition " +
        (active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)]")
      }
    >
      {children}
    </button>
  );
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("user");
  const [keyword, setKeyword] = useState("");
  const [max, setMax] = useState(10);
  const [days, setDays] = useState(90);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const [rows, setRows] = useState<CreatorRow[]>([]);
  const [filename, setFilename] = useState("");
  const [query, setQuery] = useState("");

  const ranked = useMemo(() => rankRows(rows), [rows]);

  const filtered = useMemo(() => {
    if (!query) return ranked;
    const q = query.toLowerCase();
    return ranked.filter(
      (r) =>
        r.urlname?.toLowerCase().includes(q) ||
        r.nickname?.toLowerCase().includes(q) ||
        r.profile?.toLowerCase().includes(q),
    );
  }, [ranked, query]);

  async function runAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setRunning(true);
    setError("");
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, keyword: keyword.trim(), max, days }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `http ${r.status}`);
      }
      const j = (await r.json()) as { rows: CreatorRow[] };
      setRows(j.rows || []);
      setFilename(`${mode}_${keyword.trim()}`);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setRunning(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => setRows(result.data.map(coerce)),
    });
  }

  function downloadCsv() {
    if (!rows.length) return;
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename || "note_analysis"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setKeyword("");
    setMode("user");
    setMax(10);
    setDays(90);
    setQuery("");
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-base font-bold">検索条件</h2>
            <p className="text-xs text-[var(--muted)]">
              モード・キーワード・取得件数・分析期間を指定して実行します。
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-[var(--muted)] underline-offset-2 hover:underline"
          >
            リセット
          </button>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <form onSubmit={runAnalyze} className="space-y-5">
            <div>
              <p className="mb-2 text-xs text-[var(--muted)]">モード</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                  <Chip
                    key={m}
                    active={mode === m}
                    onClick={() => setMode(m)}
                  >
                    {MODE_LABELS[m]}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_140px_140px_auto]">
              <label className="block text-sm">
                <span className="text-xs text-[var(--muted)]">キーワード</span>
                <input
                  type="text"
                  placeholder="例: 副業 / 投資 / 子育て"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="mt-1 w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs text-[var(--muted)]">取得件数</span>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={max}
                  onChange={(e) => setMax(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs text-[var(--muted)]">分析期間（日）</span>
                <input
                  type="number"
                  min={7}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="mt-1 w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <button
                type="submit"
                disabled={running}
                className="self-end rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50"
              >
                {running ? "分析中" : "分析を実行"}
              </button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>

        <details className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <summary className="cursor-pointer text-sm font-medium">
            CSV を直接読み込む
          </summary>
          <div className="mt-3 space-y-2">
            <p className="text-xs text-[var(--muted)]">
              note_analyzer.py で生成した CSV をアップロードして閲覧できます。
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="block w-full text-sm"
            />
            {filename && (
              <p className="text-xs text-[var(--muted)]">読み込み中: {filename}</p>
            )}
          </div>
        </details>
      </section>

      {rows.length > 0 && (
        <>
          <SummaryCards rows={filtered} />

          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-base font-bold">アカウント検索</h2>
                <p className="text-xs text-[var(--muted)]">
                  下のランキングをユーザー名・ニックネーム・プロフィール本文で絞り込みます。
                </p>
              </div>
              <button
                type="button"
                onClick={downloadCsv}
                className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] hover:border-[var(--accent)]"
              >
                CSV を保存
              </button>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
              <input
                type="search"
                placeholder="例: tanaka / 副業 / プロフィール内のキーワード"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <p className="mt-2 text-[11px] text-[var(--muted)]">
                総合スコア配点: {RANKING_WEIGHTS_LABEL}
              </p>
            </div>
          </section>

          <CreatorTable rows={filtered} totalCount={ranked.length} />
        </>
      )}
    </div>
  );
}
