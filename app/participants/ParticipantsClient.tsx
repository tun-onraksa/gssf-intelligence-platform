'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { PersonProfilePanel, type MasterAttendee } from '@/components/shared/PersonProfilePanel'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Role } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParticipantsClientProps {
  participants: {
    id: string
    full_name: string | null
    email: string
    nationality: string | null
    country_of_residence: string | null
    bio: string | null
    linkedin_url: string | null
    organization_name: string | null
    job_title: string | null
    needs_visa: boolean | null
    status: string | null
    is_duplicate: boolean | null
    category: string | null
    geographic_focus: string | null
    years_experience: string | null
    created_at: string | null
    profile_roles: { role: string; program_id: string | null }[]
    cohort_history: {
      year: number
      role: string
      program_id: string | null
      team_id: string | null
      programs: { name: string } | null
    }[]
    profile_expertise: {
      level: string
      expertise_tags: { id: string; name: string; domain: string } | null
    }[]
    judge_conflicts: {
      team_id: string | null
      university_id: string | null
      reason: string | null
      teams: { name: string } | null
      universities: { name: string } | null
    }[]
    rubric_acknowledgments: { acknowledged_at: string | null }[]
    team_members: { teams: { id: string; name: string } | null }[]
    university_pocs: { universities: { id: string; name: string } | null }[]
  }[]
  universities: { id: string; name: string; country: string }[]
  masterAttendees: MasterAttendee[]
}

type Participant = ParticipantsClientProps['participants'][0]

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

type FilterTab = 'all' | 'students' | 'mentors' | 'judges' | 'organizers'

const TABS: { id: FilterTab; label: string; role: Role | null }[] = [
  { id: 'all',        label: 'All',        role: null },
  { id: 'students',   label: 'Students',   role: 'STUDENT' },
  { id: 'mentors',    label: 'Mentors',    role: 'MENTOR' },
  { id: 'judges',     label: 'Judges',     role: 'JUDGE' },
  { id: 'organizers', label: 'Organizers', role: 'ORGANIZER' },
]

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_BG: Record<string, string> = {
  ADMIN: 'bg-red-500', ORGANIZER: 'bg-orange-500', MENTOR: 'bg-blue-500',
  JUDGE: 'bg-purple-500', STUDENT: 'bg-green-500', UNIVERSITY_POC: 'bg-teal-500',
  'KOR._STUDENT': 'bg-sky-500', 'INT._STUDENT': 'bg-emerald-500',
  'ASSOCIATE-ORGANIZER': 'bg-amber-500', 'CO-FOUNDER': 'bg-violet-500',
}
function avatarClass(roles: string[]) {
  return AVATAR_BG[roles[0]] ?? 'bg-slate-400'
}

