'use client'

import type { Role } from '@/lib/types'

const roleConfig: Record<Role, { bg: string; text: string; border: string; label: string }> = {
  ADMIN:          { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    label: 'Admin' },
  ORGANIZER:      { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'Organizer' },
  MENTOR:         { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   label: 'Mentor' },
  JUDGE:          { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', label: 'Judge' },
  STUDENT:        { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  label: 'Student' },
  UNIVERSITY_POC: { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-200',   label: 'University POC' },
}

interface Props {
  role: Role
  size?: 'sm' | 'md'
}

export function RoleBadge({ role, size = 'md' }: Props) {
  const { bg, text, border, label } = roleConfig[role]
  const fontSize = size === 'sm' ? 'text-[11px]' : 'text-[12px]'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${fontSize} ${bg} ${text} ${border}`}
    >
      {label}
    </span>
  )
}
