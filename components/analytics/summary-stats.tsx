'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string | number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-400">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white font-mono tabular-nums">{value}</div>
      </CardContent>
    </Card>
  )
}

interface SummaryStatsProps {
  creatorCount: number
  avgFollowers: number
  avgPostsPerWeek: number
  avgEngagement: number
}

export function SummaryStats({
  creatorCount,
  avgFollowers,
  avgPostsPerWeek,
  avgEngagement,
}: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="creators" value={creatorCount} />
      <StatCard label="avg followers" value={avgFollowers.toLocaleString()} />
      <StatCard label="avg posts/week" value={avgPostsPerWeek.toFixed(2)} />
      <StatCard label="avg engagement %" value={avgEngagement.toFixed(3)} />
    </div>
  )
}
