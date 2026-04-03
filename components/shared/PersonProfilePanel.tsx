'use client'

import { useState } from 'react'
import { Mail, ChevronDown, ChevronUp, AlertTriangle, ExternalLink } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { RoleBadge } from './RoleBadge'
import { StatusBadge } from './StatusBadge'
import type { Person } from '@/lib/types'
import { useStore } from '@/lib/store'

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const ROLE_BG: Record<string, string> = {
  ADMIN: 'bg-red-500', ORGANIZER: 'bg-orange-500', MENTOR: 'bg-blue-500',
  JUDGE: 'bg-purple-500', STUDENT: 'bg-green-500', UNIVERSITY_POC: 'bg-teal-500',
}
function avatarBg(roles: string[]) {
  return ROLE_BG[roles[0]] ?? 'bg-slate-400'
}

const LEVEL_COLOR: Record<string, string> = {
  'Practitioner': 'bg-slate-100 text-slate-600',
  'Expert': 'bg-blue-100 text-blue-700',
  'Deep Expert': 'bg-violet-100 text-violet-700',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  )
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="shrink-0 text-[12px] text-slate-400">{label}</span>
      <span className="text-right text-[12px] text-slate-700">{value}</span>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props {
  person: Person | null
  onClose: () => void
  width?: number
}

