'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search, ChevronUp, ChevronDown, AlertTriangle,
  Stamp, ChevronLeft, ChevronRight, GraduationCap, User, Scale,
} from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PersonProfilePanel } from '@/components/shared/PersonProfilePanel'
import { useStore } from '@/lib/store'
import type { Person, PersonStatus, Role } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const FLAG_MAP: Record<string, string> = {
  'United States': '🇺🇸', 'India': '🇮🇳', 'South Korea': '🇰🇷', 'Finland': '🇫🇮',
  'United Kingdom': '🇬🇧', 'Singapore': '🇸🇬', 'Switzerland': '🇨🇭', 'Israel': '🇮🇱',
  'Canada': '🇨🇦', 'Hong Kong': '🇭🇰', 'China': '🇨🇳', 'Germany': '🇩🇪',
  'Japan': '🇯🇵', 'France': '🇫🇷',
}
function flag(country: string) { return FLAG_MAP[country] ?? '🌍' }

const ROLE_BG: Record<string, string> = {
  ADMIN: 'bg-red-500', ORGANIZER: 'bg-orange-500', MENTOR: 'bg-blue-500',
  JUDGE: 'bg-purple-500', STUDENT: 'bg-green-500', UNIVERSITY_POC: 'bg-teal-500',
}
function avatarBg(roles: Role[]) { return ROLE_BG[roles[0]] ?? 'bg-slate-400' }
function initials(name: string) { return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) }

const ALL_ROLES: Role[] = ['ADMIN', 'ORGANIZER', 'MENTOR', 'JUDGE', 'STUDENT', 'UNIVERSITY_POC']
const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin', ORGANIZER: 'Organizer', MENTOR: 'Mentor',
  JUDGE: 'Judge', STUDENT: 'Student', UNIVERSITY_POC: 'University POC',
}

type SortKey = 'name' | 'status' | 'nationality'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<PersonStatus, number> = { confirmed: 0, invited: 1, pending: 2 }

// ── Active filter chips ───────────────────────────────────────────────────────

interface FilterChipProps { label: string; onRemove: () => void }
function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
      {label}
      <button onClick={onRemove} className="rounded-full hover:text-blue-900">✕</button>
    </span>
  )
}

// ── Invite dropdown ───────────────────────────────────────────────────────────

