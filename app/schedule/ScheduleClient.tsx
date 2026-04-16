'use client'

import { Fragment, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  assignTeamToSlot,
  publishSchedule as publishScheduleAction,
  resolveConflict as resolveConflictAction,
} from '@/lib/actions/schedule'
import {
  AlertTriangle,
  CheckCircle2,
  FileDown,
  Lock,
  X,
  Loader2,
} from 'lucide-react'

// ── DB types from server ──────────────────────────────────────────────────────

type DbSlot = {
  id: string
  track: string
  day: number
  start_time: string
  end_time: string
  room: string | null
  team_id: string | null
  schedule_published: boolean | null
  program_id: string | null
  teams: {
    id: string
    name: string
    stage: string | null
    qualifying_path: string | null
    region_label: string | null
    universities: { name: string; country: string } | null
  } | null
  pitch_slot_judges: {
    profiles: { id: string; full_name: string | null; organization_name: string | null } | null
  }[]
  slot_conflicts: {
    id: string
    type: string
    judge_id: string | null
    description: string | null
    resolved: boolean | null
    profiles: { id: string; full_name: string | null } | null
  }[]
}

interface ScheduleClientProps {
  slots: DbSlot[]
  judges: { id: string; full_name: string | null; organization_name: string | null }[]
  teams: { id: string; name: string; track: string | null; universities: { name: string } | null }[]
  schedulePublished: boolean
  totalConflicts: number
  programId: string
}

// ── Working internal slot type ────────────────────────────────────────────────

type WorkingConflict = {
  conflictId: string
  type: string
  judgeId: string | null
  judgeName: string
  description: string | null
}

type WorkingSlot = {
  id: string
  track: string
  day: number
  start_time: string
  end_time: string
  room: string | null
  team_id: string | null
  judgeProfiles: { id: string; full_name: string | null; organization_name: string | null }[]
  conflicts: WorkingConflict[]
}

