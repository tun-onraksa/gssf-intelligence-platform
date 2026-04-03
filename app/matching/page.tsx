'use client'

import { Suspense, useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  RefreshCw, Check, X, Search, UserPlus, ChevronDown,
  ChevronUp, AlertTriangle, TrendingUp, Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts'
import { useStore } from '@/lib/store'
import { computeMentorMatches } from '@/lib/matching'
import { QualifyingPathBadge } from '@/components/shared/QualifyingPathBadge'
import type { MentorMatch, Person, Team } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const HASH_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-green-500', 'bg-orange-500',
  'bg-teal-500', 'bg-rose-400', 'bg-indigo-500', 'bg-amber-500',
]
function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return HASH_COLORS[Math.abs(h) % HASH_COLORS.length]
}

const TAG_ABBR: Record<string, string> = {
  tag_01: 'B2B', tag_02: 'Cons.', tag_03: 'HW', tag_04: 'Climate',
  tag_05: 'FinTech', tag_06: 'Health', tag_07: 'EdTech', tag_08: 'GTM',
  tag_09: 'Fund.', tag_10: 'Prod.', tag_11: 'BD&P', tag_12: 'AI/ML',
  tag_13: 'Ops', tag_14: 'Legal', tag_15: 'Web3',
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
        <Check size={12} className="text-green-600" strokeWidth={3} />
      </div>
      <span className="text-sm font-medium text-slate-700">{message}</span>
      <button onClick={onDismiss} className="ml-1 text-slate-300 hover:text-slate-500">
        <X size={14} />
      </button>
    </div>
  )
}

// ── Breakdown Bar ─────────────────────────────────────────────────────────────

function BreakdownBar({
  label, value, max, color, animated,
}: {
  label: string; value: number; max: number; color: string; animated: boolean
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] text-slate-500">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`absolute left-0 top-0 h-full rounded-full ${color} transition-[width] ease-out`}
          style={{
            width: animated ? `${pct}%` : '0%',
            transitionDuration: '600ms',
          }}
        />
      </div>
      <span className="w-9 text-right text-[11px] font-semibold text-slate-600">{pct}%</span>
    </div>
  )
}

// ── Mentor Match Card ─────────────────────────────────────────────────────────

const RANK_CONFIG = [
  { label: '#1', ring: 'ring-2 ring-yellow-400', bg: 'bg-yellow-50/80 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800' },
  { label: '#2', ring: 'ring-1 ring-slate-300',  bg: 'bg-slate-50 border-slate-200',     badge: 'bg-slate-100 text-slate-600'  },
  { label: '#3', ring: '',                        bg: 'bg-white border-slate-200',         badge: 'bg-orange-50 text-orange-700' },
]