function InviteDropdown() {
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none">
        Invite Participant
        <ChevronDown size={14} className="text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[190px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px]">Invite as</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={false} onClick={() => router.push('/onboarding/student')}
          className="cursor-pointer gap-2">
          <User size={13} className="text-green-600" /> Student
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={false} onClick={() => router.push('/onboarding/mentor')}
          className="cursor-pointer gap-2">
          <GraduationCap size={13} className="text-blue-600" /> Mentor
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={false} onClick={() => router.push('/onboarding/judge')}
          className="cursor-pointer gap-2">
          <Scale size={13} className="text-purple-600" /> Judge
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Sortable column header ────────────────────────────────────────────────────

function SortHeader({ label, col, sortKey, sortDir, onSort }: {
  label: string; col: SortKey; sortKey: SortKey; sortDir: SortDir
  onSort: (col: SortKey) => void
}) {
  const active = sortKey === col
  return (
    <button
      onClick={() => onSort(col)}
      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
    >
      {label}
      {active ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-30" />}
    </button>
  )
}

// ── Main content (needs useSearchParams — wrapped in Suspense below) ──────────

function ParticipantsContent() {
  const searchParams = useSearchParams()
  const { persons, universities, programs } = useStore()

  // Filters
  const [search,          setSearch]          = useState('')
  const [selectedRoles,   setSelectedRoles]   = useState<Role[]>([])
  const [statusFilter,    setStatusFilter]    = useState<PersonStatus | 'all'>('all')
  const [uniFilter,       setUniFilter]       = useState('all')
  const [natFilter,       setNatFilter]       = useState('all')
  const [visaToggle,      setVisaToggle]      = useState(false)
  const [returningToggle, setReturningToggle] = useState(false)
  const [dupToggle,       setDupToggle]       = useState(false)

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Pagination
  const [page, setPage] = useState(0)

  // Selected person for profile panel
  const [selected, setSelected] = useState<Person | null>(null)

  // Pre-activate duplicates filter from URL
  useEffect(() => {
    if (searchParams.get('filter') === 'duplicates') setDupToggle(true)
  }, [searchParams])

  // Auto-highlight + open panel from URL
  const highlightId = searchParams.get('highlight')
  useEffect(() => {
    if (!highlightId) return
    const p = persons.find((x) => x.personId === highlightId)
    if (p) setSelected(p)
  }, [highlightId, persons])

  // Distinct nationality options
  const nationalities = useMemo(() => {
    const seen: Record<string, true> = {}
    return persons.map((p) => p.nationality).filter((n) => { if (seen[n]) return false; seen[n] = true; return true }).sort()
  }, [persons])

  // Filtered & sorted list
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = persons.filter((p) => {
      if (q) {
        const uni = universities.find((u) => u.universityId === p.universityId)
        const hay = `${p.name} ${p.email} ${p.organization ?? ''} ${uni?.name ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (selectedRoles.length > 0 && !selectedRoles.some((r) => p.roles.includes(r))) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (uniFilter !== 'all' && p.universityId !== uniFilter) return false
      if (natFilter !== 'all' && p.nationality !== natFilter) return false
      if (visaToggle && !p.needsVisa) return false
      if (returningToggle && p.cohortHistory.length <= 1) return false
      if (dupToggle && !p.isDuplicate) return false
      return true
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'status') cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      else if (sortKey === 'nationality') cmp = a.nationality.localeCompare(b.nationality)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [persons, universities, search, selectedRoles, statusFilter, uniFilter, natFilter, visaToggle, returningToggle, dupToggle, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleSort(col: SortKey) {
    if (sortKey === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(col); setSortDir('asc') }
    setPage(0)
  }

  function toggleRole(role: Role) {
    setSelectedRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role])
    setPage(0)
  }

  // Active filter chips
  const chips: { label: string; remove: () => void }[] = []
  if (search) chips.push({ label: `"${search}"`, remove: () => setSearch('') })
  selectedRoles.forEach((r) => chips.push({ label: ROLE_LABELS[r], remove: () => toggleRole(r) }))
  if (statusFilter !== 'all') chips.push({ label: statusFilter, remove: () => setStatusFilter('all') })
  if (uniFilter !== 'all') chips.push({ label: universities.find((u) => u.universityId === uniFilter)?.name ?? uniFilter, remove: () => setUniFilter('all') })
  if (natFilter !== 'all') chips.push({ label: natFilter, remove: () => setNatFilter('all') })
  if (visaToggle) chips.push({ label: 'Visa required', remove: () => setVisaToggle(false) })
  if (returningToggle) chips.push({ label: 'Returning', remove: () => setReturningToggle(false) })
  if (dupToggle) chips.push({ label: 'Duplicates only', remove: () => setDupToggle(false) })

  function programChip(p: Person) {
    const prog = programs.find((pr) => p.programIds.includes(pr.programId) && pr.type === 'Worlds')
    return prog ? prog.name.replace('GSSC ', '').replace(' 2026', '') : null
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Participants</h1>
          <p className="mt-1 text-sm text-slate-500">{persons.length} people across GSSC Worlds 2026</p>
        </div>
        <InviteDropdown />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Name, email, org, university…"
            className="h-8 w-64 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
          />
        </div>

        {/* Role multi-select */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-none">
            {selectedRoles.length === 0 ? 'All Roles' : `${selectedRoles.length} Role${selectedRoles.length > 1 ? 's' : ''}`}
            <ChevronDown size={13} className="text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px]">
            {ALL_ROLES.map((role) => (
              <DropdownMenuCheckboxItem
                key={role}
                checked={selectedRoles.includes(role)}
                onClick={() => toggleRole(role)}
                className="text-[13px] cursor-pointer"
              >
                {ROLE_LABELS[role]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status */}
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v as PersonStatus | 'all'); setPage(0) } }}>
          <SelectTrigger className="h-8 w-[135px] text-[13px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {[['all','All Status'],['confirmed','Confirmed'],['invited','Invited'],['pending','Pending']].map(([v,l]) => (
              <SelectItem key={v} value={v} className="text-[13px]">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* University */}
        <Select value={uniFilter} onValueChange={(v) => { if (v) { setUniFilter(v); setPage(0) } }}>
          <SelectTrigger className="h-8 w-[160px] text-[13px]">
            <SelectValue placeholder="University" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All Universities</SelectItem>
            {universities.map((u) => (
              <SelectItem key={u.universityId} value={u.universityId} className="text-[13px]">{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Nationality */}
        <Select value={natFilter} onValueChange={(v) => { if (v) { setNatFilter(v); setPage(0) } }}>
          <SelectTrigger className="h-8 w-[155px] text-[13px]">
            <SelectValue placeholder="Nationality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All Nationalities</SelectItem>
            {nationalities.map((n) => (
              <SelectItem key={n} value={n} className="text-[13px]">{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Toggles */}
        {[
          { label: 'Visa Only',  active: visaToggle,      toggle: () => { setVisaToggle((v) => !v); setPage(0) } },
          { label: 'Returning',  active: returningToggle, toggle: () => { setReturningToggle((v) => !v); setPage(0) } },
          { label: 'Duplicates', active: dupToggle,        toggle: () => { setDupToggle((v) => !v); setPage(0) } },
        ].map(({ label, active, toggle }) => (
          <button
            key={label}
            onClick={toggle}
            className={`h-8 rounded-lg border px-3 text-[12px] font-medium transition-colors ${
              active
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => <FilterChip key={c.label} label={c.label} onRemove={c.remove} />)}
          <button
            onClick={() => { setSearch(''); setSelectedRoles([]); setStatusFilter('all'); setUniFilter('all'); setNatFilter('all'); setVisaToggle(false); setReturningToggle(false); setDupToggle(false) }}
            className="text-[11px] text-slate-400 underline hover:text-slate-600"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Count row */}
        <div className="border-b border-slate-100 px-5 py-2.5">
          <p className="text-[12px] text-slate-400">
            Showing {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 border-b border-slate-100 bg-white">
              <tr>
                <th className="px-5 py-2.5">
                  <SortHeader label="Name" col="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Role(s)</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Affiliation</th>
                <th className="px-4 py-2.5">
                  <SortHeader label="Nationality" col="nationality" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Program</th>
                <th className="px-4 py-2.5">
                  <SortHeader label="Status" col="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Visa</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((person, i) => {
                const isReturning = person.cohortHistory.length > 1
                const isHighlighted = person.personId === highlightId
                return (
                  <tr
                    key={person.personId}
                    onClick={() => setSelected(person)}
                    className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/40 ${
                      isHighlighted ? 'bg-yellow-50' : i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Name */}
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarBg(person.roles)}`}>
                          {initials(person.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-[13px] font-medium text-slate-800">{person.name}</p>
                            {person.isDuplicate && (
                              <span title="Potential duplicate"><AlertTriangle size={13} className="shrink-0 text-yellow-500" /></span>
                            )}
                          </div>
                          {isReturning && (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] font-semibold text-blue-600">
                              Returning
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {person.roles.slice(0, 2).map((r) => <RoleBadge key={r} role={r} size="sm" />)}
                        {person.roles.length > 2 && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">+{person.roles.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* Affiliation */}
                    <td className="px-4 py-2.5">
                      <span className="block max-w-[140px] truncate text-[12px] text-slate-500">
                        {person.organization ?? universities.find((u) => u.universityId === person.universityId)?.name ?? '—'}
                      </span>
                    </td>

                    {/* Nationality */}
                    <td className="px-4 py-2.5">
                      <span className="whitespace-nowrap text-[12px] text-slate-600">
                        {flag(person.country)} {person.nationality}
                      </span>
                    </td>

                    {/* Program */}
                    <td className="px-4 py-2.5">
                      {programChip(person) && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                          {programChip(person)}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2.5"><StatusBadge status={person.status} /></td>

                    {/* Visa */}
                    <td className="px-4 py-2.5">
                      {person.needsVisa && (
                      <span title="Visa required"><Stamp size={15} className="text-red-400" /></span>
                    )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(person) }}
                        className="text-[12px] font-medium text-blue-600 hover:text-blue-700"
                      >
                        View
                      </button>
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
            {filtered.length} total
          </span>
          <div className="flex items-center gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 text-[12px] text-slate-500">{page + 1} / {Math.max(1, totalPages)}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Profile panel */}
      <PersonProfilePanel person={selected} onClose={() => setSelected(null)} width={440} />
    </div>
  )
}

// ── Page export with Suspense (required for useSearchParams) ──────────────────

export default function ParticipantsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1280px] pt-8 text-sm text-slate-400">Loading…</div>}>
      <ParticipantsContent />
    </Suspense>
  )
}
