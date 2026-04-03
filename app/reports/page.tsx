'use client'

import Link from 'next/link'
import { PieChart } from 'lucide-react'

const PREVIEW_CARDS = [
  {
    icon: '📊',
    title: 'Full Program Summary',
    description: 'Participant counts, team roster, and final results across all tracks.',
  },
  {
    icon: '🏢',
    title: 'Sponsor Impact',
    description: 'Mentor → Team → Result chain for each sponsor organization.',
  },
  {
    icon: '🎓',
    title: 'University Report',
    description: 'Team results filtered by university for partner-specific exports.',
  },
]

export default function Page() {
  return (
    <div className="mx-auto max-w-[960px] space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold text-slate-900">Reports</h1>
        <p className="mt-0.5 text-[13px] text-slate-400">
          Sponsor impact, program summaries, and university exports
        </p>
      </div>

      {/* Main placeholder card */}
      <div className="flex justify-center">
        <div className="w-full max-w-[480px] rounded-2xl border border-slate-200 bg-white px-12 py-12 text-center shadow-sm">
          <div className="mb-5 flex justify-center">
            <PieChart size={48} className="text-slate-300" />
          </div>
          <h2 className="mb-3 text-lg font-semibold text-slate-700">
            Reports are coming in Phase 2
          </h2>
          <p className="mb-7 max-w-md text-sm leading-relaxed text-slate-400">
            Sponsor impact reports, full program summaries, and university-scoped exports will be
            available after GSSC Worlds 2026 concludes.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-700"
          >
            Preview Dashboard →
          </Link>
        </div>
      </div>

      {/* Preview cards */}
      <div className="grid grid-cols-3 gap-4">
        {PREVIEW_CARDS.map((card) => (
          <div key={card.title} className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-5">
            <span className="mb-3 text-2xl">{card.icon}</span>
            <p className="mb-1.5 text-[13px] font-semibold text-slate-700">{card.title}</p>
            <p className="flex-1 text-[12px] leading-relaxed text-slate-400">{card.description}</p>
            <p className="mt-4 text-[11px] font-medium text-slate-400">Coming P2</p>
          </div>
        ))}
      </div>
    </div>
  )
}