function MentorMatchCard({
  match,
  rank,
  team,
  mentor,
  tagName,
  isAccepted,
  overrideOpen,
  overrideNote,
  onAccept,
  onOpenReassign,
  onToggleOverride,
  onChangeOverrideNote,
  onConfirmOverride,
  animBars,
}: {
  match: MentorMatch
  rank: number
  team: Team
  mentor: Person
  tagName: (id: string) => string
  isAccepted: boolean
  overrideOpen: boolean
  overrideNote: string
  onAccept: () => void
  onOpenReassign: () => void
  onToggleOverride: () => void
  onChangeOverrideNote: (v: string) => void
  onConfirmOverride: () => void
  animBars: boolean
}) {
  const cfg = RANK_CONFIG[rank - 1] ?? RANK_CONFIG[2]
  const scoreColor = match.score >= 80 ? 'text-green-600' : match.score >= 60 ? 'text-yellow-600' : 'text-red-500'
  const scoreBorder = match.score >= 80 ? 'border-green-300' : match.score >= 60 ? 'border-yellow-300' : 'border-red-300'
  const topTags = mentor.expertise.slice(0, 3)

  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 ${isAccepted ? 'border-green-300 bg-green-50' : cfg.bg}`}>
      {/* ── Top row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Rank badge */}
          <span className={`flex h-6 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${cfg.badge}`}>
            {cfg.label}
          </span>
          {/* Avatar */}
          <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${hashColor(mentor.name)} ${rank === 1 ? cfg.ring : ''}`}>
            {initials(mentor.name)}
            {isAccepted && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-white">
                <Check size={8} className="text-white" strokeWidth={3} />
              </span>
            )}
          </div>
          {/* Name + org */}
          <div>
            <p className="text-[14px] font-semibold text-slate-900">{mentor.name}</p>
            <p className="text-[12px] text-slate-500">{mentor.organization}</p>
          </div>
        </div>
        {/* Score ring */}
        <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border-2 ${scoreBorder}`}>
          <span className={`text-[13px] font-bold leading-none ${scoreColor}`}>{match.score}</span>
          <span className="text-[9px] text-slate-400">/100</span>
        </div>
      </div>

      {/* ── Top tags + metadata ── */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {topTags.map((e) => (
          <span key={e.tagId} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {e.level} · {tagName(e.tagId)}
          </span>
        ))}
        {mentor.geographicFocus && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
            🌏 {mentor.geographicFocus}
          </span>
        )}
        {mentor.yearsExperience != null && (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
            {mentor.yearsExperience} yrs
          </span>
        )}
      </div>

      {/* ── Breakdown bars ── */}
      <div className="mt-3 space-y-1.5 rounded-lg bg-white/60 px-3 py-2.5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Match Breakdown
        </p>
        <BreakdownBar label="Tag Overlap" value={match.tagOverlapScore} max={60} color="bg-blue-500"   animated={animBars} />
        <BreakdownBar label="Geography"   value={match.geographyScore}  max={10} color="bg-teal-500"  animated={animBars} />
        <BreakdownBar label="Stage Fit"   value={match.stageScore}      max={10} color="bg-violet-500" animated={animBars} />
      </div>

      {/* ── Matched tags ── */}
      <div className="mt-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Team Needs
        </p>
        <div className="flex flex-wrap gap-1.5">
          {team.needsExpertiseTagIds.map((tid) => {
            const covered = match.matchedTagIds.includes(tid)
            return (
              <span
                key={tid}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  covered
                    ? 'bg-green-100 text-green-700'
                    : 'border border-red-200 bg-red-50 text-red-500'
                }`}
              >
                {covered ? <Check size={9} strokeWidth={3} /> : <X size={9} />}
                {tagName(tid)}
              </span>
            )
          })}
        </div>
      </div>

      {/* ── Override panel ── */}
      {overrideOpen && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-1.5 text-[11px] font-medium text-slate-600">Override reason (optional)</p>
          <textarea
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 resize-none"
            rows={2}
            value={overrideNote}
            onChange={(e) => onChangeOverrideNote(e.target.value)}
            placeholder="e.g. Direct recommendation from program director"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={onToggleOverride}
              className="rounded px-3 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmOverride}
              className="rounded bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
            >
              Confirm Override
            </button>
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        {!isAccepted && (
          <button
            onClick={onToggleOverride}
            className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600"
          >
            Override {overrideOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}
        {!isAccepted && (
          <button
            onClick={onOpenReassign}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Reassign
          </button>
        )}
        {isAccepted ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-100 px-3 py-1.5 text-[12px] font-semibold text-green-700">
            <Check size={11} strokeWidth={3} /> Accepted
          </div>
        ) : (
          <button
            onClick={onAccept}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-green-700 transition-colors"
          >
            <Check size={11} strokeWidth={3} /> Accept
          </button>
        )}
      </div>
    </div>
  )
}

// ── Currently Assigned Banner ─────────────────────────────────────────────────

