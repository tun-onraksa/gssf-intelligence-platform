'use client'

import { useState, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Star, Phone, Mail, ChevronRight, X, Pencil, Check, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateUniversity } from '@/lib/actions/records'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DbUniversity {
  id: string
  name: string
  country: string
  active_status: boolean | null
  cohort_history: number[] | null
  status: string | null
  team_count: number | null
  poc_name: string | null
  poc_title: string | null
  poc_email: string | null
  poc_phone: string | null
  notes: string | null
}

interface Props {
  universities: DbUniversity[]
  teamsByUniversity: Record<string, string[]>  // lowercased university name → team names
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  'united states': '🇺🇸', 'usa': '🇺🇸', 'us': '🇺🇸',
  'india': '🇮🇳',
  'south korea': '🇰🇷', 'korea': '🇰🇷',
  'finland': '🇫🇮',
  'united kingdom': '🇬🇧', 'uk': '🇬🇧', 'england': '🇬🇧',
  'singapore': '🇸🇬',
  'switzerland': '🇨🇭',
  'israel': '🇮🇱',
  'canada': '🇨🇦',
  'hong kong': '🇭🇰',
  'china': '🇨🇳',
  'japan': '🇯🇵',
  'taiwan': '🇹🇼',
  'germany': '🇩🇪',
  'france': '🇫🇷',
  'uae': '🇦🇪', 'united arab emirates': '🇦🇪',
  'australia': '🇦🇺',
  'new zealand': '🇳🇿',
  'brazil': '🇧🇷',
  'mexico': '🇲🇽',
  'indonesia': '🇮🇩',
  'malaysia': '🇲🇾',
  'thailand': '🇹🇭',
  'philippines': '🇵🇭',
  'vietnam': '🇻🇳',
  'pakistan': '🇵🇰',
  'bangladesh': '🇧🇩',
  'sri lanka': '🇱🇰',
  'nepal': '🇳🇵',
  'egypt': '🇪🇬',
  'nigeria': '🇳🇬',
  'kenya': '🇰🇪',
  'ghana': '🇬🇭',
  'south africa': '🇿🇦',
  'saudi arabia': '🇸🇦',
  'turkey': '🇹🇷',
  'iran': '🇮🇷',
  'jordan': '🇯🇴',
  'lebanon': '🇱🇧',
  'spain': '🇪🇸',
  'italy': '🇮🇹',
  'netherlands': '🇳🇱',
  'sweden': '🇸🇪',
  'norway': '🇳🇴',
  'denmark': '🇩🇰',
  'poland': '🇵🇱',
  'austria': '🇦🇹',
  'belgium': '🇧🇪',
  'portugal': '🇵🇹',
  'czech republic': '🇨🇿',
  'russia': '🇷🇺',
  'ukraine': '🇺🇦',
  'greece': '🇬🇷',
  'hungary': '🇭🇺',
  'romania': '🇷🇴',
  'colombia': '🇨🇴',
  'chile': '🇨🇱',
  'argentina': '🇦🇷',
  'peru': '🇵🇪',
}

function getFlag(country: string): string {
  return FLAG_MAP[country.toLowerCase()] ?? '🌍'
}

function getRegion(country: string): string {
  const c = country.toLowerCase()
  if (['united states', 'usa', 'us', 'canada', 'mexico'].includes(c)) return 'North America'
  if (['brazil', 'colombia', 'chile', 'argentina', 'peru'].includes(c)) return 'South America'
  if (['united kingdom', 'uk', 'england', 'finland', 'switzerland', 'germany', 'france', 'spain', 'italy',
       'netherlands', 'sweden', 'norway', 'denmark', 'poland', 'austria', 'belgium', 'portugal',
       'czech republic', 'russia', 'ukraine', 'greece', 'hungary', 'romania'].includes(c)) return 'Europe'
  if (['india', 'south korea', 'korea', 'singapore', 'china', 'hong kong', 'israel', 'japan',
       'taiwan', 'indonesia', 'malaysia', 'thailand', 'philippines', 'vietnam', 'pakistan',
       'bangladesh', 'sri lanka', 'nepal'].includes(c)) return 'Asia'
  if (['uae', 'united arab emirates', 'saudi arabia', 'turkey', 'iran', 'jordan', 'lebanon', 'egypt'].includes(c)) return 'Middle East'
  if (['nigeria', 'kenya', 'ghana', 'south africa'].includes(c)) return 'Africa'
  if (['australia', 'new zealand'].includes(c)) return 'Oceania'
  return 'Other'
}

