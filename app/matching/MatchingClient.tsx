'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CheckCircle2, X, Loader2, Users, UserCheck, ArrowRight } from 'lucide-react'
import { computeMentorMatches, topMatchesForTeam } from '@/lib/matching'
import { acceptMentorMatch, removeMentorAssignment } from '@/lib/actions/matching'
import type { MatchableTeam, MatchableMentor, ExpertiseTagBasic } from '@/lib/matching'

// ── Props ─────────────────────────────────────────────────────────────────────

interface MatchingClientProps {
  teams: MatchableTeam[]
  mentors: MatchableMentor[]
  expertiseTags: ExpertiseTagBasic[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<string, string> = {
  'Practitioner': 'bg-slate-100 text-slate-600',
  'Expert':       'bg-blue-100 text-blue-700',
  'Deep Expert':  'bg-violet-100 text-violet-700',
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const HASH_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-green-500', 'bg-orange-500',
  'bg-teal-500', 'bg-rose-400', 'bg-indigo-500', 'bg-amber-500',
]
function hashColor(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff
  return HASH_COLORS[Math.abs(h) % HASH_COLORS.length]
}

// ── MentorCard ────────────────────────────────────────────────────────────────

function MentorChip({
  mentor,
  score,
  matchedTags,
  onAccept,
  loading,
}: {
  mentor: MatchableMentor
  score: number
  matchedTags: string[]
  onAccept: () => void
  loading: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${hashColor(mentor.id)}`}
        >
          {initials(mentor.full_name ?? mentor.id)}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-800">{mentor.full_name ?? '—'}</p>
          {mentor.organization_name && (
            <p className="text-[11px] text-slate-500 truncate">{mentor.organization_name}</p>
          )}
          <div className="mt-1 flex flex-wrap gap-1">
            {matchedTags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
                {tag}
              </span>
            ))}
            {matchedTags.length > 4 && (
              <span className="text-[10px] text-slate-400">+{matchedTags.length - 4}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
          {score} match{score !== 1 ? 'es' : ''}
        </span>
        <button
          onClick={onAccept}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : null}
          Accept
        </button>
      </div>
    </div>
  )
}

// ── TeamCard ──────────────────────────────────────────────────────────────────

function TeamMatchCard({
  team,
  mentors,
  allMatches,
  onAccept,
  onRemove,
  actionLoading,
}: {
  team: MatchableTeam
  mentors: MatchableMentor[]
  allMatches: ReturnType<typeof computeMentorMatches>
  onAccept: (mentorId: string, teamId: string) => void
  onRemove: (teamId: string) => void
  actionLoading: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const assignedMentor = team.assigned_mentor_id
    ? mentors.find((m) => m.id === team.assigned_mentor_id)
    : null
  const topMatches = topMatchesForTeam(team.id, allMatches, 3)
  const tags = team.team_expertise_needs
    .filter((n) => n.expertise_tags)
    .map((n) => n.expertise_tags!)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className="flex cursor-pointer items-start justify-between gap-4 p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-slate-900">{team.name}</span>
            {team.track && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                Track {team.track}
              </span>
            )}
            {assignedMentor ? (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                <CheckCircle2 size={10} /> Matched
              </span>
            ) : topMatches.length > 0 ? (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                {topMatches.length} candidate{topMatches.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                No matches
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-slate-500">{team.universities?.name ?? '—'}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.slice(0, 5).map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {/* Assigned mentor */}
          {assignedMentor && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-green-700">
                  Assigned Mentor
                </span>
                <button
                  onClick={() => onRemove(team.id)}
                  disabled={actionLoading === `remove-${team.id}`}
                  className="flex items-center gap-1 rounded text-[11px] text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {actionLoading === `remove-${team.id}`
                    ? <Loader2 size={11} className="animate-spin" />
                    : <X size={11} />}
                  Remove
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${hashColor(assignedMentor.id)}`}
                >
                  {initials(assignedMentor.full_name ?? assignedMentor.id)}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{assignedMentor.full_name}</p>
                  {assignedMentor.organization_name && (
                    <p className="text-[11px] text-slate-500">{assignedMentor.organization_name}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {assignedMentor.profile_expertise.slice(0, 4).map((exp, i) =>
                  exp.expertise_tags ? (
                    <span
                      key={i}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${LEVEL_COLOR[exp.level] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {exp.expertise_tags.name}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Candidates */}
          {!assignedMentor && topMatches.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Top Candidates
              </p>
              <div className="space-y-2">
                {topMatches.map((match) => {
                  const mentor = mentors.find((m) => m.id === match.mentorId)
                  if (!mentor) return null
                  return (
                    <MentorChip
                      key={mentor.id}
                      mentor={mentor}
                      score={match.score}
                      matchedTags={match.matchedTags}
                      onAccept={() => onAccept(mentor.id, team.id)}
                      loading={actionLoading === `accept-${team.id}-${mentor.id}`}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {!assignedMentor && topMatches.length === 0 && (
            <p className="text-[12px] text-slate-400 italic">
              No mentor expertise overlap found. Try adding more expertise tags to this team.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Coverage Chart ────────────────────────────────────────────────────────────

function CoverageBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{value} / {max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MatchingClient({ teams, mentors, expertiseTags }: MatchingClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allMatches = useMemo(
    () => computeMentorMatches(teams, mentors, expertiseTags),
    [teams, mentors, expertiseTags]
  )

  const matchedCount   = teams.filter((t) => t.assigned_mentor_id).length
  const unmatchedCount = teams.length - matchedCount
  const mentorCount    = mentors.length
  const teamDemand     = teams.length

  const filtered = useMemo(() => {
    return teams.filter((team) => {
      if (filter === 'matched'   && !team.assigned_mentor_id) return false
      if (filter === 'unmatched' &&  team.assigned_mentor_id) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          team.name.toLowerCase().includes(s) ||
          (team.universities?.name.toLowerCase().includes(s) ?? false)
        )
      }
      return true
    })
  }, [teams, filter, search])

  async function handleAccept(mentorId: string, teamId: string) {
    const key = `accept-${teamId}-${mentorId}`
    setActionLoading(key)
    setError(null)
    try {
      await acceptMentorMatch(mentorId, teamId)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRemove(teamId: string) {
    const key = `remove-${teamId}`
    setActionLoading(key)
    setError(null)
    try {
      await removeMentorAssignment(teamId)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 p-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mentor Matching</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {teams.length} teams · {mentors.length} confirmed mentors · GSSC Worlds 2026
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      {/* Coverage summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Users size={14} className="text-slate-400" />
            <span className="text-[13px] font-semibold text-slate-700">Match Coverage</span>
          </div>
          <div className="space-y-3">
            <CoverageBar
              label="Teams matched"
              value={matchedCount}
              max={teamDemand}
              color="bg-green-500"
            />
            <CoverageBar
              label="Mentors assigned"
              value={matchedCount}
              max={mentorCount}
              color="bg-blue-500"
            />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: teams.length,    label: 'Total Teams',      color: 'text-slate-800' },
              { value: matchedCount,    label: 'Matched',          color: 'text-green-600' },
              { value: unmatchedCount,  label: 'Need Match',       color: unmatchedCount > 0 ? 'text-amber-600' : 'text-slate-400' },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <p className={`text-[28px] font-bold ${color}`}>{value}</p>
                <p className="text-[11px] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-slate-500">
            <UserCheck size={12} className="text-slate-400" />
            <span>{mentorCount} confirmed mentors available</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams or universities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-[240px]"
          />
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
          {(['all', 'matched', 'unmatched'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-[12px] font-medium capitalize transition-colors ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[12px] text-slate-400">
          {filtered.length} team{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Team list — click to expand candidates */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 py-16">
            <p className="text-sm text-slate-400">No teams match your filters.</p>
          </div>
        ) : (
          filtered.map((team) => (
            <TeamMatchCard
              key={team.id}
              team={team}
              mentors={mentors}
              allMatches={allMatches}
              onAccept={handleAccept}
              onRemove={handleRemove}
              actionLoading={actionLoading}
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500">
        <span>Match score = weighted expertise overlap</span>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-1">
          <ArrowRight size={10} /> Click a team to see candidates
        </div>
        <span className="text-slate-300">·</span>
        <span>Deep Expert = 3pts · Expert = 2pts · Practitioner = 1pt</span>
      </div>
    </div>
  )
}
