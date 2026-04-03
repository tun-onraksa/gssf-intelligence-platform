'use client'

import type { QualifyingPath } from '@/lib/types'

interface Props {
  path: QualifyingPath
  regionLabel?: string
}

export function QualifyingPathBadge({ path, regionLabel }: Props) {
  if (path === 'direct') {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">
        Direct
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-blue-600 px-2 py-0.5 text-[11px] font-medium text-blue-600">
      {regionLabel ? `Via ${regionLabel}` : 'Regional'}
    </span>
  )
}
