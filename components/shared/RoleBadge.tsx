'use client'

import type { Role } from '@/lib/types'

const roleConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  ADMIN:              { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     label: 'Admin' },
  ORGANIZER:          { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200',  label: 'Organizer' },
  MENTOR:             { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200',    label: 'Mentor' },
  JUDGE:              { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200',  label: 'Judge' },
  STUDENT:            { bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-200',   label: 'Student' },
  UNIVERSITY_POC:     { bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-200',    label: 'University POC' },
  // Category-based roles from master sheet
  'KOR._STUDENT':     { bg: 'bg-sky-100',     text: 'text-sky-700',     border: 'border-sky-200',     label: 'KOR. Student' },
  'INT._STUDENT':     { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'INT. Student' },
  'ASSOCIATE-ORGANIZER': { bg: 'bg-amber-100', text: 'text-amber-700',  border: 'border-amber-200',   label: 'Associate Organizer' },
  'CO-FOUNDER':       { bg: 'bg-violet-100',  text: 'text-violet-700',  border: 'border-violet-200',  label: 'Co-Founder' },
}

interface Props {
  role: Role
  size?: 'sm' | 'md'
}

export function RoleBadge({ role, size = 'md' }: Props) {
  const normalized = role?.toUpperCase().replace(/\s+/g, '_') as Role
  const config = roleConfig[normalized] ?? { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: role }
  const { bg, text, border, label } = config
  const fontSize = size === 'sm' ? 'text-[11px]' : 'text-[12px]'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${fontSize} ${bg} ${text} ${border}`}
    >
      {label}
    </span>
  )
}
