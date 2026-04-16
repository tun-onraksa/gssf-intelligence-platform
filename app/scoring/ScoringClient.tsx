'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { submitScore as submitScoreAction, closeScoring as closeScoringAction } from '@/lib/actions/scoring'
import {
  Trophy, Lock, CheckCircle2, Clock, Info,
  ChevronDown, ChevronUp, BookOpen, X, Loader2,
} from 'lucide-react'

// ── DB types ──────────────────────────────────────────────────────────────────

type DbTeam = {
  id: string
  name: string
  track: string | null
  stage: string | null
  pitch_summary: string | null
  universities: { name: string; country: string } | null
}

type DbScore = {
  id: string
  judge_id: string | null
  team_id: string | null
  track: string | null
  innovation: number | null
  market: number | null
  team_score: number | null
  traction: number | null
  total: number | null
  submitted_at: string | null
}

type DbScoringTrack = {
  track: string
  closed: boolean | null
  closed_at: string | null
}

type DbJudge = {
  id: string
  full_name: string | null
  organization_name: string | null
  judge_conflicts: { team_id: string | null }[]
  rubric_acknowledgments: { acknowledged_at: string | null }[]
}

type DbSlot = {
  id: string
  track: string
  team_id: string | null
  pitch_slot_judges: { profile_id: string | null }[]
}

