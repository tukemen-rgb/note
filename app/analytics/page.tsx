'use client'

import { useState } from 'react'
import { CSVUpload } from '@/components/analytics/csv-upload'
import { SummaryStats } from '@/components/analytics/summary-stats'
import { SearchCreators } from '@/components/analytics/search-creators'
import { CreatorsTable } from '@/components/analytics/creators-table'
import { calculateStats as calculateStatsData, filterRows } from '@/lib/analytics/csv'
import { CreatorRow } from '@/lib/analytics/types'

export default function AnalyticsDashboardPage() {
  const [rows, setRows] = useState<CreatorRow[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const handleDataLoaded = (newRows: CreatorRow[]) => {
    setRows(newRows)
    setSearchQuery('')
  }

  const filteredRows = filterRows(rows, searchQuery)
  const stats = calculateStatsData(filteredRows)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-neutral-950 text-white">
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold">kashikin analytics</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <CSVUpload onDataLoaded={handleDataLoaded} />

        {rows.length > 0 && (
          <SummaryStats
            creatorCount={stats.creatorCount}
            avgFollowers={stats.avgFollowers}
            avgPostsPerWeek={stats.avgPostsPerWeek}
            avgEngagement={stats.avgEngagement}
          />
        )}

        {rows.length > 0 && (
          <SearchCreators value={searchQuery} onChange={setSearchQuery} />
        )}

        {rows.length > 0 && (
          <div>
            <p className="text-sm text-neutral-400 mb-4">
              Showing {filteredRows.length} of {rows.length} creators
            </p>
            <CreatorsTable rows={filteredRows} />
          </div>
        )}

        {rows.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-400 text-lg">No data loaded yet. Upload a CSV file to get started.</p>
          </div>
        )}
      </main>
    </div>
  )
}