function toWorking(slot: DbSlot): WorkingSlot {
  return {
    id:           slot.id,
    track:        slot.track,
    day:          slot.day,
    start_time:   slot.start_time,
    end_time:     slot.end_time,
    room:         slot.room,
    team_id:      slot.team_id,
    judgeProfiles: slot.pitch_slot_judges
      .map((j) => j.profiles)
      .filter((p): p is NonNullable<typeof p> => p != null),
    conflicts: slot.slot_conflicts
      .filter((c) => !c.resolved)
      .map((c) => ({
        conflictId:  c.id,
        type:        c.type,
        judgeId:     c.judge_id,
        judgeName:   c.profiles?.full_name ?? c.judge_id ?? '?',
        description: c.description,
      })),
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TRACKS = ['A', 'B', 'C'] as const
const ROOMS: Record<string, string> = { A: 'Room 101', B: 'Room 102', C: 'Room 103' }
const TRACK_ACCENT: Record<string, string> = {
  A: 'bg-blue-500',
  B: 'bg-violet-500',
  C: 'bg-teal-500',
}

type TrackFilter = 'all' | 'A' | 'B' | 'C'

type TeamLookupEntry = {
  teamId: string
  teamName: string
  university: string
  stage: string
}

// ── TeamBlock ─────────────────────────────────────────────────────────────────

interface TeamBlockProps {
  slot: WorkingSlot
  teamLookup: TeamLookupEntry[]
  track: string
  published: boolean
  onRemoveJudge: (slotId: string, judgeId: string) => void
}

function TeamBlock({ slot, teamLookup, track, published, onRemoveJudge }: TeamBlockProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slot.id })
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: slot.id,
    disabled: published || !slot.team_id,
  })
  const [openJudge, setOpenJudge] = useState<string | null>(null)

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setDropRef(node)
      setDragRef(node)
    },
    [setDropRef, setDragRef]
  )

  const team = teamLookup.find((t) => t.teamId === slot.team_id)
  const hasDouble = slot.conflicts.some((c) => c.type === 'double_booked_judge')
  const hasCOI    = slot.conflicts.some((c) => c.type === 'conflict_of_interest')

  const accentClass = hasDouble
    ? 'bg-red-400'
    : hasCOI
    ? 'bg-yellow-400'
    : (TRACK_ACCENT[track] ?? 'bg-slate-300')

  if (!team) {
    return (
      <div
        ref={setDropRef}
        className={`mt-1.5 flex h-[82px] items-center justify-center rounded-xl border border-dashed transition-colors ${
          isOver && !published
            ? 'border-blue-400 bg-blue-50/50'
            : 'border-slate-200 bg-transparent'
        }`}
      >
        <span className={`text-xs ${isOver && !published ? 'text-blue-400' : 'text-slate-300'}`}>
          {isOver && !published ? 'Drop here' : '+ Assign team'}
        </span>
      </div>
    )
  }

  const blockBgClass = hasDouble
    ? 'bg-red-50 border-red-200'
    : hasCOI
    ? 'bg-yellow-50 border-yellow-200'
    : isOver && !published
    ? 'bg-blue-50/50 border-blue-300'
    : 'bg-white border-slate-200'

  return (
    <div
      ref={setRefs}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={`relative mt-1.5 flex h-[82px] overflow-visible rounded-xl border shadow-sm transition-all duration-150 ${blockBgClass} ${
        isDragging
          ? 'z-50 cursor-grabbing opacity-70 rotate-1 shadow-xl'
          : 'cursor-grab hover:scale-[1.01] hover:shadow-md'
      }`}
    >
      <div className={`w-1 shrink-0 self-stretch rounded-l-xl ${accentClass}`} />
      <div className="relative flex min-w-0 flex-1 flex-col justify-between overflow-hidden px-3 py-2">
        {(hasDouble || hasCOI) && (
          <span className={`absolute right-2 top-2 ${hasDouble ? 'text-red-500' : 'text-yellow-500'}`}>
            <AlertTriangle size={11} />
          </span>
        )}
        <div>
          <p className="truncate pr-4 text-[13px] font-semibold text-slate-800">{team.teamName}</p>
          <p className="truncate text-[11px] text-slate-400">
            {team.university}{team.stage ? ` · ${team.stage}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {slot.judgeProfiles.map((judge) => {
            const jid = judge.id
            const judgeHasConflict = slot.conflicts.some((c) => c.judgeId === jid)
            return (
              <div key={jid} className="relative">
                <button
                  onClick={() => setOpenJudge(openJudge === jid ? null : jid)}
                  className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    judgeHasConflict
                      ? 'border-red-200 bg-red-100 text-red-700'
                      : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {judgeHasConflict && <AlertTriangle size={7} />}
                  {(judge.full_name ?? jid).split(' ')[0]}
                </button>
                {openJudge === jid && (
                  <div className="absolute bottom-full left-0 z-50 mb-1.5 w-[188px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">{judge.full_name ?? jid}</p>
                        {judge.organization_name && (
                          <p className="text-[10px] text-slate-400">{judge.organization_name}</p>
                        )}
                      </div>
                      <button onClick={() => setOpenJudge(null)} className="mt-0.5 shrink-0">
                        <X size={11} className="text-slate-400" />
                      </button>
                    </div>
                    {judgeHasConflict && (
                      <p className="mb-2 rounded bg-red-50 px-1.5 py-1 text-[10px] text-red-600">
                        ⚠ Conflict with this assignment
                      </p>
                    )}
                    {!published && (
                      <button
                        onClick={() => { onRemoveJudge(slot.id, jid); setOpenJudge(null) }}
                        className="mt-1 w-full rounded-md border border-red-100 bg-red-50 py-1 text-[11px] text-red-600 hover:bg-red-100"
                      >
                        Remove from slot
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── CalendarGrid ──────────────────────────────────────────────────────────────

function CalendarGrid({
  day, activeTrack, slots, teamLookup, published, onRemoveJudge,
}: {
  day: number
  activeTrack: TrackFilter
  slots: WorkingSlot[]
  teamLookup: TeamLookupEntry[]
  published: boolean
  onRemoveJudge: (slotId: string, judgeId: string) => void
}) {
  const daySlots = slots.filter((s) => s.day === day)
  const times    = Array.from(new Set(daySlots.map((s) => s.start_time))).sort()
  const visibleTracks = activeTrack === 'all' ? ([...TRACKS] as string[]) : [activeTrack]
  const gridCols = `64px ${visibleTracks.map(() => '1fr').join(' ')}`

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
      <div
        style={{ display: 'grid', gridTemplateColumns: gridCols, minWidth: 500 }}
        className="sticky top-0 z-10 border-b border-slate-100 bg-white"
      >
        <div className="w-16" />
        {visibleTracks.map((track) => (
          <div key={track} className="px-3 py-2.5 text-center">
            <div className="text-[12px] font-semibold text-slate-700">Track {track}</div>
            <div className="text-[10px] text-slate-400">{ROOMS[track]}</div>
          </div>
        ))}
      </div>
      <div className="pb-4">
        {times.map((time, idx) => (
          <Fragment key={time}>
            <div
              style={{ display: 'grid', gridTemplateColumns: gridCols, minWidth: 500 }}
              className="border-t border-slate-100"
            >
              <div className="flex w-16 shrink-0 items-start justify-end pr-3 pt-2">
                <span className="text-[11px] text-slate-400">{time}</span>
              </div>
              {visibleTracks.map((track) => {
                const slot = daySlots.find((s) => s.track === track && s.start_time === time)
                return (
                  <div key={track} className="relative px-2" style={{ minHeight: 96 }}>
                    {day === 1 && time === '10:00' && (
                      <div
                        className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                        style={{ top: 47 }}
                      >
                        <div
                          className="shrink-0 rounded-full border-2 border-white bg-red-500 shadow-sm"
                          style={{ width: 10, height: 10, marginLeft: -5 }}
                        />
                        <div className="h-px flex-1 bg-red-400 opacity-70" />
                        <span className="mr-1 shrink-0 text-[10px] font-medium text-red-500">Now</span>
                      </div>
                    )}
                    {slot ? (
                      <TeamBlock
                        slot={slot}
                        teamLookup={teamLookup}
                        track={track}
                        published={published}
                        onRemoveJudge={onRemoveJudge}
                      />
                    ) : (
                      <div className="mt-1.5 flex h-[82px] items-center justify-center rounded-xl border border-dashed border-slate-200">
                        <span className="text-xs text-slate-300">+ Assign team</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {idx < times.length - 1 && (
              <div
                style={{ display: 'grid', gridTemplateColumns: gridCols, minWidth: 500 }}
                className="h-[18px] border-t border-slate-50 bg-slate-50/60"
              >
                <div />
                <div
                  style={{ gridColumn: `2 / ${visibleTracks.length + 2}` }}
                  className="flex items-center justify-center"
                >
                  <span className="text-[10px] text-slate-300">15 min break</span>
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

// ── ConflictPanel ─────────────────────────────────────────────────────────────

function ConflictPanel({
  slots,
  teamLookup,
  onResolve,
}: {
  slots: WorkingSlot[]
  teamLookup: TeamLookupEntry[]
  onResolve: (slotId: string, conflictId: string) => void
}) {
  const allConflicts = slots.flatMap((slot) =>
    slot.conflicts.map((conflict) => ({ slot, conflict }))
  )

  return (
    <div
      style={{ width: allConflicts.length === 0 ? 0 : 260, transition: 'width 300ms ease' }}
      className="shrink-0 self-start overflow-hidden"
    >
      <div className="w-[260px]">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-600" />
            <span className="text-[13px] font-semibold text-red-700">
              {allConflicts.length} Conflict{allConflicts.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {allConflicts.map(({ slot, conflict }) => {
              const team = teamLookup.find((t) => t.teamId === slot.team_id)
              return (
                <div
                  key={`${slot.id}-${conflict.conflictId}`}
                  className="rounded-xl border border-red-200 bg-white p-3"
                >
                  <span
                    className={`mb-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      conflict.type === 'double_booked_judge'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {conflict.type === 'double_booked_judge' ? 'Double Booked' : 'Conflict of Interest'}
                  </span>
                  <p className="mb-2 text-[11px] leading-relaxed text-slate-600">{conflict.description}</p>
                  <p className="mb-3 text-[10px] text-slate-400">
                    Track {slot.track} · {slot.room ?? ''} · Day {slot.day} {slot.start_time}
                    {team && ` · ${team.teamName}`}
                  </p>
                  <button
                    onClick={() => onResolve(slot.id, conflict.conflictId)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Mark Resolved
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ScheduleClient({
  slots: initialSlots,
  teams,
  schedulePublished,
  programId,
}: ScheduleClientProps) {
  const router = useRouter()

  const teamLookup: TeamLookupEntry[] = teams.map((t) => ({
    teamId:     t.id,
    teamName:   t.name,
    university: t.universities?.name ?? '',
    stage:      '',
  }))

  const [localSlots, setLocalSlots] = useState<WorkingSlot[]>(() =>
    initialSlots.map(toWorking)
  )
  const [activeDay,       setActiveDay]       = useState('1')
  const [activeTrack,     setActiveTrack]     = useState<TrackFilter>('all')
  const [draggingId,      setDraggingId]      = useState<string | null>(null)
  const [confirmOpen,     setConfirmOpen]     = useState(false)
  const [published,       setPublished]       = useState(schedulePublished)
  const [publishLoading,  setPublishLoading]  = useState(false)
  const [publishError,    setPublishError]    = useState<string | null>(null)

  const allConflicts = localSlots.flatMap((s) => s.conflicts)
  const hasConflicts = allConflicts.length > 0

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setDraggingId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return

      const sourceId = active.id as string
      const targetId = over.id as string

      const sourceSlot = localSlots.find((s) => s.id === sourceId)
      const targetSlot = localSlots.find((s) => s.id === targetId)
      if (!sourceSlot) return

      // Optimistic local update
      setLocalSlots((prev) =>
        prev.map((slot) => {
          if (slot.id === sourceId) return { ...slot, team_id: targetSlot?.team_id ?? null }
          if (slot.id === targetId) return { ...slot, team_id: sourceSlot.team_id }
          return slot
        })
      )

      // Commit to DB
      try {
        await assignTeamToSlot(sourceId, targetSlot?.team_id ?? null)
        if (targetSlot?.team_id !== null || sourceSlot.team_id !== null) {
          await assignTeamToSlot(targetId, sourceSlot.team_id)
        }
        router.refresh()
      } catch {
        // Revert on failure
        setLocalSlots((prev) =>
          prev.map((slot) => {
            if (slot.id === sourceId) return { ...slot, team_id: sourceSlot.team_id }
            if (slot.id === targetId) return { ...slot, team_id: targetSlot?.team_id ?? null }
            return slot
          })
        )
      }
    },
    [localSlots, router]
  )

  const handleResolve = useCallback(
    async (slotId: string, conflictId: string) => {
      // Optimistic: remove from local state
      setLocalSlots((prev) =>
        prev.map((s) => {
          if (s.id !== slotId) return s
          return { ...s, conflicts: s.conflicts.filter((c) => c.conflictId !== conflictId) }
        })
      )
      try {
        await resolveConflictAction(conflictId)
        router.refresh()
      } catch {
        // Conflict stays resolved locally even if server call fails
      }
    },
    [router]
  )

  const handleRemoveJudge = useCallback(
    (slotId: string, judgeId: string) => {
      setLocalSlots((prev) =>
        prev.map((s) => {
          if (s.id !== slotId) return s
          return { ...s, judgeProfiles: s.judgeProfiles.filter((j) => j.id !== judgeId) }
        })
      )
    },
    []
  )

  const handlePublish = async () => {
    setPublishLoading(true)
    setPublishError(null)
    try {
      await publishScheduleAction(programId)
      setPublished(true)
      setConfirmOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setPublishLoading(false)
    }
  }

  const draggingSlot = localSlots.find((s) => s.id === draggingId)
  const draggingTeam = draggingSlot?.team_id
    ? teamLookup.find((t) => t.teamId === draggingSlot.team_id)
    : null

  return (
    <div className="flex h-full flex-col">
      {published && (
        <div className="flex items-center gap-2 border-b border-green-200 bg-green-50 px-6 py-2.5">
          <CheckCircle2 size={14} className="text-green-600" />
          <span className="text-[13px] font-medium text-green-700">
            Schedule published — judges and participants have been notified.
          </span>
          <Lock size={12} className="ml-1 text-green-500" />
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-[18px] font-semibold text-slate-900">Pitch Schedule</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">GSSF Worlds 2026 · May 19–20</p>
        </div>
        <div className="flex items-center gap-3">
          {hasConflicts && !published && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[12px] font-medium text-red-600">
              <AlertTriangle size={12} />
              {allConflicts.length} conflict{allConflicts.length > 1 ? 's' : ''}
            </span>
          )}
          {published ? (
            <button
              onClick={() => window.print()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-800 px-3 text-[13px] font-medium text-white shadow-sm hover:bg-slate-700"
            >
              <FileDown size={14} /> Export PDF
            </button>
          ) : (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={hasConflicts}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Publish Schedule
            </button>
          )}
        </div>
      </div>

      <div className="flex h-[44px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-6">
        <Select value={activeDay} onValueChange={(v) => v && setActiveDay(v)}>
          <SelectTrigger className="h-8 w-[160px] border-slate-200 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1" className="text-[13px]">Day 1 — May 19</SelectItem>
            <SelectItem value="2" className="text-[13px]">Day 2 — May 20</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-slate-200" />

        {(['all', 'A', 'B', 'C'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTrack(t)}
            className={`h-7 rounded-full px-3 text-[12px] font-medium transition-colors ${
              activeTrack === t
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t === 'all' ? 'All' : `Track ${t}`}
          </button>
        ))}
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-5 overflow-auto p-6">
          <div className="min-w-0 flex-1">
            <CalendarGrid
              day={Number(activeDay)}
              activeTrack={activeTrack}
              slots={localSlots}
              teamLookup={teamLookup}
              published={published}
              onRemoveJudge={handleRemoveJudge}
            />
          </div>
          <ConflictPanel
            slots={localSlots}
            teamLookup={teamLookup}
            onResolve={handleResolve}
          />
        </div>

        <DragOverlay>
          {draggingTeam && (
            <div className="rounded-lg border-2 border-blue-400 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 shadow-xl">
              {draggingTeam.teamName}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-[16px] font-semibold text-slate-900">Publish Schedule?</h2>
            <p className="mb-1 text-[13px] leading-relaxed text-slate-600">
              This will make the schedule visible to all judges, mentors, and participants.
            </p>
            <p className="mb-6 text-[13px] leading-relaxed text-slate-600">
              Once published, slot assignments will be{' '}
              <span className="font-medium text-slate-800">locked</span> and cannot be changed without re-opening.
            </p>
            {publishError && <p className="mb-3 text-[12px] text-red-500">{publishError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={publishLoading}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={publishLoading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-[13px] font-medium text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {publishLoading && <Loader2 size={13} className="animate-spin" />}
                Yes, Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
