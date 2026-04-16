'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, X, Mail, Phone, ChevronRight, ExternalLink, Pencil, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updatePass } from '@/lib/actions/records'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Pass {
  id: string
  full_name: string
  category: string | null
  poc_name: string | null
  title: string | null
  organization: string | null
  status: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  dietary_restrictions: string | null
  allergies: string | null
  details: string | null
  headshot_url: string | null
}

interface Props {
  passes: Pass[]
}

// ── Category config ───────────────────────────────────────────────────────────

// Palette of distinct colors — any category not matching a keyword gets one
// deterministically assigned by hashing the category string.
const COLOR_PALETTE: Array<{ bg: string; text: string; border: string; avatar: string }> = [
  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    avatar: 'bg-blue-500'    },
  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  avatar: 'bg-violet-500'  },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', avatar: 'bg-emerald-500' },
  { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    avatar: 'bg-rose-500'    },
  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   avatar: 'bg-amber-500'   },
  { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     avatar: 'bg-sky-500'     },
  { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    avatar: 'bg-teal-500'    },
  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  avatar: 'bg-orange-500'  },
  { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',    avatar: 'bg-pink-500'    },
  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  avatar: 'bg-indigo-500'  },
  { bg: 'bg-yellow-50',  text: 'text-yellow-800',  border: 'border-yellow-200',  avatar: 'bg-yellow-500'  },
  { bg: 'bg-lime-50',    text: 'text-lime-700',    border: 'border-lime-200',    avatar: 'bg-lime-500'    },
]

function hashCategory(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return hash % COLOR_PALETTE.length
}

function getCategoryConfig(category: string | null) {
  if (!category) return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', avatar: 'bg-slate-400' }
  return COLOR_PALETTE[hashCategory(category.toLowerCase())]
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null
  const cfg = getCategoryConfig(category)
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {category}
    </span>
  )
}

