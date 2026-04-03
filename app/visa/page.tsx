'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import type { Person, VisaLetter } from '@/lib/types'
import {
  CheckCircle2, Clock, Eye, RefreshCw, Send,
  AlertTriangle, ChevronDown, ChevronUp, X, FileText,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

const FLAG: Record<string, string> = {
  'United States': '🇺🇸', 'India': '🇮🇳', 'South Korea': '🇰🇷', 'Finland': '🇫🇮',
  'United Kingdom': '🇬🇧', 'Singapore': '🇸🇬', 'Switzerland': '🇨🇭', 'Israel': '🇮🇱',
  'Canada': '🇨🇦', 'Hong Kong': '🇭🇰', 'China': '🇨🇳', 'Austria': '🇦🇹',
  'Germany': '🇩🇪', 'Nigeria': '🇳🇬', 'Bangladesh': '🇧🇩', 'Japan': '🇯🇵',
  'France': '🇫🇷', 'Spain': '🇪🇸', 'Brazil': '🇧🇷',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function rolePrimary(roles: string[]): string {
  if (roles.includes('STUDENT')) return 'Student Participant'
  if (roles.includes('MENTOR')) return 'Mentor'
  if (roles.includes('JUDGE')) return 'Judge'
  if (roles.includes('ORGANIZER')) return 'Organizer'
  return roles[0] ?? 'Participant'
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── Letter Preview Modal ──────────────────────────────────────────────────────

function LetterPreviewModal({
  person,
  letter,
  onClose,
  onMarkSent,
}: {
  person: Person
  letter: VisaLetter
  onClose: () => void
  onMarkSent: () => void
}) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const isSent = letter.status === 'sent'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-[680px] flex-col rounded-2xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-slate-500" />
            <span className="text-[14px] font-semibold text-slate-800">Visa Invitation Letter — {person.name}</span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-slate-100">
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        {/* Letter body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[580px] rounded-xl border border-slate-200 bg-white p-8 font-serif text-[13px] leading-relaxed text-slate-800 shadow-sm print:shadow-none print:border-0">
            {/* Logo placeholder */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-[120px] rounded bg-slate-200 flex items-center justify-center">
                <span className="text-[9px] font-sans font-semibold uppercase tracking-widest text-slate-400">GSSF Logo</span>
              </div>
              <div>
                <p className="text-[11px] font-sans font-bold uppercase tracking-wide text-slate-700">Global Student Startup Challenge Foundation</p>
                <p className="text-[10px] font-sans text-slate-400">info@gssf.org · gssf.org</p>
              </div>
            </div>

            <p className="mb-4 font-sans text-[12px] text-slate-500">Date: {today}</p>

            <p className="mb-4">To Whom It May Concern,</p>

            <p className="mb-4">
              We hereby invite{' '}
              <strong>{person.name}</strong>{' '}
              ({person.nationality}),{' '}
              {person.passportNumber
                ? <>holding Passport No. <strong>{person.passportNumber}</strong>, issued by {person.country},</>
                : <>passport details pending confirmation,</>
              }{' '}
              to attend the
            </p>

            <div className="my-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center font-sans">
              <p className="text-[14px] font-bold text-blue-900">GSSC Worlds 2026</p>
              <p className="text-[12px] text-blue-700">Global Student Startup Challenge</p>
              <p className="text-[12px] text-blue-700">Seoul, Republic of Korea</p>
              <p className="text-[12px] font-semibold text-blue-800 mt-1">May 17–21, 2026</p>
            </div>

            <p className="mb-4">
              <strong>{person.name}</strong> is an official{' '}
              <strong>{rolePrimary(person.roles)}</strong>{' '}
              representing{' '}
              <strong>{person.organization ?? 'GSSC Worlds 2026'}</strong>{' '}
              at this program. All accommodation and program costs will be covered by the organizing foundation.
            </p>

            <p className="mb-6">
              Should you require any further information, please contact us at{' '}
              <span className="font-medium text-blue-700">info@gssf.org</span>.
            </p>

            <p className="mb-1">Sincerely,</p>
            <p className="mb-0.5 font-semibold">Mike Lee</p>
            <p className="text-[12px] text-slate-500">Program Director, GSSF / USC</p>
            <p className="text-[12px] text-slate-500">mike@gssf.org</p>
            <div className="mt-6 border-t border-slate-300 pt-3">
              <p className="text-[11px] text-slate-400">___________________________</p>
              <p className="text-[11px] text-slate-400">Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Print / Save as PDF
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50">
              Close
            </button>
            {!isSent && (
              <button
                onClick={onMarkSent}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-green-700"
              >
                <Send size={12} /> Mark as Sent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── GenerationLog ─────────────────────────────────────────────────────────────

function GenerationLog({ letters, persons }: { letters: VisaLetter[]; persons: Person[] }) {
  const [open, setOpen] = useState(false)
  if (letters.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
      >
        <span>Generation Log</span>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Participant', 'Version', 'Generated At', 'Sent At', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {letters.map((l, i) => {
                const person = persons.find((p) => p.personId === l.personId)
                return (
                  <tr key={l.letterId} className={`border-b border-slate-100 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                    <td className="px-4 py-2.5 text-[12px] font-medium text-slate-800">{person?.name ?? l.personId}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-500">v{l.version}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-500">{fmtDate(l.generatedAt)}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-500">
                      {l.sentAt ? fmtDate(l.sentAt) : <span className="text-slate-400">Pending</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {l.status === 'sent' ? (
                        <span className="text-[11px] text-slate-300">—</span>
                      ) : (
                        <button className="text-[11px] font-medium text-blue-600 hover:underline">Resend</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Page() {
  const { persons, visaLetters, generateVisaLetters, markVisaLetterSent } = useStore()

  const visaRequired = persons.filter((p) => p.needsVisa && p.status === 'confirmed')
  const eligibleCount = visaRequired.length

  const [genState, setGenState] = useState<'idle' | 'generating' | 'done'>(
    visaLetters.length > 0 ? 'done' : 'idle'
  )
  const [progress, setProgress] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [previewLetter, setPreviewLetter] = useState<VisaLetter | null>(null)
  const [previewPerson, setPreviewPerson] = useState<Person | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const letters = visaLetters

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function runGeneration() {
    setConfirmOpen(false)
    setGenState('generating')
    setProgress(0)
    let count = 0
    intervalRef.current = setInterval(() => {
      count += 1
      setProgress(count)
      if (count >= eligibleCount) {
        clearInterval(intervalRef.current!)
        generateVisaLetters()
        setGenState('done')
        setToast(`${eligibleCount} letters generated successfully`)
      }
    }, 2000 / eligibleCount)
  }

  function openPreview(letter: VisaLetter) {
    const person = persons.find((p) => p.personId === letter.personId)
    if (!person) return
    setPreviewLetter(letter)
    setPreviewPerson(person)
  }

  function handleMarkSent() {
    if (!previewLetter) return
    markVisaLetterSent(previewLetter.letterId)
    setPreviewLetter(null)
    setPreviewPerson(null)
  }

  const sentCount = letters.filter((l) => l.status === 'sent').length
  const pendingCount = letters.filter((l) => l.status !== 'sent').length

  function StatusBadge({ status }: { status: string }) {
    if (status === 'sent')      return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Sent</span>
    if (status === 'generated') return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Generated</span>
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Pending</span>
  }

  return (
    <div className="mx-auto max-w-[980px] space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Visa Letters</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">
            Bulk visa invitation letter generation for GSSC Worlds 2026
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {genState === 'done' ? (
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={13} /> Regenerate All
            </button>
          ) : genState === 'generating' ? (
            <button disabled className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[13px] font-medium text-white opacity-80">
              <RefreshCw size={13} className="animate-spin" /> Generating… ({progress}/{eligibleCount})
            </button>
          ) : (
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-700"
            >
              Generate All Letters ({eligibleCount})
            </button>
          )}
        </div>
      </div>

      {/* Generated summary banner */}
      {genState === 'done' && letters.length > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 size={15} className="shrink-0 text-green-600" />
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <span className="font-semibold text-green-800">{letters.length} letters generated</span>
            <span className="text-green-500">·</span>
            <span className="text-green-700">{sentCount} sent</span>
            <span className="text-green-500">·</span>
            <span className="text-green-700">{pendingCount} pending delivery</span>
          </div>
        </div>
      )}

      {/* Stat chips (post-generation) */}
      {genState === 'done' && letters.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-600">
          <span>📄 <strong>{letters.length}</strong> Generated</span>
          <span className="text-slate-300">·</span>
          <span>✉️ <strong>{sentCount}</strong> Sent</span>
          <span className="text-slate-300">·</span>
          <span>⏳ <strong>{pendingCount}</strong> Pending</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Participant', 'Nationality', 'Passport', 'Generated', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visaRequired.map((person, i) => {
              const letter = letters.find((l) => l.personId === person.personId)
              const hasPassport = !!person.passportNumber
              const missingPassport = !hasPassport

              return (
                <tr
                  key={person.personId}
                  className={`border-b border-slate-100 last:border-0 ${
                    missingPassport ? 'bg-amber-50/60' : i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                  }`}
                >
                  {/* Participant */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                        {initials(person.name)}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-slate-800">{person.name}</p>
                        <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-semibold text-slate-500">
                          {rolePrimary(person.roles).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>
                  {/* Nationality */}
                  <td className="px-4 py-3 text-[12px] text-slate-600">
                    {FLAG[person.country] ?? '🌍'} {person.nationality}
                  </td>
                  {/* Passport */}
                  <td className="px-4 py-3">
                    {hasPassport ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-green-600">
                        <CheckCircle2 size={11} /> On file
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[12px] text-amber-600">
                        <AlertTriangle size={11} /> Missing
                      </span>
                    )}
                  </td>
                  {/* Generated */}
                  <td className="px-4 py-3 text-[12px] text-slate-500">
                    {letter ? (
                      fmtDate(letter.generatedAt)
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Clock size={11} /> —
                      </span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={letter?.status ?? 'pending'} />
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    {letter ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openPreview(letter)}
                          title="Preview"
                          className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmOpen(true)}
                          title="Regenerate"
                          className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                        >
                          <RefreshCw size={13} />
                        </button>
                        {letter.status !== 'sent' && (
                          <button
                            onClick={() => markVisaLetterSent(letter.letterId)}
                            title="Mark Sent"
                            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                          >
                            <Send size={13} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[12px] text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Generation log */}
      <GenerationLog letters={letters} persons={persons} />

      {/* Generate confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[440px] rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-[16px] font-semibold text-slate-900">Generate Visa Invitation Letters?</h3>
            <p className="mb-5 text-[13px] leading-relaxed text-slate-600">
              Generate visa invitation letters for all{' '}
              <strong>{eligibleCount}</strong> participants with{' '}
              <em>needsVisa = true</em>. Letters will be populated from passport data on file.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={runGeneration}
                className="flex-1 rounded-xl bg-blue-600 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Letter preview modal */}
      {previewLetter && previewPerson && (
        <LetterPreviewModal
          person={previewPerson}
          letter={previewLetter}
          onClose={() => { setPreviewLetter(null); setPreviewPerson(null) }}
          onMarkSent={handleMarkSent}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-[13px] font-medium text-white shadow-xl">
          <CheckCircle2 size={14} className="text-green-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
