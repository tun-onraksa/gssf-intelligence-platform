'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Trophy, ArrowRight, Printer, X } from 'lucide-react'

// ── DB Types ──────────────────────────────────────────────────────────────────

interface DbTeamMember {
  profiles: { id: string; full_name: string | null } | null
}

interface DbTeamUniversity {
  id: string
  name: string
  country: string
}

interface DbTeam {
  id: string
  name: string
  track: string | null
  stage: string | null
  qualifying_path: string | null
  region_label: string | null
  pitch_summary: string | null
  university_id: string | null
  universities: DbTeamUniversity | null
  team_members: DbTeamMember[]
}

interface DbPocProfile {
  id: string
  full_name: string | null
  email: string | null
}

interface DbUniversity {
  id: string
  name: string
  country: string
  active_status: boolean | null
  cohort_history: number[] | null
  university_pocs: { profiles: DbPocProfile | null }[]
}

interface DbScore {
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

interface DbScoringTrack {
  track: string
  closed: boolean | null
  closed_at: string | null
}

interface DbPitchSlot {
  id: string
  track: string | null
  day: number | null
  start_time: string | null
  end_time: string | null
  room: string | null
  team_id: string | null
}

interface RoleCounts {
  student: number
  mentor: number
  judge: number
  organizer: number
  total: number
}

interface Props {
  teams: DbTeam[]
  universities: DbUniversity[]
  scores: DbScore[]
  scoringTracks: DbScoringTrack[]
  pitchSlots: DbPitchSlot[]
  roleCounts: RoleCounts
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FLAG: Record<string, string> = {
  'United States': '🇺🇸', 'India': '🇮🇳', 'South Korea': '🇰🇷', 'Finland': '🇫🇮',
  'United Kingdom': '🇬🇧', 'Singapore': '🇸🇬', 'Switzerland': '🇨🇭', 'Israel': '🇮🇱',
  'Canada': '🇨🇦', 'Hong Kong': '🇭🇰', 'China': '🇨🇳',
}

function getRegion(country: string): string {
  if (['United States', 'Canada'].includes(country)) return 'North America'
  if (['United Kingdom', 'Finland', 'Switzerland', 'Germany', 'France'].includes(country)) return 'Europe'
  if (['Israel'].includes(country)) return 'Middle East'
  if (['India', 'South Korea', 'Singapore', 'China', 'Hong Kong', 'Japan'].includes(country)) return 'Asia'
  return 'Other'
}

function getContinent(country: string): string {
  if (['United States', 'Canada'].includes(country)) return 'North America'
  if (['United Kingdom', 'Finland', 'Switzerland', 'Germany', 'France'].includes(country)) return 'Europe'
  if (['Israel'].includes(country)) return 'Middle East'
  return 'Asia'
}

const SEGMENT_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316']

// ── Helpers ───────────────────────────────────────────────────────────────────

function isTrackClosed(scoringTracks: DbScoringTrack[], track: string): boolean {
  return scoringTracks.some((t) => t.track === track && t.closed)
}

function calcAvg(teamScores: DbScore[]): number {
  if (!teamScores.length) return 0
  const valid = teamScores.filter((s) => s.total !== null)
  if (!valid.length) return 0
  return Math.round((valid.reduce((s, sc) => s + (sc.total ?? 0), 0) / valid.length) * 100) / 100
}

function calcInnovationAvg(teamScores: DbScore[]): number {
  if (!teamScores.length) return 0
  const valid = teamScores.filter((s) => s.innovation !== null)
  if (!valid.length) return 0
  return Math.round((valid.reduce((s, sc) => s + (sc.innovation ?? 0), 0) / valid.length) * 100) / 100
}

// ── Shared Sub-components ─────────────────────────────────────────────────────

function QualifyingPathBadge({ path }: { path: string | null }) {
  return path === 'regional' ? (
    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Regional</span>
  ) : (
    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Direct</span>
  )
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(score / 10, 1) * 100}%` }} />
    </div>
  )
}

function SectionTitle({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon && <span className="text-slate-400">{icon}</span>}
      <h3 className="text-[14px] font-semibold text-slate-800">{title}</h3>
    </div>
  )
}

// ── Pure SVG Donut Chart ──────────────────────────────────────────────────────

function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const r = 54, cx = 90, cy = 90
  const circumference = 2 * Math.PI * r
  const total = data.reduce((s, d) => s + d.value, 0)
  let cum = 0
  const segments = data.map((d) => {
    const len = total > 0 ? (d.value / total) * circumference : 0
    const seg = { ...d, len, cum }
    cum += len
    return seg
  })
  return (
    <svg viewBox="0 0 180 180" width={180} height={180} className="block">
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={26} />
        {segments.map((seg) => (
          <circle
            key={seg.name}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={26}
            strokeDasharray={`${seg.len} ${circumference - seg.len}`}
            strokeDashoffset={-seg.cum}
          />
        ))}
      </g>
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="22" fontWeight="bold" fill="#0f172a">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#94a3b8">total</text>
    </svg>
  )
}

// ── Cohort Timeline ───────────────────────────────────────────────────────────

function CohortTimeline({ university, currentTeams }: { university: DbUniversity; currentTeams: DbTeam[] }) {
  const sorted = [...(university.cohort_history ?? [])].sort((a, b) => a - b)
  return (
    <div className="flex flex-wrap items-start gap-1">
      {sorted.map((year, i) => {
        const isCurrent = year === 2026
        const currentTeam = isCurrent ? currentTeams[0] : null
        return (
          <div key={year} className="flex items-center gap-1">
            {i > 0 && <ArrowRight size={12} className="flex-shrink-0 text-slate-300" />}
            <div className={`min-w-[88px] rounded-lg border p-2.5 text-[11px] ${isCurrent ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <p className={`font-bold ${isCurrent ? 'text-blue-700' : 'text-slate-700'}`}>{year}</p>
              {isCurrent && currentTeam ? (
                <>
                  <p className="font-medium text-blue-600">{currentTeam.name}</p>
                  <p className="text-blue-400">In progress</p>
                </>
              ) : !isCurrent ? (
                <p className="text-slate-400">Participated</p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Print Modal ───────────────────────────────────────────────────────────────

function PrintModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <>
      <style>{`
        @media print {
          body > *:not(#gssf-print-root) { display: none !important; }
          #gssf-print-root { position: fixed !important; inset: 0 !important; z-index: 99999 !important; background: white !important; padding: 40px !important; overflow: auto !important; display: block !important; }
          .print-hide { display: none !important; }
        }
      `}</style>
      <div className="print-hide fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8">
        <div className="relative w-full max-w-[800px] rounded-xl bg-white shadow-2xl" id="gssf-print-root">
          <div className="print-hide flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <p className="text-[15px] font-semibold text-slate-800">{title}</p>
              <p className="text-[12px] text-slate-400">GSSC Worlds 2026 · Confidential</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-700"
              >
                <Printer size={13} /> Print / Save as PDF
              </button>
              <button onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="hidden p-6 pb-2 print:flex items-center gap-3 border-b border-slate-200">
            <div className="h-8 w-8 rounded bg-slate-800 flex-shrink-0" />
            <div>
              <p className="text-[14px] font-bold text-slate-900">GSSC Worlds 2026</p>
              <p className="text-[11px] text-slate-500">Global Student Startup Challenge Foundation · Confidential</p>
            </div>
          </div>
          <div className="p-8">{children}</div>
        </div>
      </div>
    </>
  )
}

// ── TAB 1: Full Program Summary ───────────────────────────────────────────────

function FullProgramContent({
  teams, universities, scores, scoringTracks, pitchSlots, roleCounts,
}: {
  teams: DbTeam[]
  universities: DbUniversity[]
  scores: DbScore[]
  scoringTracks: DbScoringTrack[]
  pitchSlots: DbPitchSlot[]
  roleCounts: RoleCounts
}) {
  const worldsUniIds = new Set(teams.map((t) => t.university_id).filter(Boolean))
  const worldsUnis = universities.filter((u) => worldsUniIds.has(u.id))
  const continents = new Set(worldsUnis.map((u) => getContinent(u.country)))

  const { student: studentCount, mentor: mentorCount, judge: judgeCount, organizer: organizerCount, total: totalParticipants } = roleCounts

  const donutData = [
    { name: 'Students', value: studentCount, color: SEGMENT_COLORS[0] },
    { name: 'Mentors', value: mentorCount, color: SEGMENT_COLORS[1] },
    { name: 'Judges', value: judgeCount, color: SEGMENT_COLORS[2] },
    { name: 'Organizers', value: organizerCount, color: SEGMENT_COLORS[3] },
  ]

  const uniTableRows = [...worldsUnis].sort((a, b) => getRegion(a.country).localeCompare(getRegion(b.country)))
  const uniCountryCounts = new Set(worldsUnis.map((u) => u.country)).size

  const TRACKS = ['A', 'B', 'C']

  function getTrackRoom(track: string) {
    const slot = pitchSlots.find((s) => s.track === track)
    return slot?.room ?? `Room ${track}`
  }

  function getTrackSlots(track: string) {
    return [...pitchSlots.filter((s) => s.track === track && s.team_id)].sort((a, b) => {
      if ((a.day ?? 0) !== (b.day ?? 0)) return (a.day ?? 0) - (b.day ?? 0)
      return (a.start_time ?? '').localeCompare(b.start_time ?? '')
    })
  }

  const anyTrackClosed = TRACKS.some((t) => isTrackClosed(scoringTracks, t))

  function getTrackRankings(track: string) {
    const trackTeams = teams.filter((t) => t.track === track)
    return trackTeams
      .map((team) => {
        const ts = scores.filter((s) => s.team_id === team.id)
        return { team, avg: calcAvg(ts), innovAvg: calcInnovationAvg(ts), scoreCount: ts.length }
      })
      .sort((a, b) => {
        const diff = b.avg - a.avg
        return Math.abs(diff) > 0.05 ? diff : b.innovAvg - a.innovAvg
      })
  }

  return (
    <div className="space-y-8">
      {/* Section 1 — Program Overview */}
      <div className="rounded-xl border border-slate-200 bg-white" style={{ borderLeft: '4px solid #0F172A' }}>
        <div className="px-6 py-5">
          <p className="text-[18px] font-bold text-slate-900">GSSC Worlds 2026</p>
          <p className="text-[13px] text-slate-600">Global Student Startup Challenge — Worlds Edition</p>
          <p className="mt-0.5 text-[12px] text-slate-400">Seoul, Republic of Korea · May 17–21, 2026</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500">
            <span>Organized by: <span className="font-semibold text-slate-700">Global Student Startup Challenge Foundation (GSSF)</span></span>
            <span>Academic Collaborator: <span className="font-semibold text-slate-700">UC Berkeley</span></span>
            <span>Program Sponsor: <span className="font-semibold text-slate-700">USC</span></span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { value: teams.length, label: 'Teams' },
              { value: worldsUnis.length, label: 'Universities' },
              { value: continents.size, label: 'Continents' },
              { value: totalParticipants, label: 'Participants' },
              { value: mentorCount, label: 'Mentors' },
              { value: judgeCount, label: 'Judges' },
            ].map(({ value, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3.5 py-2">
                <span className="text-[20px] font-bold text-slate-900">{value}</span>
                <span className="text-[12px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2 — Role Breakdown + University Table */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionTitle title="Participation by Role" />
          <div className="flex justify-center">
            <DonutChart data={donutData} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ background: d.color }} />
                <span className="text-[11px] text-slate-600">{d.name}: <span className="font-semibold">{d.value}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionTitle title="University Representation" />
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">University</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Country</th>
                  <th className="px-3 py-2 text-center font-semibold text-slate-500">Teams</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">Region</th>
                </tr>
              </thead>
              <tbody>
                {uniTableRows.map((u, i) => {
                  const uniTeams = teams.filter((t) => t.university_id === u.id)
                  return (
                    <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-3 py-1.5 font-medium text-slate-800">{u.name}</td>
                      <td className="px-3 py-1.5 text-slate-500">{FLAG[u.country] ?? ''} {u.country}</td>
                      <td className="px-3 py-1.5 text-center text-slate-700">{uniTeams.length}</td>
                      <td className="px-3 py-1.5 text-slate-500">{getRegion(u.country)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {worldsUnis.length} universities · {uniCountryCounts} countries · {continents.size} continents
          </p>
        </div>
      </div>

      {/* Section 3 — Team Roster */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <SectionTitle icon={<Trophy size={14} />} title="Competing Teams" />
        <div className="overflow-hidden rounded-lg border border-slate-100">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['#', 'Team', 'University', 'Country', 'Path', 'Track', 'Stage'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => {
                const uni = team.universities
                return (
                  <tr key={team.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-1.5 font-semibold text-slate-800">{team.name}</td>
                    <td className="px-3 py-1.5 text-slate-600">{uni?.name ?? '—'}</td>
                    <td className="px-3 py-1.5 text-slate-500">{FLAG[uni?.country ?? ''] ?? ''} {uni?.country ?? '—'}</td>
                    <td className="px-3 py-1.5"><QualifyingPathBadge path={team.qualifying_path} /></td>
                    <td className="px-3 py-1.5 font-medium text-slate-700">{team.track ? `Track ${team.track}` : '—'}</td>
                    <td className="px-3 py-1.5 text-slate-500">{team.stage}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4 — Pitch Schedule */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <SectionTitle title="Pitch Schedule" />
        <div className="grid grid-cols-3 gap-4">
          {TRACKS.map((track) => {
            const slots = getTrackSlots(track)
            return (
              <div key={track} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 text-[12px] font-semibold text-slate-700">
                  Track {track} — {getTrackRoom(track)}
                </p>
                <div className="space-y-1">
                  {slots.map((slot) => {
                    const team = teams.find((t) => t.id === slot.team_id)
                    return (
                      <div key={slot.id} className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400 tabular-nums">Day {slot.day}, {slot.start_time}</span>
                        <span className="font-medium text-slate-700">{team?.name ?? '—'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 5 — Final Rankings */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <SectionTitle icon={<Trophy size={14} />} title="Competition Results" />
        {anyTrackClosed ? (
          <div className="space-y-4">
            {TRACKS.filter((t) => isTrackClosed(scoringTracks, t)).map((track) => {
              const ranked = getTrackRankings(track)
              return (
                <div key={track}>
                  <p className="mb-2 text-[12px] font-semibold text-slate-600">Track {track}</p>
                  <div className="overflow-hidden rounded-lg border border-slate-100">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Rank</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Team</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">University</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-500">Avg Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranked.map((r, i) => {
                          const uni = r.team.universities
                          const isTie = i > 0 && Math.abs(ranked[i - 1].avg - r.avg) <= 0.05
                          return (
                            <tr key={r.team.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="px-3 py-1.5 font-bold text-slate-800">
                                #{i + 1}
                                {isTie && <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold text-amber-700">TIE</span>}
                              </td>
                              <td className="px-3 py-1.5 font-medium text-slate-800">{r.team.name}</td>
                              <td className="px-3 py-1.5 text-slate-500">{uni?.name ?? '—'}</td>
                              <td className="px-3 py-1.5 text-right font-semibold text-blue-700">{r.avg.toFixed(2)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-100 px-6 py-8 text-center">
            <p className="text-[13px] font-medium text-slate-500">Results will appear after scoring closes.</p>
            <p className="mt-1 text-[12px] text-slate-400">Close a track in /scoring to unlock rankings here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TAB 2: University Report ──────────────────────────────────────────────────

function UniversityReportTab({
  universities, teams, scores, scoringTracks, pitchSlots,
}: {
  universities: DbUniversity[]
  teams: DbTeam[]
  scores: DbScore[]
  scoringTracks: DbScoringTrack[]
  pitchSlots: DbPitchSlot[]
}) {
  const [selectedUniId, setSelectedUniId] = useState<string>(() => universities[0]?.id ?? '')
  const [showPrint, setShowPrint] = useState(false)

  const uni = universities.find((u) => u.id === selectedUniId)
  const uniTeams = teams.filter((t) => t.university_id === selectedUniId)
  const pocs = (uni?.university_pocs ?? [])
    .map((p) => p.profiles)
    .filter((p): p is DbPocProfile => !!p)

  const participationYears = uni?.cohort_history?.length ?? 0
  const allUniTeams = teams.filter((t) => t.university_id === selectedUniId)
  const directCount = allUniTeams.filter((t) => t.qualifying_path === 'direct').length
  const regionalCount = allUniTeams.filter((t) => t.qualifying_path === 'regional').length
  const isMultiYear = (uni?.cohort_history?.length ?? 0) >= 3

  const UniversityContent = () => (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[18px] font-bold text-slate-900">{uni?.name ?? '—'}</p>
              {isMultiYear && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  ⭐ Multi-year Partner
                </span>
              )}
            </div>
            <p className="text-[13px] text-slate-500">
              {FLAG[uni?.country ?? ''] ?? ''} {uni?.country} · Active Partner · Member since {Math.min(...(uni?.cohort_history ?? [2026]))}
            </p>
            {pocs.length > 0 && (
              <p className="mt-1 text-[12px] text-slate-400">
                POC: {pocs.map((p) => `${p.full_name} · ${p.email}`).join(', ')}
              </p>
            )}
            {pocs.length === 0 && (
              <p className="mt-1 text-[12px] text-slate-400">POC: —</p>
            )}
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-semibold text-green-700">Active</span>
        </div>
      </div>

      {/* This year teams */}
      <div>
        <p className="mb-3 text-[13px] font-semibold text-slate-800">This Year&apos;s Teams</p>
        {uniTeams.length > 0 ? uniTeams.map((team) => {
          const slot = pitchSlots.find((s) => s.team_id === team.id)
          const teamScores = scores.filter((s) => s.team_id === team.id)
          const avg = calcAvg(teamScores)
          const isClosed = team.track ? isTrackClosed(scoringTracks, team.track) : false
          const trackTeams = teams.filter((t) => t.track === team.track)
          const ranked = trackTeams
            .map((t) => ({ teamId: t.id, avg: calcAvg(scores.filter((s) => s.team_id === t.id)) }))
            .sort((a, b) => b.avg - a.avg)
          const rank = ranked.findIndex((r) => r.teamId === team.id) + 1
          const members = team.team_members
            .map((m) => m.profiles?.full_name)
            .filter((n): n is string => !!n)

          return (
            <div key={team.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[15px] font-bold text-slate-900">{team.name}</p>
                  <p className="mt-0.5 text-[12px] text-slate-400">&ldquo;{team.pitch_summary}&rdquo;</p>
                </div>
                <div className="flex items-center gap-2">
                  <QualifyingPathBadge path={team.qualifying_path} />
                  {team.track && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Track {team.track}</span>
                  )}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] text-slate-600">
                <div><span className="text-slate-400">Stage:</span> {team.stage}</div>
                {members.length > 0 && <div className="col-span-2"><span className="text-slate-400">Members:</span> {members.join(', ')}</div>}
                {slot && (
                  <div><span className="text-slate-400">Pitch Slot:</span> Day {slot.day}, {slot.start_time}, {slot.room}</div>
                )}
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3">
                {isClosed && avg > 0 ? (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="font-semibold text-slate-800">Score: {avg.toFixed(2)} / 10</span>
                      <span className="text-slate-500">Rank: #{rank} Track {team.track}</span>
                    </div>
                    <ScoreBar score={avg} />
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400">Score: Pending (scoring not yet closed)</p>
                )}
              </div>
            </div>
          )
        }) : (
          <p className="text-[13px] text-slate-400">No teams at Worlds 2026.</p>
        )}
      </div>

      {/* Cohort History */}
      {uni && (uni.cohort_history?.length ?? 0) > 0 && (
        <div>
          <p className="mb-3 text-[13px] font-semibold text-slate-800">Cohort History</p>
          <CohortTimeline university={uni} currentTeams={uniTeams} />
        </div>
      )}

      {/* Participation Stats */}
      <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-[12px] text-slate-600">
        <span><span className="font-semibold text-slate-800">{participationYears}</span> years participating</span>
        <span>·</span>
        <span><span className="font-semibold text-slate-800">{allUniTeams.length}</span> total teams sent</span>
        <span>·</span>
        <span><span className="font-semibold text-slate-800">{directCount}</span> direct qualifier{directCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span><span className="font-semibold text-slate-800">{regionalCount}</span> regional qualifier{regionalCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-[13px] font-medium text-slate-600">University</label>
        <Select value={selectedUniId} onValueChange={(v) => v && setSelectedUniId(v)}>
          <SelectTrigger className="w-[280px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...universities]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {FLAG[u.country] ?? ''} {u.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => setShowPrint(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {UniversityContent()}

      <PrintModal open={showPrint} onClose={() => setShowPrint(false)} title={`${uni?.name ?? 'University'} — GSSC Worlds 2026 Report`}>
        {UniversityContent()}
      </PrintModal>
    </div>
  )
}

// ── Page Client ───────────────────────────────────────────────────────────────

export function ReportsClient({ teams, universities, scores, scoringTracks, pitchSlots, roleCounts }: Props) {
  const [activeTab, setActiveTab] = useState('summary')
  const [showSummaryPrint, setShowSummaryPrint] = useState(false)

  return (
    <div className="mx-auto max-w-[1024px] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Reports</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">
            Program summaries, sponsor impact, and university exports · GSSC Worlds 2026
          </p>
        </div>
        <button
          onClick={() => setShowSummaryPrint(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
        >
          <Download size={14} /> Export PDF
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => v && setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="summary">Full Program Summary</TabsTrigger>
          <TabsTrigger value="university">University Report</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <FullProgramContent
            teams={teams}
            universities={universities}
            scores={scores}
            scoringTracks={scoringTracks}
            pitchSlots={pitchSlots}
            roleCounts={roleCounts}
          />
        </TabsContent>

        <TabsContent value="university" className="mt-6">
          <UniversityReportTab
            universities={universities}
            teams={teams}
            scores={scores}
            scoringTracks={scoringTracks}
            pitchSlots={pitchSlots}
          />
        </TabsContent>
      </Tabs>

      {/* Full Summary Print Modal */}
      <PrintModal
        open={showSummaryPrint}
        onClose={() => setShowSummaryPrint(false)}
        title="Full Program Summary — GSSC Worlds 2026"
      >
        <FullProgramContent
          teams={teams}
          universities={universities}
          scores={scores}
          scoringTracks={scoringTracks}
          pitchSlots={pitchSlots}
          roleCounts={roleCounts}
        />
      </PrintModal>
    </div>
  )
}
