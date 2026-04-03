'use client'

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { useStore } from '@/lib/store'

type ItemStatus = 'ok' | 'warn' | 'fail'

interface CheckItem {
  label: string
  status: ItemStatus
  detail: string
}

function CheckRow({ label, status, detail }: CheckItem) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2.5">
        {status === 'ok'   && <CheckCircle2 size={15} className="text-green-500 shrink-0" />}
        {status === 'warn' && <AlertTriangle size={15} className="text-yellow-500 shrink-0" />}
        {status === 'fail' && <XCircle       size={15} className="text-red-400 shrink-0" />}
        <span className="text-[13px] text-slate-700">{label}</span>
      </div>
      <span className="text-[11px] text-slate-400 ml-4 shrink-0">{detail}</span>
    </div>
  )
}

export function ReadinessChecklist() {
  const { persons, teams, schedulePublished, visaLetters } = useStore()

  const judges = persons.filter(
    (p) => p.roles.includes('JUDGE') && p.programIds.includes('prog_worlds_2026')
  )
  const ackedJudges = judges.filter((p) => p.rubricAck).length
  const mentorsAssigned = teams.filter((t) => t.assignedMentorId).length
  const hasDuplicates = persons.some((p) => p.isDuplicate)
  const visaRequired = persons.filter(
    (p) => p.needsVisa && p.programIds.includes('prog_worlds_2026')
  ).length
  const visaGenerated = visaLetters.length

  const items: CheckItem[] = [
    { label: 'Program published',            status: 'ok',   detail: 'Live' },
    { label: 'All 16 teams confirmed',        status: 'ok',   detail: '16 / 16' },
    { label: 'Student onboarding open',       status: 'ok',   detail: 'Active' },
    { label: 'Mentor onboarding open',        status: 'ok',   detail: 'Active' },
    {
      label: 'Judge rubric acknowledgment',
      status: ackedJudges === judges.length ? 'ok' : 'warn',
      detail: `${ackedJudges} of ${judges.length} complete`,
    },
    {
      label: 'Mentor matching complete',
      status: mentorsAssigned === teams.length ? 'ok' : 'warn',
      detail: `${mentorsAssigned} of ${teams.length} matched`,
    },
    {
      label: 'Pitch schedule published',
      status: schedulePublished ? 'ok' : 'fail',
      detail: schedulePublished ? 'Published' : 'Not published',
    },
    {
      label: 'Visa letters generated',
      status: visaGenerated >= visaRequired ? 'ok' : 'fail',
      detail: visaGenerated === 0 ? 'None generated' : `${visaGenerated} / ${visaRequired}`,
    },
    {
      label: 'Duplicate records resolved',
      status: hasDuplicates ? 'warn' : 'ok',
      detail: hasDuplicates ? '1 flagged' : 'Clean',
    },
  ]

  const okCount = items.filter((i) => i.status === 'ok').length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Worlds 2026 Readiness</h3>
        </div>
        <span className="text-[11px] text-slate-400">{okCount} / {items.length} complete</span>
      </div>
      <div className="mt-3">
        {items.map((item) => (
          <CheckRow key={item.label} {...item} />
        ))}
      </div>
    </div>
  )
}
