'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, X, Mail, Phone, ChevronRight, Pencil, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateSponsor } from '@/lib/actions/records'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Sponsor {
  id: string
  name: string
  sponsorship: string | null
  status: string | null
  reach: string | null
  notes: string | null
  logo_url: string | null
  poc_name: string | null
  poc_title: string | null
  poc_email: string | null
  poc_phone: string | null
  poc_notes: string | null
}

interface Props {
  sponsors: Sponsor[]
}

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { bg: string; text: string; border: string; avatar: string }> = {
  'global founding partner': { bg: 'bg-yellow-50',  text: 'text-yellow-800', border: 'border-yellow-300', avatar: 'bg-yellow-500'  },
  'regional university host': { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   avatar: 'bg-blue-500'    },
  'founders table':           { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', avatar: 'bg-violet-500'  },
  'host sponsor':             { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',avatar: 'bg-emerald-500' },
  'prize sponsor':            { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', avatar: 'bg-orange-500'  },
  'partner':                  { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200',   avatar: 'bg-rose-500'    },
}

const DEFAULT_TIER = { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', avatar: 'bg-slate-400' }

function getTierConfig(tier: string | null) {
  if (!tier) return DEFAULT_TIER
  const key = tier.toLowerCase()
  return Object.entries(TIER_CONFIG).find(([k]) => key.includes(k))?.[1] ?? DEFAULT_TIER
}

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null
  const cfg = getTierConfig(tier)
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {tier}
    </span>
  )
}

function SponsorAvatar({ name, tier, size = 'sm' }: { name: string; tier: string | null; size?: 'sm' | 'lg' }) {
  const cfg = getTierConfig(tier)
  const dim = size === 'lg' ? 'h-10 w-10 text-base rounded-lg' : 'h-7 w-7 text-[11px] rounded-full'
  return (
    <div className={`flex shrink-0 items-center justify-center font-bold text-white ${dim} ${cfg.avatar}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-[12px] text-slate-300">—</span>
  const s = status.toLowerCase()
  const { bg, text, dot } = s.includes('confirmed') || s.includes('active')
    ? { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  }
    : s.includes('pending') || s.includes('prospect') || s.includes('negotiat')
    ? { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' }
    : s.includes('declined') || s.includes('inactive') || s.includes('lost')
    ? { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    }
    : { bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400'  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${bg} ${text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function SponsorModal({ sponsor, onClose }: { sponsor: Sponsor; onClose: () => void }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<Sponsor>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (editing) { cancelEdit() } else { onClose() } } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, editing])

  useEffect(() => { setEditing(false); setDraft({}); setError(null) }, [sponsor])

  function startEdit() { setDraft({ ...sponsor }); setEditing(true) }
  function cancelEdit() { setEditing(false); setDraft({}); setError(null) }
  function set(field: keyof Sponsor, value: string) { setDraft((d) => ({ ...d, [field]: value })) }
  function v(field: keyof Sponsor) { return editing ? (draft[field] as string ?? '') : (sponsor[field] as string ?? '') }

  async function save() {
    setSaving(true); setError(null)
    try {
      await updateSponsor(sponsor.id, {
        name: draft.name ?? undefined, sponsorship: draft.sponsorship ?? undefined,
        status: draft.status ?? undefined, reach: draft.reach ?? undefined,
        notes: draft.notes ?? undefined, poc_name: draft.poc_name ?? undefined,
        poc_email: draft.poc_email ?? undefined, poc_title: draft.poc_title ?? undefined,
        poc_phone: draft.poc_phone ?? undefined, poc_notes: draft.poc_notes ?? undefined,
      })
      setEditing(false); router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  const F = ({ label, field, textarea }: { label: string; field: keyof Sponsor; textarea?: boolean }) => (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      {textarea
        ? <textarea value={v(field)} onChange={(e) => set(field, e.target.value)} rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        : <input value={v(field)} onChange={(e) => set(field, e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
      }
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <SponsorAvatar name={editing ? (draft.name || sponsor.name) : sponsor.name} tier={editing ? (draft.sponsorship ?? sponsor.sponsorship) : sponsor.sponsorship} size="lg" />
            <div>
              {editing
                ? <input value={v('name')} onChange={(e) => set('name', e.target.value)}
                    className="text-[15px] font-semibold text-slate-900 border-b border-blue-400 focus:outline-none bg-transparent w-full" />
                : <h2 className="text-[15px] font-semibold text-slate-900">{sponsor.name}</h2>
              }
              {editing
                ? <input value={v('sponsorship')} onChange={(e) => set('sponsorship', e.target.value)} placeholder="Tier"
                    className="mt-0.5 text-[12px] text-slate-500 border-b border-slate-200 focus:outline-none bg-transparent w-full" />
                : <TierBadge tier={sponsor.sponsorship} />
              }
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!editing
              ? <button onClick={startEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" title="Edit"><Pencil size={14} /></button>
              : <>
                  <button onClick={cancelEdit} className="rounded-lg px-2.5 py-1 text-[12px] text-slate-500 hover:bg-slate-100">Cancel</button>
                  <button onClick={save} disabled={saving} className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                  </button>
                </>
            }
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-600">{error}</p>}

          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <F label="Status" field="status" />
                <F label="Reach / Audience" field="reach" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Point of Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Name" field="poc_name" />
                  <F label="Title" field="poc_title" />
                  <F label="Email" field="poc_email" />
                  <F label="Phone" field="poc_phone" />
                  <div className="col-span-2"><F label="Contact Notes" field="poc_notes" textarea /></div>
                </div>
              </div>
              <F label="Notes" field="notes" textarea />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Status</p>
                  <StatusBadge status={sponsor.status} />
                </div>
                {sponsor.reach && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Reach / Audience</p>
                    <p className="text-[13px] text-slate-700">{sponsor.reach}</p>
                  </div>
                )}
              </div>
              {(sponsor.poc_name || sponsor.poc_email || sponsor.poc_phone) && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Point of Contact</p>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1.5">
                    {sponsor.poc_name && <p className="text-[13px] font-medium text-slate-800">{sponsor.poc_name}{sponsor.poc_title && <span className="ml-1.5 text-[12px] font-normal text-slate-500">· {sponsor.poc_title}</span>}</p>}
                    {sponsor.poc_email && <a href={`mailto:${sponsor.poc_email}`} className="flex items-center gap-2 text-[12px] text-blue-600 hover:underline"><Mail size={12} /> {sponsor.poc_email}</a>}
                    {sponsor.poc_phone && <p className="flex items-center gap-2 text-[12px] text-slate-500"><Phone size={12} /> {sponsor.poc_phone}</p>}
                    {sponsor.poc_notes && <p className="text-[12px] text-slate-500 italic">{sponsor.poc_notes}</p>}
                  </div>
                </div>
              )}
              {sponsor.notes && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Notes</p>
                  <p className="text-[13px] text-slate-600 whitespace-pre-wrap">{sponsor.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function SponsorsClient({ sponsors }: Props) {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Sponsor | null>(null)

  const tiers = useMemo(() => {
    const set = new Set(sponsors.map((s) => s.sponsorship).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [sponsors])

  const statuses = useMemo(() => {
    const set = new Set(sponsors.map((s) => s.status).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [sponsors])

  const filtered = useMemo(() => {
    return sponsors.filter((s) => {
      const q = search.toLowerCase()
      if (q && !s.name.toLowerCase().includes(q) && !(s.poc_name ?? '').toLowerCase().includes(q)) return false
      if (tierFilter !== 'all' && s.sponsorship !== tierFilter) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      return true
    })
  }, [sponsors, search, tierFilter, statusFilter])

  const isFiltered = search || tierFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-slate-900">Sponsors</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''} · GSSF Worlds 2026</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sponsors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-[220px]"
          />
        </div>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Tiers</option>
          {tiers.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {isFiltered && (
          <button
            onClick={() => { setSearch(''); setTierFilter('all'); setStatusFilter('all') }}
            className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="text-[12px] font-medium text-slate-500">
            {filtered.length} of {sponsors.length} sponsors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-white">
              <tr>
                <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sponsor</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tier</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">POC</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reach</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-slate-400">
                    {sponsors.length === 0 ? 'No sponsors imported yet.' : 'No sponsors match the current filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/40 ${
                      i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <SponsorAvatar name={s.name} tier={s.sponsorship} size="sm" />
                        <span className="text-[13px] font-medium text-slate-800">{s.name}</span>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3">
                      <TierBadge tier={s.sponsorship} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>

                    {/* POC */}
                    <td className="px-4 py-3">
                      {s.poc_name ? (
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-slate-700 truncate max-w-[140px]">{s.poc_name}</p>
                          {s.poc_email && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{s.poc_email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-300">—</span>
                      )}
                    </td>

                    {/* Reach */}
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-500 truncate block max-w-[120px]">
                        {s.reach ?? '—'}
                      </span>
                    </td>

                    {/* Arrow */}
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className="text-slate-300" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <SponsorModal sponsor={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
