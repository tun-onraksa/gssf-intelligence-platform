'use client'

import { Clock } from 'lucide-react'

interface ActivityItem {
  id: string
  full_name: string | null
  email: string
  created_at: string | null
  status: string | null
  profile_roles: { role: string }[]
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN:          '#EF4444',
  ORGANIZER:      '#F97316',
  MENTOR:         '#3B82F6',
  JUDGE:          '#8B5CF6',
  STUDENT:        '#10B981',
  UNIVERSITY_POC: '#14B8A6',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
        </div>
        <p className="text-[13px] text-slate-400">No participants added yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Clock size={16} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
        {items.map((item) => {
          const role = item.profile_roles[0]?.role ?? ''
          const color = ROLE_COLOR[role] ?? '#94A3B8'
          const name = item.full_name ?? item.email
          const label = role
            ? `${name} added as ${role.charAt(0) + role.slice(1).toLowerCase()}`
            : `${name} added to the platform`
          return (
            <div key={item.id} className="flex items-start gap-3">
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] text-slate-700 leading-snug">{label}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{item.created_at ? timeAgo(item.created_at) : ''}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
