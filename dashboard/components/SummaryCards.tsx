import type { CreatorRow } from "@/components/CreatorTable";

function avg(rows: CreatorRow[], key: keyof CreatorRow): number {
  if (!rows.length) return 0;
  const total = rows.reduce((sum, r) => sum + (Number(r[key]) || 0), 0);
  return total / rows.length;
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default function SummaryCards({ rows }: { rows: CreatorRow[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card label="creators" value={rows.length.toLocaleString()} />
      <Card
        label="avg followers"
        value={avg(rows, "follower_count").toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}
      />
      <Card
        label="avg posts / week"
        value={avg(rows, "posts_per_week").toFixed(2)}
      />
      <Card
        label="avg engagement %"
        value={avg(rows, "engagement_rate_pct").toFixed(3)}
      />
    </section>
  );
}
