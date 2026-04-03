'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'
import {
  Sheet, SheetContent, SheetTitle,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { TeamCard } from '@/components/shared/TeamCard'
import { QualifyingPathBadge } from '@/components/shared/QualifyingPathBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useStore } from '@/lib/store'
import type { Team } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  'United States': '🇺🇸', 'India': '🇮🇳', 'South Korea': '🇰🇷', 'Finland': '🇫🇮',
  'United Kingdom': '🇬🇧', 'Singapore': '🇸🇬', 'Switzerland': '🇨🇭', 'Israel': '🇮🇱',
  'Canada': '🇨🇦', 'Hong Kong': '🇭🇰', 'China': '🇨🇳', 'Germany': '🇩🇪',
}
const HASH_COLORS = ['bg-blue-500','bg-violet-500','bg-green-500','bg-orange-500','bg-teal-500','bg-rose-400','bg-indigo-500','bg-amber-500']
function hashColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return HASH_COLORS[Math.abs(h) % HASH_COLORS.length]
}
function initials(name: string) { return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) }

const STAGE_COLOR: Record<string, string> = {
  'Pre-seed': 'bg-slate-100 text-slate-600',
  'Seed':     'bg-blue-50 text-blue-600',
  'Series A': 'bg-violet-50 text-violet-600',
}

// ── Team Detail Drawer ────────────────────────────────────────────────────────

