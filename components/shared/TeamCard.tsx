'use client'

import { ArrowRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { QualifyingPathBadge } from './QualifyingPathBadge'
import type { Team } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

const HASH_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-green-500', 'bg-orange-500',
  'bg-teal-500', 'bg-rose-400', 'bg-indigo-500', 'bg-amber-500',
]
function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return HASH_COLORS[Math.abs(h) % HASH_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const FLAG_MAP: Record<string, string> = {
  'United States': '🇺🇸', 'India': '🇮🇳', 'South Korea': '🇰🇷', 'Finland': '🇫🇮',
  'United Kingdom': '🇬🇧', 'Singapore': '🇸🇬', 'Switzerland': '🇨🇭', 'Israel': '🇮🇱',
  'Canada': '🇨🇦', 'Hong Kong': '🇭🇰', 'China': '🇨🇳', 'Germany': '🇩🇪',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  team: Team
  onClick: () => void
}

export function TeamCard({ team, onClick }: Props) {
  const { persons, universities, expertiseTags } = useStore()

  const university = universities.find((u) => u.universityId === team.universityId)
  const members = team.memberIds.map((id) => persons.find((p) => p.personId === id)).filter(Boolean) as typeof persons
  const tags = team.needsExpertiseTagIds.map((id) => expertiseTags.find((t) => t.tagId === id)).filter(Boolean) as typeof expertiseTags
  const countryFlag = FLAG_MAP[university?.country ?? ''] ?? '🌍'

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Top chips row */}
      <div className="flex items-center gap-1.5">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          Track {team.trackAssignment}
        </span>
        <QualifyingPathBadge path={team.qualifyingPath} regionLabel={team.regionLabel} />
        <div className="ml-auto flex items-center gap-1.5">
          {team.assignedMentorId ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] font-medium text-green-700">Matched</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <span className="text-[11px] font-medium text-yellow-700">Unmatched</span>
            </>
          )}
        </div>
      </div>

      {/* Team identity */}
      <div className="mt-3">
        <h3 className="text-xl font-bold text-slate-900">{team.teamName}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{university?.name}</p>
        <p className="mt-0.5 text-[13px] text-slate-400">
          {countryFlag} {university?.country}
        </p>
      </div>

      {/* Pitch summary */}
      <p className="mt-3 line-clamp-2 text-sm italic text-slate-600">
        &ldquo;{team.pitchSummary}&rdquo;
      </p>

      {/* Divider */}
      <div className="my-3 border-t border-slate-100" />

      {/* Needs expertise */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Needs Expertise
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.tagId}
              className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-slate-100" />

      {/* Footer row: members + view link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {members.slice(0, 3).map((m, i) => (
            <div
              key={m.personId}
              title={m.name}
              style={{ marginLeft: i === 0 ? 0 : -8 }}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${hashColor(m.name)}`}
            >
              {initials(m.name)}
            </div>
          ))}
          {members.length > 3 && (
            <div
              style={{ marginLeft: -8 }}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold text-slate-600"
            >
              +{members.length - 3}
            </div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className="flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-700"
        >
          View Team <ArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}
