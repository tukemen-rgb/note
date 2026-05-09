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

type SortKey =
  | "follower_count"
  | "posts_per_week"
  | "engagement_rate_pct"
  | "avg_likes_in_window"
  | "total_likes_in_window";

const SORT_LABEL: Record<SortKey, string> = {
  follower_count: "フォロワー",
  posts_per_week: "投稿数 / 週",
  avg_likes_in_window: "平均スキ",
  total_likes_in_window: "累計スキ",
  engagement_rate_pct: "エンゲージ率",
};

export default function CreatorTable({ rows }: { rows: CreatorRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("engagement_rate_pct");
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      const av = Number(a[sortKey]) || 0;
      const bv = Number(b[sortKey]) || 0;
      return desc ? bv - av : av - bv;
    });
    return out;
  }, [rows, sortKey, desc]);

  function HeaderCell({
    label,
    keyName,
    align = "right",
  }: {
    label: string;
    keyName: SortKey;
    align?: "left" | "right";
  }) {
    const active = keyName === sortKey;
    return (
      <th className={`px-3 py-2 text-${align} font-medium text-[var(--muted)]`}>
        <button
          type="button"
          onClick={() => {
            if (active) setDesc((d) => !d);
            else {
              setSortKey(keyName);
              setDesc(true);
            }
          }}
          className={active ? "text-[var(--text)] font-bold" : ""}
        >
          {label}
          {active ? (desc ? " ↓" : " ↑") : ""}
        </button>
      </th>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-bold">クリエイター一覧</h2>
          <p className="text-xs text-[var(--muted)]">
            並び替え基準: {SORT_LABEL[sortKey]}（{desc ? "降順" : "昇順"}）
          </p>
        </div>
        <p className="text-xs text-[var(--muted)]">{sorted.length} 件</p>
      </div>
      <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[#fafaf7] text-xs">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">
                クリエイター
              </th>
              <HeaderCell label="フォロワー" keyName="follower_count" />
              <HeaderCell label="投稿数 / 週" keyName="posts_per_week" />
              <HeaderCell label="平均スキ" keyName="avg_likes_in_window" />
              <HeaderCell label="累計スキ" keyName="total_likes_in_window" />
              <HeaderCell label="エンゲージ率" keyName="engagement_rate_pct" />
              <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">
                最高反応の投稿
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr
                key={r.urlname}
                className="border-t border-[var(--border)] align-top"
              >
                <td className="px-3 py-3">
                  <a
                    href={`https://note.com/${r.urlname}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--text)] underline-offset-2 hover:underline"
                  >
                    {r.nickname || r.urlname}
                  </a>
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    @{r.urlname}
                  </div>
                  {r.profile && (
                    <div className="mt-1 line-clamp-2 text-[11px] text-[var(--muted)]">
                      {r.profile}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {r.follower_count.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {r.posts_per_week.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {r.avg_likes_in_window.toFixed(1)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {r.total_likes_in_window.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {r.engagement_rate_pct.toFixed(3)}%
                </td>
                <td className="px-3 py-3">
                  {r.top_post_url ? (
                    <a
                      href={r.top_post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--text)] underline-offset-2 hover:underline"
                    >
                      {r.top_post_title || "(タイトルなし)"}
                    </a>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                  <div className="mt-1 text-xs text-[var(--muted)] tabular-nums">
                    スキ {r.top_post_likes.toLocaleString()}
                    {r.top_post_estimated_views > 0 && (
                      <>
                        {" "}/ 推定ビュー{" "}
                        {r.top_post_estimated_views_low.toLocaleString()}〜
                        {r.top_post_estimated_views_high.toLocaleString()}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-sm text-[var(--muted)]"
                  colSpan={7}
                >
                  該当するクリエイターがありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
