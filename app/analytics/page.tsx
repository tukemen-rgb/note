'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CSVUpload } from '@/components/analytics/csv-upload'
import { SummaryStats } from '@/components/analytics/summary-stats'
import { SearchCreators } from '@/components/analytics/search-creators'
import { CreatorsTable } from '@/components/analytics/creators-table'
import { getAuthFromStorage, clearAuthFromStorage } from '@/lib/analytics/auth'
import { calculateStats as calculateStatsData, filterRows } from '@/lib/analytics/csv'
import { CreatorRow } from '@/lib/analytics/types'

export default function AnalyticsDashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [rows, setRows] = useState<CreatorRow[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (getAuthFromStorage()) {
      setIsAuthenticated(true)
      setIsLoading(false)
    } else {
      router.push('/analytics/login')
    }
  }, [router])

  const handleLogout = () => {
    clearAuthFromStorage()
    router.push('/analytics/login')
  }

  const handleDataLoaded = (newRows: CreatorRow[]) => {
    setRows(newRows)
    setSearchQuery('')
  }

  const filteredRows = filterRows(rows, searchQuery)
  const stats = calculateStatsData(filteredRows)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-neutral-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-neutral-950 text-white">
      {/* Top Bar */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">kashikin analytics</h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            ログアウト
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* CSV Upload */}
        <CSVUpload onDataLoaded={handleDataLoaded} />

        {/* Summary Stats */}
        {rows.length > 0 && (
          <SummaryStats
            creatorCount={stats.creatorCount}
            avgFollowers={stats.avgFollowers}
            avgPostsPerWeek={stats.avgPostsPerWeek}
            avgEngagement={stats.avgEngagement}
          />
        )}

        {/* Search */}
        {rows.length > 0 && (
          <SearchCreators value={searchQuery} onChange={setSearchQuery} />
        )}

        {/* Table */}
        {rows.length > 0 && (
          <div>
            <p className="text-sm text-neutral-400 mb-4">
              Showing {filteredRows.length} of {rows.length} creators
            </p>
            <CreatorsTable rows={filteredRows} />
          </div>
        )}

        {/* Empty State */}
        {rows.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-400 text-lg">No data loaded yet. Upload a CSV file to get started.</p>
          </div>
        )}
      </main>
    </div>
  )
}