function PassAvatar({ name, category, size = 'sm' }: { name: string; category: string | null; size?: 'sm' | 'lg' }) {
  const cfg = getCategoryConfig(category)
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const dim = size === 'lg' ? 'h-10 w-10 text-base rounded-lg' : 'h-7 w-7 text-[11px] rounded-full'
  return (
    <div className={`flex shrink-0 items-center justify-center font-bold text-white ${dim} ${cfg.avatar}`}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-[12px] text-slate-300">—</span>
  const s = status.toLowerCase()
  const { bg, text, dot } = s.includes('confirmed') || s.includes('active') || s.includes('approved')
    ? { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  }
    : s.includes('pending') || s.includes('invited')
    ? { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' }
    : s.includes('declined') || s.includes('inactive') || s.includes('revoked')
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

function PassModal({ pass, onClose }: { pass: Pass; onClose: () => void }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<Pass>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (editing) { cancelEdit() } else { onClose() } } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, editing])

  useEffect(() => { setEditing(false); setDraft({}); setError(null) }, [pass])

  function startEdit() { setDraft({ ...pass }); setEditing(true) }
  function cancelEdit() { setEditing(false); setDraft({}); setError(null) }
  function set(field: keyof Pass, value: string) { setDraft((d) => ({ ...d, [field]: value })) }
  function v(field: keyof Pass) { return editing ? (draft[field] as string ?? '') : (pass[field] as string ?? '') }

  async function save() {
    setSaving(true); setError(null)
    try {
      await updatePass(pass.id, {
        full_name: draft.full_name ?? undefined, category: draft.category ?? undefined,
        poc_name: draft.poc_name ?? undefined, title: draft.title ?? undefined,
        organization: draft.organization ?? undefined, status: draft.status ?? undefined,
        email: draft.email ?? undefined, phone: draft.phone ?? undefined,
        linkedin_url: draft.linkedin_url ?? undefined,
        dietary_restrictions: draft.dietary_restrictions ?? undefined,
        allergies: draft.allergies ?? undefined, details: draft.details ?? undefined,
      })
      setEditing(false); router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  const F = ({ label, field, textarea }: { label: string; field: keyof Pass; textarea?: boolean }) => (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      {textarea
        ? <textarea value={v(field)} onChange={(e) => set(field, e.target.value)} rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        : <input value={v(field)} onChange={(e) => set(field, e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500" />
      }
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <PassAvatar name={editing ? (draft.full_name || pass.full_name) : pass.full_name} category={editing ? (draft.category ?? pass.category) : pass.category} size="lg" />
            <div>
              {editing
                ? <input value={v('full_name')} onChange={(e) => set('full_name', e.target.value)}
                    className="text-[15px] font-semibold text-slate-900 border-b border-blue-400 focus:outline-none bg-transparent w-full" />
                : <h2 className="text-[15px] font-semibold text-slate-900">{pass.full_name}</h2>
              }
              <div className="flex items-center gap-2 mt-0.5">
                {editing
                  ? <input value={v('category')} onChange={(e) => set('category', e.target.value)} placeholder="Category"
                      className="text-[12px] text-slate-500 border-b border-slate-200 focus:outline-none bg-transparent" />
                  : <CategoryBadge category={pass.category} />
                }
                {!editing && pass.title && <span className="text-[12px] text-slate-400">{pass.title}</span>}
              </div>
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
            <div className="grid grid-cols-2 gap-3">
              <F label="Status" field="status" />
              <F label="Title" field="title" />
              <F label="Organization" field="organization" />
              <F label="POC" field="poc_name" />
              <F label="Email" field="email" />
              <F label="Phone" field="phone" />
              <F label="LinkedIn" field="linkedin_url" />
              <F label="Dietary" field="dietary_restrictions" />
              <F label="Allergies" field="allergies" />
              <div className="col-span-2"><F label="Details" field="details" textarea /></div>
            </div>
          ) : (
            <>
          {/* Status + Org */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Status</p>
              <StatusBadge status={pass.status} />
            </div>
            {pass.organization && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Organization</p>
                <p className="text-[13px] text-slate-700">{pass.organization}</p>
              </div>
            )}
          </div>

          {/* Contact */}
          {(pass.email || pass.phone || pass.linkedin_url) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Contact</p>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1.5">
                {pass.email && (
                  <a href={`mailto:${pass.email}`} className="flex items-center gap-2 text-[12px] text-blue-600 hover:underline">
                    <Mail size={12} /> {pass.email}
                  </a>
                )}
                {pass.phone && (
                  <p className="flex items-center gap-2 text-[12px] text-slate-500">
                    <Phone size={12} /> {pass.phone}
                  </p>
                )}
                {pass.linkedin_url && (
                  <a href={pass.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-blue-600 hover:underline">
                    <ExternalLink size={12} /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}

          {/* POC */}
          {pass.poc_name && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Point of Contact</p>
              <p className="text-[13px] text-slate-700">{pass.poc_name}</p>
            </div>
          )}

          {/* Dietary / Allergies */}
          {(pass.dietary_restrictions || pass.allergies) && (
            <div className="grid grid-cols-2 gap-4">
              {pass.dietary_restrictions && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Dietary</p>
                  <p className="text-[13px] text-slate-600">{pass.dietary_restrictions}</p>
                </div>
              )}
              {pass.allergies && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Allergies</p>
                  <p className="text-[13px] text-slate-600">{pass.allergies}</p>
                </div>
              )}
            </div>
          )}

          {/* Details */}
          {pass.details && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Details</p>
              <p className="text-[13px] text-slate-600 whitespace-pre-wrap">{pass.details}</p>
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

export function PassesClient({ passes }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Pass | null>(null)

  const categories = useMemo(() => {
    const set = new Set(passes.map((p) => p.category).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [passes])

  const statuses = useMemo(() => {
    const set = new Set(passes.map((p) => p.status).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [passes])

  const filtered = useMemo(() => {
    return passes.filter((p) => {
      const q = search.toLowerCase()
      if (q && !p.full_name.toLowerCase().includes(q) && !(p.organization ?? '').toLowerCase().includes(q)) return false
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      return true
    })
  }, [passes, search, categoryFilter, statusFilter])

  const isFiltered = search || categoryFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-semibold text-slate-900">Passes</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">{passes.length} pass{passes.length !== 1 ? 'es' : ''} · GSSF Worlds 2026</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search passes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-[220px]"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
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
            onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all') }}
            className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <span className="text-[12px] font-medium text-slate-500">
            {filtered.length} of {passes.length} passes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-white">
              <tr>
                <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Name</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Category</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Organization</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Contact</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-slate-400">
                    {passes.length === 0 ? 'No passes imported yet.' : 'No passes match the current filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/40 ${
                      i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Name */}
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <PassAvatar name={p.full_name} category={p.category} size="sm" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-800 truncate">{p.full_name}</p>
                          {p.title && (
                            <p className="text-[11px] text-slate-400 truncate">{p.title}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-2.5">
                      <CategoryBadge category={p.category} />
                    </td>

                    {/* Organization */}
                    <td className="px-4 py-2.5">
                      <span className="text-[12px] text-slate-500 truncate block max-w-[160px]">
                        {p.organization ?? '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-2.5">
                      {p.email ? (
                        <span className="text-[12px] text-slate-400 truncate block max-w-[160px]">{p.email}</span>
                      ) : (
                        <span className="text-[12px] text-slate-300">—</span>
                      )}
                    </td>

                    {/* Arrow */}
                    <td className="px-4 py-2.5">
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
        <PassModal pass={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
