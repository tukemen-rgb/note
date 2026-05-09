"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import CreatorTable, { CreatorRow } from "@/components/CreatorTable";
import SummaryCards from "@/components/SummaryCards";

type Mode = "user" | "note" | "tag";

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

export default function Page() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [mode, setMode] = useState<Mode>("user");
  const [keyword, setKeyword] = useState("");
  const [max, setMax] = useState(10);
  const [days, setDays] = useState(90);
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<CreatorRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("kashikin_auth") !== "1") {
      router.replace("/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.urlname?.toLowerCase().includes(q) ||
        r.nickname?.toLowerCase().includes(q) ||
        r.profile?.toLowerCase().includes(q),
    );
  }, [rows, query]);

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

  function logout() {
    localStorage.removeItem("kashikin_auth");
    router.replace("/login");
  }

  if (!authChecked) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          サーバ経由で note.com の公開APIを叩きます。CSV取込でも閲覧できます。
        </p>
        <button
          type="button"
          onClick={logout}
          className="text-xs text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          ログアウト
        </button>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <form onSubmit={runAnalyze} className="grid gap-3 md:grid-cols-[120px_1fr_100px_100px_auto]">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          >
            <option value="user">user (プロフ)</option>
            <option value="note">note (投稿)</option>
            <option value="tag">tag (ハッシュタグ)</option>
          </select>
          <input
            type="text"
            placeholder="キーワード（例: 副業）"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
          <input
            type="number"
            min={1}
            max={25}
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            title="最大クリエイター数 (1-25)"
            className="rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
          <input
            type="number"
            min={7}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            title="分析期間 (日)"
            className="rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={running}
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {running ? "分析中…" : "分析実行"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </section>

      <details className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <summary className="cursor-pointer text-sm font-medium">CSVを直接読み込む</summary>
        <div className="mt-3 space-y-2">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="block w-full text-sm"
          />
          {filename && <p className="text-xs text-neutral-500">{filename}</p>}
        </div>
      </details>

      {rows.length > 0 && (
        <>
          <SummaryCards rows={filtered} />
          <section className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <input
              type="search"
              placeholder="urlname / nickname / profile で検索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
            />
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
            >
              CSV保存
            </button>
          </section>
          <CreatorTable rows={filtered} />
        </>
      )}
    </div>
  );
}