const isMultiYear = (u: DbUniversity) => (u.cohort_history?.length ?? 0) >= 3

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? '').toLowerCase()
  const map: Record<string, string> = {
    confirmed:  'bg-green-100 text-green-700',
    invited:    'bg-blue-100 text-blue-700',
    pending:    'bg-amber-100 text-amber-700',
    declined:   'bg-red-100 text-red-700',
    inactive:   'bg-slate-100 text-slate-500',
  }
  const cls = map[s] ?? 'bg-slate-100 text-slate-500'
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${cls}`}>
      {status ?? 'Unknown'}
    </span>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function UniversityModal({ university, teams, onClose }: { university: DbUniversity | null; teams: string[]; onClose: () => void }) {
  const router = useRouter()
  const multi = isMultiYear(university ?? { cohort_history: [] } as unknown as DbUniversity)
  const hasPoc = !!(university?.poc_name || university?.poc_email)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<DbUniversity>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { if (editing) { setEditing(false) } else { onClose() } } }
    if (university) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [university, onClose, editing])

  useEffect(() => { setEditing(false); setDraft({}); setError(null) }, [university])

  if (!university) return null

  function startEdit() { setDraft({ ...university }); setEditing(true) }
  function cancelEdit() { setEditing(false); setDraft({}); setError(null) }
  function set(field: keyof DbUniversity, value: unknown) { setDraft((d) => ({ ...d, [field]: value })) }

  async function save() {
    setSaving(true); setError(null)
    try {
      await updateUniversity(university!.id, {
        name: draft.name ?? undefined,
        country: draft.country ?? undefined,
        status: draft.status ?? undefined,
        team_count: draft.team_count != null ? Number(draft.team_count) : undefined,
        poc_name: draft.poc_name ?? undefined,
        poc_email: draft.poc_email ?? undefined,
        poc_title: draft.poc_title ?? undefined,
        poc_phone: draft.poc_phone ?? undefined,
        notes: draft.notes ?? undefined,
      })
      setEditing(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const val = (field: keyof DbUniversity) => editing ? (draft[field] as string ?? '') : (university[field] as string ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className={`shrink-0 border-b px-6 py-5 ${multi ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {multi && <Star size={15} className="fill-amber-400 text-amber-500" />}
                <h2 className="text-[20px] font-bold text-slate-900">{university.name}</h2>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
                {getFlag(university.country)} {university.country} · {getRegion(university.country)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {university.status && <StatusBadge status={university.status} />}
                {multi && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    <Star size={9} className="fill-amber-500 text-amber-500" /> Multi-year Partner
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!editing ? (
                <button onClick={startEdit} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700" title="Edit">
                  <Pencil size={15} />
                </button>
              ) : (
                <>
                  <button onClick={cancelEdit} className="shrink-0 rounded-lg px-2.5 py-1 text-[12px] text-slate-500 hover:bg-slate-200">Cancel</button>
                  <button onClick={save} disabled={saving} className="shrink-0 flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                  </button>
                </>
              )}
              <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">

          {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-600">{error}</p>}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Teams</p>
              {editing ? (
                <input type="number" value={draft.team_count ?? ''} onChange={(e) => set('team_count', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="mt-0.5 text-[24px] font-bold text-slate-900">{teams.length || university.team_count || '—'}</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
              {editing ? (
                <input value={val('status')} onChange={(e) => set('status', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="mt-0.5 text-[14px] font-semibold text-slate-700 capitalize">{university.status ?? '—'}</p>
              )}
            </div>
          </div>

          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">University Name</p>
                <input value={val('name')} onChange={(e) => set('name', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Country</p>
                <input value={val('country')} onChange={(e) => set('country', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {/* POC */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Point of Contact</p>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                {[['poc_name','Name'],['poc_title','Title'],['poc_email','Email'],['poc_phone','Phone']].map(([field, label]) => (
                  <div key={field}>
                    <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
                    <input value={val(field as keyof DbUniversity)} onChange={(e) => set(field as keyof DbUniversity, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
            ) : hasPoc ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-[13px] font-bold text-white">
                    {initials(university.poc_name ?? '?')}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {university.poc_name && <p className="text-[13px] font-semibold text-slate-800">{university.poc_name}</p>}
                    {university.poc_title && <p className="text-[12px] text-slate-500">{university.poc_title}</p>}
                    {university.poc_email && (
                      <a href={`mailto:${university.poc_email}`} className="flex items-center gap-1.5 text-[12px] text-blue-600 hover:underline">
                        <Mail size={11} /> {university.poc_email}
                      </a>
                    )}
                    {university.poc_phone && (
                      <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <Phone size={11} /> {university.poc_phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-[12px] text-slate-400">No POC on record</div>
            )}
          </div>

          {/* Notes */}
          {(university.notes || editing) && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notes</p>
              {editing ? (
                <textarea value={val('notes')} onChange={(e) => set('notes', e.target.value)} rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              ) : (
                <p className="rounded-xl border border-slate-200 bg-white p-4 text-[13px] leading-relaxed text-slate-700">{university.notes}</p>
              )}
            </div>
          )}

          {/* Teams */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Teams at GSSF Worlds 2026</p>
            {teams.length > 0 ? (
              <div className="space-y-2">
                {teams.map((name) => (
                  <div key={name} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                    <span className="text-[13px] font-medium text-slate-800">{name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate-400">No teams on record</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function UniversitiesClient({ universities, teamsByUniversity }: Props) {
  const [search, setSearch]           = useState('')
  const [region, setRegion]           = useState('All')
  const [multiYearOnly, setMultiYearOnly] = useState(false)
  const [hasPocOnly, setHasPocOnly]   = useState(false)
  const [selected, setSelected]       = useState<DbUniversity | null>(null)

  const countryCount   = new Set(universities.map((u) => u.country)).size
  const multiYearCount = universities.filter(isMultiYear).length
  const totalTeams     = universities.reduce((sum, u) => sum + (u.team_count ?? 0), 0)

  const filtered = useMemo(() => {
    return universities
      .filter((u) => {
        if (search) {
          const q = search.toLowerCase()
          if (!u.name.toLowerCase().includes(q) && !u.country.toLowerCase().includes(q)) return false
        }
        if (region !== 'All' && getRegion(u.country) !== region) return false
        if (multiYearOnly && !isMultiYear(u)) return false
        if (hasPocOnly && !u.poc_name && !u.poc_email) return false
        return true
      })
      .sort((a, b) => {
        const aLen = a.cohort_history?.length ?? 0
        const bLen = b.cohort_history?.length ?? 0
        if (bLen !== aLen) return bLen - aLen
        return a.name.localeCompare(b.name)
      })
  }, [universities, search, region, multiYearOnly, hasPocOnly])

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Universities</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">
            {universities.length} partner universities · {totalTeams} teams across GSSF Worlds 2026
          </p>
        </div>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-600">
        <span className="flex items-center gap-1.5"><span>🏛</span><strong>{universities.length}</strong> Universities</span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1.5"><span>🌍</span><strong>{countryCount}</strong> Countries</span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1.5"><span>⭐</span><strong>{multiYearCount}</strong> Multi-year Partners</span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1.5"><span>👥</span><strong>{totalTeams}</strong> Teams</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <Select value={region} onValueChange={(v) => v && setRegion(v)}>
          <SelectTrigger className="h-8 w-[150px] text-[13px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            {['All', 'North America', 'South America', 'Europe', 'Asia', 'Middle East', 'Africa', 'Oceania', 'Other'].map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => setMultiYearOnly((v) => !v)}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors ${
            multiYearOnly ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Star size={12} className={multiYearOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} />
          Multi-year only
        </button>
        <button
          onClick={() => setHasPocOnly((v) => !v)}
          className={`h-8 rounded-lg border px-3 text-[12px] font-medium transition-colors ${
            hasPocOnly ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Has POC
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
              {['University', 'Region', 'Teams', 'Status', 'POC', 'Notes', 'Team Names'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((uni, i) => {
              const multi = isMultiYear(uni)
              return (
                <tr
                  key={uni.id}
                  onClick={() => setSelected(uni)}
                  className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                    i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                  } ${multi ? 'border-l-[3px] border-l-amber-400' : ''}`}
                >
                  {/* University */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {multi && <Star size={11} className="shrink-0 fill-amber-400 text-amber-400" />}
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">{uni.name}</p>
                        <p className="text-[11px] text-slate-400">{getFlag(uni.country)} {uni.country}</p>
                      </div>
                    </div>
                  </td>
                  {/* Region */}
                  <td className="px-4 py-3 text-[12px] text-slate-500">{getRegion(uni.country)}</td>
                  {/* Teams */}
                  <td className="px-4 py-3 text-[13px] font-semibold text-slate-700">
                    {uni.team_count ?? <span className="text-slate-300">—</span>}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    {uni.status ? <StatusBadge status={uni.status} /> : <span className="text-[12px] text-slate-300">—</span>}
                  </td>
                  {/* POC */}
                  <td className="px-4 py-3">
                    {uni.poc_name ? (
                      <div>
                        <p className="text-[12px] font-medium text-slate-700">{uni.poc_name}</p>
                        {uni.poc_email && <p className="text-[11px] text-slate-400">{uni.poc_email}</p>}
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-300">—</span>
                    )}
                  </td>
                  {/* Notes */}
                  <td className="max-w-[180px] px-4 py-3">
                    {uni.notes ? (
                      <p className="truncate text-[12px] text-slate-500">{uni.notes}</p>
                    ) : (
                      <span className="text-[12px] text-slate-300">—</span>
                    )}
                  </td>
                  {/* Team Names */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {(teamsByUniversity[uni.name.toLowerCase()] ?? []).map((t) => (
                          <span key={t} className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">{t}</span>
                        ))}
                        {!(teamsByUniversity[uni.name.toLowerCase()]?.length) && (
                          <span className="text-[12px] text-slate-300">—</span>
                        )}
                      </div>
                      <ChevronRight size={13} className="shrink-0 text-slate-300" />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[13px] text-slate-400">No universities match your filters.</div>
        )}
      </div>

      <UniversityModal
        university={selected}
        teams={selected ? (teamsByUniversity[selected.name.toLowerCase()] ?? []) : []}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
