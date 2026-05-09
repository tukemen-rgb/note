'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { parseCSV } from '@/lib/analytics/csv'
import { CreatorRow } from '@/lib/analytics/types'

interface CSVUploadProps {
  onDataLoaded: (rows: CreatorRow[]) => void
  isLoading?: boolean
}

export function CSVUpload({ onDataLoaded, isLoading = false }: CSVUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    try {
      const rows = await parseCSV(file)
      onDataLoaded(rows)
    } catch (error) {
      console.error('CSV parse error:', error)
      alert('CSVファイルの解析に失敗しました')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader>
        <CardTitle>CSV Upload</CardTitle>
        <CardDescription>Upload creator data CSV file</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isLoading}
            className="text-sm text-neutral-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
          />
        </div>
      </CardContent>
    </Card>
  )
}
