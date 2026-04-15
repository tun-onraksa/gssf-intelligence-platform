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
import type { Role } from '@/lib/types'

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
  'Expert':       'bg-blue-100 text-blue-700',
  'Deep Expert':  'bg-violet-100 text-violet-700',
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

// ── Participant shape (Supabase) ───────────────────────────────────────────────
// Handles both the abbreviated shape (dashboard recentParticipants) and the
// full shape (participants page). Use optional chaining for fields only present
// in the full shape.

interface ParticipantShape {
  id: string
  full_name: string | null
  email: string
  nationality: string | null
  country_of_residence: string | null
  bio?: string | null
  linkedin_url?: string | null
  organization_name?: string | null
  job_title?: string | null
  needs_visa: boolean | null
  status: string | null
  is_duplicate: boolean | null
  geographic_focus?: string | null
  years_experience?: string | null
  profile_roles: { role: string; program_id: string | null }[]
  cohort_history?: {
    year: number
    role: string
    program_id: string | null
    team_id?: string | null
    programs?: { name: string } | null
  }[]
  profile_expertise?: {
    level: string
    expertise_tags?: { id: string; name: string; domain: string } | null
  }[]
  judge_conflicts?: {
    team_id?: string | null
    university_id?: string | null
    reason?: string | null
    teams?: { name: string } | null
    universities?: { name: string } | null
  }[]
  rubric_acknowledgments?: { acknowledged_at: string | null }[]
  team_members?: { teams: { id: string; name: string } | null }[]
  university_pocs?: { universities: { id: string; name: string } | null }[]
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props {
  participant: ParticipantShape | null
  onClose: () => void
  width?: number
}

export function PersonProfilePanel({ participant, onClose, width = 440 }: Props) {
  const [logisticsOpen, setLogisticsOpen] = useState(false)

  const roles = participant?.profile_roles.map((r) => r.role) ?? []
  const acked = (participant?.rubric_acknowledgments?.length ?? 0) > 0
  const ackedAt = participant?.rubric_acknowledgments?.[0]?.acknowledged_at

  const hasLogistics = participant?.needs_visa === true
  const isReturning  = (participant?.cohort_history?.length ?? 0) > 1

  return (
    <Sheet
      open={participant !== null}
      onOpenChange={(open: boolean) => { if (!open) onClose() }}
    >
      <SheetContent
        side="right"
        className="overflow-y-auto p-0"
        style={{ width, maxWidth: width }}
      >
        {participant && (
          <>
            {/* ── Hero ── */}
            <div className="border-b border-slate-100 bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-white ${avatarBg(roles)}`}
                >
                  {initials(participant.full_name ?? participant.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SheetTitle className="text-xl font-bold text-slate-900">
                      {participant.full_name ?? participant.email}
                    </SheetTitle>
                    {participant.is_duplicate === true && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                        DUPLICATE
                      </span>
                    )}
                    {isReturning && (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                        Returning
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {roles.map((r) => <RoleBadge key={r} role={r as Role} size="sm" />)}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={(participant.status ?? 'pending') as 'pending' | 'invited' | 'confirmed'} />
                  </div>
                  <SheetDescription className="mt-1.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                    <Mail size={12} className="shrink-0 text-slate-400" />
                    {participant.email}
                  </SheetDescription>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">

              {/* ── Duplicate Warning ── */}
              {participant.is_duplicate === true && (
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
                {participant.bio && (
                  <p className="mb-2 text-[13px] text-slate-600 leading-relaxed">{participant.bio}</p>
                )}
                {participant.organization_name && (
                  <FieldRow label="Organization" value={participant.organization_name} />
                )}
                {participant.job_title && (
                  <FieldRow label="Title" value={participant.job_title} />
                )}
                {participant.linkedin_url && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[12px] text-slate-400">LinkedIn</span>
                    <a
                      href={participant.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] text-blue-600 hover:underline"
                    >
                      Profile <ExternalLink size={10} />
                    </a>
                  </div>
                )}
                {participant.nationality && <FieldRow label="Nationality" value={participant.nationality} />}
                {participant.country_of_residence && (
                  <FieldRow label="Residence" value={participant.country_of_residence} />
                )}
              </div>

              {/* ── Cohort History Timeline ── */}
              <div>
                <SectionLabel>Cohort History</SectionLabel>
                {(participant.cohort_history?.length ?? 0) === 0 ? (
                  <p className="text-[12px] text-slate-400">First cohort</p>
                ) : (
                  <ol className="ml-2 border-l-2 border-slate-200 space-y-3">
                    {[...(participant.cohort_history ?? [])].reverse().map((entry, i) => (
                      <li key={i} className="relative pl-4">
                        <span className="absolute -left-[7px] top-[4px] h-3 w-3 rounded-full border-2 border-white bg-blue-400" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-semibold text-slate-800">{entry.year}</span>
                          <RoleBadge role={entry.role as Role} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {entry.programs?.name ?? (entry.program_id ? `Program ${entry.program_id.slice(0, 8)}` : '—')}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* ── Expertise Tags — MENTOR ── */}
              {roles.includes('MENTOR') && (participant.profile_expertise?.length ?? 0) > 0 && (
                <div>
                  <SectionLabel>Expertise</SectionLabel>
                  {participant.geographic_focus && (
                    <FieldRow label="Geographic focus" value={participant.geographic_focus} />
                  )}
                  {participant.years_experience && (
                    <FieldRow label="Experience" value={`${participant.years_experience} yrs`} />
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {participant.profile_expertise?.map((exp, i) =>
                      exp.expertise_tags ? (
                        <span
                          key={exp.expertise_tags.id ?? i}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${LEVEL_COLOR[exp.level] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {exp.expertise_tags.name}
                          <span className="opacity-60">· {exp.level}</span>
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* ── Judge Info ── */}
              {roles.includes('JUDGE') && (
                <div>
                  <SectionLabel>Judge Info</SectionLabel>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">Rubric acknowledged</span>
                      {acked ? (
                        <span className="text-[12px] font-medium text-green-600">
                          ✓ {ackedAt ? ackedAt.slice(0, 10) : ''}
                        </span>
                      ) : (
                        <span className="text-[12px] font-medium text-red-500">Not acknowledged</span>
                      )}
                    </div>
                    {(participant.judge_conflicts?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[11px] text-slate-400 mb-1">Conflicts</p>
                        <div className="flex flex-wrap gap-1">
                          {participant.judge_conflicts?.map((c, i) => (
                            <span key={i} className="rounded bg-red-50 px-2 py-0.5 text-[11px] text-red-600">
                              {c.teams?.name ?? c.universities?.name ?? '—'}
                            </span>
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
                    {logisticsOpen
                      ? <ChevronUp   size={14} className="text-slate-400 mb-2" />
                      : <ChevronDown size={14} className="text-slate-400 mb-2" />}
                  </button>
                  {logisticsOpen && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1">
                      <FieldRow
                        label="Visa required"
                        value={<span className="font-medium text-red-600">Yes</span>}
                      />
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
