"use client";

import { useMemo, useState } from "react";

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
  top_post_excerpt: string;
  bottom_post_title: string;
  bottom_post_url: string;
  bottom_post_likes: number;
  bottom_post_excerpt: string;
  perplexity_summary?: string;
};

type SortKey =
  | "follower_count"
  | "posts_per_week"
  | "engagement_rate_pct"
  | "avg_likes_in_window";

export default function CreatorTable({ rows }: { rows: CreatorRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("engagement_rate_pct");
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return desc ? bv - av : av - bv;
    });
    return out;
  }, [rows, sortKey, desc]);

  function header(label: string, key: SortKey) {
    const active = key === sortKey;
    return (
      <button
        type="button"
        onClick={() => {
          if (active) setDesc((d) => !d);
          else {
            setSortKey(key);
            setDesc(true);
          }
        }}
        className={`text-left ${active ? "font-semibold" : "font-medium"}`}
      >
        {label}
        {active ? (desc ? " ▼" : " ▲") : ""}
      </button>
    );
  }

  return (
    <section className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          <tr>
            <th className="px-3 py-2 text-left">creator</th>
            <th className="px-3 py-2 text-right">{header("followers", "follower_count")}</th>
            <th className="px-3 py-2 text-right">{header("posts/wk", "posts_per_week")}</th>
            <th className="px-3 py-2 text-right">{header("avg likes", "avg_likes_in_window")}</th>
            <th className="px-3 py-2 text-right">{header("eng %", "engagement_rate_pct")}</th>
            <th className="px-3 py-2 text-left">top post</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.urlname}
              className="border-t border-neutral-200 dark:border-neutral-800"
            >
              <td className="px-3 py-2">
                <a
                  href={`https://note.com/${r.urlname}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                >
                  {r.nickname || r.urlname}
                </a>
                <div className="text-xs text-neutral-500">@{r.urlname}</div>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {r.follower_count.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {r.posts_per_week.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {r.avg_likes_in_window.toFixed(1)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {r.engagement_rate_pct.toFixed(3)}
              </td>
              <td className="px-3 py-2">
                {r.top_post_url ? (
                  <a
                    href={r.top_post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {r.top_post_title || "(no title)"}
                  </a>
                ) : (
                  <span className="text-neutral-500">-</span>
                )}
                <div className="text-xs text-neutral-500">
                  ♥ {r.top_post_likes.toLocaleString()}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
