'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { QualifyingPathBadge } from '@/components/shared/QualifyingPathBadge'

const PREVIEW_COUNT = 6

export function TeamGrid() {
  const { teams, universities, expertiseTags } = useStore()

  const preview = teams.slice(0, PREVIEW_COUNT)

  function getUniName(universityId: string) {
    return universities.find((u) => u.universityId === universityId)?.name ?? universityId
  }

  function getTagName(tagId: string) {
    return expertiseTags.find((t) => t.tagId === tagId)?.name ?? tagId
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Teams at a Glance</h2>
        <Link
          href="/teams"
          className="flex items-center gap-1 text-[13px] text-blue-600 hover:text-blue-700"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {preview.map((team) => (
          <div
            key={team.teamId}
            className="min-w-[200px] max-w-[200px] flex-shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="font-semibold text-slate-900 text-sm">{team.teamName}</p>
            <p className="mt-0.5 text-xs text-slate-500 truncate">{getUniName(team.universityId)}</p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <QualifyingPathBadge path={team.qualifyingPath} regionLabel={team.regionLabel} />
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Track {team.trackAssignment}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              {team.assignedMentorId ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-[11px] text-slate-500">Matched</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                  <span className="text-[11px] text-slate-500">Unmatched</span>
                </>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {team.needsExpertiseTagIds.slice(0, 3).map((tagId) => (
                <span
                  key={tagId}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                >
                  {getTagName(tagId)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
