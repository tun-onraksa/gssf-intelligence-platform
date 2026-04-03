'use client'

import { useState, useMemo } from 'react'
import {
  Sheet, SheetContent, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store'
import type { University, Team, Person } from '@/lib/types'
import { Search, Star, ArrowRight, ChevronRight } from 'lucide-react'

// ── Country helpers ───────────────────────────────────────────────────────────

const FLAG: Record<string, string> = {
  'United States': '🇺🇸', 'India': '🇮🇳', 'South Korea': '🇰🇷', 'Finland': '🇫🇮',
  'United Kingdom': '🇬🇧', 'Singapore': '🇸🇬', 'Switzerland': '🇨🇭', 'Israel': '🇮🇱',
  'Canada': '🇨🇦', 'Hong Kong': '🇭🇰', 'China': '🇨🇳',
}

function getRegion(country: string): string {
  if (['United States', 'Canada'].includes(country)) return 'North America'
  if (['United Kingdom', 'Finland', 'Switzerland', 'Germany', 'France'].includes(country)) return 'Europe'
  if (['India', 'South Korea', 'Singapore', 'China', 'Hong Kong', 'Israel', 'Japan', 'Taiwan'].includes(country)) return 'Asia'
  if (['UAE', 'Saudi Arabia', 'Turkey'].includes(country)) return 'Middle East'
  return 'Other'
}

const isMultiYear = (u: University) => u.cohortHistory.length >= 3

// ── Historical data for multi-year partners ───────────────────────────────────

const HISTORY: Record<string, Record<number, { team: string; result: string }>> = {
  uni_usc:     { 2024: { team: 'Nexora', result: '2nd Place, Track A' }, 2025: { team: 'Volta',  result: '1st Place, Track B'  } },
  uni_iitdelhi:{ 2024: { team: 'Spira',  result: 'Finalist'           }, 2025: { team: 'Kratos', result: '3rd Place, Track C'  } },
  uni_aalto:   { 2024: { team: 'Vela',   result: '3rd Place, Track A' }, 2025: { team: 'Phos',   result: 'Finalist'            } },
  uni_kaist:   { 2024: { team: 'Solis',  result: '2nd Place, Track C' }, 2025: { team: 'Noma',   result: '1st Place, Track A'  } },
  uni_oxford:  { 2024: { team: 'Crest',  result: 'Finalist'           }, 2025: { team: 'Lune',   result: '2nd Place, Track B'  } },
}

// ── QualifyingPathBadge ───────────────────────────────────────────────────────

function QualifyingPathBadge({ path }: { path: string }) {
  return path === 'regional' ? (
    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Regional</span>
  ) : (
    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Direct</span>
  )
}

// ── University Drawer ─────────────────────────────────────────────────────────

function UniversityDrawer({
  university,
  teams,
  persons,
  onClose,
}: {
  university: University | null
  teams: Team[]
  persons: Person[]
  onClose: () => void
}) {
  if (!university) return null

  const uniTeams = teams.filter((t) => t.universityId === university.universityId)
  const pocs = university.pocIds
    .map((id) => persons.find((p) => p.personId === id))
    .filter((p): p is Person => !!p)
  const multi = isMultiYear(university)
  const sortedYears = [...university.cohortHistory].sort((a, b) => b - a)
  const regionalTeams = uniTeams.filter((t) => t.qualifyingPath === 'regional')

  function initials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Sheet open={!!university} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] overflow-y-auto p-0">
        {/* Header */}
        <div className={`border-b p-5 ${multi ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
          <SheetTitle className="text-[18px] font-bold text-slate-900 flex items-center gap-2">
            {multi && <Star size={15} className="text-amber-500 fill-amber-400" />}
            {university.name}
          </SheetTitle>
          <SheetDescription className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
            {FLAG[university.country] ?? '🌍'} {university.country} · {getRegion(university.country)}
          </SheetDescription>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${university.activeStatus ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {university.activeStatus ? 'Active' : 'Inactive'}
            </span>
            {multi && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Star size={9} className="fill-amber-500 text-amber-500" /> Multi-year Partner
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6 p-5">
          {/* Cohort History Timeline */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cohort History</p>
            <ol className="ml-2 space-y-4 border-l border-slate-200">
              {sortedYears.map((year) => {
                const isCurrent = year === 2026
                const hist = HISTORY[university.universityId]?.[year]
                const currentTeams = year === 2026 ? uniTeams : null
                const poc = pocs[0]
                return (
                  <li key={year} className="relative pl-5">
                    <span className={`absolute -left-[7px] top-[4px] h-3.5 w-3.5 rounded-full border-2 border-white ${isCurrent ? 'bg-blue-500' : 'bg-slate-400'}`} />
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[13px] font-bold ${isCurrent ? 'text-blue-700' : 'text-slate-700'}`}>{year}</span>
                      {isCurrent && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-600">Current</span>}
                    </div>
                    <p className="text-[12px] font-medium text-slate-700">GSSC Worlds {year}</p>
                    {currentTeams && currentTeams.length > 0 && (
                      <p className="text-[12px] text-slate-500">
                        Teams: {currentTeams.map((t) => `${t.teamName} (${t.qualifyingPath === 'regional' ? `Regional via ${t.regionLabel}` : 'Direct qualifier'})`).join(', ')}
                      </p>
                    )}
                    {hist && (
                      <p className="text-[12px] text-slate-500">Team: {hist.team} · {hist.result}</p>
                    )}
                    {poc && (
                      <p className="text-[11px] text-slate-400">POC: {poc.name} · {poc.email}</p>
                    )}
                    {isCurrent && <p className="text-[11px] text-slate-400">Result: TBD</p>}
                    {!isCurrent && hist && <p className="text-[11px] text-slate-400">Result: {hist.result}</p>}
                  </li>
                )
              })}
            </ol>
          </div>

          {/* Qualifying Path Diagram */}
          {regionalTeams.length > 0 && (
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Qualifying Path</p>
              {regionalTeams.map((t) => (
                <div key={t.teamId} className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
                  <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700">
                    {university.name}
                  </span>
                  <ArrowRight size={12} className="text-slate-400 shrink-0" />
                  <span className="rounded border border-violet-200 bg-violet-50 px-2 py-1 font-medium text-violet-700">
                    {t.regionLabel ?? 'Regional Program'}
                  </span>
                  <ArrowRight size={12} className="text-slate-400 shrink-0" />
                  <span className="rounded border border-blue-300 bg-blue-50 px-2 py-1 font-medium text-blue-700">
                    GSSC Worlds 2026
                  </span>
                  <span className="text-slate-400">({t.teamName})</span>
                </div>
              ))}
            </div>
          )}

          {/* POC Section */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Points of Contact</p>
            {pocs.length > 0 ? (
              <div className="space-y-2">
                {pocs.map((poc) => (
                  <div key={poc.personId} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500 text-[12px] font-bold text-white">
                      {initials(poc.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800">{poc.name}</p>
                      <p className="text-[11px] text-slate-400">{poc.email}</p>
                      {poc.organization && <p className="text-[11px] text-slate-400">{poc.organization}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3">
                <span className="text-[12px] text-slate-500">No POC assigned</span>
                <button disabled className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-400 cursor-not-allowed opacity-60">
                  Assign POC
                </button>
              </div>
            )}
          </div>

          {/* Teams Section */}
          {uniTeams.length > 0 && (
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Teams at Worlds 2026</p>
              <div className="space-y-2">
                {uniTeams.map((team) => {
                  const memberCount = team.memberIds.length
                  const mentor = team.assignedMentorId
                    ? persons.find((p) => p.personId === team.assignedMentorId)
                    : null
                  return (
                    <div key={team.teamId} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-800">{team.teamName}</span>
                        <QualifyingPathBadge path={team.qualifyingPath} />
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{team.stage}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {memberCount} member{memberCount !== 1 ? 's' : ''} ·{' '}
                        {mentor ? `Mentor: ${mentor.name}` : 'Unmatched'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Page() {
  const { universities, teams, persons } = useStore()

  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('All')
  const [multiYearOnly, setMultiYearOnly] = useState(false)
  const [hasPocOnly, setHasPocOnly] = useState(false)
  const [selected, setSelected] = useState<University | null>(null)

  // Stats
  const countryCount = new Set(universities.map((u) => u.country)).size
  const multiYearCount = universities.filter(isMultiYear).length

  // Filter
  const filtered = useMemo(() => {
    return universities
      .filter((u) => {
        if (search) {
          const q = search.toLowerCase()
          if (!u.name.toLowerCase().includes(q) && !u.country.toLowerCase().includes(q)) return false
        }
        if (region !== 'All' && getRegion(u.country) !== region) return false
        if (multiYearOnly && !isMultiYear(u)) return false
        if (hasPocOnly && u.pocIds.length === 0) return false
        return true
      })
      .sort((a, b) => {
        if (b.cohortHistory.length !== a.cohortHistory.length) return b.cohortHistory.length - a.cohortHistory.length
        return a.name.localeCompare(b.name)
      })
  }, [universities, search, region, multiYearOnly, hasPocOnly])

  function getUniversityTeams(uid: string) {
    return teams.filter((t) => t.universityId === uid && t.programId === 'prog_worlds_2026')
  }

  function getPoc(university: University): Person | null {
    if (university.pocIds.length === 0) return null
    return persons.find((p) => p.personId === university.pocIds[0]) ?? null
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Universities</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">
            {universities.length} partner universities across GSSC Worlds 2026
          </p>
        </div>
        <button
          disabled
          title="Available in full build"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-400 cursor-not-allowed opacity-60"
        >
          + Add University
        </button>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-600">
        <span className="flex items-center gap-1.5"><span>🏛</span><strong>{universities.length}</strong> Universities</span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1.5"><span>🌍</span><strong>{countryCount}</strong> Countries</span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1.5"><span>⭐</span><strong>{multiYearCount}</strong> Multi-year Partners</span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        {/* Region */}
        <Select value={region} onValueChange={(v) => v && setRegion(v)}>
          <SelectTrigger className="h-8 w-[150px] text-[13px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            {['All', 'North America', 'Europe', 'Asia', 'Middle East'].map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Multi-year toggle */}
        <button
          onClick={() => setMultiYearOnly((v) => !v)}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors ${
            multiYearOnly ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Star size={12} className={multiYearOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} />
          Multi-year only
        </button>
        {/* Has POC toggle */}
        <button
          onClick={() => setHasPocOnly((v) => !v)}
          className={`h-8 rounded-lg border px-3 text-[12px] font-medium transition-colors ${
            hasPocOnly ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Has POC
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
              {['University', 'Region', 'Cohort History', 'Teams 2026', 'Qualifying Path', 'POC', 'Status'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((uni, i) => {
              const multi = isMultiYear(uni)
              const uniTeams = getUniversityTeams(uni.universityId)
              const poc = getPoc(uni)
              const paths = Array.from(new Set(uniTeams.map((t) => t.qualifyingPath)))
              return (
                <tr
                  key={uni.universityId}
                  onClick={() => setSelected(uni)}
                  className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                    i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                  } ${multi ? 'border-l-[3px] border-l-amber-400' : ''}`}
                >
                  {/* University name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {multi && <Star size={11} className="shrink-0 fill-amber-400 text-amber-400" />}
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">{uni.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {FLAG[uni.country] ?? '🌍'} {uni.country}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Region */}
                  <td className="px-4 py-3 text-[12px] text-slate-500">{getRegion(uni.country)}</td>
                  {/* Cohort history */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {uni.cohortHistory.map((yr) => (
                        <span key={yr} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          yr === 2026 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>{yr}</span>
                      ))}
                    </div>
                  </td>
                  {/* Teams count */}
                  <td className="px-4 py-3">
                    {uniTeams.length > 0 ? (
                      <span className="text-[13px] font-semibold text-slate-800">{uniTeams.length}</span>
                    ) : (
                      <span className="text-[12px] text-slate-300">—</span>
                    )}
                  </td>
                  {/* Qualifying path */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {paths.length > 0
                        ? paths.map((p) => <QualifyingPathBadge key={p} path={p} />)
                        : <span className="text-[12px] text-slate-300">—</span>
                      }
                    </div>
                  </td>
                  {/* POC */}
                  <td className="px-4 py-3">
                    {poc ? (
                      <div>
                        <p className="text-[12px] font-medium text-slate-700">{poc.name}</p>
                        <p className="text-[11px] text-slate-400">{poc.email}</p>
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-300">—</span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        uni.activeStatus ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {uni.activeStatus ? 'Active' : 'Inactive'}
                      </span>
                      <ChevronRight size={13} className="text-slate-300" />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <UniversityDrawer
        university={selected}
        teams={teams}
        persons={persons}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
