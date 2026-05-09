import Papa from 'papaparse'
import { CreatorRow } from './types'

const NUMERIC_FIELDS: (keyof CreatorRow)[] = [
  'follower_count',
  'following_count',
  'note_count',
  'posts_in_window',
  'posts_per_week',
  'total_likes_in_window',
  'avg_likes_in_window',
  'engagement_rate_pct',
  'top_post_likes',
  'bottom_post_likes',
]

export const parseCSV = (file: File): Promise<CreatorRow[]> => {
  return new Promise((resolve, reject) => {
    const config: Papa.ParseLocalConfig<Record<string, string>, File> = {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        try {
          const rows = (results.data as Record<string, string>[])
            .map((row) => {
              const processed: Record<string, any> = { ...row }
              NUMERIC_FIELDS.forEach((field) => {
                if (field in processed) {
                  const val = processed[field]
                  processed[field] = val === '' ? 0 : parseFloat(val)
                }
              })
              return processed as CreatorRow
            })
          resolve(rows)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(error)
      },
    }
    Papa.parse<Record<string, string>, File>(file, config)
  })
}

export const calculateStats = (rows: CreatorRow[]) => {
  if (rows.length === 0) {
    return {
      creatorCount: 0,
      avgFollowers: 0,
      avgPostsPerWeek: 0,
      avgEngagement: 0,
    }
  }

  const creatorCount = rows.length
  const avgFollowers = rows.reduce((sum, r) => sum + r.follower_count, 0) / creatorCount
  const avgPostsPerWeek = rows.reduce((sum, r) => sum + r.posts_per_week, 0) / creatorCount
  const avgEngagement = rows.reduce((sum, r) => sum + r.engagement_rate_pct, 0) / creatorCount

  return {
    creatorCount,
    avgFollowers: Math.round(avgFollowers),
    avgPostsPerWeek: parseFloat(avgPostsPerWeek.toFixed(2)),
    avgEngagement: parseFloat(avgEngagement.toFixed(3)),
  }
}

export const filterRows = (rows: CreatorRow[], query: string): CreatorRow[] => {
  if (!query.trim()) return rows
  const lowerQuery = query.toLowerCase()
  return rows.filter((row) => {
    const urlname = row.urlname.toLowerCase()
    const nickname = row.nickname.toLowerCase()
    const profile = row.profile.toLowerCase()
    return urlname.includes(lowerQuery) || nickname.includes(lowerQuery) || profile.includes(lowerQuery)
  })
}