export function PersonProfilePanel({ person, onClose, width = 440 }: Props) {
  const { expertiseTags, universities, teams, programs } = useStore()
  const [logisticsOpen, setLogisticsOpen] = useState(false)

  function tagName(tagId: string) {
    return expertiseTags.find((t) => t.tagId === tagId)?.name ?? tagId
  }
function uniName(universityId?: string) {
    return universities.find((u) => u.universityId === universityId)?.name ?? null
  }
  function teamName(teamId?: string) {
    return teams.find((t) => t.teamId === teamId)?.teamName ?? teamId
  }
  function programName(programId: string) {
    return programs.find((p) => p.programId === programId)?.name ?? programId.replace('prog_', '').replace(/_/g, ' ')
  }
  function conflictTeamName(teamId: string) {
    return teams.find((t) => t.teamId === teamId)?.teamName ?? teamId
  }

  const hasLogistics = person && (person.needsVisa || person.dietaryRestrictions || person.flightDetails || person.passportNumber)

  return (
    <Sheet
      open={person !== null}
      onOpenChange={(open: boolean) => { if (!open) onClose() }}
    >
      <SheetContent
        side="right"
        className="overflow-y-auto p-0"
        style={{ width, maxWidth: width }}
      >
        {person && (
          <>
            {/* ── Hero ── */}
            <div className="border-b border-slate-100 bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-white ${avatarBg(person.roles)}`}
                >
                  {initials(person.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SheetTitle className="text-xl font-bold text-slate-900">
                      {person.name}
                    </SheetTitle>
                    {person.isDuplicate && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                        DUPLICATE
                      </span>
                    )}
                    {person.cohortHistory.length > 1 && (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                        Returning
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {person.roles.map((r) => <RoleBadge key={r} role={r} size="sm" />)}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={person.status} />
                  </div>
                  <SheetDescription className="mt-1.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                    <Mail size={12} className="shrink-0 text-slate-400" />
                    {person.email}
                  </SheetDescription>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">

              {/* ── Duplicate Warning ── */}
              {person.isDuplicate && (
                <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-[12px] text-red-700 leading-snug">
                    This record may be a duplicate. Another record exists for this person under a different email. Review before Worlds 2026 goes live.
                  </p>
                </div>
              )}

              {/* ── Bio & Affiliation ── */}
              <div>
                <SectionLabel>Bio & Affiliation</SectionLabel>
                {person.bio && (
                  <p className="mb-2 text-[13px] text-slate-600 leading-relaxed">{person.bio}</p>
                )}
                {(person.organization || uniName(person.universityId)) && (
                  <FieldRow
                    label={person.universityId ? 'University' : 'Organization'}
                    value={person.organization ?? uniName(person.universityId) ?? '—'}
                  />
                )}
                {person.linkedIn && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[12px] text-slate-400">LinkedIn</span>
                    <a
                      href={person.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] text-blue-600 hover:underline"
                    >
                      Profile <ExternalLink size={10} />
                    </a>
                  </div>
                )}
                <FieldRow label="Nationality" value={person.nationality} />
                <FieldRow label="Residence" value={person.country} />
              </div>

              {/* ── Cohort History Timeline ── */}
              <div>
                <SectionLabel>Cohort History</SectionLabel>
                {person.cohortHistory.length === 0 ? (
                  <p className="text-[12px] text-slate-400">First cohort</p>
                ) : (
                  <ol className="ml-2 border-l-2 border-slate-200 space-y-3">
                    {[...person.cohortHistory].reverse().map((entry, i) => (
                      <li key={i} className="relative pl-4">
                        <span className="absolute -left-[7px] top-[4px] h-3 w-3 rounded-full border-2 border-white bg-blue-400" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-semibold text-slate-800">{entry.year}</span>
                          <RoleBadge role={entry.role} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {programName(entry.programId)}
                          {entry.teamId ? ` · ${teamName(entry.teamId)}` : ''}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* ── Expertise Tags — MENTOR ── */}
              {person.roles.includes('MENTOR') && person.expertise.length > 0 && (
                <div>
                  <SectionLabel>Expertise</SectionLabel>
                  {person.geographicFocus && (
                    <FieldRow label="Geographic focus" value={person.geographicFocus} />
                  )}
                  {person.industryVertical && (
                    <FieldRow label="Vertical" value={person.industryVertical} />
                  )}
                  {person.yearsExperience != null && (
                    <FieldRow label="Experience" value={`${person.yearsExperience} yrs`} />
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {person.expertise.map((e) => (
                      <span
                        key={e.tagId}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${LEVEL_COLOR[e.level] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {tagName(e.tagId)}
                        <span className="opacity-60">· {e.level}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Conflict Declarations — JUDGE ── */}
              {person.roles.includes('JUDGE') && (
                <div>
                  <SectionLabel>Judge Info</SectionLabel>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">Rubric acknowledged</span>
                      {person.rubricAck ? (
                        <span className="text-[12px] font-medium text-green-600">
                          ✓ {person.rubricAckAt?.slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-[12px] font-medium text-red-500">Not acknowledged</span>
                      )}
                    </div>
                    {person.conflictWithTeamIds.length > 0 && (
                      <div>
                        <p className="text-[11px] text-slate-400 mb-1">Conflicted teams</p>
                        <div className="flex flex-wrap gap-1">
                          {person.conflictWithTeamIds.map((tid) => (
                            <span key={tid} className="rounded bg-red-50 px-2 py-0.5 text-[11px] text-red-600">
                              {conflictTeamName(tid)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {person.conflictWithUniversityIds.length > 0 && (
                      <div>
                        <p className="text-[11px] text-slate-400 mb-1">Conflicted universities</p>
                        <div className="flex flex-wrap gap-1">
                          {person.conflictWithUniversityIds.map((uid) => (
                            <span key={uid} className="rounded bg-red-50 px-2 py-0.5 text-[11px] text-red-600">{uid}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Logistics ── */}
              {hasLogistics && (
                <div>
                  <button
                    onClick={() => setLogisticsOpen((o) => !o)}
                    className="flex w-full items-center justify-between"
                  >
                    <SectionLabel>Logistics</SectionLabel>
                    {logisticsOpen ? <ChevronUp size={14} className="text-slate-400 mb-2" /> : <ChevronDown size={14} className="text-slate-400 mb-2" />}
                  </button>
                  {logisticsOpen && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1">
                      <FieldRow
                        label="Visa required"
                        value={
                          person.needsVisa ? (
                            <span className="font-medium text-red-600">Yes</span>
                          ) : 'No'
                        }
                      />
                      <FieldRow
                        label="Passport"
                        value={person.passportNumber ? 'On file' : <span className="text-slate-400">Missing</span>}
                      />
                      {person.dietaryRestrictions && (
                        <FieldRow label="Dietary" value={person.dietaryRestrictions} />
                      )}
                      {person.flightDetails && (
                        <FieldRow label="Flight" value={person.flightDetails} />
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
