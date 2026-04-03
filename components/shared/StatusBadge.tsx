'use client'

import type { PersonStatus } from '@/lib/types'

const statusConfig: Record<PersonStatus, { bg: string; text: string; dot: string; label: string }> = {
  confirmed: { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Confirmed' },
  invited:   { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Invited' },
  pending:   { bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400',  label: 'Pending' },
}

interface Props {
  status: PersonStatus
}

export function StatusBadge({ status }: Props) {
  const { bg, text, dot, label } = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${bg} ${text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
