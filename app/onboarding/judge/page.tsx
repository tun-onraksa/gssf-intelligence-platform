'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, Briefcase, ShieldAlert, ClipboardList, MapPin, CheckCircle, Check, Lock, Loader2 } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StepForm } from '@/components/shared/StepForm'
import { createClient } from '@/lib/supabase/client'
import { submitOnboarding } from '@/lib/actions/onboarding'

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Personal\nInfo', icon: User },
  { label: 'Background', icon: Briefcase },
  { label: 'Conflicts', icon: ShieldAlert },
  { label: 'Rubric', icon: ClipboardList },
  { label: 'Logistics', icon: MapPin },
  { label: 'Confirm', icon: CheckCircle },
]

const COUNTRIES = [
  'Afghanistan','Argentina','Australia','Austria','Belgium','Brazil','Canada',
  'Chile','China','Colombia','Denmark','Egypt','Ethiopia','Finland','France',
  'Germany','Ghana','Greece','Hong Kong','India','Indonesia','Ireland','Israel',
  'Italy','Japan','Jordan','Kenya','Malaysia','Mexico','Netherlands','New Zealand',
  'Nigeria','Norway','Pakistan','Peru','Philippines','Poland','Portugal',
  'Saudi Arabia','Singapore','South Africa','South Korea','Spain','Sweden',
  'Switzerland','Taiwan','Thailand','Turkey','UAE','United Kingdom',
  'United States','Vietnam','Zimbabwe',
]

// ── Styles ────────────────────────────────────────────────────────────────────

