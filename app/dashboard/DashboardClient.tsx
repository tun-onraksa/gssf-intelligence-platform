'use client'

import { useState, useMemo } from 'react'
import {
  Users, Trophy, UserCheck, FileText,
  CheckCircle2, AlertTriangle, XCircle, ArrowRight,
  Search, X, Mail, Phone, Building2, Handshake, Ticket, UserCircle,
} from 'lucide-react'
import Link from 'next/link'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { InviteModal } from '@/components/shared/InviteModal'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Role } from '@/lib/types'
import { useEffect } from 'react'

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
  recentActivity: {
    id: string
    full_name: string | null
    email: string
    created_at: string | null
    status: string | null
    profile_roles: { role: string }[]
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
  participants: {
    id: string
    full_name: string | null
    email: string
    category: string | null
    organization_name: string | null
    status: string | null
    needs_visa: boolean | null
    profile_roles: { role: string; program_id: string | null }[]
    cohort_history: { year: number; role: string }[]
  }[]
  universities: {
    id: string
    name: string
    country: string | null
    poc_name: string | null
    poc_email: string | null
    poc_title: string | null
    poc_phone: string | null
    team_count: number | null
    status: string | null
  }[]
  sponsors: {
    id: string
    name: string
    sponsorship: string | null
    status: string | null
    poc_name: string | null
    poc_email: string | null
    poc_title: string | null
    poc_phone: string | null
  }[]
  passes: {
    id: string
    full_name: string
    email: string | null
    category: string | null
    organization: string | null
    title: string | null
    status: string | null
    phone: string | null
    dietary_restrictions: string | null
    allergies: string | null
    details: string | null
    poc_name: string | null
  }[]
}

// ── Unified person type ───────────────────────────────────────────────────────

