'use client'

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Person } from '@/lib/types'
import { useStore } from '@/lib/store'

interface Props {
  person: Person | null
  onClose: () => void
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const roleColors: Record<string, string> = {
  ADMIN: '#EF4444', ORGANIZER: '#F97316', MENTOR: '#3B82F6',
  JUDGE: '#8B5CF6', STUDENT: '#10B981', UNIVERSITY_POC: '#14B8A6',
}

function avatarBg(roles: string[]) {
  const primary = roles[0] ?? 'ADMIN'
  return roleColors[primary] ?? '#94A3B8'
}

export function PersonSlideOver({ person, onClose }: Props) {
  const { expertiseTags, universities, teams } = useStore()

  function tagName(tagId: string) {
    return expertiseTags.find((t) => t.tagId === tagId)?.name ?? tagId
  }
  function uniName(universityId?: string) {
    if (!universityId) return null
    return universities.find((u) => u.universityId === universityId)?.name ?? universityId
  }
  function teamName(teamId?: string) {
    if (!teamId) return teamId
    return teams.find((t) => t.teamId === teamId)?.teamName ?? teamId
  }

  return (
    <Sheet
      open={person !== null}
      onOpenChange={(open: boolean) => { if (!open) onClose() }}
    >
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] overflow-y-auto p-0">
        {person && (
          <>
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-5">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
                  style={{ backgroundColor: avatarBg(person.roles) }}
                >
                  {initials(person.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-[15px] font-semibold text-slate-900">
                      {person.name}
                    </SheetTitle>
                    {person.isDuplicate && (
                      <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
                        DUPLICATE
                      </span>
                    )}
                  </div>
                  <SheetDescription className="mt-0.5 text-[12px] text-slate-500">
                    {person.organization ?? person.email}
                  </SheetDescription>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {person.roles.map((r) => (
                      <RoleBadge key={r} role={r} size="sm" />
                    ))}
                  </div>
                </div>
                <StatusBadge status={person.status} />
              </div>
            </div>

            {/* Body */}
            <div className="space-y-5 p-5">
              {/* Contact */}
              <Section title="Contact">
                <Field label="Email"       value={person.email} />
                <Field label="Nationality" value={person.nationality} />
                <Field label="Country"     value={person.country} />
                {person.linkedIn && <Field label="LinkedIn" value={person.linkedIn} />}
                {uniName(person.universityId) && (
                  <Field label="University" value={uniName(person.universityId)!} />
                )}
              </Section>

              {/* Logistics */}
              {(person.needsVisa || person.dietaryRestrictions || person.flightDetails) && (
                <Section title="Logistics">
                  <Field label="Visa required" value={person.needsVisa ? 'Yes' : 'No'} />
                  {person.dietaryRestrictions && (
                    <Field label="Dietary" value={person.dietaryRestrictions} />
                  )}
                  {person.flightDetails && (
                    <Field label="Flight" value={person.flightDetails} />
                  )}
                </Section>
              )}

              {/* Expertise — mentors */}
              {person.roles.includes('MENTOR') && person.expertise.length > 0 && (
                <Section title="Expertise">
                  {person.geographicFocus && (
                    <Field label="Geographic focus" value={person.geographicFocus} />
                  )}
                  {person.industryVertical && (
                    <Field label="Vertical" value={person.industryVertical} />
                  )}
                  {person.yearsExperience != null && (
                    <Field label="Years exp." value={`${person.yearsExperience} years`} />
                  )}
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {person.expertise.map((e) => (
                      <span
                        key={e.tagId}
                        className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700"
                      >
                        {tagName(e.tagId)} · {e.level}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Conflicts — judges */}
              {person.roles.includes('JUDGE') && (
                <Section title="Judge Info">
                  <Field
                    label="Rubric acknowledged"
                    value={person.rubricAck ? `Yes — ${person.rubricAckAt?.slice(0, 10)}` : 'No'}
                  />
                  {person.conflictWithTeamIds.length > 0 && (
                    <div className="mt-1">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">
                        Conflicts (teams)
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {person.conflictWithTeamIds.map((tid) => (
                          <span
                            key={tid}
                            className="rounded bg-red-50 px-2 py-0.5 text-[11px] text-red-600"
                          >
                            {teamName(tid)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Section>
              )}

              {/* Cohort history */}
              {person.cohortHistory.length > 0 && (
                <Section title="Cohort History">
                  <ol className="ml-2 border-l border-slate-200 space-y-3">
                    {person.cohortHistory.map((entry, i) => (
                      <li key={i} className="relative pl-4">
                        <span className="absolute -left-[5px] top-[5px] h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-400" />
                        <p className="text-[12px] font-medium text-slate-700">
                          {entry.year} · {entry.role}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {entry.programId.replace('prog_', '').replace(/_/g, ' ')}
                          {entry.teamId ? ` · ${teamName(entry.teamId)}` : ''}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {/* Bio */}
              {person.bio && (
                <Section title="Bio">
                  <p className="text-[13px] text-slate-600 leading-relaxed">{person.bio}</p>
                </Section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[12px] text-slate-400 shrink-0">{label}</span>
      <span className="text-[12px] text-slate-700 text-right">{value}</span>
    </div>
  )
}
