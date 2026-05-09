# kashikin analytics

A Next.js 14 analytics dashboard for note.com creators. Upload CSV data to analyze creator performance metrics with real-time filtering and sorting.

## Features

- **Secure Authentication**: Login screen with credential validation (default: admin/kashikin2026)
- **CSV Upload**: Parse and load creator data with automatic numeric field coercion
- **Summary Stats**: Display aggregate metrics (creator count, average followers, posts/week, engagement rate)
- **Real-time Search**: Filter creators by name, nickname, or profile with case-insensitive matching
- **Sortable Table**: Click column headers to sort by followers, posts/week, average likes, or engagement rate (default: engagement % descending)
- **Creator Links**: Direct links to note.com profiles and top posts with like counts
- **Dark Mode**: Clean, minimal dark UI with monospace numbers for data

## Getting Started

### Installation

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000`

### Login Credentials

**Development (default):**
- User ID: `admin`
- Password: `kashikin2026`

**Production:**
Set environment variables:
- `NEXT_PUBLIC_LOGIN_ID`
- `NEXT_PUBLIC_LOGIN_PASSWORD`

### CSV Format

Required columns:
- `urlname` (string) - note.com creator URL name
- `nickname` (string) - Display name
- `profile` (string) - Profile description
- `follower_count` (number)
- `following_count` (number)
- `note_count` (number)
- `posts_in_window` (number)
- `posts_per_week` (number)
- `total_likes_in_window` (number)
- `avg_likes_in_window` (number)
- `engagement_rate_pct` (number)
- `top_post_title` (string)
- `top_post_url` (string)
- `top_post_likes` (number)
- `top_post_excerpt` (string)
- `bottom_post_title` (string)
- `bottom_post_url` (string)
- `bottom_post_likes` (number)
- `bottom_post_excerpt` (string)

A sample CSV file is available at `/public/sample-creators.csv` for testing.

## UI Sections

1. **CSV Upload Card** - File input for uploading creator data
2. **Summary Stats** - Grid showing aggregate metrics (4 columns on desktop, 2 on mobile)
3. **Search Input** - Filter creators in real-time
4. **Creators Table** - Sortable table with:
   - Creator name + @urlname (linked to note.com)
   - Followers (right-aligned, locale formatting)
   - Posts/week (2 decimals)
   - Avg likes (1 decimal)
   - Engagement % (3 decimals)
   - Top post title with like count (linked)

## Technology Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Papa Parse (CSV parsing)
- React hooks for state management

## Architecture

- `/app` - Page routes (login, dashboard)
- `/components/analytics` - Feature components (CSV upload, stats, table, search)
- `/lib/analytics` - Utilities for auth, CSV parsing, data filtering
- localStorage - Client-side auth state persistence

## Authentication Flow

1. User logs in with credentials at `/login`
2. Credentials verified against env vars (or defaults)
3. `kashikin_auth` stored in localStorage
4. Dashboard redirects to `/login` if not authenticated
5. Logout clears localStorage and redirects to login

## Notes

- All numeric fields coerced to numbers during CSV parsing
- Summary stats calculated from filtered results
- Table sorts in-memory using React useMemo
- No external API calls - all data client-side
- Japanese UI labels with English code identifiers
