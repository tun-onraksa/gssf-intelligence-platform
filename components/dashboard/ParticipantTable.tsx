'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PersonSlideOver } from './PersonSlideOver'
import type { Person, Role } from '@/lib/types'

const PAGE_SIZE = 10

type FilterTab = 'all' | 'mentors' | 'judges' | 'students' | 'organizers'

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'mentors',    label: 'Mentors' },
  { id: 'judges',     label: 'Judges' },
  { id: 'students',   label: 'Students' },
  { id: 'organizers', label: 'Organizers' },
]

const ROLE_FILTER: Record<FilterTab, Role | null> = {
  all:        null,
  mentors:    'MENTOR',
  judges:     'JUDGE',
  students:   'STUDENT',
  organizers: 'ORGANIZER',
}

const FLAG_MAP: Record<string, string> = {
  'United States': '🇺🇸', 'India': '🇮🇳', 'South Korea': '🇰🇷', 'Finland': '🇫🇮',
  'United Kingdom': '🇬🇧', 'Singapore': '🇸🇬', 'Switzerland': '🇨🇭', 'Israel': '🇮🇱',
  'Canada': '🇨🇦', 'Hong Kong': '🇭🇰', 'China': '🇨🇳', 'Germany': '🇩🇪',
  'France': '🇫🇷', 'Japan': '🇯🇵', 'Nigeria': '🇳🇬', 'Ghana': '🇬🇭',
  'Egypt': '🇪🇬', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽',
}

function flag(country: string) {
  return FLAG_MAP[country] ?? '🌍'
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_BG: Record<string, string> = {
  ADMIN: 'bg-red-500', ORGANIZER: 'bg-orange-500', MENTOR: 'bg-blue-500',
  JUDGE: 'bg-purple-500', STUDENT: 'bg-green-500', UNIVERSITY_POC: 'bg-teal-500',
}

function avatarClass(roles: Role[]) {
  return AVATAR_BG[roles[0]] ?? 'bg-slate-400'
}

export function ParticipantTable() {
  const { persons } = useStore()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Person | null>(null)

  const worldsPersons = persons.filter((p) => p.programIds.includes('prog_worlds_2026'))

  const roleFilter = ROLE_FILTER[activeTab]
  const filtered = roleFilter
    ? worldsPersons.filter((p) => p.roles.includes(roleFilter))
    : worldsPersons

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleTabChange(tab: FilterTab) {
    setActiveTab(tab)
    setPage(0)
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Table header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">Participants</h3>
        {/* Filter tabs */}
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 border-b border-slate-100 bg-white">
            <tr>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Name</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Role(s)</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Org / University</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nationality</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((person, i) => {
              const isReturning = person.cohortHistory.length > 1
              return (
                <tr
                  key={person.personId}
                  onClick={() => setSelected(person)}
                  className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/40 ${
                    i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                  }`}
                >
                  {/* Name */}
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${avatarClass(person.roles)}`}
                      >
                        {initials(person.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 truncate">{person.name}</p>
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
                      {person.roles.slice(0, 2).map((r) => (
                        <RoleBadge key={r} role={r} size="sm" />
                      ))}
                      {person.roles.length > 2 && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                          +{person.roles.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Org/University */}
                  <td className="px-4 py-2.5">
                    <span className="text-[12px] text-slate-500 truncate block max-w-[140px]">
                      {person.organization ?? '—'}
                    </span>
                  </td>

                  {/* Nationality */}
                  <td className="px-4 py-2.5">
                    <span className="text-[12px] text-slate-600 whitespace-nowrap">
                      {flag(person.country)} {person.nationality.replace(/-/g, '‑')}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-2.5">
                    <StatusBadge status={person.status} />
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
          {filtered.length === 0 ? 'No results' : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
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

      {/* Slide-over */}
      <PersonSlideOver person={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
