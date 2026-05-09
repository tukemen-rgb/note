'use client'

import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { CreatorRow } from '@/lib/analytics/types'

type SortKey = 'followers' | 'postsPerWeek' | 'avgLikes' | 'engagement' | null
type SortOrder = 'asc' | 'desc'

interface CreatorsTableProps {
  rows: CreatorRow[]
}

export function CreatorsTable({ rows }: CreatorsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('engagement')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  const sortedRows = useMemo(() => {
    const sorted = [...rows]
    if (!sortKey) return sorted

    sorted.sort((a, b) => {
      let aVal: number, bVal: number

      switch (sortKey) {
        case 'followers':
          aVal = a.follower_count
          bVal = b.follower_count
          break
        case 'postsPerWeek':
          aVal = a.posts_per_week
          bVal = b.posts_per_week
          break
        case 'avgLikes':
          aVal = a.avg_likes_in_window
          bVal = b.avg_likes_in_window
          break
        case 'engagement':
          aVal = a.engagement_rate_pct
          bVal = b.engagement_rate_pct
          break
        default:
          return 0
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return sorted
  }, [rows, sortKey, sortOrder])

  const SortableHeader = ({
    label,
    sortKeyValue,
    align = 'left',
  }: {
    label: string
    sortKeyValue: SortKey
    align?: 'left' | 'right'
  }) => {
    const isActive = sortKey === sortKeyValue
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSort(sortKeyValue)}
        className={`h-8 px-2 font-semibold ${align === 'right' ? 'justify-end w-full' : ''} ${
          isActive ? 'text-blue-400' : 'text-neutral-400'
        }`}
      >
        {label}
        {isActive && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
      </Button>
    )
  }

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-neutral-800">
          <TableRow className="border-b border-neutral-700">
            <TableHead className="text-neutral-300">
              <div className="py-2">creator</div>
            </TableHead>
            <TableHead className="text-right text-neutral-300">
              <SortableHeader label="followers" sortKeyValue="followers" align="right" />
            </TableHead>
            <TableHead className="text-right text-neutral-300">
              <SortableHeader label="posts/wk" sortKeyValue="postsPerWeek" align="right" />
            </TableHead>
            <TableHead className="text-right text-neutral-300">
              <SortableHeader label="avg likes" sortKeyValue="avgLikes" align="right" />
            </TableHead>
            <TableHead className="text-right text-neutral-300">
              <SortableHeader label="engagement %" sortKeyValue="engagement" align="right" />
            </TableHead>
            <TableHead className="text-right text-neutral-300">
              <div className="py-2">top post</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => (
            <TableRow key={`${row.urlname}`} className="border-b border-neutral-800 hover:bg-neutral-800/50">
              <TableCell className="text-white">
                <a
                  href={`https://note.com/${row.urlname}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  <div className="font-medium">{row.nickname}</div>
                  <div className="text-sm text-neutral-400">@{row.urlname}</div>
                </a>
              </TableCell>
              <TableCell className="text-right text-white font-mono tabular-nums">
                {row.follower_count.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-white font-mono tabular-nums">
                {row.posts_per_week.toFixed(2)}
              </TableCell>
              <TableCell className="text-right text-white font-mono tabular-nums">
                {row.avg_likes_in_window.toFixed(1)}
              </TableCell>
              <TableCell className="text-right text-white font-mono tabular-nums">
                {row.engagement_rate_pct.toFixed(3)}
              </TableCell>
              <TableCell className="text-right">
                {row.top_post_url ? (
                  <a
                    href={row.top_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                  >
                    <div className="truncate max-w-xs">{row.top_post_title}</div>
                    <div className="text-neutral-400 text-xs">♥ {row.top_post_likes.toLocaleString()}</div>
                  </a>
                ) : (
                  <span className="text-neutral-500">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