function TeamDrawer({ team, onClose }: { team: Team | null; onClose: () => void }) {
  const router = useRouter()
  const { persons, universities, expertiseTags, programs, pitchSlots } = useStore()

  const university     = team ? universities.find((u) => u.universityId === team.universityId) : null
  const members        = team ? team.memberIds.map((id) => persons.find((p) => p.personId === id)).filter(Boolean) as typeof persons : []
  const tags           = team ? team.needsExpertiseTagIds.map((id) => expertiseTags.find((t) => t.tagId === id)).filter(Boolean) as typeof expertiseTags : []
  const assignedMentor = team?.assignedMentorId ? persons.find((p) => p.personId === team.assignedMentorId) : null
  const slot           = team ? pitchSlots.find((s) => s.teamId === team.teamId) : null
  const slotJudges     = slot ? slot.judgeIds.map((id) => persons.find((p) => p.personId === id)).filter(Boolean) as typeof persons : []
  const countryFlag    = FLAG_MAP[university?.country ?? ''] ?? '🌍'

  const sourceProgram = team ? programs.find(
    (p) => p.type === 'Regional' && p.advancesToId === 'prog_worlds_2026' &&
    team.regionLabel && p.name.toLowerCase().includes(team.regionLabel.replace('GSSC ', '').toLowerCase())
  ) : null
  const worldsProgram = programs.find((p) => p.programId === 'prog_worlds_2026')

  function mentorCountForTag(tagId: string) {
    return persons.filter((p) => p.roles.includes('MENTOR') && p.expertise.some((e) => e.tagId === tagId)).length
  }

  return (
    <Sheet open={team !== null} onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <SheetContent side="right" className="overflow-y-auto p-0" style={{ width: 480, maxWidth: 480 }}>
        {team && (
          <>
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-2xl font-bold text-slate-900">{team.teamName}</SheetTitle>
                <QualifyingPathBadge path={team.qualifyingPath} regionLabel={team.regionLabel} />
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Track {team.trackAssignment}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {countryFlag} {university?.name} · {university?.country}
              </p>
              <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLOR[team.stage]}`}>
                {team.stage}
              </span>
            </div>

            <div className="space-y-5 p-5">

              {/* Pitch Summary */}
              <section>
                <p className="mb-1.5 section-label">Pitch Summary</p>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[13px] italic text-slate-700 leading-relaxed">&ldquo;{team.pitchSummary}&rdquo;</p>
                </div>
              </section>

              {/* Qualifying Path */}
              <section>
                <p className="mb-2 section-label">Qualifying Path</p>
                {team.qualifyingPath === 'direct' ? (
                  <p className="text-[13px] text-slate-600">Qualified directly to GSSC Worlds 2026</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-700">
                      {sourceProgram?.name ?? team.regionLabel}
                    </div>
                    <ArrowRight size={14} className="shrink-0 text-slate-400" />
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700">
                      {worldsProgram?.name ?? 'GSSC Worlds 2026'}
                    </div>
                  </div>
                )}
              </section>

              {/* Team Roster */}
              <section>
                <p className="mb-2 section-label">Team Roster</p>
                <div className="space-y-1.5">
                  {members.map((m) => (
                    <div
                      key={m.personId}
                      onClick={() => router.push(`/participants?highlight=${m.personId}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${hashColor(m.name)}`}>
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-slate-800">{m.name}</p>
                        <p className="text-[11px] text-slate-400">{m.nationality}</p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Mentor */}
              <section>
                <p className="mb-2 section-label">Mentor</p>
                {assignedMentor ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">{assignedMentor.name}</p>
                        <p className="text-[12px] text-slate-500">{assignedMentor.organization}</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">Assigned</span>
                    </div>
                    {assignedMentor.expertise.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {assignedMentor.expertise.map((e) => (
                          <span key={e.tagId} className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600">
                            {expertiseTags.find((t) => t.tagId === e.tagId)?.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3">
                    <p className="text-[13px] text-slate-500">No mentor assigned yet</p>
                    <button
                      onClick={() => router.push(`/matching?teamId=${team.teamId}`)}
                      className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700"
                    >
                      Run Matching <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </section>

              {/* Needs Expertise */}
              <section>
                <p className="mb-2 section-label">Needs Expertise</p>
                <div className="space-y-1.5">
                  {tags.map((tag) => (
                    <div key={tag.tagId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-[13px] font-medium text-slate-700">{tag.name}</span>
                      <span className="text-[11px] text-slate-400">{mentorCountForTag(tag.tagId)} mentors</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Pitch Slot */}
              {slot && (
                <section>
                  <p className="mb-2 section-label">Pitch Slot</p>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="grid grid-cols-2 gap-y-1.5 text-[12px]">
                      {[['Day', `Day ${slot.day}`], ['Time', `${slot.startTime}–${slot.endTime}`], ['Room', slot.room], ['Track', `Track ${slot.track}`]].map(([k, v]) => (
                        <><span key={k + 'k'} className="text-slate-400">{k}</span><span key={k + 'v'} className="font-medium text-slate-700">{v}</span></>
                      ))}
                    </div>
                    {slotJudges.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {slotJudges.map((j) => (
                          <span key={j.personId} className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] text-purple-700">
                            {j.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type PathFilter   = 'all' | 'direct' | 'regional'
type TrackFilter  = 'all' | 'A' | 'B' | 'C'
type MentorFilter = 'all' | 'matched' | 'unmatched'
type StageFilter  = 'all' | 'Pre-seed' | 'Seed'

export default function TeamsPage() {
  const { teams, universities } = useStore()

  const [search,       setSearch]       = useState('')
  const [pathFilter,   setPathFilter]   = useState<PathFilter>('all')
  const [trackFilter,  setTrackFilter]  = useState<TrackFilter>('all')
  const [mentorFilter, setMentorFilter] = useState<MentorFilter>('all')
  const [stageFilter,  setStageFilter]  = useState<StageFilter>('all')
  const [selected,     setSelected]     = useState<Team | null>(null)

  const activeFilterCount = [
    pathFilter !== 'all', trackFilter !== 'all',
    mentorFilter !== 'all', stageFilter !== 'all', search !== '',
  ].filter(Boolean).length

  function clearAll() {
    setSearch(''); setPathFilter('all'); setTrackFilter('all')
    setMentorFilter('all'); setStageFilter('all')
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return teams.filter((t) => {
      const uni = universities.find((u) => u.universityId === t.universityId)
      if (q && !t.teamName.toLowerCase().includes(q) && !uni?.name.toLowerCase().includes(q)) return false
      if (pathFilter   !== 'all' && t.qualifyingPath   !== pathFilter)   return false
      if (trackFilter  !== 'all' && t.trackAssignment  !== trackFilter)  return false
      if (mentorFilter === 'matched'   && !t.assignedMentorId) return false
      if (mentorFilter === 'unmatched' &&  t.assignedMentorId) return false
      if (stageFilter  !== 'all' && t.stage !== stageFilter) return false
      return true
    })
  }, [teams, universities, search, pathFilter, trackFilter, mentorFilter, stageFilter])

  return (
    <div className="mx-auto max-w-[1280px] space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
          <p className="mt-1 text-sm text-slate-500">{teams.length} teams competing at GSSC Worlds 2026</p>
        </div>
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-400 opacity-60">
              + Create Team
            </TooltipTrigger>
            <TooltipContent side="bottom">Available in full build</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams or universities…"
            className="h-8 w-60 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
          {(['all', 'direct', 'regional'] as PathFilter[]).map((v) => (
            <button
              key={v}
              onClick={() => setPathFilter(v)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${pathFilter === v ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <Select value={trackFilter} onValueChange={(v) => v && setTrackFilter(v as TrackFilter)}>
          <SelectTrigger className="h-8 w-[130px] text-[13px]">
            <SelectValue placeholder="Track" />
          </SelectTrigger>
          <SelectContent>
            {[['all','All Tracks'],['A','Track A'],['B','Track B'],['C','Track C']].map(([v, l]) => (
              <SelectItem key={v} value={v} className="text-[13px]">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={mentorFilter} onValueChange={(v) => v && setMentorFilter(v as MentorFilter)}>
          <SelectTrigger className="h-8 w-[155px] text-[13px]">
            <SelectValue placeholder="Mentor status" />
          </SelectTrigger>
          <SelectContent>
            {[['all','All Mentor Status'],['matched','Matched'],['unmatched','Unmatched']].map(([v, l]) => (
              <SelectItem key={v} value={v} className="text-[13px]">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={(v) => v && setStageFilter(v as StageFilter)}>
          <SelectTrigger className="h-8 w-[130px] text-[13px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            {[['all','All Stages'],['Pre-seed','Pre-seed'],['Seed','Seed']].map(([v, l]) => (
              <SelectItem key={v} value={v} className="text-[13px]">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              {activeFilterCount} active
            </span>
            <button onClick={clearAll} className="text-[12px] text-slate-400 underline hover:text-slate-600">
              Clear all
            </button>
          </div>
        )}
      </div>

      <p className="text-[13px] text-slate-400">Showing {filtered.length} of {teams.length} teams</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <p className="text-sm text-slate-400">No teams match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard key={team.teamId} team={team} onClick={() => setSelected(team)} />
          ))}
        </div>
      )}

      <TeamDrawer team={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
