'use client'

import { useState } from 'react'
import { Search, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { QualifyingPathBadge } from '@/components/shared/QualifyingPathBadge'
import type { QualifyingPath } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamsClientProps {
  teams: {
    id: string
    name: string
    pitch_summary: string | null
    stage: string | null
    qualifying_path: string | null
    region_label: string | null
    track: string | null
    assigned_mentor_id: string | null
    universities: { id: string; name: string; country: string } | null
    team_members: {
      profile_id: string | null
      profiles: { id: string; full_name: string | null; nationality: string | null; status: string | null } | null
    }[]
    team_expertise_needs: {
      priority: number | null
      expertise_tags: { id: string; name: string; domain: string } | null
    }[]
    profiles: {
      id: string
      full_name: string | null
      organization_name: string | null
      // Supabase cannot infer nested relations via FK alias — cast at render
      profile_expertise: unknown
    } | null
  }[]
  pitchSlots: {
    id: string
    track: string
    day: number
    start_time: string
    end_time: string
    room: string | null
    team_id: string | null
    pitch_slot_judges: {
      profiles: { id: string; full_name: string | null; organization_name: string | null } | null
    }[]
  }[]
}

type Team = TeamsClientProps['teams'][0]

// ── Helpers ───────────────────────────────────────────────────────────────────

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
function countryFlag(country?: string) {
  return FLAG_MAP[country ?? ''] ?? '🌍'
}

// ── Team card ─────────────────────────────────────────────────────────────────

function TeamCard({ team, onClick }: { team: Team; onClick: () => void }) {
  const tags = team.team_expertise_needs
    .filter((n) => n.expertise_tags)
    .map((n) => n.expertise_tags!)

  const members = team.team_members
    .filter((m) => m.profiles)
    .map((m) => m.profiles!)

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Top chips */}
      <div className="flex items-center gap-1.5">
        {team.track && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            Track {team.track}
          </span>
        )}
        <QualifyingPathBadge
          path={(team.qualifying_path ?? 'direct') as QualifyingPath}
          regionLabel={team.region_label ?? undefined}
        />
        {team.assigned_mentor_id && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Matched
          </span>
        )}
      </div>

      {/* Team identity */}
      <div className="mt-3">
        <h3 className="text-xl font-bold text-slate-900">{team.name}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{team.universities?.name}</p>
        <p className="mt-0.5 text-[13px] text-slate-400">
          {countryFlag(team.universities?.country)} {team.universities?.country}
        </p>
      </div>

      {/* Pitch summary */}
      {team.pitch_summary && (
        <p className="mt-3 line-clamp-2 text-sm italic text-slate-600">
          &ldquo;{team.pitch_summary}&rdquo;
        </p>
      )}

      <div className="my-3 border-t border-slate-100" />

      {/* Expertise needs */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Needs Expertise
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
            >
              {tag.name}
            </span>
          ))}
          {tags.length === 0 && (
            <span className="text-[12px] text-slate-400">None specified</span>
          )}
        </div>
      </div>

      <div className="my-3 border-t border-slate-100" />

      {/* Footer: members + view link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {members.slice(0, 3).map((m, i) => (
            <div
              key={m.id}
              title={m.full_name ?? undefined}
              style={{ marginLeft: i === 0 ? 0 : -8 }}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${hashColor(m.full_name ?? m.id)}`}
            >
              {initials(m.full_name ?? m.id)}
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

// ── Team drawer ───────────────────────────────────────────────────────────────

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{title}</p>
      {children}
    </div>
  )
}

function DrawerField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="shrink-0 text-[12px] text-slate-400">{label}</span>
      <span className="text-right text-[12px] text-slate-700">{value}</span>
    </div>
  )
}

function TeamDrawer({
  team,
  pitchSlots,
  onClose,
}: {
  team: Team | null
  pitchSlots: TeamsClientProps['pitchSlots']
  onClose: () => void
}) {
  if (!team) return null

  const slot = pitchSlots.find((s) => s.team_id === team.id)
  const slotJudges = slot?.pitch_slot_judges.map((j) => j.profiles).filter(Boolean) ?? []
  const members = team.team_members.filter((m) => m.profiles).map((m) => m.profiles!)
  const tags = team.team_expertise_needs
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
    .filter((n) => n.expertise_tags)
    .map((n) => n.expertise_tags!)

  return (
    <Sheet open={team !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-[440px] overflow-y-auto p-0" style={{ maxWidth: 440 }}>
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[18px] font-bold text-white ${hashColor(team.name)}`}
            >
              {initials(team.name)}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-bold text-slate-900">{team.name}</SheetTitle>
              <SheetDescription className="mt-0.5 text-[13px] text-slate-500">
                {team.universities?.name} {team.universities?.country ? `· ${countryFlag(team.universities.country)} ${team.universities.country}` : ''}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {team.track && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    Track {team.track}
                  </span>
                )}
                <QualifyingPathBadge
                  path={(team.qualifying_path ?? 'direct') as QualifyingPath}
                  regionLabel={team.region_label ?? undefined}
                />
                {team.stage && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {team.stage}
                  </span>
                )}
                {team.assigned_mentor_id && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                    Mentor matched
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">

          {/* Pitch summary */}
          {team.pitch_summary && (
            <DrawerSection title="Pitch Summary">
              <p className="text-[13px] text-slate-600 italic leading-relaxed">
                &ldquo;{team.pitch_summary}&rdquo;
              </p>
            </DrawerSection>
          )}

          {/* Qualifying path chain */}
          <DrawerSection title="Qualifying Path">
            {(team.qualifying_path ?? 'direct') === 'direct' ? (
              <p className="text-[13px] text-slate-700">Qualified directly to GSSF Worlds 2026</p>
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-slate-700">
                <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">
                  {team.region_label ?? 'Regional'}
                </span>
                <ArrowRight size={14} className="text-slate-400" />
                <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                  GSSF Worlds 2026
                </span>
              </div>
            )}
          </DrawerSection>

          {/* Team members */}
          <DrawerSection title={`Team Members (${members.length})`}>
            {members.length === 0 ? (
              <p className="text-[12px] text-slate-400">No members added</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${hashColor(m.full_name ?? m.id)}`}
                      >
                        {initials(m.full_name ?? m.id)}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-slate-800">{m.full_name ?? m.id}</p>
                        {m.nationality && <p className="text-[11px] text-slate-400">{m.nationality}</p>}
                      </div>
                    </div>
                    <StatusBadge status={(m.status ?? 'pending') as 'pending' | 'invited' | 'confirmed'} />
                  </div>
                ))}
              </div>
            )}
          </DrawerSection>

          {/* Assigned mentor */}
          <DrawerSection title="Mentor">
            {team.profiles ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${hashColor(team.profiles.full_name ?? team.profiles.id)}`}
                  >
                    {initials(team.profiles.full_name ?? team.profiles.id)}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">{team.profiles.full_name ?? team.profiles.id}</p>
                    {team.profiles.organization_name && (
                      <p className="text-[11px] text-slate-500">{team.profiles.organization_name}</p>
                    )}
                  </div>
                </div>
                {Array.isArray(team.profiles.profile_expertise) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(team.profiles.profile_expertise as { level: string; expertise_tags: { name: string } | null }[])
                        .slice(0, 3)
                        .map((exp, i) =>
                          exp.expertise_tags ? (
                            <span
                              key={i}
                              className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] text-blue-700"
                            >
                              {exp.expertise_tags.name}
                            </span>
                          ) : null
                        )}
                    </div>
                  )}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 p-3">
                <p className="text-[12px] text-slate-400">No mentor assigned</p>
                <Link
                  href={`/matching?teamId=${team.id}`}
                  className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700"
                >
                  Run Matching <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </DrawerSection>

          {/* Expertise needs */}
          <DrawerSection title="Expertise Needs">
            {tags.length === 0 ? (
              <p className="text-[12px] text-slate-400">None specified</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                  >
                    {tag.name}
                    <span className="ml-1 text-[10px] text-blue-400">· {tag.domain}</span>
                  </span>
                ))}
              </div>
            )}
          </DrawerSection>

          {/* Pitch slot */}
          <DrawerSection title="Pitch Slot">
            {slot ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1">
                <DrawerField label="Track"  value={`Track ${slot.track}`} />
                <DrawerField label="Day"    value={`Day ${slot.day}`} />
                <DrawerField label="Time"   value={`${slot.start_time} – ${slot.end_time}`} />
                {slot.room && <DrawerField label="Room" value={slot.room} />}
                {slotJudges.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-slate-400 mb-1">Judges</p>
                    <div className="space-y-1">
                      {slotJudges.map((j) => j && (
                        <div key={j.id} className="flex items-center gap-1.5">
                          <RoleBadge role="JUDGE" size="sm" />
                          <span className="text-[12px] text-slate-700">{j.full_name ?? j.id}</span>
                          {j.organization_name && (
                            <span className="text-[11px] text-slate-400">· {j.organization_name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-slate-400">No slot assigned</p>
            )}
          </DrawerSection>

          {/* Run matching */}
          {team.assigned_mentor_id && (
            <Link
              href={`/matching?teamId=${team.id}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 py-2.5 text-[13px] font-medium text-blue-700 hover:bg-blue-100"
            >
              Run Matching <ArrowRight size={14} />
            </Link>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TeamsClient({ teams, pitchSlots }: TeamsClientProps) {
  const [search, setSearch] = useState('')
  const [trackFilter, setTrackFilter] = useState('all')
  const [pathFilter, setPathFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [matchFilter, setMatchFilter] = useState('all')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  const tracks = Array.from(new Set(teams.map((t) => t.track).filter((x): x is string => x != null)))
  const stages = Array.from(new Set(teams.map((t) => t.stage).filter((x): x is string => x != null)))

  const filtered = teams.filter((team) => {
    if (search) {
      const s = search.toLowerCase()
      const matchesName = team.name.toLowerCase().includes(s)
      const matchesUni  = team.universities?.name.toLowerCase().includes(s) ?? false
      if (!matchesName && !matchesUni) return false
    }
    if (trackFilter !== 'all' && team.track !== trackFilter) return false
    if (pathFilter  !== 'all' && team.qualifying_path !== pathFilter) return false
    if (stageFilter !== 'all' && team.stage !== stageFilter) return false
    if (matchFilter === 'matched'   && !team.assigned_mentor_id) return false
    if (matchFilter === 'unmatched' &&  team.assigned_mentor_id) return false
    return true
  })

  function clearFilters() {
    setSearch('')
    setTrackFilter('all')
    setPathFilter('all')
    setStageFilter('all')
    setMatchFilter('all')
  }

  const isFiltered = search || trackFilter !== 'all' || pathFilter !== 'all' ||
                     stageFilter !== 'all' || matchFilter !== 'all'

  return (
    <div className="space-y-6 p-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
        <p className="mt-0.5 text-sm text-slate-500">{teams.length} teams · GSSF Worlds 2026</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams or universities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-[260px]"
          />
        </div>

        {/* Track filter */}
        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Tracks</option>
          {tracks.map((t) => (
            <option key={t} value={t}>Track {t}</option>
          ))}
        </select>

        {/* Qualifying path filter */}
        <select
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Paths</option>
          <option value="direct">Direct</option>
          <option value="regional">Regional</option>
        </select>

        {/* Stage filter */}
        {stages.length > 0 && (
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {/* Match status filter */}
        <select
          value={matchFilter}
          onChange={(e) => setMatchFilter(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Match Status</option>
          <option value="matched">Matched</option>
          <option value="unmatched">Unmatched</option>
        </select>

        {isFiltered && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600"
          >
            <X size={12} /> Clear
          </button>
        )}

        <span className="ml-auto text-[12px] text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Team grid */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 py-16">
          <p className="text-sm text-slate-400">No teams match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => setSelectedTeam(team)}
            />
          ))}
        </div>
      )}

      {/* Team drawer */}
      <TeamDrawer
        team={selectedTeam}
        pitchSlots={pitchSlots}
        onClose={() => setSelectedTeam(null)}
      />
    </div>
  )
}