const FLAG_MAP: Record<string, string> = {
  // Country names
  'united states': '🇺🇸', 'usa': '🇺🇸', 'us': '🇺🇸', 'u.s.a': '🇺🇸', 'u.s.': '🇺🇸',
  'india': '🇮🇳', 'south korea': '🇰🇷', 'korea': '🇰🇷', 'republic of korea': '🇰🇷',
  'finland': '🇫🇮', 'united kingdom': '🇬🇧', 'uk': '🇬🇧', 'england': '🇬🇧', 'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'singapore': '🇸🇬', 'switzerland': '🇨🇭', 'israel': '🇮🇱',
  'canada': '🇨🇦', 'hong kong': '🇭🇰', 'china': '🇨🇳',
  'japan': '🇯🇵', 'taiwan': '🇹🇼', 'germany': '🇩🇪', 'france': '🇫🇷',
  'uae': '🇦🇪', 'united arab emirates': '🇦🇪',
  'australia': '🇦🇺', 'new zealand': '🇳🇿',
  'brazil': '🇧🇷', 'mexico': '🇲🇽', 'colombia': '🇨🇴', 'chile': '🇨🇱',
  'argentina': '🇦🇷', 'peru': '🇵🇪',
  'nigeria': '🇳🇬', 'ghana': '🇬🇭', 'kenya': '🇰🇪',
  'south africa': '🇿🇦', 'egypt': '🇪🇬',
  'indonesia': '🇮🇩', 'malaysia': '🇲🇾', 'thailand': '🇹🇭',
  'philippines': '🇵🇭', 'vietnam': '🇻🇳', 'pakistan': '🇵🇰',
  'bangladesh': '🇧🇩', 'sri lanka': '🇱🇰', 'nepal': '🇳🇵',
  'saudi arabia': '🇸🇦', 'turkey': '🇹🇷', 'iran': '🇮🇷',
  'jordan': '🇯🇴', 'lebanon': '🇱🇧',
  'spain': '🇪🇸', 'italy': '🇮🇹', 'netherlands': '🇳🇱',
  'sweden': '🇸🇪', 'norway': '🇳🇴', 'denmark': '🇩🇰',
  'poland': '🇵🇱', 'austria': '🇦🇹', 'belgium': '🇧🇪',
  'portugal': '🇵🇹', 'czech republic': '🇨🇿', 'russia': '🇷🇺',
  'ukraine': '🇺🇦', 'greece': '🇬🇷', 'hungary': '🇭🇺', 'romania': '🇷🇴',
  // Nationality adjectives
  'american': '🇺🇸', 'indian': '🇮🇳', 'korean': '🇰🇷', 'south korean': '🇰🇷',
  'finnish': '🇫🇮', 'british': '🇬🇧', 'english': '🇬🇧',
  'singaporean': '🇸🇬', 'swiss': '🇨🇭', 'israeli': '🇮🇱',
  'canadian': '🇨🇦', 'chinese': '🇨🇳', 'hongkonger': '🇭🇰', 'hong konger': '🇭🇰',
  'japanese': '🇯🇵', 'taiwanese': '🇹🇼', 'german': '🇩🇪', 'french': '🇫🇷',
  'emirati': '🇦🇪', 'australian': '🇦🇺', 'new zealander': '🇳🇿',
  'brazilian': '🇧🇷', 'mexican': '🇲🇽', 'colombian': '🇨🇴', 'chilean': '🇨🇱',
  'argentinian': '🇦🇷', 'argentine': '🇦🇷', 'peruvian': '🇵🇪',
  'nigerian': '🇳🇬', 'ghanaian': '🇬🇭', 'kenyan': '🇰🇪',
  'south african': '🇿🇦', 'egyptian': '🇪🇬',
  'indonesian': '🇮🇩', 'malaysian': '🇲🇾', 'thai': '🇹🇭',
  'filipino': '🇵🇭', 'philippine': '🇵🇭', 'vietnamese': '🇻🇳', 'pakistani': '🇵🇰',
  'bangladeshi': '🇧🇩', 'sri lankan': '🇱🇰', 'nepali': '🇳🇵',
  'saudi': '🇸🇦', 'saudi arabian': '🇸🇦', 'turkish': '🇹🇷', 'iranian': '🇮🇷',
  'jordanian': '🇯🇴', 'lebanese': '🇱🇧',
  'spanish': '🇪🇸', 'italian': '🇮🇹', 'dutch': '🇳🇱',
  'swedish': '🇸🇪', 'norwegian': '🇳🇴', 'danish': '🇩🇰',
  'polish': '🇵🇱', 'austrian': '🇦🇹', 'belgian': '🇧🇪',
  'portuguese': '🇵🇹', 'czech': '🇨🇿', 'russian': '🇷🇺',
  'ukrainian': '🇺🇦', 'greek': '🇬🇷', 'hungarian': '🇭🇺', 'romanian': '🇷🇴',
}
function flag(country: string) {
  return FLAG_MAP[country.trim().toLowerCase()] ?? '🌍'
}

// ── Main component ────────────────────────────────────────────────────────────