function AssignedBanner({ mentor, onRemove }: { mentor: Person; onRemove: () => void }) {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${hashColor(mentor.name)}`}>
        {initials(mentor.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600">Currently Assigned</p>
        <p className="text-[13px] font-medium text-slate-800">{mentor.name} · {mentor.organization}</p>
      </div>
      <button
        onClick={onRemove}
        className="text-[12px] text-red-400 hover:text-red-600 hover:underline shrink-0"
      >
        Remove
      </button>
    </div>
  )
}

// ── Reassign Modal ────────────────────────────────────────────────────────────

function ReassignModal({
  open, onClose, onSelect, mentors, currentMentorId,
}: {
  open: boolean
  onClose: () => void
  onSelect: (mentorId: string) => void
  mentors: Person[]
  currentMentorId?: string
}) {
  const [search, setSearch] = useState('')
  const filtered = mentors.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.organization ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-800">Reassign Mentor</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search size={13} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mentors…"
              className="flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.map((m) => {
            const isCurrent = m.personId === currentMentorId
            return (
              <button
                key={m.personId}
                onClick={() => { onSelect(m.personId); onClose() }}
                className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50 ${isCurrent ? 'bg-green-50' : ''}`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${hashColor(m.name)}`}>
                  {initials(m.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-800">{m.name}</p>
                  <p className="text-[11px] text-slate-400">{m.organization} · {m.geographicFocus}</p>
                </div>
                {isCurrent && (
                  <span className="shrink-0 text-[10px] font-medium text-green-600">Current</span>
                )}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-[13px] text-slate-400">No mentors found</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Custom supply bar shape for Recharts ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SupplyBarShape(props: any) {
  const { x, y, width, height, isGap } = props
  if (!height || height <= 0 || !width || width <= 0) return null
  return (
    <rect
      x={x} y={y} width={width} height={height}
      fill={isGap ? '#f87171' : '#3b82f6'}
      rx={2}
    />
  )
}

// ── Coverage Chart ────────────────────────────────────────────────────────────

type CoverageEntry = {
  tagId: string; abbr: string; fullName: string
  mentorCount: number; teamDemand: number; isGap: boolean
}

function CoverageChart({ data }: { data: CoverageEntry[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barGap={2} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="abbr" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          formatter={(value, name) => [value, name]}
          labelFormatter={(label) => data.find((d) => d.abbr === label)?.fullName ?? label}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => (
            <span style={{ color: '#64748b' }}>
              {value}
              {value === 'Mentor Supply' && (
                <span style={{ color: '#94a3b8', marginLeft: 4 }}>(red = &lt;2 mentors)</span>
              )}
            </span>
          )}
        />
        <Bar dataKey="mentorCount" name="Mentor Supply" shape={<SupplyBarShape />} maxBarSize={22}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isGap ? '#f87171' : '#3b82f6'} />
          ))}
        </Bar>
        <Bar dataKey="teamDemand" name="Team Demand" fill="#a78bfa" radius={[2, 2, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Gap Summary Cards ─────────────────────────────────────────────────────────

function GapCards({ data }: { data: CoverageEntry[] }) {
  const gaps     = data.filter((d) => d.isGap).sort((a, b) => a.mentorCount - b.mentorCount)
  const covered  = data.filter((d) => d.mentorCount >= 3).sort((a, b) => b.mentorCount - a.mentorCount)
  const demanded = [...data].sort((a, b) => b.teamDemand - a.teamDemand).slice(0, 3)

  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {/* Gaps */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <p className="text-[13px] font-semibold text-red-700">
            {gaps.length} Coverage Gap{gaps.length !== 1 ? 's' : ''}
          </p>
        </div>
        <p className="text-[11px] text-red-600 mb-2">Tags with fewer than 2 mentors:</p>
        {gaps.length === 0 ? (
          <p className="text-[11px] text-red-400">No gaps detected</p>
        ) : (
          <ul className="space-y-1">
            {gaps.map((d) => (
              <li key={d.tagId} className="text-[11px] text-red-700">
                <span className="font-medium">· {d.fullName}</span>
                <span className="text-red-400 ml-1">({d.mentorCount} mentor · {d.teamDemand} team{d.teamDemand !== 1 ? 's' : ''})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Well-covered */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-green-600 shrink-0" />
          <p className="text-[13px] font-semibold text-green-700">
            {covered.length} Well-Covered Area{covered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <p className="text-[11px] text-green-600 mb-2">Tags with 3+ mentors available:</p>
        <p className="text-[11px] text-green-700">
          <span className="font-medium">Top:</span>{' '}
          {covered.slice(0, 3).map((d) => `${d.fullName} (${d.mentorCount})`).join(', ')}
        </p>
      </div>

      {/* High demand */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-violet-600 shrink-0" />
          <p className="text-[13px] font-semibold text-violet-700">Top Demanded Tags</p>
        </div>
        <p className="text-[11px] text-violet-600 mb-2">Most requested by teams:</p>
        <ol className="space-y-0.5">
          {demanded.map((d, i) => (
            <li key={d.tagId} className="text-[11px] text-violet-700">
              {i + 1}. <span className="font-medium">{d.fullName}</span>
              <span className="text-violet-400 ml-1">— {d.teamDemand} team{d.teamDemand !== 1 ? 's' : ''}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

// ── Main content ──────────────────────────────────────────────────────────────

function MatchingContent() {
  const searchParams = useSearchParams()
  const { teams, persons, expertiseTags, mentorMatches, acceptMentorMatch, activeProgramId } = useStore()

  const mentors = useMemo(() => persons.filter((p) => p.roles.includes('MENTOR')), [persons])
  const programTeams = useMemo(() => teams.filter((t) => t.programId === activeProgramId), [teams, activeProgramId])

  // Local match state (refreshed by Run Matching Engine)
  const [liveMatches, setLiveMatches] = useState<MentorMatch[]>(mentorMatches)
  const [isRunning, setIsRunning] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Team selection (default first, or from URL)
  const urlTeamId = searchParams.get('teamId')
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    urlTeamId ?? programTeams[0]?.teamId ?? ''
  )

  // When URL param arrives after first render
  useEffect(() => {
    if (urlTeamId) setSelectedTeamId(urlTeamId)
  }, [urlTeamId])

  // Override panels per match (key = mentorId)
  const [overrideOpen, setOverrideOpen]   = useState<Record<string, boolean>>({})
  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>({})

  // Reassign modal
  const [reassignOpen, setReassignOpen] = useState(false)
  const [reassignTeamId, setReassignTeamId] = useState<string>('')

  // Bar animation: trigger when team changes
  const [animBars, setAnimBars] = useState(false)
  const prevTeam = useRef<string>('')
  useEffect(() => {
    if (selectedTeamId !== prevTeam.current) {
      setAnimBars(false)
      const t = setTimeout(() => setAnimBars(true), 30)
      prevTeam.current = selectedTeamId
      return () => clearTimeout(t)
    }
  }, [selectedTeamId])
  // Arm on initial mount
  useEffect(() => { setTimeout(() => setAnimBars(true), 100) }, [])

  // ── Derived data ──────────────────────────────────────────────────────────

  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId)
  const selectedMatches = useMemo(
    () => liveMatches.filter((m) => m.teamId === selectedTeamId).sort((a, b) => a.rank - b.rank),
    [liveMatches, selectedTeamId]
  )

  const matchedCount = programTeams.filter((t) => !!t.assignedMentorId).length

  function tagName(id: string) {
    return expertiseTags.find((t) => t.tagId === id)?.name ?? id
  }
  function getMentor(id: string): Person | undefined {
    return persons.find((p) => p.personId === id)
  }

  // Coverage analysis data
  const coverageData: CoverageEntry[] = useMemo(() =>
    expertiseTags.map((tag) => ({
      tagId: tag.tagId,
      abbr: TAG_ABBR[tag.tagId] ?? tag.name.slice(0, 5),
      fullName: tag.name,
      mentorCount: mentors.filter((m) => m.expertise.some((e) => e.tagId === tag.tagId)).length,
      teamDemand: programTeams.filter((t) => t.needsExpertiseTagIds.includes(tag.tagId)).length,
      isGap: mentors.filter((m) => m.expertise.some((e) => e.tagId === tag.tagId)).length < 2,
    })),
    [expertiseTags, mentors, programTeams]
  )

  // ── Actions ───────────────────────────────────────────────────────────────

  const dismissToast = useCallback(() => setToast(null), [])

  function handleRunMatching() {
    setIsRunning(true)
    setTimeout(() => {
      const fresh = computeMentorMatches(programTeams, mentors)
      setLiveMatches(fresh)
      setIsRunning(false)
      setToast(`Matching complete — ${programTeams.length} teams scored across ${mentors.length} mentors`)
    }, 1500)
  }

  function handleAccept(mentorId: string, teamId: string) {
    acceptMentorMatch(mentorId, teamId)
    const mentor = getMentor(mentorId)
    const team = teams.find((t) => t.teamId === teamId)
    if (mentor && team) {
      setToast(`${mentor.name} assigned to ${team.teamName}`)
    }
    setOverrideOpen((prev) => ({ ...prev, [mentorId]: false }))
  }

  function handleRemoveAssignment(teamId: string) {
    acceptMentorMatch('', teamId)
    setToast('Assignment removed')
  }

  function handleReassignSelect(mentorId: string) {
    acceptMentorMatch(mentorId, reassignTeamId)
    const mentor = getMentor(mentorId)
    const team = teams.find((t) => t.teamId === reassignTeamId)
    if (mentor && team) setToast(`${mentor.name} assigned to ${team.teamName}`)
  }

  function openReassign(teamId: string) {
    setReassignTeamId(teamId)
    setReassignOpen(true)
  }

  function toggleOverride(mentorId: string) {
    setOverrideOpen((prev) => ({ ...prev, [mentorId]: !prev[mentorId] }))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const assignedMentorInTop3 = selectedTeam?.assignedMentorId
    ? selectedMatches.some((m) => m.mentorId === selectedTeam.assignedMentorId)
    : false

  const assignedMentorOutside = selectedTeam?.assignedMentorId && !assignedMentorInTop3
    ? getMentor(selectedTeam.assignedMentorId)
    : null

  return (
    <>
      {/* ── Page header ── */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mentor Matching</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Automated mentor–team matching for GSSC Worlds 2026
          </p>
        </div>
        <button
          onClick={handleRunMatching}
          disabled={isRunning}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-70 transition-colors"
        >
          <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? 'Computing matches…' : 'Run Matching Engine'}
        </button>
      </div>

      {/* ── Summary bar ── */}
      <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm shadow-sm">
        <Stat label="Teams" value={programTeams.length} />
        <Div />
        <Stat label="Mentors" value={mentors.length} />
        <Div />
        <Stat label="Matches Accepted" value={matchedCount} color="text-green-600" />
        <Div />
        <Stat label="Unmatched" value={programTeams.length - matchedCount} color={programTeams.length - matchedCount > 0 ? 'text-amber-600' : 'text-slate-700'} />
      </div>

      {/* ── Row 1: Matching Panel ── */}
      <div className="mb-5 grid grid-cols-[35%_65%] gap-4">
        {/* Left: Team selector */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select a Team
            </p>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 420 }}>
            {programTeams.map((team) => {
              const uni = team.universityId
              const isActive = team.teamId === selectedTeamId
              const isMatched = !!team.assignedMentorId
              return (
                <button
                  key={team.teamId}
                  onClick={() => setSelectedTeamId(team.teamId)}
                  className={`w-full border-l-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    isActive ? 'border-l-blue-500 bg-blue-50' : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[13px] font-semibold leading-snug ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                      {team.teamName}
                    </span>
                    {isMatched ? (
                      <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Matched</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Unmatched</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{uni.replace('uni_', '')}</span>
                    <QualifyingPathBadge path={team.qualifyingPath} regionLabel={team.regionLabel} />
                  </div>
                </button>
              )
            })}
          </div>
          {/* Counter */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <p className="text-[12px] text-slate-500">
              <span className="font-semibold text-green-600">{matchedCount}</span> of{' '}
              {programTeams.length} teams matched
            </p>
          </div>
        </div>

        {/* Right: Match cards */}
        <div className="flex flex-col overflow-hidden">
          {selectedTeam ? (
            <>
              {/* Team header */}
              <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedTeam.teamName}</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {selectedTeam.stage}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Top 3 matches based on expertise overlap, geography, and stage
                    </p>
                  </div>
                </div>
                {/* Needs tags */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedTeam.needsExpertiseTagIds.map((tid) => (
                    <span
                      key={tid}
                      className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                    >
                      {tagName(tid)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assigned mentor outside top-3 */}
              {assignedMentorOutside && (
                <AssignedBanner
                  mentor={assignedMentorOutside}
                  onRemove={() => handleRemoveAssignment(selectedTeam.teamId)}
                />
              )}

              {/* Match cards */}
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 560 }}>
                {selectedMatches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
                    <UserPlus size={24} className="mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-400">No matches computed</p>
                    <p className="text-[12px] text-slate-400 mt-1">Click &ldquo;Run Matching Engine&rdquo; to generate matches</p>
                  </div>
                ) : (
                  selectedMatches.map((match) => {
                    const mentor = getMentor(match.mentorId)
                    if (!mentor) return null
                    const isAccepted = selectedTeam.assignedMentorId === match.mentorId
                    return (
                      <MentorMatchCard
                        key={match.mentorId}
                        match={match}
                        rank={match.rank}
                        team={selectedTeam}
                        mentor={mentor}
                        tagName={tagName}
                        isAccepted={isAccepted}
                        overrideOpen={!!overrideOpen[match.mentorId]}
                        overrideNote={overrideNotes[match.mentorId] ?? ''}
                        onAccept={() => handleAccept(match.mentorId, selectedTeam.teamId)}
                        onOpenReassign={() => openReassign(selectedTeam.teamId)}
                        onToggleOverride={() => toggleOverride(match.mentorId)}
                        onChangeOverrideNote={(v) => setOverrideNotes((p) => ({ ...p, [match.mentorId]: v }))}
                        onConfirmOverride={() => handleAccept(match.mentorId, selectedTeam.teamId)}
                        animBars={animBars}
                      />
                    )
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-400">
              <p className="text-sm">Select a team to view matches</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Coverage Analysis ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Ecosystem Coverage Analysis</h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Mentor supply vs. team demand across all {expertiseTags.length} expertise areas
            </p>
          </div>
        </div>

        <CoverageChart data={coverageData} />
        <GapCards data={coverageData} />

        {/* Recommendation */}
        {coverageData.filter((d) => d.isGap).length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <span className="text-lg mt-0.5">💡</span>
            <div className="flex-1">
              <p className="text-[13px] text-blue-800">
                <span className="font-semibold">Recommendation:</span> Consider recruiting 1–2
                additional mentors with{' '}
                {coverageData.filter((d) => d.isGap).map((d) => d.fullName).join(' and ')}{' '}
                expertise before Worlds 2026.
              </p>
            </div>
            <a
              href="/onboarding/mentor"
              className="shrink-0 flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Invite Mentor →
            </a>
          </div>
        )}
      </div>

      {/* ── Modals / Toast ── */}
      <ReassignModal
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        onSelect={handleReassignSelect}
        mentors={mentors}
        currentMentorId={teams.find((t) => t.teamId === reassignTeamId)?.assignedMentorId}
      />
      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </>
  )
}

// ── Tiny helpers (defined after main to avoid hoisting issues) ────────────────

function Stat({ label, value, color = 'text-slate-700' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[15px] font-bold ${color}`}>{value}</span>
      <span className="text-[12px] text-slate-500">{label}</span>
    </div>
  )
}
function Div() {
  return <div className="h-4 w-px bg-slate-200" />
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function MatchingPage() {
  return (
    <Suspense>
      <MatchingContent />
    </Suspense>
  )
}