interface ScoringClientProps {
  currentProfileId: string
  currentProfileName: string
  isJudge: boolean
  programId: string
  teams: DbTeam[]
  scores: DbScore[]
  scoringTracks: DbScoringTrack[]
  judges: DbJudge[]
  slots: DbSlot[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface Dims { innovation: number; market: number; team: number; traction: number }

function calcWeighted(d: Dims): number {
  return Math.round((d.innovation * 0.3 + d.market * 0.25 + d.team * 0.25 + d.traction * 0.2) * 100) / 100
}

function scoreColor(s: number): string {
  if (s >= 7.5) return 'text-green-600'
  if (s >= 5)   return 'text-amber-600'
  return 'text-red-500'
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function isTrackClosed(scoringTracks: DbScoringTrack[], track: string): boolean {
  return scoringTracks.find((t) => t.track === track)?.closed ?? false
}

function getTrackTeamIds(slots: DbSlot[], track: string): string[] {
  return slots.filter((s) => s.track === track && s.team_id).map((s) => s.team_id!)
}

function getTrackJudgeIds(slots: DbSlot[], track: string): string[] {
  const trackSlots = slots.filter((s) => s.track === track)
  const ids = new Set<string>()
  trackSlots.forEach((s) => s.pitch_slot_judges.forEach((j) => { if (j.profile_id) ids.add(j.profile_id) }))
  return Array.from(ids)
}

// ── Rubric ────────────────────────────────────────────────────────────────────

const RUBRIC = [
  {
    dimension: 'Innovation', weight: '30%',
    description: 'Novelty of the solution, IP differentiation, and technical breakthrough.',
    anchors: ['1–3: Incremental or derivative', '4–6: Notable differentiation', '7–10: Category-defining or disruptive'],
  },
  {
    dimension: 'Market Opportunity', weight: '25%',
    description: 'Size and growth of addressable market, competitive landscape, and timing.',
    anchors: ['1–3: Niche or crowded', '4–6: Clear TAM with viable path', '7–10: Large TAM, first-mover position'],
  },
  {
    dimension: 'Team', weight: '25%',
    description: 'Founding team strength, complementary skills, experience, and coachability.',
    anchors: ['1–3: Missing key functions', '4–6: Balanced team with gaps', '7–10: World-class, mission-aligned'],
  },
  {
    dimension: 'Traction', weight: '20%',
    description: 'Revenue, users, pilots, partnerships, or other measurable proof of demand.',
    anchors: ['1–3: Idea stage', '4–6: Early signals or pilots', '7–10: Strong revenue or adoption'],
  },
]

const DIMS: Array<{ key: keyof Dims; label: string; weight: string }> = [
  { key: 'innovation', label: 'Innovation',         weight: '30%' },
  { key: 'market',     label: 'Market Opportunity',  weight: '25%' },
  { key: 'team',       label: 'Team',                weight: '25%' },
  { key: 'traction',   label: 'Traction',            weight: '20%' },
]

// ── DotRow / StaticBar ────────────────────────────────────────────────────────

function DotRow({ value }: { value: number }) {
  return (
    <div className="mt-1.5 flex gap-1">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < value ? 'bg-blue-500' : 'bg-slate-200'}`} />
      ))}
    </div>
  )
}

function StaticBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-green-500 transition-[width] duration-700"
        style={{ width: `${(value / 10) * 100}%` }}
      />
    </div>
  )
}

// ── RubricModal ───────────────────────────────────────────────────────────────

function RubricModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[80vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-slate-900">Scoring Rubric</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-slate-100">
            <X size={16} className="text-slate-400" />
          </button>
        </div>
        <div className="space-y-4">
          {RUBRIC.map((r) => (
            <div key={r.dimension} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-slate-800">{r.dimension}</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{r.weight}</span>
              </div>
              <p className="mb-2 text-[12px] text-slate-500">{r.description}</p>
              {r.anchors.map((a) => <p key={a} className="text-[11px] text-slate-400">· {a}</p>)}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-slate-400">
          Weighted total = Innovation×0.30 + Market×0.25 + Team×0.25 + Traction×0.20
        </p>
      </div>
    </div>
  )
}

// ── ScoringCard ───────────────────────────────────────────────────────────────

function ScoringCard({
  team,
  existingScore,
  programId,
  isClosed,
  onRefresh,
}: {
  team: DbTeam
  existingScore: DbScore | null
  judgeId: string
  programId: string
  isClosed: boolean
  onRefresh: () => void
}) {
  const [dims, setDims] = useState<Dims>({ innovation: 5, market: 5, team: 5, traction: 5 })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const weighted = calcWeighted(dims)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      await submitScoreAction({
        teamId:     team.id,
        programId,
        track:      team.track ?? 'A',
        innovation: dims.innovation,
        market:     dims.market,
        team:       dims.team,
        traction:   dims.traction,
      })
      onRefresh()
      setConfirmOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (existingScore) {
    const s = existingScore
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[15px] font-semibold text-slate-900">{team.name}</span>
              {team.stage && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{team.stage}</span>}
              {team.track && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Track {team.track}</span>}
            </div>
            <p className="mt-0.5 text-[12px] text-slate-500">{team.universities?.name}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 size={13} />
              <span className="text-[12px] font-semibold">Score Submitted</span>
            </div>
            <p className="text-[11px] text-slate-400">{fmtDate(s.submitted_at ?? '')}</p>
          </div>
        </div>
        <div className="mb-4 space-y-2.5">
          {[
            { label: 'Innovation',         value: s.innovation ?? 0 },
            { label: 'Market Opportunity', value: s.market ?? 0 },
            { label: 'Team',               value: s.team_score ?? 0 },
            { label: 'Traction',           value: s.traction ?? 0 },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] text-slate-600">{label}</span>
                <span className="text-[12px] font-semibold text-slate-800">{value} / 10</span>
              </div>
              <StaticBar value={value} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-green-200 pt-3">
          <span className="text-[13px] font-semibold text-slate-700">Weighted Score</span>
          <span className={`text-[17px] font-bold ${scoreColor(s.total ?? 0)}`}>
            {(s.total ?? 0).toFixed(2)} <span className="text-[12px] font-normal text-slate-400">/ 10</span>
          </span>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-100 px-3 py-2.5">
          <Lock size={11} className="mt-0.5 shrink-0 text-green-600" />
          <p className="text-[11px] leading-relaxed text-green-800">
            Scores are final. Other judges&apos; scores are hidden until this track&apos;s scoring closes.
          </p>
        </div>
      </div>
    )
  }

  if (isClosed) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-2">
          <Lock size={13} className="text-slate-400" />
          <span className="text-[13px] text-slate-500">Scoring closed for this track.</span>
        </div>
        <p className="mt-1 text-[12px] text-slate-400">{team.name}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[15px] font-semibold text-slate-900">{team.name}</span>
          {team.stage && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{team.stage}</span>}
          {team.track && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Track {team.track}</span>}
        </div>
        <p className="mt-0.5 text-[12px] text-slate-500">{team.universities?.name}</p>
        {team.pitch_summary && (
          <p className="mt-1 text-[12px] italic text-slate-400">&ldquo;{team.pitch_summary}&rdquo;</p>
        )}
      </div>

      <div className="mb-4 space-y-5 border-t border-slate-100 pt-4">
        {DIMS.map(({ key, label, weight }) => (
          <div key={key}>
            <div className="mb-1.5 flex items-center justify-between">
              <div>
                <span className="text-[13px] font-medium text-slate-700">{label}</span>
                <span className="ml-1.5 text-[11px] text-slate-400">{weight}</span>
              </div>
              <span className="text-[16px] font-bold text-slate-900">{dims[key]}</span>
            </div>
            <input
              type="range" min={1} max={10} step={1}
              value={dims[key]}
              onChange={(e) => setDims((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              className="h-1.5 w-full cursor-pointer accent-blue-600"
            />
            <DotRow value={dims[key]} />
          </div>
        ))}
      </div>

      <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <span className="text-[13px] font-semibold text-slate-600">Weighted Score</span>
        <span className={`text-[22px] font-bold ${scoreColor(weighted)}`}>
          {weighted.toFixed(2)}
          <span className="ml-1 text-[13px] font-normal text-slate-400">/ 10</span>
        </span>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setDims({ innovation: 5, market: 5, team: 5, traction: 5 })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-700"
        >
          Submit Score →
        </button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-[15px] font-semibold text-slate-900">
              Submit score for {team.name}?
            </h3>
            <p className="mb-1 text-[13px] leading-relaxed text-slate-500">Scores cannot be edited after submission.</p>
            <p className="mb-5 text-[13px] text-slate-500">
              Weighted score:{' '}
              <span className={`font-bold ${scoreColor(weighted)}`}>{weighted.toFixed(2)} / 10</span>
            </p>
            {error && <p className="mb-3 text-[12px] text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── JudgeScoringView ──────────────────────────────────────────────────────────

function JudgeScoringView({
  currentProfileId, programId, teams, scores, scoringTracks, judges, slots,
}: {
  currentProfileId: string
  programId: string
  teams: DbTeam[]
  scores: DbScore[]
  scoringTracks: DbScoringTrack[]
  judges: DbJudge[]
  slots: DbSlot[]
}) {
  const router = useRouter()
  const [rubricOpen, setRubricOpen] = useState(false)

  const mySlots       = slots.filter((s) => s.pitch_slot_judges.some((j) => j.profile_id === currentProfileId))
  const myTrack       = mySlots[0]?.track ?? 'A'
  const myTeamIds     = Array.from(new Set(mySlots.map((s) => s.team_id).filter((id): id is string => !!id)))
  const isClosed      = isTrackClosed(scoringTracks, myTrack)

  const myJudge       = judges.find((j) => j.id === currentProfileId)
  const conflictTeamIds = (myJudge?.judge_conflicts ?? []).map((c) => c.team_id).filter((id): id is string => !!id)

  const queueTeamIds    = myTeamIds.filter((id) => !conflictTeamIds.includes(id))
  const conflictedTeams = conflictTeamIds.map((id) => teams.find((t) => t.id === id)).filter(Boolean) as DbTeam[]

  const myScores  = scores.filter((s) => s.judge_id === currentProfileId)
  const scoredCount = queueTeamIds.filter((id) => myScores.some((s) => s.team_id === id)).length

  return (
    <div className="mx-auto max-w-[700px] space-y-5 py-2">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">My Scoring Queue</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">Score your assigned teams before Pitch Day closes.</p>
        </div>
        <p className="text-[13px] font-semibold text-slate-600">Track {myTrack} · GSSF Worlds 2026</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <span className="text-[13px] font-semibold text-slate-800">{scoredCount} of {queueTeamIds.length} teams scored</span>
        <span className="text-slate-300">·</span>
        {isClosed ? (
          <span className="flex items-center gap-1 text-[12px] text-green-600"><Lock size={11} /> Scoring closed</span>
        ) : (
          <span className="text-[12px] text-slate-500">Scoring closes when ADMIN closes Track {myTrack}</span>
        )}
        <span className="text-slate-300">·</span>
        <button
          onClick={() => setRubricOpen(true)}
          className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:underline"
        >
          <BookOpen size={11} /> Rubric ↗
        </button>
      </div>

      {conflictedTeams.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
          <p className="text-[12px] leading-relaxed text-blue-800">
            {conflictedTeams.length} team{conflictedTeams.length > 1 ? 's' : ''} excluded from your queue due to a declared conflict of interest:{' '}
            {conflictedTeams.map((t, i) => (
              <span key={t.id}>
                {i > 0 ? ', ' : ''}
                <strong>{t.name}</strong>{t.universities?.name ? ` (${t.universities.name})` : ''}
              </span>
            ))}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {queueTeamIds.map((teamId) => {
          const team = teams.find((t) => t.id === teamId)
          if (!team) return null
          return (
            <ScoringCard
              key={teamId}
              team={team}
              existingScore={myScores.find((s) => s.team_id === teamId) ?? null}
              judgeId={currentProfileId}
              programId={programId}
              isClosed={isClosed}
              onRefresh={() => router.refresh()}
            />
          )
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-medium text-slate-600">Your progress</span>
          <span className="text-[12px] font-semibold text-slate-800">{scoredCount} / {queueTeamIds.length} teams scored</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-[width] duration-500"
            style={{ width: `${queueTeamIds.length > 0 ? (scoredCount / queueTeamIds.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <RubricModal open={rubricOpen} onClose={() => setRubricOpen(false)} />
    </div>
  )
}

// ── CompletionTable ───────────────────────────────────────────────────────────

function CompletionTable({
  teamIds, judgeIds, scores, teams, judges, isClosed,
}: {
  teamIds: string[]
  judgeIds: string[]
  scores: DbScore[]
  teams: DbTeam[]
  judges: DbJudge[]
  isClosed: boolean
}) {
  function shortName(id: string) {
    return (judges.find((j) => j.id === id)?.full_name ?? id).split(' ')[0]
  }

  function rowStatus(teamId: string): 'Complete' | 'Partial' | 'Pending' {
    const eligible   = judgeIds.filter((jid) => !judges.find((j) => j.id === jid)?.judge_conflicts.some((c) => c.team_id === teamId))
    const submitted  = eligible.filter((jid) => scores.some((s) => s.judge_id === jid && s.team_id === teamId))
    if (submitted.length === 0) return 'Pending'
    if (submitted.length < eligible.length) return 'Partial'
    return 'Complete'
  }

  function avgScore(teamId: string): number | null {
    if (!isClosed) return null
    const ts = scores.filter((s) => s.team_id === teamId)
    if (ts.length === 0) return null
    return Math.round((ts.reduce((a, s) => a + (s.total ?? 0), 0) / ts.length) * 100) / 100
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[560px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="py-2.5 pl-4 pr-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Team</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">University</th>
            {judgeIds.map((jid) => (
              <th key={jid} className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">{shortName(jid)}</th>
            ))}
            <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">Avg</th>
            <th className="py-2.5 pl-3 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody>
          {teamIds.map((teamId, i) => {
            const team   = teams.find((t) => t.id === teamId)
            const status = rowStatus(teamId)
            const avg    = avgScore(teamId)
            return (
              <tr key={teamId} className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="py-3 pl-4 pr-3 text-[13px] font-medium text-slate-800">{team?.name ?? teamId}</td>
                <td className="px-3 py-3 text-[12px] text-slate-500">{team?.universities?.name ?? '—'}</td>
                {judgeIds.map((jid) => {
                  const hasConflict = judges.find((j) => j.id === jid)?.judge_conflicts.some((c) => c.team_id === teamId) ?? false
                  const score       = scores.find((s) => s.judge_id === jid && s.team_id === teamId)
                  return (
                    <td key={jid} className="px-3 py-3 text-center">
                      {hasConflict ? (
                        <span className="text-[12px] text-slate-300">—</span>
                      ) : score ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-green-600">
                          <CheckCircle2 size={11} />{isClosed ? (score.total ?? 0).toFixed(1) : '✓'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] text-amber-500">
                          <Clock size={11} />Pending
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="px-3 py-3 text-center text-[13px] font-semibold">
                  {avg !== null ? <span className={scoreColor(avg)}>{avg.toFixed(2)}</span> : <span className="text-slate-300">—</span>}
                </td>
                <td className="py-3 pl-3 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    status === 'Complete' ? 'bg-green-100 text-green-700' :
                    status === 'Partial'  ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                  }`}>{status}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── RankingsPanel ─────────────────────────────────────────────────────────────

function RankingsPanel({ track, teamIds, scores, teams }: {
  track: string; teamIds: string[]; scores: DbScore[]; teams: DbTeam[]
}) {
  const ranked = teamIds.map((teamId) => {
    const ts   = scores.filter((s) => s.team_id === teamId)
    const n    = ts.length
    const avg  = n > 0 ? Math.round((ts.reduce((a, s) => a + (s.total ?? 0), 0) / n) * 100) / 100 : 0
    const inno = n > 0 ? Math.round((ts.reduce((a, s) => a + (s.innovation ?? 0), 0) / n) * 100) / 100 : 0
    const mkt  = n > 0 ? Math.round((ts.reduce((a, s) => a + (s.market ?? 0), 0) / n) * 100) / 100 : 0
    const tm   = n > 0 ? Math.round((ts.reduce((a, s) => a + (s.team_score ?? 0), 0) / n) * 100) / 100 : 0
    const trac = n > 0 ? Math.round((ts.reduce((a, s) => a + (s.traction ?? 0), 0) / n) * 100) / 100 : 0
    return { teamId, avg, inno, mkt, tm, trac }
  }).sort((a, b) => Math.abs(b.avg - a.avg) < 0.005 ? b.inno - a.inno : b.avg - a.avg)

  const tiedIds = new Set<string>()
  ranked.forEach((r, i) => {
    const nx = ranked[i + 1]
    if (nx && Math.abs(r.avg - nx.avg) < 0.05) { tiedIds.add(r.teamId); tiedIds.add(nx.teamId) }
  })

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy size={15} className="text-amber-500" />
        <h3 className="text-[14px] font-bold text-slate-900">Track {track} Final Rankings</h3>
      </div>
      <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-amber-100 bg-amber-50/60">
              {['#', 'Team', 'University', 'Score', 'Inno.', 'Market', 'Team', 'Trac.'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400 first:pl-4 last:pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => {
              const team    = teams.find((t) => t.id === r.teamId)
              const isFirst = i === 0
              return (
                <tr key={r.teamId} className={`border-b border-slate-100 last:border-0 ${isFirst ? 'bg-amber-50' : ''}`}>
                  <td className="py-3 pl-4 pr-3">
                    <span className={`text-[13px] font-bold ${isFirst ? 'text-amber-600' : 'text-slate-400'}`}>{i + 1}</span>
                    {isFirst && <span className="ml-1">🏆</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[13px] font-semibold ${isFirst ? 'text-amber-900' : 'text-slate-800'}`}>{team?.name ?? r.teamId}</span>
                      {tiedIds.has(r.teamId) && (
                        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-orange-600">TIE</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-slate-500">{team?.universities?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-center"><span className={`text-[14px] font-bold ${scoreColor(r.avg)}`}>{r.avg.toFixed(2)}</span></td>
                  <td className="px-3 py-3 text-center text-[12px] text-slate-500">{r.inno.toFixed(1)}</td>
                  <td className="px-3 py-3 text-center text-[12px] text-slate-500">{r.mkt.toFixed(1)}</td>
                  <td className="px-3 py-3 text-center text-[12px] text-slate-500">{r.tm.toFixed(1)}</td>
                  <td className="px-3 py-3 pr-4 text-center text-[12px] text-slate-500">{r.trac.toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {tiedIds.size > 0 && (
        <p className="mt-3 text-[11px] text-amber-700">Tie-break applied: Innovation score used to separate tied teams.</p>
      )}
    </div>
  )
}

// ── AuditLog ──────────────────────────────────────────────────────────────────

function AuditLog({ trackScores, judges, teams, isClosed }: {
  trackScores: DbScore[]; judges: DbJudge[]; teams: DbTeam[]; isClosed: boolean
}) {
  const [open, setOpen] = useState(false)
  const judgeName = (id: string) => judges.find((j) => j.id === id)?.full_name ?? id
  const teamName  = (id: string) => teams.find((t) => t.id === id)?.name ?? id

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
      >
        <span>Score Audit Log</span>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Judge', 'Team', 'Innov.', 'Market', 'Team', 'Trac.', 'Total', 'Submitted'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400 first:pl-4 last:pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trackScores.length === 0 ? (
                <tr><td colSpan={8} className="py-6 text-center text-[12px] text-slate-400">No scores submitted yet</td></tr>
              ) : trackScores.map((s, i) => (
                <tr key={s.id} className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="py-2.5 pl-4 pr-3 text-[12px] text-slate-700">{judgeName(s.judge_id ?? '')}</td>
                  <td className="px-3 py-2.5 text-[12px] text-slate-700">{teamName(s.team_id ?? '')}</td>
                  {isClosed ? (
                    <>
                      <td className="px-3 py-2.5 text-center text-[12px] text-slate-600">{s.innovation}</td>
                      <td className="px-3 py-2.5 text-center text-[12px] text-slate-600">{s.market}</td>
                      <td className="px-3 py-2.5 text-center text-[12px] text-slate-600">{s.team_score}</td>
                      <td className="px-3 py-2.5 text-center text-[12px] text-slate-600">{s.traction}</td>
                      <td className="px-3 py-2.5 text-center text-[12px] font-semibold text-slate-800">{(s.total ?? 0).toFixed(2)}</td>
                    </>
                  ) : (
                    [0,1,2,3,4].map((k) => (
                      <td key={k} className="px-3 py-2.5 text-center text-[12px] text-slate-300">Hidden</td>
                    ))
                  )}
                  <td className="py-2.5 pl-3 pr-4 text-[11px] text-slate-400">{fmtDate(s.submitted_at ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── TrackView ─────────────────────────────────────────────────────────────────

function TrackView({ track, slots, scores, teams, judges, scoringTracks, programId }: {
  track: string
  slots: DbSlot[]
  scores: DbScore[]
  teams: DbTeam[]
  judges: DbJudge[]
  scoringTracks: DbScoringTrack[]
  programId: string
}) {
  const router = useRouter()
  const [confirmClose,  setConfirmClose]  = useState(false)
  const [closingLoading, setClosingLoading] = useState(false)
  const [closingError,  setClosingError]  = useState<string | null>(null)

  const teamIds     = getTrackTeamIds(slots, track)
  const judgeIds    = getTrackJudgeIds(slots, track)
  const trackScores = scores.filter((s) => s.track === track)
  const isClosed    = isTrackClosed(scoringTracks, track)

  const allSubmitted = teamIds.every((teamId) =>
    judgeIds.every((jid) => {
      const judge = judges.find((j) => j.id === jid)
      if (judge?.judge_conflicts.some((c) => c.team_id === teamId)) return true
      return scores.some((s) => s.judge_id === jid && s.team_id === teamId)
    })
  )

  const judgeNames = judgeIds.map((id) => judges.find((j) => j.id === id)?.full_name ?? id).join(', ')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600">
          <span className="font-bold text-slate-900">Track {track}</span>
          <span className="text-slate-300">·</span>
          <span>{teamIds.length} teams</span>
          <span className="text-slate-300">·</span>
          <span>{judgeIds.length} judge{judgeIds.length !== 1 ? 's' : ''}{judgeNames ? ` (${judgeNames})` : ''}</span>
        </div>
        {isClosed ? (
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[12px] font-semibold text-green-700">
            <CheckCircle2 size={12} /> Scoring Closed
          </span>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <button
              disabled={!allSubmitted}
              onClick={() => setConfirmClose(true)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Close Scoring
            </button>
            {!allSubmitted && <p className="text-[10px] text-slate-400">All judges must submit first</p>}
          </div>
        )}
      </div>

      <CompletionTable
        teamIds={teamIds}
        judgeIds={judgeIds}
        scores={scores}
        teams={teams}
        judges={judges}
        isClosed={isClosed}
      />

      {isClosed && teamIds.length > 0 && (
        <RankingsPanel track={track} teamIds={teamIds} scores={trackScores} teams={teams} />
      )}

      <AuditLog trackScores={trackScores} judges={judges} teams={teams} isClosed={isClosed} />

      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-[16px] font-semibold text-slate-900">Close scoring for Track {track}?</h3>
            <p className="mb-5 text-[13px] leading-relaxed text-slate-600">
              Individual scores will become visible and rankings will be calculated. This cannot be undone.
            </p>
            {closingError && <p className="mb-3 text-[12px] text-red-500">{closingError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setConfirmClose(false)} disabled={closingLoading}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Cancel
              </button>
              <button
                disabled={closingLoading}
                onClick={async () => {
                  setClosingLoading(true)
                  setClosingError(null)
                  try {
                    await closeScoringAction(programId, track)
                    router.refresh()
                    setConfirmClose(false)
                  } catch (err: unknown) {
                    setClosingError(err instanceof Error ? err.message : 'An unexpected error occurred')
                  } finally {
                    setClosingLoading(false)
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {closingLoading && <Loader2 size={13} className="animate-spin" />}
                Close Scoring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CrossTrackSummary ─────────────────────────────────────────────────────────

function CrossTrackSummary({ slots, scores, scoringTracks }: {
  slots: DbSlot[]; scores: DbScore[]; scoringTracks: DbScoringTrack[]
}) {
  const TRACKS_LIST = ['A', 'B', 'C'] as const
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold text-slate-700">All Tracks Overview</h3>
      <div className="grid grid-cols-3 gap-4">
        {TRACKS_LIST.map((track) => {
          const teamIds   = getTrackTeamIds(slots, track)
          const judgeIds  = getTrackJudgeIds(slots, track)
          const total     = teamIds.length * judgeIds.length
          const submitted = scores.filter((s) => s.track === track).length
          const isClosed  = isTrackClosed(scoringTracks, track)
          const pct       = total > 0 ? submitted / total : 0
          return (
            <div key={track} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[14px] font-bold text-slate-800">Track {track}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isClosed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {isClosed ? 'Closed' : 'Open'}
                </span>
              </div>
              <p className="mb-2.5 text-[11px] text-slate-400">{teamIds.length} teams · {judgeIds.length} judge{judgeIds.length !== 1 ? 's' : ''}</p>
              <p className={`text-[12px] font-semibold ${pct === 1 ? 'text-green-600' : pct > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                {pct === 1 ? '✅' : pct > 0 ? '⚠️' : '❌'} {submitted}/{total} submitted
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── AdminScoringView ──────────────────────────────────────────────────────────

function AdminScoringView({
  programId, teams, scores, scoringTracks, judges, slots,
}: {
  programId: string
  teams: DbTeam[]
  scores: DbScore[]
  scoringTracks: DbScoringTrack[]
  judges: DbJudge[]
  slots: DbSlot[]
}) {
  const [activeTrack, setActiveTrack] = useState('A')
  const TRACKS_LIST = ['A', 'B', 'C'] as const

  return (
    <div className="mx-auto max-w-[960px] space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Scoring</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">Manage judge scoring across all tracks.</p>
        </div>
        <p className="text-[13px] font-semibold text-slate-500">GSSF Worlds 2026</p>
      </div>

      <Tabs value={activeTrack} onValueChange={(v) => v && setActiveTrack(v)}>
        <TabsList className="mb-5">
          {TRACKS_LIST.map((track) => (
            <TabsTrigger key={track} value={track} className="gap-2">
              Track {track}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                isTrackClosed(scoringTracks, track) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {isTrackClosed(scoringTracks, track) ? 'Closed' : 'Open'}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        {TRACKS_LIST.map((track) => (
          <TabsContent key={track} value={track}>
            <TrackView
              track={track}
              slots={slots}
              scores={scores}
              teams={teams}
              judges={judges}
              scoringTracks={scoringTracks}
              programId={programId}
            />
          </TabsContent>
        ))}
      </Tabs>

      <CrossTrackSummary slots={slots} scores={scores} scoringTracks={scoringTracks} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScoringClient(props: ScoringClientProps) {
  if (props.isJudge) {
    return (
      <JudgeScoringView
        currentProfileId={props.currentProfileId}
        programId={props.programId}
        teams={props.teams}
        scores={props.scores}
        scoringTracks={props.scoringTracks}
        judges={props.judges}
        slots={props.slots}
      />
    )
  }
  return (
    <AdminScoringView
      programId={props.programId}
      teams={props.teams}
      scores={props.scores}
      scoringTracks={props.scoringTracks}
      judges={props.judges}
      slots={props.slots}
    />
  )
}
