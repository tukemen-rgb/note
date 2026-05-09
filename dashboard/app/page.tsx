"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import CreatorTable, { CreatorRow } from "@/components/CreatorTable";
import SummaryCards from "@/components/SummaryCards";

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
  "bottom_post_likes",
];

function coerce(row: Record<string, string>): CreatorRow {
  const out = { ...row } as Record<string, unknown>;
  for (const key of NUMERIC_FIELDS) {
    const v = row[key];
    out[key] = v === "" || v === undefined ? 0 : Number(v);
  }
  return out as unknown as CreatorRow;
}

export default function Page() {
  const [rows, setRows] = useState<CreatorRow[]>([]);
  const [filename, setFilename] = useState<string>("");
  const [query, setQuery] = useState("");

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

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setRows(result.data.map(coerce));
      },
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <label className="block text-sm font-medium">CSV を選択</label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="mt-2 block w-full text-sm"
        />
        {filename && (
          <p className="mt-2 text-xs text-neutral-500">読み込み中: {filename}</p>
        )}
      </section>

      {rows.length > 0 && (
        <>
          <SummaryCards rows={filtered} />
          <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <input
              type="search"
              placeholder="urlname / nickname / profile で検索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
            />
          </section>
          <CreatorTable rows={filtered} />
        </>
      )}
    </div>
  );
}
