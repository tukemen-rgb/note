import type { CreatorRow } from "@/components/CreatorTable";

function avg(rows: CreatorRow[], key: keyof CreatorRow): number {
  if (!rows.length) return 0;
  const total = rows.reduce((sum, r) => sum + (Number(r[key]) || 0), 0);
  return total / rows.length;
}

function sum(rows: CreatorRow[], key: keyof CreatorRow): number {
  return rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
}

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-[var(--muted)]">{hint}</div>}
    </div>
  );
}

export default function SummaryCards({ rows }: { rows: CreatorRow[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-bold">サマリー指標</h2>
        <p className="text-xs text-[var(--muted)]">
          フィルタ後 {rows.length.toLocaleString()} 件のクリエイターをもとに算出しています。
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card
          label="クリエイター数"
          value={rows.length.toLocaleString()}
          hint="絞り込み対象"
        />
        <Card
          label="平均フォロワー数"
          value={avg(rows, "follower_count").toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          hint="算術平均"
        />
        <Card
          label="平均投稿数 / 週"
          value={avg(rows, "posts_per_week").toFixed(2)}
          hint="直近期間ベース"
        />
        <Card
          label="平均エンゲージメント率"
          value={`${avg(rows, "engagement_rate_pct").toFixed(3)}%`}
          hint="スキ ÷ (フォロワー × 投稿数)"
        />
        <Card
          label="累計スキ数"
          value={sum(rows, "total_likes_in_window").toLocaleString()}
          hint="直近期間ベース"
        />
        <Card
          label="平均スキ数 / 投稿"
          value={avg(rows, "avg_likes_in_window").toFixed(1)}
          hint="期間内の平均"
        />
        <Card
          label="平均累計投稿数"
          value={avg(rows, "note_count").toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
          hint="アカウント開設以来"
        />
        <Card
          label="平均期間内投稿数"
          value={avg(rows, "posts_in_window").toFixed(1)}
          hint="算術平均"
        />
      </div>
    </section>
  );
}
