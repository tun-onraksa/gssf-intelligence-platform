'use client'

import { Calendar, MapPin, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { StatCards } from '@/components/dashboard/StatCards'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { ReadinessChecklist } from '@/components/dashboard/ReadinessChecklist'
import { ParticipantTable } from '@/components/dashboard/ParticipantTable'
import { TeamGrid } from '@/components/dashboard/TeamGrid'
import { SimulateInviteButton } from '@/components/dashboard/SimulateInviteButton'

export default function DashboardPage() {
  const { persons, programs, activeProgramId } = useStore()
  const router = useRouter()

  const program = programs.find((p) => p.programId === activeProgramId)
  const hasDuplicates = persons.some((p) => p.isDuplicate)

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">

      {/* ── Section 1: Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{program?.name ?? 'GSSC Worlds 2026'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of all participants, teams, and program status
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-600 shadow-sm">
            <Calendar size={13} className="text-slate-400" />
            May 17–21, 2026
            <span className="mx-1 text-slate-300">·</span>
            <MapPin size={13} className="text-slate-400" />
            Seoul
          </div>
          <SimulateInviteButton />
        </div>
      </div>

      {/* ── Section 2: Stat Cards ── */}
      <StatCards />

      {/* ── Section 3: Duplicate Alert Banner ── */}
      {hasDuplicates && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <AlertTriangle size={18} className="shrink-0 text-yellow-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-800">
              Duplicate participant detected — James Park appears under 2 email addresses.
            </p>
            <p className="text-[12px] text-yellow-700 mt-0.5">
              This may cause data inconsistency before Worlds 2026 goes live.
            </p>
          </div>
          <button
            onClick={() => router.push('/participants?filter=duplicates')}
            className="shrink-0 rounded-md border border-yellow-300 bg-white px-3 py-1.5 text-[12px] font-medium text-yellow-800 hover:bg-yellow-100 transition-colors"
          >
            Review →
          </button>
        </div>
      )}

      {/* ── Section 4: Two-Column ── */}
      <div className="flex gap-5 items-start flex-col lg:flex-row">

        {/* Left: Participant Table */}
        <div className="w-full lg:w-[60%] min-w-0">
          <ParticipantTable />
        </div>

        {/* Right: Activity Feed + Readiness Checklist */}
        <div className="w-full lg:w-[40%] space-y-4 min-w-0">
          <ActivityFeed />
          <ReadinessChecklist />
        </div>
      </div>

      {/* ── Section 5: Team Grid Preview ── */}
      <TeamGrid />

    </div>
  )
}
