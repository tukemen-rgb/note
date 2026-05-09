import type { CreatorRow } from "@/components/CreatorTable";

export type RankedRow = CreatorRow & {
  rank: number;
  composite_score: number;
};

const WEIGHTS: { key: keyof CreatorRow; weight: number }[] = [
  { key: "follower_count", weight: 0.3 },
  { key: "engagement_rate_pct", weight: 0.25 },
  { key: "posts_per_week", weight: 0.2 },
  { key: "avg_likes_in_window", weight: 0.15 },
  { key: "total_likes_in_window", weight: 0.1 },
];

function minMax(values: number[]): (v: number) => number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return () => 0;
  return (v) => (v - min) / range;
}

export function rankRows(rows: CreatorRow[]): RankedRow[] {
  if (!rows.length) return [];

  const normalizers = WEIGHTS.map(({ key }) =>
    minMax(rows.map((r) => Number(r[key]) || 0)),
  );

  const scored = rows.map((row) => {
    let score = 0;
    WEIGHTS.forEach(({ key, weight }, i) => {
      score += normalizers[i](Number(row[key]) || 0) * weight;
    });
    return {
      ...row,
      composite_score: Number((score * 100).toFixed(1)),
    };
  });

  scored.sort((a, b) => b.composite_score - a.composite_score);

  return scored.map((r, i) => ({ ...r, rank: i + 1 }));
}

export const RANKING_WEIGHTS_LABEL = WEIGHTS.map(({ key, weight }) => {
  const label: Record<string, string> = {
    follower_count: "フォロワー数",
    engagement_rate_pct: "エンゲージメント率",
    posts_per_week: "投稿頻度",
    avg_likes_in_window: "平均スキ数",
    total_likes_in_window: "累計スキ数",
  };
  return `${label[String(key)]} ${Math.round(weight * 100)}%`;
}).join(" / ");
