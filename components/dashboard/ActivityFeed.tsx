'use client'

import { Clock } from 'lucide-react'

const FEED_ITEMS = [
  { color: '#10B981', text: 'Rohan Mehta confirmed onboarding as Mentor',           time: '1h ago' },
  { color: '#10B981', text: 'Atlix team roster complete (3/3 students confirmed)',  time: '2h ago' },
  { color: '#F59E0B', text: 'Leila Ahmadi invited as Judge (Track B) — pending rubric ack', time: '3h ago' },
  { color: '#10B981', text: 'Helion team created and assigned to Track A',          time: '4h ago' },
  { color: '#10B981', text: 'Priya Nair confirmed onboarding — conflict declared for Nexus', time: '6h ago' },
  { color: '#F59E0B', text: 'James Park flagged as potential duplicate',             time: '8h ago' },
  { color: '#10B981', text: 'GSSC Worlds 2026 program published',                   time: '1d ago' },
]

export function ActivityFeed() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Clock size={16} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
        {FEED_ITEMS.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-slate-700 leading-snug">{item.text}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
