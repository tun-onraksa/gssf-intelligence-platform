'use client'

import { useState } from 'react'
import {
  Users, Trophy, UserCheck, FileText,
  CheckCircle2, AlertTriangle, XCircle, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { SimulateInviteButton } from '@/components/dashboard/SimulateInviteButton'
import { InviteModal } from '@/components/shared/InviteModal'
import { PersonProfilePanel } from '@/components/shared/PersonProfilePanel'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { QualifyingPathBadge } from '@/components/shared/QualifyingPathBadge'
import type { Role, QualifyingPath } from '@/lib/types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface DashboardClientProps {
  stats: {
    totalParticipants: number
    totalTeams: number
    confirmedCount: number
    matchedTeams: number
    visaCount: number
  }
  duplicates: { id: string; full_name: string | null; email: string }[]
  recentParticipants: {
    id: string
    full_name: string | null
    email: string
    nationality: string | null
    country_of_residence: string | null
    organization_name: string | null
    needs_visa: boolean | null
    status: string | null
    is_duplicate: boolean | null
    profile_roles: { role: string; program_id: string | null }[]
    cohort_history: { year: number; role: string; program_id: string | null }[]
  }[]
  previewTeams: {
    id: string
    name: string
    pitch_summary: string | null
    stage: string | null
    qualifying_path: string | null
    region_label: string | null
    track: string | null
    universities: { id: string; name: string; country: string } | null
    team_expertise_needs: {
      expertise_tags: { id: string; name: string; domain: string } | null
    }[]
  }[]
  readiness: {
    rubricAcksCount: number
    totalJudges: number
    matchedTeams: number
    totalTeams: number
    schedulePublished: boolean
    visaLettersGenerated: number
    visaRequired: number
    hasDuplicates: boolean
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_BG: Record<string, string> = {
  ADMIN: 'bg-red-500', ORGANIZER: 'bg-orange-500', MENTOR: 'bg-blue-500',
  JUDGE: 'bg-purple-500', STUDENT: 'bg-green-500', UNIVERSITY_POC: 'bg-teal-500',
}
function avatarClass(roles: string[]) {
  return AVATAR_BG[roles[0]] ?? 'bg-slate-400'
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

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, subtext, icon: Icon, accentColor, iconColor }: {
  label: string; value: number | string; subtext: string
  icon: React.ElementType; accentColor: string; iconColor: string
}) {
  return (
    <div
      className="group relative flex flex-1 flex-col gap-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <Icon size={20} style={{ color: iconColor }} className="mt-0.5 shrink-0" />
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{subtext}</p>
    </div>
  )
}

type CheckStatus = 'ok' | 'warn' | 'fail'

function CheckRow({ label, status, detail }: { label: string; status: CheckStatus; detail: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2.5">
        {status === 'ok'   && <CheckCircle2 size={15} className="text-green-500 shrink-0" />}
        {status === 'warn' && <AlertTriangle size={15} className="text-yellow-500 shrink-0" />}
        {status === 'fail' && <XCircle       size={15} className="text-red-400 shrink-0" />}
        <span className="text-[13px] text-slate-700">{label}</span>
      </div>
      <span className="text-[11px] text-slate-400 ml-4 shrink-0">{detail}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardClient({
  stats, duplicates, recentParticipants, previewTeams, readiness,
}: DashboardClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<typeof recentParticipants[0] | null>(null)

  const readinessItems: { label: string; status: CheckStatus; detail: string }[] = [
    { label: 'Program published',       status: 'ok',   detail: 'Live' },
    { label: 'All 16 teams confirmed',  status: 'ok',   detail: '16 / 16' },
    { label: 'Student onboarding open', status: 'ok',   detail: 'Active' },
    {
      label: 'Judge rubric acknowledgment',
      status: readiness.rubricAcksCount === readiness.totalJudges ? 'ok' : 'warn',
      detail: `${readiness.rubricAcksCount} of ${readiness.totalJudges} complete`,
    },
    {
      label: 'Pitch schedule published',
      status: readiness.schedulePublished ? 'ok' : 'fail',
      detail: readiness.schedulePublished ? 'Published' : 'Not published',
    },
    {
      label: 'Visa letters generated',
      status: readiness.visaLettersGenerated >= readiness.visaRequired ? 'ok' : 'fail',
      detail: readiness.visaLettersGenerated === 0
        ? 'None generated'
        : `${readiness.visaLettersGenerated} / ${readiness.visaRequired}`,
    },
    {
      label: 'Duplicate records resolved',
      status: readiness.hasDuplicates ? 'warn' : 'ok',
      detail: readiness.hasDuplicates ? '1 flagged' : 'Clean',
    },
  ]
  const okCount = readinessItems.filter((i) => i.status === 'ok').length

  return (
    <div className="space-y-6 p-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GSSC Worlds 2026</h1>
          <p className="mt-0.5 text-sm text-slate-500">Program dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <SimulateInviteButton />
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Invite
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="flex gap-4">
        <StatCard
          label="Total Participants"
          value={stats.totalParticipants}
          subtext="Across 14 universities"
          icon={Users}
          accentColor="#3B82F6"
          iconColor="#3B82F6"
        />
        <StatCard
          label="Teams"
          value={stats.totalTeams}
          subtext="Direct + Regional"
          icon={Trophy}
          accentColor="#7C3AED"
          iconColor="#7C3AED"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmedCount}
          subtext={`of ${stats.totalParticipants} invited`}
          icon={UserCheck}
          accentColor="#10B981"
          iconColor="#10B981"
        />
        <StatCard
          label="Visa Required"
          value={stats.visaCount}
          subtext={`${stats.visaCount} letters pending`}
          icon={FileText}
          accentColor="#EF4444"
          iconColor="#EF4444"
        />
      </div>

      {/* ── Duplicate banner ── */}
      {duplicates.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-500" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Duplicate record detected: {duplicates[0].full_name ?? duplicates[0].email}
            </p>
            <p className="mt-0.5 text-[12px] text-yellow-700">
              {duplicates.length} flagged record{duplicates.length > 1 ? 's' : ''} may need review before Worlds 2026 goes live.
            </p>
          </div>
        </div>
      )}

      {/* ── Main content: table + right column ── */}
      <div className="grid grid-cols-[1fr_320px] gap-6">

        {/* Participant table preview */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Participants</h3>
            <Link
              href="/participants"
              className="flex items-center gap-1 text-[13px] text-blue-600 hover:text-blue-700"
            >
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 border-b border-slate-100 bg-white">
                <tr>
                  <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Name</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Role</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Org</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nationality</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentParticipants.map((p, i) => {
                  const role = p.profile_roles[0]?.role ?? ''
                  const roles = p.profile_roles.map((r) => r.role)
                  const isReturning = p.cohort_history.length > 1
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPerson(p)}
                      className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/40 ${
                        i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                      }`}
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${avatarClass(roles)}`}>
                            {initials(p.full_name ?? p.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-slate-800 truncate">{p.full_name ?? p.email}</p>
                            {isReturning && (
                              <span className="inline-block rounded bg-blue-100 px-1.5 py-0 text-[10px] font-semibold text-blue-600">
                                Returning
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {role && <RoleBadge role={role as Role} size="sm" />}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] text-slate-500 truncate block max-w-[120px]">
                          {p.organization_name ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] text-slate-600 whitespace-nowrap">
                          {flag(p.nationality ?? '')} {(p.nationality ?? '').replace(/-/g, '‑')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={(p.status ?? 'pending') as 'pending' | 'invited' | 'confirmed'} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <ActivityFeed />

          {/* Readiness checklist */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900">Worlds 2026 Readiness</h3>
              </div>
              <span className="text-[11px] text-slate-400">{okCount} / {readinessItems.length} complete</span>
            </div>
            <div className="mt-3">
              {readinessItems.map((item) => (
                <CheckRow key={item.label} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Team grid preview ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Teams at a Glance</h2>
          <Link href="/teams" className="flex items-center gap-1 text-[13px] text-blue-600 hover:text-blue-700">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {previewTeams.map((team) => (
            <div
              key={team.id}
              className="min-w-[200px] max-w-[200px] flex-shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="font-semibold text-slate-900 text-sm">{team.name}</p>
              <p className="mt-0.5 text-xs text-slate-500 truncate">{team.universities?.name ?? '—'}</p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <QualifyingPathBadge
                  path={(team.qualifying_path ?? 'direct') as QualifyingPath}
                  regionLabel={team.region_label ?? undefined}
                />
                {team.track && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    Track {team.track}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {team.team_expertise_needs.slice(0, 3).map((need, i) =>
                  need.expertise_tags ? (
                    <span
                      key={need.expertise_tags.id ?? i}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                    >
                      {need.expertise_tags.name}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Person profile panel ── */}
      <PersonProfilePanel
        participant={selectedPerson}
        onClose={() => setSelectedPerson(null)}
      />

      {/* ── Invite modal ── */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}