export function ParticipantsClient({ participants, universities, masterAttendees }: ParticipantsClientProps) {
  const [activeTab, setActiveTab]         = useState<FilterTab>('all')
  const [search, setSearch]               = useState('')
  const [nationalityFilter, setNationality] = useState('all')
  const [universityFilter, setUniversity]   = useState('all')
  const [page, setPage]                   = useState(0)
  const [selected, setSelected]           = useState<Participant | null>(null)

  // Derived filter options
  const nationalities = useMemo(
    () => Array.from(new Set(participants.map((p) => p.nationality).filter((x): x is string => x != null))).sort(),
    [participants]
  )

  const filtered = useMemo(() => {
    const tabRole = TABS.find((t) => t.id === activeTab)?.role ?? null

    return participants.filter((p) => {
      const pRoles = p.profile_roles.map((r) => r.role)
      const roles = pRoles.length > 0
        ? pRoles
        : [p.category].filter((r): r is string => !!r?.trim()).map((r) => r.toUpperCase().replace(/\s+/g, '_'))

      if (tabRole) {
        const matches = roles.includes(tabRole) ||
          // KOR._STUDENT and INT._STUDENT count as STUDENT
          (tabRole === 'STUDENT' && roles.some((r) => r.includes('STUDENT')))
        if (!matches) return false
      }

      if (search) {
        const s = search.toLowerCase()
        const matchesName  = (p.full_name ?? '').toLowerCase().includes(s)
        const matchesEmail = p.email.toLowerCase().includes(s)
        const matchesOrg   = p.organization_name?.toLowerCase().includes(s) ?? false
        if (!matchesName && !matchesEmail && !matchesOrg) return false
      }

      if (nationalityFilter !== 'all' && (p.nationality ?? '') !== nationalityFilter) return false

      if (universityFilter !== 'all') {
        const uni = universities.find((u) => u.id === universityFilter)
        if (uni) {
          const matchesOrg     = p.organization_name === uni.name
          const matchesMember  = p.team_members.some((m) => m.teams !== null)
          const matchesPoc     = p.university_pocs.some((poc) => poc.universities?.id === universityFilter)
          if (!matchesOrg && !matchesMember && !matchesPoc) return false
        }
      }

      return true
    })
  }, [participants, activeTab, search, nationalityFilter, universityFilter, universities])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleTabChange(tab: FilterTab) {
    setActiveTab(tab)
    setPage(0)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(0)
  }

  function clearFilters() {
    setSearch('')
    setNationality('all')
    setUniversity('all')
    setPage(0)
  }

  const isFiltered = search || nationalityFilter !== 'all' || universityFilter !== 'all'

  return (
    <div className="space-y-6 p-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Participants</h1>
        <p className="mt-0.5 text-sm text-slate-500">{participants.length} participants · GSSF Worlds 2026</p>
      </div>

      {/* Search + filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, org…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-[260px]"
          />
        </div>

        {/* Nationality filter — hidden until flag display is fixed */}
        {/* <select
          value={nationalityFilter}
          onChange={(e) => { setNationality(e.target.value); setPage(0) }}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Nationalities</option>
          {nationalities.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select> */}

        {/* University filter */}
        <select
          value={universityFilter}
          onChange={(e) => { setUniversity(e.target.value); setPage(0) }}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Universities</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {isFiltered && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-[12px] text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 border-b border-slate-100 bg-white">
              <tr>
                <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Name</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Role(s)</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Org / University</th>
                {/* <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nationality</th> */}
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((p, i) => {
                const profileRoles = p.profile_roles.map((r) => r.role)
              const roles = profileRoles.length > 0
                ? profileRoles
                : [p.category].filter((r): r is string => !!r?.trim()).map((r) => r.toUpperCase().replace(/\s+/g, '_'))
                const isReturning = p.cohort_history.length > 1
                const orgDisplay = p.organization_name
                  ?? p.team_members[0]?.teams?.name
                  ?? p.university_pocs[0]?.universities?.name
                  ?? '—'

                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/40 ${
                      i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Name */}
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${avatarClass(roles)}`}
                        >
                          {initials(p.full_name ?? p.email)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-medium text-slate-800 truncate">{p.full_name ?? p.email}</p>
                            {p.is_duplicate && (
                              <span className="shrink-0 rounded bg-red-100 px-1 py-0 text-[10px] font-bold text-red-700">DUP</span>
                            )}
                          </div>
                          {isReturning && (
                            <span className="inline-block rounded bg-blue-100 px-1.5 py-0 text-[10px] font-semibold text-blue-600">
                              Returning
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {roles.slice(0, 2).map((r) => (
                          <RoleBadge key={r} role={r as Role} size="sm" />
                        ))}
                        {roles.length > 2 && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                            +{roles.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Org/University */}
                    <td className="px-4 py-2.5">
                      <span className="text-[12px] text-slate-500 truncate block max-w-[140px]">
                        {orgDisplay}
                      </span>
                    </td>

                    {/* Nationality — hidden until flag display is fixed */}
                    {/* <td className="px-4 py-2.5">
                      <span className="text-[12px] text-slate-600 whitespace-nowrap">
                        {flag(p.nationality ?? '')} {(p.nationality ?? '').replace(/-/g, '‑')}
                      </span>
                    </td> */}

                    {/* Status */}
                    <td className="px-4 py-2.5">
                      <StatusBadge status={(p.status ?? 'pending') as 'pending' | 'invited' | 'confirmed'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <span className="text-[12px] text-slate-400">
            {filtered.length === 0
              ? 'No results'
              : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 text-[12px] text-slate-500">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Person profile modal */}
      <PersonProfilePanel
        participant={selected}
        masterAttendee={selected ? (masterAttendees.find((m) => m.email === selected.email) ?? null) : null}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
