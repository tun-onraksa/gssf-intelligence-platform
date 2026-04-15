'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchSheetPreview, importSheetData } from '@/lib/actions/sheets'
import { SHEET_MAPPINGS, DB_FIELD_LABELS } from '@/lib/sheets/mappings'
import type { SheetType } from '@/lib/sheets/mappings'

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage = 'input' | 'preview' | 'result'

interface PreviewData {
  sheetId: string
  tabName: string
  availableTabs: { title: string; sheetId: number }[]
  headers: string[]
  totalRows: number
  preview: Record<string, string>[]
  detectedType: SheetType | null
  autoMapping: Record<string, string>
  allRows: string[][]
}

interface ImportResult {
  inserted: number
  skipped: number
  errors: { row: number; message: string }[]
  total: number
}

const SHEET_TYPE_LABELS: Record<SheetType, string> = {
  participants: 'Participants',
  teams: 'Teams',
  mentors: 'Mentors',
  universities: 'Universities',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ImportClient({
  programId,
  programName,
}: {
  programId: string
  programName: string
}) {
  const [stage, setStage] = useState<Stage>('input')
  const [url, setUrl] = useState('')
  const [forcedType, setForcedType] = useState<SheetType | 'auto'>('auto')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [sheetType, setSheetType] = useState<SheetType | null>(null)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [errorsExpanded, setErrorsExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── Helpers ──────────────────────────────────────────────────────────────

  const activeType = sheetType ?? preview?.detectedType ?? null

  const dbFieldOptions = useMemo(() => {
    if (!activeType) return []
    return SHEET_MAPPINGS[activeType].map((m) => ({
      value: m.dbField,
      label: DB_FIELD_LABELS[m.dbField] ?? m.dbField,
      required: m.required,
    }))
  }, [activeType])

  const requiredUnmapped = useMemo(() => {
    if (!activeType) return []
    return SHEET_MAPPINGS[activeType]
      .filter((m) => m.required)
      .filter((m) => !Object.values(columnMapping).includes(m.dbField))
      .map((m) => DB_FIELD_LABELS[m.dbField] ?? m.dbField)
  }, [activeType, columnMapping])

  // ── Stage 1 → 2: fetch preview ───────────────────────────────────────────

  function handlePreview() {
    setErrorMsg(null)
    startTransition(async () => {
      try {
        const data = await fetchSheetPreview(url.trim())
        setPreview(data)
        const resolved = forcedType !== 'auto' ? forcedType : (data.detectedType ?? null)
        setSheetType(resolved)
        setColumnMapping(data.autoMapping)
        setStage('preview')
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred')
      }
    })
  }

  // Re-fetch when admin selects a different tab
  function handleTabChange(tabTitle: string) {
    if (!preview) return
    setErrorMsg(null)
    // Extract base URL (strip hash/gid)
    const baseUrl = url.split('#')[0].split('?')[0]
    const tab = preview.availableTabs.find((t) => t.title === tabTitle)
    const newUrl = tab ? `${baseUrl}?gid=${tab.sheetId}` : baseUrl
    setUrl(newUrl)
    startTransition(async () => {
      try {
        const data = await fetchSheetPreview(newUrl)
        setPreview(data)
        const resolved = forcedType !== 'auto' ? forcedType : (data.detectedType ?? null)
        setSheetType(resolved)
        setColumnMapping(data.autoMapping)
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred')
      }
    })
  }

  // ── Stage 2 → 3: run import ──────────────────────────────────────────────

  function handleImport() {
    if (!preview || !activeType) return
    setErrorMsg(null)
    startTransition(async () => {
      try {
        const res = await importSheetData({
          sheetType: activeType,
          columnMapping,
          allRows: preview.allRows,
          headers: preview.headers,
          programId,
        })
        setResult(res)
        setStage('result')
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred')
      }
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 1 — URL Input
  // ─────────────────────────────────────────────────────────────────────────

  if (stage === 'input') {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">Import from Google Sheets</h1>
          <p className="mt-1 text-sm text-slate-400">{programName}</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-6 space-y-5">
          {/* URL field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Sheet URL
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
              onKeyDown={(e) => { if (e.key === 'Enter' && url.trim()) handlePreview() }}
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <ExternalLink size={10} />
              Sheet must be set to &quot;Anyone with the link can view&quot;
            </p>
          </div>

          {/* Type selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
              What type of data is in this sheet?
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(['auto', 'participants', 'teams', 'mentors', 'universities'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForcedType(t)}
                  className={`rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${
                    forcedType === t
                      ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                      : 'border-slate-600 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t === 'auto' ? 'Auto-detect' : SHEET_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            onClick={handlePreview}
            disabled={!url.trim() || isPending}
            className="w-full gap-2"
          >
            {isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Fetching sheet…</>
            ) : (
              <>Preview Sheet <ArrowRight size={14} /></>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 2 — Preview & Column Mapping
  // ─────────────────────────────────────────────────────────────────────────

  if (stage === 'preview' && preview) {
    const previewHeaders = preview.headers.slice(0, 6)

    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => setStage('input')}
              className="mb-1 flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft size={12} /> Back
            </button>
            <h1 className="text-xl font-semibold text-white">
              Preview: &quot;{preview.tabName}&quot;
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {activeType ? (
                <span className="text-blue-400">{SHEET_TYPE_LABELS[activeType]}</span>
              ) : (
                <span className="text-yellow-400">Type unknown — select one below</span>
              )}{' '}
              · {preview.totalRows} rows
            </p>
          </div>

          {/* Tab picker */}
          {preview.availableTabs.length > 1 && (
            <div className="shrink-0">
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
                Tab
              </label>
              <select
                value={preview.tabName}
                onChange={(e) => handleTabChange(e.target.value)}
                disabled={isPending}
                className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[12px] text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {preview.availableTabs.map((t) => (
                  <option key={t.sheetId} value={t.title}>{t.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Sheet type override */}
          {!preview.detectedType && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
              <p className="text-[13px] text-yellow-300">
                Could not auto-detect sheet type. Select one to enable column mapping.
              </p>
              <div className="flex flex-wrap gap-2">
                {(['participants', 'teams', 'mentors', 'universities'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSheetType(t)
                      setColumnMapping(
                        Object.fromEntries(
                          preview.headers.map((h) => {
                            const match = SHEET_MAPPINGS[t].find(
                              (m) => m.sheetColumn.toLowerCase() === h.toLowerCase()
                            )
                            return match ? [h, match.dbField] : []
                          }).filter((e) => e.length > 0)
                        )
                      )
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      sheetType === t
                        ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                        : 'border-slate-600 bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {SHEET_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Column mapping */}
          {activeType && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden">
              <div className="border-b border-slate-700 px-4 py-3">
                <h2 className="text-[13px] font-medium text-white">Column Mapping</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Map each sheet column to the correct database field, or skip it.
                </p>
              </div>
              <div className="divide-y divide-slate-700/60">
                {preview.headers.map((header) => {
                  const mapped = columnMapping[header]

                  return (
                    <div key={header} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-48 shrink-0 truncate text-[13px] text-slate-300" title={header}>
                        {header}
                      </span>
                      <span className="text-slate-600">→</span>
                      <select
                        value={mapped ?? ''}
                        onChange={(e) =>
                          setColumnMapping((prev) => {
                            const next = { ...prev }
                            if (e.target.value) {
                              next[header] = e.target.value
                            } else {
                              delete next[header]
                            }
                            return next
                          })
                        }
                        className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-[12px] text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">— skip —</option>
                        {dbFieldOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}{opt.required ? ' *' : ''}
                          </option>
                        ))}
                      </select>
                      <span className="w-4 text-center text-sm">
                        {mapped ? '✅' : <span className="text-slate-600">–</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Required fields warning */}
          {requiredUnmapped.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2.5 text-[12px] text-yellow-300">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>Required fields not mapped: {requiredUnmapped.join(', ')}</span>
            </div>
          )}

          {/* Data preview table */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden">
            <div className="border-b border-slate-700 px-4 py-3">
              <h2 className="text-[13px] font-medium text-white">
                Data Preview{' '}
                <span className="text-slate-500 font-normal">(first 5 rows)</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-slate-700">
                    {previewHeaders.map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap"
                      >
                        {h}
                        {columnMapping[h] && (
                          <span className="ml-1 text-slate-600">
                            → {DB_FIELD_LABELS[columnMapping[h]] ?? columnMapping[h]}
                          </span>
                        )}
                      </th>
                    ))}
                    {preview.headers.length > 6 && (
                      <th className="px-4 py-2.5 text-left text-slate-600">
                        +{preview.headers.length - 6} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-700/20">
                      {previewHeaders.map((h) => (
                        <td
                          key={h}
                          className="px-4 py-2 text-slate-300 max-w-[200px] truncate"
                          title={row[h]}
                        >
                          {row[h] || <span className="text-slate-600">—</span>}
                        </td>
                      ))}
                      {preview.headers.length > 6 && <td />}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStage('input')} className="gap-2">
              <ArrowLeft size={13} /> Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={!activeType || requiredUnmapped.length > 0 || isPending}
              className="gap-2"
            >
              {isPending ? (
                <><Loader2 size={14} className="animate-spin" /> Importing…</>
              ) : (
                <><Upload size={14} /> Import {preview.totalRows} rows</>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stage 3 — Import Result
  // ─────────────────────────────────────────────────────────────────────────

  if (stage === 'result' && result) {
    const hasErrors = result.errors.length > 0

    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-6 space-y-5">
          {/* Status header */}
          <div className="flex items-center gap-3">
            {hasErrors && result.inserted === 0 ? (
              <AlertTriangle size={22} className="text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 size={22} className="text-green-400 shrink-0" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">
                {hasErrors && result.inserted === 0 ? 'Import Failed' : 'Import Complete'}
              </h2>
              <p className="text-sm text-slate-400">{activeType ? SHEET_TYPE_LABELS[activeType] : ''}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-3 text-center">
              <p className="text-2xl font-bold text-green-400">{result.inserted}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Inserted</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{result.skipped}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Updated</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-3 text-center">
              <p className={`text-2xl font-bold ${hasErrors ? 'text-red-400' : 'text-slate-500'}`}>
                {result.errors.length}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">Errors</p>
            </div>
          </div>

          {/* Error log */}
          {hasErrors && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 overflow-hidden">
              <button
                onClick={() => setErrorsExpanded((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-[12px] text-red-300 hover:bg-red-500/10"
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} had errors
                  (click to {errorsExpanded ? 'collapse' : 'expand'})
                </span>
                {errorsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {errorsExpanded && (
                <div className="border-t border-red-500/20 divide-y divide-red-500/10 max-h-48 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-3 py-2 text-[12px] text-red-300/80">
                      <span className="font-mono text-red-400/60">Row {e.row}:</span>{' '}
                      {e.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <hr className="border-slate-700" />

          {/* Next steps */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Next steps</p>
            <ul className="space-y-1 text-[13px] text-slate-400">
              <li>· Send invites to imported participants from <Link href="/participants" className="text-blue-400 hover:underline">/participants</Link></li>
              <li>· Review any profiles missing passport data</li>
              <li>· Run mentor matching from <Link href="/matching" className="text-blue-400 hover:underline">/matching</Link></li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/participants" className="flex-1">
              <Button variant="outline" className="w-full gap-1.5">
                View Participants <ArrowRight size={13} />
              </Button>
            </Link>
            <Button
              onClick={() => {
                setStage('input')
                setPreview(null)
                setResult(null)
                setUrl('')
                setSheetType(null)
                setColumnMapping({})
                setErrorsExpanded(false)
              }}
              variant="ghost"
              className="flex-1"
            >
              Import Another Sheet
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
