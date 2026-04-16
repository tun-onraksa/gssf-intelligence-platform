'use client'

import { useEffect, useState } from 'react'
import { Mail, X, ExternalLink, Phone, Plane, Utensils, AlertTriangle, Pencil, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RoleBadge } from './RoleBadge'
import { StatusBadge } from './StatusBadge'
import { updateParticipant } from '@/lib/actions/records'
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

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {Icon && <Icon size={13} className="text-slate-400" />}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{children}</p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="py-1.5 border-b border-slate-50 last:border-0">
      <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
      <p className="text-[13px] text-slate-800">{value}</p>
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6">{children}</div>
}

function EF({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MasterAttendee {
  id: string
  email: string | null
  full_name: string | null
  last_name: string | null
  nickname: string | null
  prefix: string | null
  category: string | null
  title: string | null
  organization: string | null
  mentor_name: string | null
  team_name: string | null
  phone: string | null
  linkedin_url: string | null
  dietary_restrictions: string | null
  allergies: string | null
  details: string | null
  headshot_url: string | null
  sex: string | null
  departure_city: string | null
  departure_date_to: string | null
  departure_date_from: string | null
  destination_city: string | null
  other_requests: string | null
  ticket_status: string | null
  itinerary_url: string | null
  itinerary_file2_url: string | null
}

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
  needs_visa?: boolean | null
  status: string | null
  is_duplicate?: boolean | null
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

interface Props {
  participant: ParticipantShape | null
  masterAttendee?: MasterAttendee | null
  onClose: () => void
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function PersonProfilePanel({ participant, masterAttendee, onClose }: Props) {
  const router = useRouter()
  const profileRoles = participant?.profile_roles.map((r) => r.role) ?? []
  const roles = (profileRoles.length > 0
    ? profileRoles
    : [masterAttendee?.category].filter((r): r is string => !!r?.trim())
  ).map((r) => r.toUpperCase().replace(/\s+/g, '_'))
  const acked = (participant?.rubric_acknowledgments?.length ?? 0) > 0
  const ackedAt = participant?.rubric_acknowledgments?.[0]?.acknowledged_at
  const m = masterAttendee

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<ParticipantShape>>({})

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { if (editing) { cancelEdit() } else { onClose() } }
    }
    if (participant) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [participant, onClose, editing])

  // Reset edit state when participant changes
  useEffect(() => { setEditing(false); setDraft({}); setError(null) }, [participant?.id])

  if (!participant) return null

  function startEdit() { setDraft({ ...participant }); setEditing(true) }
  function cancelEdit() { setEditing(false); setDraft({}); setError(null) }
  function set<K extends keyof ParticipantShape>(field: K, value: ParticipantShape[K]) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  async function save() {
    setSaving(true); setError(null)
    try {
      await updateParticipant(participant!.id, {
        full_name:           draft.full_name           ?? undefined,
        email:               draft.email               ?? undefined,
        organization_name:   draft.organization_name   ?? undefined,
        job_title:           draft.job_title           ?? undefined,
        status:              draft.status              ?? undefined,
        nationality:         draft.nationality         ?? undefined,
        country_of_residence: draft.country_of_residence ?? undefined,
        needs_visa:          draft.needs_visa          ?? undefined,
        linkedin_url:        draft.linkedin_url        ?? undefined,
        bio:                 draft.bio                 ?? undefined,
      })
      setEditing(false); router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  const displayName = participant.full_name ?? participant.email
  const hasTravel = !!(m?.departure_city || m?.departure_date_to || m?.departure_date_from || m?.destination_city || m?.ticket_status || m?.other_requests)
  const hasDietary = !!(m?.dietary_restrictions || m?.allergies)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-[780px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* ── Header ── */}
        <div className={`shrink-0 border-b border-slate-100 bg-slate-50 px-6 py-5`}>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[18px] font-bold text-white ${avatarBg(roles)}`}>
              {initials(editing ? (draft.full_name ?? displayName) : displayName)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {editing
                  ? <input value={draft.full_name ?? ''} onChange={(e) => set('full_name', e.target.value)}
                      className="text-[18px] font-bold text-slate-900 border-b border-blue-400 focus:outline-none bg-transparent w-full max-w-xs" />
                  : <h2 className="text-[20px] font-bold text-slate-900">{displayName}</h2>
                }
                {!editing && m?.nickname && <span className="text-[14px] text-slate-400">&ldquo;{m.nickname}&rdquo;</span>}
                {!editing && participant.is_duplicate && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">DUPLICATE</span>
                )}
              </div>
              {editing ? (
                <div className="mt-1 flex gap-2">
                  <input value={draft.job_title ?? ''} onChange={(e) => set('job_title', e.target.value)}
                    placeholder="Job title"
                    className="text-[12px] text-slate-500 border-b border-slate-200 focus:outline-none bg-transparent w-36" />
                  <input value={draft.organization_name ?? ''} onChange={(e) => set('organization_name', e.target.value)}
                    placeholder="Organization"
                    className="text-[12px] text-slate-500 border-b border-slate-200 focus:outline-none bg-transparent w-40" />
                </div>
              ) : (m?.title || m?.organization || participant.job_title || participant.organization_name) ? (
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {m?.title ?? participant.job_title}{(m?.title ?? participant.job_title) && (m?.organization ?? participant.organization_name) ? ' · ' : ''}
                  {m?.organization ?? participant.organization_name}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {roles.map((r) => <RoleBadge key={r} role={r as Role} size="sm" />)}
                {editing
                  ? <select value={draft.status ?? ''} onChange={(e) => set('status', e.target.value)}
                      className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 focus:outline-none">
                      <option value="">— Status —</option>
                      <option value="pending">Pending</option>
                      <option value="invited">Invited</option>
                      <option value="confirmed">Confirmed</option>
                    </select>
                  : <StatusBadge status={(participant.status ?? 'pending') as 'pending' | 'invited' | 'confirmed'} />
                }
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
                {editing
                  ? <input value={draft.email ?? ''} onChange={(e) => set('email', e.target.value)}
                      className="flex items-center gap-1 border-b border-slate-200 focus:outline-none bg-transparent text-[12px]" />
                  : <span className="flex items-center gap-1"><Mail size={11} />{participant.email}</span>
                }
                {!editing && m?.phone && <span className="flex items-center gap-1"><Phone size={11} />{m.phone}</span>}
                {!editing && (m?.linkedin_url ?? participant.linkedin_url) && (
                  <a href={m?.linkedin_url ?? participant.linkedin_url ?? '#'} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline">
                    LinkedIn <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {!editing
                ? <button onClick={startEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200" title="Edit"><Pencil size={14} /></button>
                : <>
                    <button onClick={cancelEdit} className="rounded-lg px-2.5 py-1 text-[12px] text-slate-500 hover:bg-slate-200">Cancel</button>
                    <button onClick={save} disabled={saving}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                    </button>
                  </>
              }
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
          </div>
          {error && <p className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-[12px] text-red-600">{error}</p>}
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="overflow-y-auto">
          {editing ? (
            /* ── Edit form ── */
            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
              <EF label="LinkedIn URL" value={draft.linkedin_url ?? ''} onChange={(v) => set('linkedin_url', v)} />
              <EF label="Nationality" value={draft.nationality ?? ''} onChange={(v) => set('nationality', v)} />
              <EF label="Country of Residence" value={draft.country_of_residence ?? ''} onChange={(v) => set('country_of_residence', v)} />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Needs Visa</p>
                <select value={draft.needs_visa ? 'yes' : 'no'} onChange={(e) => set('needs_visa', e.target.value === 'yes')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Bio / Notes</p>
                <textarea value={draft.bio ?? ''} onChange={(e) => set('bio', e.target.value)} rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-2 divide-x divide-slate-100">

            {/* Left column */}
            <div className="space-y-6 p-6">

              {/* Duplicate warning */}
              {participant.is_duplicate && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-500" />
                  <p className="text-[12px] text-red-700 leading-snug">Possible duplicate record. Review before event.</p>
                </div>
              )}

              {/* Personal Info */}
              <div>
                <SectionLabel>Personal Info</SectionLabel>
                <Grid>
                  <Field label="Prefix" value={m?.prefix} />
                  <Field label="Category" value={m?.category} />
                  <Field label="Sex" value={m?.sex} />
                  <Field label="Nationality" value={participant.nationality} />
                  <Field label="Country of Residence" value={participant.country_of_residence} />
                  <Field label="Needs Visa" value={participant.needs_visa ? 'Yes' : 'No'} />
                </Grid>
              </div>

              {/* Team & Mentor */}
              {(m?.team_name || m?.mentor_name) && (
                <div>
                  <SectionLabel>Team</SectionLabel>
                  <Grid>
                    <Field label="Team" value={m?.team_name} />
                    <Field label="Mentor" value={m?.mentor_name} />
                  </Grid>
                </div>
              )}

              {/* Bio / Details */}
              {(participant.bio || m?.details) && (
                <div>
                  <SectionLabel>Notes / Bio</SectionLabel>
                  <p className="text-[13px] leading-relaxed text-slate-700">{m?.details ?? participant.bio}</p>
                </div>
              )}

              {/* Judge Info */}
              {roles.includes('JUDGE') && (
                <div>
                  <SectionLabel>Judge Info</SectionLabel>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">Rubric acknowledged</span>
                      {acked
                        ? <span className="text-[12px] font-medium text-green-600">✓ {ackedAt?.slice(0, 10)}</span>
                        : <span className="text-[12px] font-medium text-red-500">Not acknowledged</span>}
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

              {/* Cohort History */}
              {(participant.cohort_history?.length ?? 0) > 0 && (
                <div>
                  <SectionLabel>Cohort History</SectionLabel>
                  <ol className="ml-2 border-l-2 border-slate-200 space-y-2">
                    {[...(participant.cohort_history ?? [])].reverse().map((entry, i) => (
                      <li key={i} className="relative pl-4">
                        <span className="absolute -left-[7px] top-[4px] h-3 w-3 rounded-full border-2 border-white bg-blue-400" />
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-slate-800">{entry.year}</span>
                          <RoleBadge role={entry.role as Role} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-500">{entry.programs?.name ?? '—'}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6 p-6">

              {/* Travel & Logistics */}
              <div>
                <SectionLabel icon={Plane}>Travel & Logistics</SectionLabel>
                {hasTravel ? (
                  <Grid>
                    <Field label="Departure City" value={m?.departure_city} />
                    <Field label="Destination" value={m?.destination_city} />
                    <Field label="Departure to Korea" value={m?.departure_date_to} />
                    <Field label="Departure from Korea" value={m?.departure_date_from} />
                    <Field label="Ticket Status" value={m?.ticket_status} />
                    <Field label="Other Requests" value={m?.other_requests} />
                  </Grid>
                ) : (
                  <p className="text-[12px] text-slate-400">No travel info on record</p>
                )}
                {m?.itinerary_url && (
                  <a href={m.itinerary_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-[12px] text-blue-600 hover:underline">
                    Itinerary <ExternalLink size={10} />
                  </a>
                )}
                {m?.itinerary_file2_url && (
                  <a href={m.itinerary_file2_url} target="_blank" rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-[12px] text-blue-600 hover:underline">
                    Itinerary (File 2) <ExternalLink size={10} />
                  </a>
                )}
              </div>

              {/* Dietary */}
              <div>
                <SectionLabel icon={Utensils}>Dietary & Health</SectionLabel>
                {hasDietary ? (
                  <>
                    <Field label="Special Dietary" value={m?.dietary_restrictions ?? participant.bio} />
                    <Field label="Allergies" value={m?.allergies} />
                  </>
                ) : (
                  <p className="text-[12px] text-slate-400">No dietary requirements on record</p>
                )}
              </div>

              {/* Expertise — Mentors */}
              {roles.includes('MENTOR') && (participant.profile_expertise?.length ?? 0) > 0 && (
                <div>
                  <SectionLabel>Expertise</SectionLabel>
                  {participant.geographic_focus && <Field label="Geographic Focus" value={participant.geographic_focus} />}
                  {participant.years_experience && <Field label="Years Experience" value={participant.years_experience} />}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {participant.profile_expertise?.map((exp, i) =>
                      exp.expertise_tags ? (
                        <span key={exp.expertise_tags.id ?? i}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                          {exp.expertise_tags.name}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