interface UnifiedPerson {
  key: string
  name: string
  email: string | null
  participant: DashboardClientProps['participants'][0] | null
  universityPocs: { university: DashboardClientProps['universities'][0] }[]
  sponsorPocs: { sponsor: DashboardClientProps['sponsors'][0] }[]
  pass: DashboardClientProps['passes'][0] | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500', 'bg-sky-500', 'bg-teal-500', 'bg-orange-500',
  'bg-pink-500', 'bg-indigo-500',
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function roleFromParticipant(p: DashboardClientProps['participants'][0]) {
  const profileRoles = p.profile_roles.map((r) => r.role)
  return profileRoles.length > 0
    ? profileRoles
    : [p.category].filter((r): r is string => !!r?.trim()).map((r) => r.toUpperCase().replace(/\s+/g, '_'))
}

// ── Source tags ───────────────────────────────────────────────────────────────

function SourceTag({ label, icon: Icon, color }: { label: string; icon: React.ElementType; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${color}`}>
      <Icon size={9} />
      {label}
    </span>
  )
}

// ── Unified person modal ──────────────────────────────────────────────────────

function UnifiedPersonModal({ person, onClose }: { person: UnifiedPerson; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const roles = person.participant ? roleFromParticipant(person.participant) : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white ${avatarColor(person.name)}`}>
              {initials(person.name)}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">{person.name}</h2>
              {person.email && <p className="text-[12px] text-slate-400">{person.email}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── Participant card ── */}
          {person.participant && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCircle size={14} className="text-blue-500" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Participant</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Role(s)</p>
                  <div className="flex flex-wrap gap-1">
                    {roles.length > 0
                      ? roles.map((r) => <RoleBadge key={r} role={r as Role} size="sm" />)
                      : <span className="text-[12px] text-slate-400">—</span>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Status</p>
                  <StatusBadge status={(person.participant.status ?? 'pending') as 'pending' | 'invited' | 'confirmed'} />
                </div>
                {person.participant.organization_name && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Organization</p>
                    <p className="text-[12px] text-slate-700">{person.participant.organization_name}</p>
                  </div>
                )}
                {person.participant.needs_visa && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Visa</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                      Required
                    </span>
                  </div>
                )}
                {person.participant.cohort_history.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Cohort History</p>
                    <div className="flex flex-wrap gap-1">
                      {person.participant.cohort_history.map((c, i) => (
                        <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{c.year}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── University POC cards ── */}
          {person.universityPocs.length > 0 && (
            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={14} className="text-teal-500" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-600">
                  University POC · {person.universityPocs.length} {person.universityPocs.length === 1 ? 'university' : 'universities'}
                </p>
              </div>
              <div className="space-y-3">
                {person.universityPocs.map(({ university }) => (
                  <div key={university.id} className="rounded-lg bg-white border border-teal-100 px-3 py-2.5">
                    <p className="text-[13px] font-medium text-slate-800">{university.name}</p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {university.country && <p className="text-[11px] text-slate-400">{university.country}</p>}
                      {university.poc_title && <p className="text-[11px] text-slate-500">{university.poc_title}</p>}
                      {university.team_count != null && (
                        <p className="text-[11px] text-slate-400">{university.team_count} team{university.team_count !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                    {university.poc_phone && (
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                        <Phone size={10} /> {university.poc_phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sponsor POC cards ── */}
          {person.sponsorPocs.length > 0 && (
            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Handshake size={14} className="text-orange-500" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">
                  Sponsor Contact · {person.sponsorPocs.length} {person.sponsorPocs.length === 1 ? 'sponsor' : 'sponsors'}
                </p>
              </div>
              <div className="space-y-3">
                {person.sponsorPocs.map(({ sponsor }) => (
                  <div key={sponsor.id} className="rounded-lg bg-white border border-orange-100 px-3 py-2.5">
                    <p className="text-[13px] font-medium text-slate-800">{sponsor.name}</p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {sponsor.sponsorship && <p className="text-[11px] text-slate-500">{sponsor.sponsorship}</p>}
                      {sponsor.poc_title && <p className="text-[11px] text-slate-400">{sponsor.poc_title}</p>}
                      {sponsor.status && <p className="text-[11px] text-slate-400">{sponsor.status}</p>}
                    </div>
                    {sponsor.poc_phone && (
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                        <Phone size={10} /> {sponsor.poc_phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Pass card ── */}
          {person.pass && (
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Ticket size={14} className="text-violet-500" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">Pass Holder</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {person.pass.category && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Category</p>
                    <p className="text-[12px] text-slate-700">{person.pass.category}</p>
                  </div>
                )}
                {person.pass.status && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Status</p>
                    <p className="text-[12px] text-slate-700">{person.pass.status}</p>
                  </div>
                )}
                {person.pass.organization && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Organization</p>
                    <p className="text-[12px] text-slate-700">{person.pass.organization}</p>
                  </div>
                )}
                {person.pass.title && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Title</p>
                    <p className="text-[12px] text-slate-700">{person.pass.title}</p>
                  </div>
                )}
                {person.pass.dietary_restrictions && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Dietary</p>
                    <p className="text-[12px] text-slate-700">{person.pass.dietary_restrictions}</p>
                  </div>
                )}
                {person.pass.poc_name && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">POC</p>
                    <p className="text-[12px] text-slate-700">{person.pass.poc_name}</p>
                  </div>
                )}
                {person.pass.details && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Details</p>
                    <p className="text-[12px] text-slate-600 whitespace-pre-wrap">{person.pass.details}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact info if available from any source */}
          {person.email && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Contact</p>
              <a href={`mailto:${person.email}`} className="flex items-center gap-2 text-[12px] text-blue-600 hover:underline">
                <Mail size={12} /> {person.email}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
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
  stats, duplicates, recentActivity, readiness,
  participants, universities, sponsors, passes,
}: DashboardClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<UnifiedPerson | null>(null)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'participant' | 'university' | 'sponsor' | 'pass'>('all')

  // ── Build unified people list ─────────────────────────────────────────────

  const allPeople = useMemo<UnifiedPerson[]>(() => {
    const map = new Map<string, UnifiedPerson>()

    function getKey(name: string, email: string | null) {
      return email?.toLowerCase().trim() || name.toLowerCase().trim()
    }

    function getOrCreate(name: string, email: string | null): UnifiedPerson {
      const key = getKey(name, email)
      if (!map.has(key)) {
        map.set(key, { key, name, email, participant: null, universityPocs: [], sponsorPocs: [], pass: null })
      }
      const person = map.get(key)!
      // Prefer longer/more complete name
      if (name.length > person.name.length) person.name = name
      return person
    }

    // Participants
    for (const p of participants) {
      const name = p.full_name || p.email
      const person = getOrCreate(name, p.email)
      person.participant = p
    }

    // University POCs
    for (const u of universities) {
      if (!u.poc_name) continue
      const person = getOrCreate(u.poc_name, u.poc_email)
      person.universityPocs.push({ university: u })
    }

    // Sponsor POCs
    for (const s of sponsors) {
      if (!s.poc_name) continue
      const person = getOrCreate(s.poc_name, s.poc_email)
      person.sponsorPocs.push({ sponsor: s })
    }

    // Passes
    for (const p of passes) {
      const person = getOrCreate(p.full_name, p.email)
      person.pass = p
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [participants, universities, sponsors, passes])

  // ── Filter ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return allPeople.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !(p.email ?? '').toLowerCase().includes(q)) return false
      }
      if (sourceFilter === 'participant' && !p.participant) return false
      if (sourceFilter === 'university' && p.universityPocs.length === 0) return false
      if (sourceFilter === 'sponsor' && p.sponsorPocs.length === 0) return false
      if (sourceFilter === 'pass' && !p.pass) return false
      return true
    })
  }, [allPeople, search, sourceFilter])

  // ── Readiness ─────────────────────────────────────────────────────────────

  const readinessItems: { label: string; status: CheckStatus; detail: string }[] = [
    {
      label: 'Participants imported',
      status: stats.totalParticipants > 0 ? 'ok' : 'fail',
      detail: stats.totalParticipants > 0 ? `${stats.totalParticipants} profiles` : 'None yet',
    },
    {
      label: 'Teams registered',
      status: stats.totalTeams > 0 ? 'ok' : 'fail',
      detail: stats.totalTeams > 0 ? `${stats.totalTeams} teams` : 'None yet',
    },
    {
      label: 'Judge rubric acknowledgment',
      status: readiness.totalJudges === 0 ? 'fail' : readiness.rubricAcksCount === readiness.totalJudges ? 'ok' : 'warn',
      detail: `${readiness.rubricAcksCount} of ${readiness.totalJudges} complete`,
    },
    {
      label: 'Pitch schedule published',
      status: readiness.schedulePublished ? 'ok' : 'fail',
      detail: readiness.schedulePublished ? 'Published' : 'Not published',
    },
    {
      label: 'Visa letters generated',
      status: readiness.visaRequired === 0 ? 'ok' : readiness.visaLettersGenerated >= readiness.visaRequired ? 'ok' : 'fail',
      detail: readiness.visaRequired === 0 ? 'No visa requests' : `${readiness.visaLettersGenerated} / ${readiness.visaRequired}`,
    },
    {
      label: 'Duplicate records resolved',
      status: readiness.hasDuplicates ? 'warn' : 'ok',
      detail: readiness.hasDuplicates ? 'Duplicates flagged' : 'Clean',
    },
  ]
  const okCount = readinessItems.filter((i) => i.status === 'ok').length

  return (
    <div className="space-y-6 p-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GSSF Worlds 2026</h1>
          <p className="mt-0.5 text-sm text-slate-500">Program dashboard</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Invite
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="flex gap-4">
        <StatCard label="Total Participants" value={stats.totalParticipants} subtext="Across all universities" icon={Users} accentColor="#3B82F6" iconColor="#3B82F6" />
        <StatCard label="Teams" value={stats.totalTeams} subtext="Direct + Regional" icon={Trophy} accentColor="#7C3AED" iconColor="#7C3AED" />
        <StatCard label="Confirmed" value={stats.confirmedCount} subtext={`of ${stats.totalParticipants} invited`} icon={UserCheck} accentColor="#10B981" iconColor="#10B981" />
        <StatCard label="Visa Required" value={stats.visaCount} subtext={`${stats.visaCount} letters pending`} icon={FileText} accentColor="#EF4444" iconColor="#EF4444" />
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
              {duplicates.length} flagged record{duplicates.length > 1 ? 's' : ''} may need review.
            </p>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="grid grid-cols-[1fr_320px] gap-6">

        {/* ── People directory ── */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Header + search */}
          <div className="border-b border-slate-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">People Directory</h3>
              <Link href="/participants" className="flex items-center gap-1 text-[13px] text-blue-600 hover:text-blue-700">
                Participants <ArrowRight size={13} />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-[12px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Source filter tabs */}
              <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
                {([
                  { id: 'all', label: 'All' },
                  { id: 'participant', label: 'Participants' },
                  { id: 'university', label: 'Uni POC' },
                  { id: 'sponsor', label: 'Sponsors' },
                  { id: 'pass', label: 'Passes' },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSourceFilter(tab.id)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      sourceFilter === tab.id
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400">{filtered.length} of {allPeople.length} people</p>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-slate-400">No people found.</div>
            ) : (
              filtered.map((person, i) => {
                const roles = person.participant ? roleFromParticipant(person.participant) : []
                const sources = [
                  person.participant && 'participant',
                  person.universityPocs.length > 0 && 'university',
                  person.sponsorPocs.length > 0 && 'sponsor',
                  person.pass && 'pass',
                ].filter(Boolean) as string[]

                return (
                  <div
                    key={person.key}
                    onClick={() => setSelectedPerson(person)}
                    className={`flex cursor-pointer items-center gap-3 border-b border-slate-50 px-5 py-3 transition-colors hover:bg-blue-50/40 ${
                      i % 2 === 1 ? 'bg-slate-50/30' : ''
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(person.name)}`}>
                      {initials(person.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-slate-800 truncate">{person.name}</p>
                        {roles[0] && <RoleBadge role={roles[0] as Role} size="sm" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {person.email && <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{person.email}</p>}
                        {sources.length > 1 && <span className="text-[11px] text-slate-300">·</span>}
                        {sources.includes('university') && (
                          <SourceTag label="Uni POC" icon={Building2} color="bg-teal-50 text-teal-600 border-teal-200" />
                        )}
                        {sources.includes('sponsor') && (
                          <SourceTag label="Sponsor" icon={Handshake} color="bg-orange-50 text-orange-600 border-orange-200" />
                        )}
                        {sources.includes('pass') && (
                          <SourceTag label="Pass" icon={Ticket} color="bg-violet-50 text-violet-600 border-violet-200" />
                        )}
                      </div>
                    </div>
                    {person.participant && (
                      <StatusBadge status={(person.participant.status ?? 'pending') as 'pending' | 'invited' | 'confirmed'} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <ActivityFeed items={recentActivity} />
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

      {/* ── Unified person modal ── */}
      {selectedPerson && (
        <UnifiedPersonModal person={selectedPerson} onClose={() => setSelectedPerson(null)} />
      )}

      {/* ── Invite modal ── */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}