const inp = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors'
const lbl = 'text-sm font-medium text-slate-700'
const errCls = 'mt-1 text-xs text-red-500'

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className={lbl}>{children}{required && <span className="ml-0.5 text-red-500">*</span>}</label>
}
function FErr({ msg }: { msg?: string }) {
  return msg ? <p className={errCls}>{msg}</p> : null
}
function F({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>
}

// ── Teams & Universities for COI ──────────────────────────────────────────────

const ALL_TEAMS = [
  { teamId: 'team_atlix',   name: 'Atlix',    uni: 'USC',            country: '🇺🇸' },
  { teamId: 'team_cognate', name: 'Cognate',  uni: 'UC Berkeley',    country: '🇺🇸' },
  { teamId: 'team_helion',  name: 'Helion',   uni: 'ETH Zurich',     country: '🇨🇭' },
  { teamId: 'team_meridian',name: 'Meridian', uni: 'Oxford',         country: '🇬🇧' },
  { teamId: 'team_arca',    name: 'Arca',     uni: 'NUS',            country: '🇸🇬' },
  { teamId: 'team_solace',  name: 'Solace',   uni: 'Columbia',       country: '🇺🇸' },
  { teamId: 'team_parity',  name: 'Parity',   uni: 'UT Austin',      country: '🇺🇸' },
  { teamId: 'team_luma',    name: 'Luma',     uni: 'HKUST',          country: '🇭🇰' },
  { teamId: 'team_vanta',   name: 'Vanta',    uni: 'Tsinghua',       country: '🇨🇳' },
  { teamId: 'team_dune',    name: 'Dune',     uni: 'U of Toronto',   country: '🇨🇦' },
  { teamId: 'team_nexus',   name: 'Nexus',    uni: 'IIT Delhi',      country: '🇮🇳' },
  { teamId: 'team_orbit',   name: 'Orbit',    uni: 'IIT Delhi',      country: '🇮🇳' },
  { teamId: 'team_pragma',  name: 'Pragma',   uni: 'Tel Aviv U',     country: '🇮🇱' },
  { teamId: 'team_flux',    name: 'Flux',     uni: 'Aalto',          country: '🇫🇮' },
  { teamId: 'team_kirin',   name: 'Kirin',    uni: 'KAIST',          country: '🇰🇷' },
  { teamId: 'team_sora',    name: 'Sora',     uni: 'KAIST',          country: '🇰🇷' },
]

const ALL_UNIVERSITIES = [
  { id: 'uni_usc',      name: 'USC',                        country: '🇺🇸' },
  { id: 'uni_berkeley', name: 'UC Berkeley',                country: '🇺🇸' },
  { id: 'uni_iitdelhi', name: 'IIT Delhi',                  country: '🇮🇳' },
  { id: 'uni_kaist',    name: 'KAIST',                      country: '🇰🇷' },
  { id: 'uni_aalto',    name: 'Aalto University',           country: '🇫🇮' },
  { id: 'uni_oxford',   name: 'University of Oxford',       country: '🇬🇧' },
  { id: 'uni_nus',      name: 'NUS',                        country: '🇸🇬' },
  { id: 'uni_eth',      name: 'ETH Zurich',                 country: '🇨🇭' },
  { id: 'uni_tau',      name: 'Tel Aviv University',        country: '🇮🇱' },
  { id: 'uni_toronto',  name: 'University of Toronto',      country: '🇨🇦' },
  { id: 'uni_hkust',    name: 'HKUST',                      country: '🇭🇰' },
  { id: 'uni_tsinghua', name: 'Tsinghua University',        country: '🇨🇳' },
  { id: 'uni_columbia', name: 'Columbia University',        country: '🇺🇸' },
  { id: 'uni_utaustin', name: 'UT Austin',                  country: '🇺🇸' },
]

// ── Form type ─────────────────────────────────────────────────────────────────

type ConflictEntry = { reason: string }
type TeamConflicts = Record<string, ConflictEntry>
type UniConflicts  = Record<string, ConflictEntry>

type JF = {
  firstName: string; lastName: string; email: string
  nationality: string; country: string; bio: string
  organization: string; jobTitle: string; vertical: string
  yearsExperience: string; geoFocus: string; linkedin: string; proBio: string
  coiConfirmed: boolean
  rubricAcked: boolean
  tshirt: string; dietary: string; dietaryOther: string
  emergencyName: string; emergencyPhone: string; accessibility: string
  needsVisa: string; fullLegalName: string; passportNumber: string
  passportExpiry: string; dateOfBirth: string; issuingCountry: string
  arrivalDate: string; departingCity: string; flightBooked: string
}
type Err = Partial<Record<keyof JF | 'coi' | 'rubric', string>>

const INIT: JF = {
  firstName: '', lastName: '', email: '',
  nationality: '', country: '', bio: '',
  organization: '', jobTitle: '', vertical: '',
  yearsExperience: '', geoFocus: '', linkedin: '', proBio: '',
  coiConfirmed: false, rubricAcked: false,
  tshirt: '', dietary: '', dietaryOther: '',
  emergencyName: '', emergencyPhone: '', accessibility: '',
  needsVisa: '', fullLegalName: '', passportNumber: '',
  passportExpiry: '', dateOfBirth: '', issuingCountry: '',
  arrivalDate: '', departingCity: '', flightBooked: '',
}

// ── Success ───────────────────────────────────────────────────────────────────

function SuccessCard({
  firstName, email, teamConflicts, uniConflicts, rubricAckedAt,
}: {
  firstName: string; email: string
  teamConflicts: TeamConflicts; uniConflicts: UniConflicts
  rubricAckedAt: string
}) {
  const conflictedTeams   = ALL_TEAMS.filter((t) => teamConflicts[t.teamId])
  const conflictedUnis    = ALL_UNIVERSITIES.filter((u) => uniConflicts[u.id])
  const noConflicts       = conflictedTeams.length === 0 && conflictedUnis.length === 0
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 shadow-lg">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
          <Check size={28} className="text-green-600" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 text-center">
          You&apos;re confirmed, {firstName}!
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed text-center">
          You&apos;re confirmed as a Judge at GSSF Worlds 2026. Your scoring queue
          will be activated before Pitch Day (May 19).
        </p>
        <div className="mt-5 space-y-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Conflicts Declared</p>
            <p className="mt-0.5 text-sm text-slate-700">
              {noConflicts ? 'None — you will score all assigned teams.' : (
                <>
                  {conflictedTeams.map((t) => t.name).join(', ')}
                  {conflictedUnis.length > 0 && ` · ${conflictedUnis.map((u) => u.name).join(', ')}`}
                </>
              )}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rubric Acknowledged</p>
            <p className="mt-0.5 text-sm text-green-600">✓ {rubricAckedAt.slice(0, 16).replace('T', ' ')}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">What&apos;s next</p>
            <p className="mt-0.5 text-sm text-slate-600">
              You&apos;ll receive your pitch schedule 48 hours before the event. Confirmation sent to{' '}
              <span className="font-medium">{email}</span>.
            </p>
          </div>
        </div>
        <a href="/dashboard" className="mt-6 block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors text-center">
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}

// ── Step 1: Personal Info ─────────────────────────────────────────────────────

function Step1({ f, set, e, track }: { f: JF; set: (k: keyof JF, v: string | boolean) => void; e: Err; track?: string }) {
  const left = 300 - f.bio.length
  return (
    <div className="space-y-4">
      <div className="mb-5 flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
        <span className="mt-0.5 text-lg">⚖️</span>
        <div>
          <p className="text-sm text-purple-900">You&apos;ve been invited as a <span className="font-bold">Judge{track ? ` — Track ${track}` : ''}</span></p>
          <p className="mt-0.5 text-[12px] text-purple-500">GSSF Worlds 2026 · Seoul, May 17–21</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <F><Label required>First Name</Label>
          <input className={inp} value={f.firstName} onChange={(ev) => set('firstName', ev.target.value)} placeholder="Marcus" />
          <FErr msg={e.firstName} /></F>
        <F><Label required>Last Name</Label>
          <input className={inp} value={f.lastName} onChange={(ev) => set('lastName', ev.target.value)} placeholder="Webb" />
          <FErr msg={e.lastName} /></F>
      </div>
      <F><Label required>Email</Label>
        <div className="relative">
          <input className={`${inp} bg-slate-50 text-slate-500 pr-8`} value={f.email} readOnly />
          <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <p className="text-[11px] text-slate-400">Pre-filled from your invite.</p></F>
      <F><Label required>Nationality</Label>
        <Select value={f.nationality || undefined} onValueChange={(v) => v && set('nationality', v)}>
          <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select nationality…" /></SelectTrigger>
          <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <FErr msg={e.nationality} /></F>
      <F><Label required>Country of Residence</Label>
        <Select value={f.country || undefined} onValueChange={(v) => v && set('country', v)}>
          <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select country…" /></SelectTrigger>
          <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <FErr msg={e.country} /></F>
      <F><Label>Short Bio</Label>
        <textarea className={`${inp} min-h-[80px] resize-none`} value={f.bio}
          onChange={(ev) => ev.target.value.length <= 300 && set('bio', ev.target.value)}
          placeholder="Tell us about your background and what you bring as a judge." />
        <p className={`text-right text-[11px] ${left < 30 ? 'text-red-400' : 'text-slate-400'}`}>{left} chars left</p></F>
    </div>
  )
}

// ── Step 2: Professional Background ──────────────────────────────────────────

function Step2({ f, set, e }: { f: JF; set: (k: keyof JF, v: string | boolean) => void; e: Err }) {
  const left = 500 - f.proBio.length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <F><Label required>Current Organization</Label>
          <input className={inp} value={f.organization} onChange={(ev) => set('organization', ev.target.value)} placeholder="Company or institution" />
          <FErr msg={e.organization} /></F>
        <F><Label required>Job Title</Label>
          <input className={inp} value={f.jobTitle} onChange={(ev) => set('jobTitle', ev.target.value)} placeholder="e.g. VP Product" />
          <FErr msg={e.jobTitle} /></F>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <F><Label required>Industry Vertical</Label>
          <Select value={f.vertical || undefined} onValueChange={(v) => v && set('vertical', v)}>
            <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {['Technology','Finance','Healthcare','Climate','Consumer','Education','Deep Tech','Other'].map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FErr msg={e.vertical} /></F>
        <F><Label required>Years of Experience</Label>
          <Select value={f.yearsExperience || undefined} onValueChange={(v) => v && set('yearsExperience', v)}>
            <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {['1–3','3–5','5–10','10–15','15+'].map((y) => <SelectItem key={y} value={y}>{y} years</SelectItem>)}
            </SelectContent>
          </Select>
          <FErr msg={e.yearsExperience} /></F>
      </div>
      <F><Label required>Geographic Focus</Label>
        <Select value={f.geoFocus || undefined} onValueChange={(v) => v && set('geoFocus', v)}>
          <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select region…" /></SelectTrigger>
          <SelectContent>
            {['North America','Latin America','Europe','South Asia','Southeast Asia','East Asia','Middle East','Africa','Global'].map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FErr msg={e.geoFocus} /></F>
      <F><Label required>LinkedIn URL</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">in</span>
          <input className={`${inp} pl-8`} value={f.linkedin} onChange={(ev) => set('linkedin', ev.target.value)} placeholder="linkedin.com/in/yourprofile" />
        </div>
        <FErr msg={e.linkedin} /></F>
      <F><Label required>Professional Bio</Label>
        <textarea className={`${inp} min-h-[100px] resize-none`} value={f.proBio}
          onChange={(ev) => ev.target.value.length <= 500 && set('proBio', ev.target.value)}
          placeholder="Describe your professional background and expertise relevant to judging startup pitches." />
        <p className={`text-right text-[11px] ${left < 50 ? 'text-red-400' : 'text-slate-400'}`}>{left} chars left</p>
        <FErr msg={e.proBio} /></F>
    </div>
  )
}

// ── Step 3: Conflict of Interest ──────────────────────────────────────────────

function Step3({
  f, set, teamConflicts, setTeamConflicts, uniConflicts, setUniConflicts, e,
}: {
  f: JF
  set: (k: keyof JF, v: string | boolean) => void
  teamConflicts: TeamConflicts
  setTeamConflicts: (c: TeamConflicts) => void
  uniConflicts: UniConflicts
  setUniConflicts: (c: UniConflicts) => void
  e: Err
}) {
  const totalConflicts = Object.keys(teamConflicts).length + Object.keys(uniConflicts).length

  function toggleTeam(id: string) {
    if (teamConflicts[id]) {
      const next = { ...teamConflicts }; delete next[id]; setTeamConflicts(next)
    } else {
      setTeamConflicts({ ...teamConflicts, [id]: { reason: '' } })
    }
  }
  function setTeamReason(id: string, reason: string) {
    setTeamConflicts({ ...teamConflicts, [id]: { reason } })
  }
  function toggleUni(id: string) {
    if (uniConflicts[id]) {
      const next = { ...uniConflicts }; delete next[id]; setUniConflicts(next)
    } else {
      setUniConflicts({ ...uniConflicts, [id]: { reason: '' } })
    }
  }
  function setUniReason(id: string, reason: string) {
    setUniConflicts({ ...uniConflicts, [id]: { reason } })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
        <p className="text-sm font-semibold text-orange-800">Conflict of Interest Declaration</p>
        <p className="mt-1 text-[12px] text-orange-700 leading-relaxed">
          Please review all competing teams and declare any conflicts. A conflict exists if you have
          a financial interest, personal relationship, or prior professional engagement with a team or
          their university that could affect your objectivity.
        </p>
      </div>

      {/* Teams table */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Competing Teams</p>
        <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
          {ALL_TEAMS.map((team) => {
            const hasConflict = !!teamConflicts[team.teamId]
            return (
              <div key={team.teamId} className="p-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={hasConflict} onChange={() => toggleTeam(team.teamId)}
                    className="accent-red-500 h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-800">{team.name}</span>
                    <span className="ml-2 text-[11px] text-slate-400">{team.country} {team.uni}</span>
                  </div>
                  {hasConflict && (
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">
                      Conflict
                    </span>
                  )}
                </div>
                {hasConflict && (
                  <input
                    className={`${inp} mt-2 text-[12px]`}
                    value={teamConflicts[team.teamId]?.reason ?? ''}
                    onChange={(ev) => setTeamReason(team.teamId, ev.target.value)}
                    placeholder="Brief reason (optional)"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Universities */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Universities</p>
        <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
          {ALL_UNIVERSITIES.map((uni) => {
            const hasConflict = !!uniConflicts[uni.id]
            return (
              <div key={uni.id} className="p-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={hasConflict} onChange={() => toggleUni(uni.id)}
                    className="accent-red-500 h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-800">{uni.name}</span>
                    <span className="ml-2 text-[11px] text-slate-400">{uni.country}</span>
                  </div>
                </div>
                {hasConflict && (
                  <input
                    className={`${inp} mt-2 text-[12px]`}
                    value={uniConflicts[uni.id]?.reason ?? ''}
                    onChange={(ev) => setUniReason(uni.id, ev.target.value)}
                    placeholder="Brief reason (optional)"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* No conflicts notice */}
      {totalConflicts === 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-[12px] text-blue-700">
            No conflicts declared — you will be assigned to score all teams in your track.
          </p>
        </div>
      )}

      {/* Confirmation checkbox */}
      <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
        f.coiConfirmed ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}>
        <input
          type="checkbox"
          checked={f.coiConfirmed}
          onChange={(ev) => set('coiConfirmed', ev.target.checked)}
          className="mt-0.5 h-4 w-4 accent-blue-600 shrink-0"
        />
        <p className="text-[12px] text-slate-700 leading-relaxed">
          I confirm that all conflicts have been declared accurately. I understand that undisclosed
          conflicts may result in score invalidation.
        </p>
      </label>
      {e.coi && <p className={errCls}>{e.coi}</p>}
    </div>
  )
}

// ── Step 4: Rubric Acknowledgment ─────────────────────────────────────────────

function Step4({
  f, set, rubricScrolled, setRubricScrolled, e, track,
}: {
  f: JF
  set: (k: keyof JF, v: string | boolean) => void
  rubricScrolled: boolean
  setRubricScrolled: (v: boolean) => void
  e: Err
  track?: string
}) {
  const rubricRef = useRef<HTMLDivElement>(null)

  function handleScroll() {
    const el = rubricRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
      setRubricScrolled(true)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Please read the scoring rubric carefully before acknowledging.
      </p>

      {/* Rubric card */}
      <div
        ref={rubricRef}
        onScroll={handleScroll}
        className="relative max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">GSSF Worlds 2026 — Judging Rubric</h3>
            {track && <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Track {track}</span>}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Dimension</th>
                <th className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">Weight</th>
                <th className="py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">Scale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['Innovation',          '30%', '1–10'],
                ['Market Opportunity',  '25%', '1–10'],
                ['Team',                '25%', '1–10'],
                ['Traction',            '20%', '1–10'],
              ].map(([dim, wt, sc]) => (
                <tr key={dim}>
                  <td className="py-2.5 font-medium text-slate-700">{dim}</td>
                  <td className="py-2.5 text-center text-slate-600">{wt}</td>
                  <td className="py-2.5 text-right text-slate-600">{sc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[12px] font-semibold text-slate-600">Total score</p>
            <p className="text-[12px] text-slate-500 mt-0.5">Weighted sum, maximum 10.0</p>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-slate-700">Tie-break Protocol</p>
            <p className="mt-1 text-[12px] text-slate-500 leading-relaxed">
              In the event of a tie, Innovation score takes precedence. If still tied, Team score is
              used. The final tie-break is a panel discussion among all track judges.
            </p>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-slate-700">Score Confidentiality</p>
            <p className="mt-1 text-[12px] text-slate-500 leading-relaxed">
              Individual judge scores are hidden until all judges in a track have submitted. Scores
              are final once the ADMIN closes scoring for a track.
            </p>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      {!rubricScrolled && (
        <p className="text-center text-[12px] text-slate-400">↓ Scroll to read the full rubric</p>
      )}

      {/* Acknowledgment checkbox */}
      <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
        rubricScrolled
          ? f.rubricAcked
            ? 'border-green-300 bg-green-50'
            : 'border-slate-200 bg-white hover:bg-slate-50'
          : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-50'
      }`}>
        <input
          type="checkbox"
          checked={f.rubricAcked}
          disabled={!rubricScrolled}
          onChange={(ev) => set('rubricAcked', ev.target.checked)}
          className="mt-0.5 h-4 w-4 accent-blue-600 shrink-0"
        />
        <p className="text-[12px] text-slate-700 leading-relaxed">
          I have read and understood the GSSF Worlds 2026 scoring rubric, including dimension weights,
          the tie-break protocol, and the score confidentiality policy.
        </p>
      </label>
      {e.rubric && <p className={errCls}>{e.rubric}</p>}
    </div>
  )
}

// ── Step 5: Logistics ─────────────────────────────────────────────────────────

function Step5({ f, set, e }: { f: JF; set: (k: keyof JF, v: string | boolean) => void; e: Err }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <F><Label>T-Shirt Size</Label>
          <Select value={f.tshirt || undefined} onValueChange={(v) => v && set('tshirt', v)}>
            <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>{['XS','S','M','L','XL','XXL'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select></F>
        <F><Label>Dietary Restrictions</Label>
          <Select value={f.dietary || undefined} onValueChange={(v) => v && set('dietary', v)}>
            <SelectTrigger className="w-full h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {['None','Vegetarian','Vegan','Halal','Kosher','Gluten-Free','Other'].map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select></F>
      </div>
      {f.dietary === 'Other' && (
        <F><Label>Describe your dietary needs</Label>
          <input className={inp} value={f.dietaryOther} onChange={(ev) => set('dietaryOther', ev.target.value)} placeholder="Describe your restrictions" /></F>
      )}
      <div className="grid grid-cols-2 gap-3">
        <F><Label required>Emergency Contact Name</Label>
          <input className={inp} value={f.emergencyName} onChange={(ev) => set('emergencyName', ev.target.value)} placeholder="Full name" />
          <FErr msg={e.emergencyName} /></F>
        <F><Label required>Emergency Contact Phone</Label>
          <input className={inp} value={f.emergencyPhone} onChange={(ev) => set('emergencyPhone', ev.target.value)} placeholder="+1 555 000 0000" />
          <FErr msg={e.emergencyPhone} /></F>
      </div>
      <F><Label>Accessibility Needs</Label>
        <textarea className={`${inp} min-h-[60px] resize-none`} value={f.accessibility}
          onChange={(ev) => set('accessibility', ev.target.value)} placeholder="Any accessibility requirements? (optional)" /></F>

      <div className="pt-2 border-t border-slate-100">
        <F><Label>Do you require a visa to travel to South Korea?</Label>
          <div className="mt-1 flex gap-5">
            {['Yes','No','Not sure'].map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="j_needsVisa" value={opt} checked={f.needsVisa === opt}
                  onChange={() => set('needsVisa', opt)} className="accent-blue-600" />
                <span className="text-sm text-slate-700">{opt}</span>
              </label>
            ))}
          </div></F>
        {(f.needsVisa === 'Yes' || f.needsVisa === 'Not sure') && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Passport Details</p>
            <F><Label required>Full Legal Name</Label>
              <input className={inp} value={f.fullLegalName} onChange={(ev) => set('fullLegalName', ev.target.value)} placeholder="As on passport" />
              <FErr msg={e.fullLegalName} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F><Label required>Passport Number</Label>
                <input className={inp} value={f.passportNumber} onChange={(ev) => set('passportNumber', ev.target.value)} placeholder="A12345678" />
                <FErr msg={e.passportNumber} /></F>
              <F><Label required>Issuing Country</Label>
                <Select value={f.issuingCountry || undefined} onValueChange={(v) => v && set('issuingCountry', v)}>
                  <SelectTrigger className="w-full h-9"><SelectValue placeholder="Country…" /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <FErr msg={e.issuingCountry} /></F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F><Label required>Passport Expiry</Label>
                <input type="date" className={inp} value={f.passportExpiry} onChange={(ev) => set('passportExpiry', ev.target.value)} />
                <FErr msg={e.passportExpiry} /></F>
              <F><Label required>Date of Birth</Label>
                <input type="date" className={inp} value={f.dateOfBirth} onChange={(ev) => set('dateOfBirth', ev.target.value)} />
                <FErr msg={e.dateOfBirth} /></F>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Step 6: Confirm ───────────────────────────────────────────────────────────

function Step6({ f, teamConflicts, uniConflicts, track }: { f: JF; teamConflicts: TeamConflicts; uniConflicts: UniConflicts; track?: string }) {
  const conflictedTeams = ALL_TEAMS.filter((t) => teamConflicts[t.teamId])
  const conflictedUnis  = ALL_UNIVERSITIES.filter((u) => uniConflicts[u.id])
  const rows = [
    ['Name', `${f.firstName} ${f.lastName}`],
    ['Email', f.email],
    ['Organization', f.organization || '—'],
    ['Title', f.jobTitle || '—'],
    ['Track Assignment', track ? `Track ${track}` : '—'],
    ['Conflicts (Teams)', conflictedTeams.length > 0 ? conflictedTeams.map((t) => t.name).join(', ') : 'None'],
    ['Conflicts (Universities)', conflictedUnis.length > 0 ? conflictedUnis.map((u) => u.name).join(', ') : 'None'],
    ['Rubric Acknowledged', f.rubricAcked ? '✓ Yes' : '—'],
    ['Visa Required', f.needsVisa || '—'],
    ['Passport', f.passportNumber ? 'On file' : '—'],
  ]
  return (
    <div className="space-y-1">
      <p className="mb-4 text-sm text-slate-500">Review your information before submitting.</p>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between border-b border-slate-100 py-2 last:border-0">
          <span className="text-sm text-slate-400">{label}</span>
          <span className="max-w-[280px] text-right text-sm font-medium text-slate-800">{value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TITLES = [
  { title: 'Personal Information',           subtitle: 'Tell us about yourself.' },
  { title: 'Professional Background',        subtitle: 'Your role and organization.' },
  { title: 'Conflict of Interest',           subtitle: 'Declare any conflicts before scoring opens.' },
  { title: 'Scoring Rubric',                 subtitle: 'Acknowledge the judging rubric.' },
  { title: 'Logistics & Travel',             subtitle: 'Dietary, emergency contact, and visa details.' },
  { title: 'Confirm & Submit',               subtitle: 'Review your judge profile before submitting.' },
]

type InviteContext = { email: string; role: string; programId: string; teamId?: string; track?: string }

function JudgeOnboardingContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [form, setFormState] = useState<JF>(INIT)
  const [teamConflicts, setTeamConflicts] = useState<TeamConflicts>({})
  const [uniConflicts, setUniConflicts]   = useState<UniConflicts>({})
  const [rubricScrolled, setRubricScrolled] = useState(false)
  const [rubricAckedAt, setRubricAckedAt]   = useState('')
  const [errors, setErrors] = useState<Err>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [inviteContext, setInviteContext] = useState<InviteContext | null>(null)
  const [inviteError, setInviteError] = useState(false)

  useEffect(() => {
    if (!token) { setInviteError(true); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any).rpc('get_invite_by_token', { invite_token: token })
      .then(({ data, error }: { data: Record<string, unknown>[] | null; error: unknown }) => {
        if (error || !data || data.length === 0) {
          setInviteError(true)
        } else {
          const invite = data[0] as Record<string, string | null>
          const ctx: InviteContext = {
            email: invite.email ?? '',
            role: invite.role ?? '',
            programId: invite.program_id ?? '',
            teamId: invite.team_id ?? undefined,
            track: invite.track ?? undefined,
          }
          setInviteContext(ctx)
          set('email', ctx.email)
        }
      })
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold text-slate-900">Invalid or expired invite</h2>
          <p className="text-sm text-slate-500 mt-2">
            This invite link is no longer valid. Please contact your program organizer for a new invite.
          </p>
        </div>
      </div>
    )
  }

  if (!inviteContext) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  const track = inviteContext.track

  function set(key: keyof JF, value: string | boolean) {
    setFormState((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: undefined }))
    // Timestamp rubric ack
    if (key === 'rubricAcked' && value === true && !rubricAckedAt) {
      setRubricAckedAt(new Date().toISOString())
    }
  }

  function validate(s: number): boolean {
    const e: Err = {}
    if (s === 0) {
      if (!form.firstName) e.firstName = 'Required'
      if (!form.lastName)  e.lastName  = 'Required'
      if (!form.nationality) e.nationality = 'Required'
      if (!form.country)     e.country     = 'Required'
    }
    if (s === 1) {
      if (!form.organization)    e.organization    = 'Required'
      if (!form.jobTitle)        e.jobTitle        = 'Required'
      if (!form.vertical)        e.vertical        = 'Required'
      if (!form.yearsExperience) e.yearsExperience = 'Required'
      if (!form.geoFocus)        e.geoFocus        = 'Required'
      if (!form.linkedin)        e.linkedin        = 'Required'
      if (!form.proBio)          e.proBio          = 'Required'
    }
    if (s === 2) {
      if (!form.coiConfirmed) e.coi = 'You must confirm your conflict declarations to proceed'
    }
    if (s === 3) {
      if (!form.rubricAcked) e.rubric = 'You must acknowledge the rubric to proceed'
    }
    if (s === 4) {
      if (!form.emergencyName)  e.emergencyName  = 'Required'
      if (!form.emergencyPhone) e.emergencyPhone = 'Required'
      if (form.needsVisa === 'Yes' || form.needsVisa === 'Not sure') {
        if (!form.fullLegalName)  e.fullLegalName  = 'Required'
        if (!form.passportNumber) e.passportNumber = 'Required'
        if (!form.passportExpiry) e.passportExpiry = 'Required'
        if (!form.dateOfBirth)    e.dateOfBirth    = 'Required'
        if (!form.issuingCountry) e.issuingCountry = 'Required'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() { if (validate(step)) setStep((s) => s + 1) }

  async function handleSubmit() {
    const ackedAt = rubricAckedAt || new Date().toISOString()
    setRubricAckedAt(ackedAt)
    try {
      await submitOnboarding({
        token: token!,
        fullName: `${form.firstName} ${form.lastName}`,
        nationality: form.nationality,
        countryOfResidence: form.country,
        bio: form.bio || undefined,
        linkedinUrl: form.linkedin || undefined,
        organizationName: form.organization || undefined,
        jobTitle: form.jobTitle || undefined,
        needsVisa: form.needsVisa === 'Yes',
        passportNumber: form.passportNumber || undefined,
        passportExpiry: form.passportExpiry || undefined,
        passportIssuingCountry: form.issuingCountry || undefined,
        legalName: form.fullLegalName || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        dietaryRestrictions: form.dietary === 'Other' ? form.dietaryOther : form.dietary || undefined,
        tshirtSize: form.tshirt || undefined,
        emergencyContactName: form.emergencyName || undefined,
        emergencyContactPhone: form.emergencyPhone || undefined,
        arrivalDate: form.arrivalDate || undefined,
        departurCity: form.departingCity || undefined,
        flightBooked: form.flightBooked === 'Yes',
        accessibilityNeeds: form.accessibility || undefined,
        industryVertical: form.vertical || undefined,
        geographicFocus: form.geoFocus || undefined,
        yearsExperience: form.yearsExperience || undefined,
        conflictTeamIds: Object.keys(teamConflicts),
        conflictUniversityIds: Object.keys(uniConflicts),
        conflictReasons: {
          ...Object.fromEntries(Object.entries(teamConflicts).map(([k, v]) => [k, v.reason])),
          ...Object.fromEntries(Object.entries(uniConflicts).map(([k, v]) => [k, v.reason])),
        },
      })
      setSubmitted(true)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    }
  }

  if (submitted) {
    return (
      <SuccessCard
        firstName={form.firstName}
        email={form.email}
        teamConflicts={teamConflicts}
        uniConflicts={uniConflicts}
        rubricAckedAt={rubricAckedAt}
      />
    )
  }

  const steps = [
    <Step1 key={0} f={form} set={set} e={errors} track={track} />,
    <Step2 key={1} f={form} set={set} e={errors} />,
    <Step3 key={2} f={form} set={set} teamConflicts={teamConflicts} setTeamConflicts={setTeamConflicts} uniConflicts={uniConflicts} setUniConflicts={setUniConflicts} e={errors} />,
    <Step4 key={3} f={form} set={set} rubricScrolled={rubricScrolled} setRubricScrolled={setRubricScrolled} e={errors} track={track} />,
    <Step5 key={4} f={form} set={set} e={errors} />,
    <Step6 key={5} f={form} teamConflicts={teamConflicts} uniConflicts={uniConflicts} track={track} />,
  ]

  return (
    <StepForm
      steps={STEPS}
      currentStep={step}
      title={TITLES[step].title}
      subtitle={TITLES[step].subtitle}
      onNext={handleNext}
      onBack={() => setStep((s) => s - 1)}
      onSubmit={handleSubmit}
      isFirstStep={step === 0}
      isLastStep={step === STEPS.length - 1}
      submitLabel="Complete Onboarding"
    >
      {steps[step]}
      {submitError && (
        <p className="mt-3 text-sm text-red-500">{submitError}</p>
      )}
    </StepForm>
  )
}

export default function JudgeOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>}>
      <JudgeOnboardingContent />
    </Suspense>
  )
}
