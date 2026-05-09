'use client'

import { Input } from '@/components/ui/input'

interface SearchCreatorsProps {
  value: string
  onChange: (value: string) => void
}

export function SearchCreators({ value, onChange }: SearchCreatorsProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        placeholder="Filter by name, nickname, or profile..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500"
      />
    </div>
  )
}
