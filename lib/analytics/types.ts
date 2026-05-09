export interface CreatorRow {
  urlname: string
  nickname: string
  profile: string
  follower_count: number
  following_count: number
  note_count: number
  posts_in_window: number
  posts_per_week: number
  total_likes_in_window: number
  avg_likes_in_window: number
  engagement_rate_pct: number
  top_post_title: string
  top_post_url: string
  top_post_likes: number
  top_post_estimated_views_low: number
  top_post_estimated_views: number
  top_post_estimated_views_high: number
  top_post_excerpt: string
  bottom_post_title: string
  bottom_post_url: string
  bottom_post_likes: number
  bottom_post_estimated_views_low: number
  bottom_post_estimated_views: number
  bottom_post_estimated_views_high: number
  bottom_post_excerpt: string
}

export interface RankedRow extends CreatorRow {
  rank: number
  composite_score: number
}

export interface AuthState {
  loggedIn: boolean
}
