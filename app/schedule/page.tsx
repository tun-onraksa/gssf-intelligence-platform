'use client'

import { Fragment, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useStore } from '@/lib/store'
import type { PitchSlot, Person, SlotConflict } from '@/lib/types'
import {
  AlertTriangle,
  CheckCircle2,
  GripVertical,
  X,
  FileDown,
  Lock,
} from 'lucide-react'

// ─── Conflict detection ────────────────────────────────────────────────────────

function detectConflicts(slots: PitchSlot[], persons: Person[]): PitchSlot[] {
  return slots.map((slot) => {
    const conflicts: SlotConflict[] = []

    // double_booked_judge: same judge appears in another slot at same day+time
    for (const judgeId of slot.judgeIds) {
      const isDoubleBooked = slots.some(
        (other) =>
          other.slotId !== slot.slotId &&
          other.day === slot.day &&
          other.startTime === slot.startTime &&
          other.judgeIds.includes(judgeId)
      )
      if (
        isDoubleBooked &&
        !conflicts.some((c) => c.judgeId === judgeId && c.type === 'double_booked_judge')
      ) {
        const judge = persons.find((p) => p.personId === judgeId)
        conflicts.push({
          type: 'double_booked_judge',
          judgeId,
          description: `${judge?.name ?? judgeId} is scheduled in multiple tracks at ${slot.startTime} on Day ${slot.day}.`,
        })
      }
    }

    // conflict_of_interest: judge declared conflict with assigned team
    if (slot.teamId) {
      for (const judgeId of slot.judgeIds) {
        const judge = persons.find((p) => p.personId === judgeId)
        if (judge?.conflictWithTeamIds.includes(slot.teamId)) {
          conflicts.push({
            type: 'conflict_of_interest',
            judgeId,
            description: `${judge.name} declared a conflict of interest with this team.`,
          })
        }
      }
    }

    return { ...slot, conflicts }
  })
}

// ─── DraggableTeam ────────────────────────────────────────────────────────────

function DraggableTeam({
  slotId,
  teamName,
  disabled,
}: {
  slotId: string
  teamName: string
  disabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: slotId,
    disabled,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }}
      {...listeners}
      {...attributes}
      className="flex cursor-grab items-center gap-1.5 active:cursor-grabbing"
    >
      <GripVertical size={11} className="shrink-0 text-slate-300" />
      <span className="truncate text-[13px] font-semibold text-slate-800">{teamName}</span>
    </div>
  )
}

// ─── SlotCell ─────────────────────────────────────────────────────────────────

interface SlotCellProps {
  slot: PitchSlot
  persons: Person[]
  teamLookup: Array<{ teamId: string; teamName: string }>
  published: boolean
  onRemoveJudge: (slotId: string, judgeId: string) => void
}

function SlotCell({ slot, persons, teamLookup, published, onRemoveJudge }: SlotCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.slotId })
  const [openJudge, setOpenJudge] = useState<string | null>(null)

  const team = teamLookup.find((t) => t.teamId === slot.teamId)
  const hasDouble = slot.conflicts.some((c) => c.type === 'double_booked_judge')
  const hasCOI = slot.conflicts.some((c) => c.type === 'conflict_of_interest')
  const hasConflict = hasDouble || hasCOI

  const borderClass = hasDouble
    ? 'border-red-300 bg-red-50'
    : hasCOI
    ? 'border-amber-300 bg-amber-50'
    : isOver && !published
    ? 'border-blue-400 bg-blue-50'
    : 'border-slate-200 bg-white'

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[96px] rounded-lg border-2 p-3 transition-colors ${borderClass}`}
    >
      {hasConflict && (
        <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
          <AlertTriangle size={9} />
        </div>
      )}

      {/* Team row */}
      <div className="mb-2.5">
        {team ? (
          <DraggableTeam slotId={slot.slotId} teamName={team.teamName} disabled={published} />
        ) : (
          <span className="text-[11px] italic text-slate-400">Empty slot</span>
        )}
      </div>

      {/* Judge chips */}
      <div className="flex flex-wrap gap-1">
        {slot.judgeIds.map((jid) => {
          const judge = persons.find((p) => p.personId === jid)
          const judgeHasConflict = slot.conflicts.some((c) => c.judgeId === jid)
          return (
            <div key={jid} className="relative">
              <button
                onClick={() => setOpenJudge(openJudge === jid ? null : jid)}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors
                  ${judgeHasConflict
                    ? 'border-red-200 bg-red-100 text-red-700'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {judgeHasConflict && <AlertTriangle size={7} />}
                {judge?.name.split(' ')[0] ?? jid}
              </button>

              {/* Judge popover */}
              {openJudge === jid && (
                <div className="absolute bottom-full left-0 z-50 mb-1.5 w-[188px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800">{judge?.name ?? jid}</p>
                      <p className="text-[10px] text-slate-400">{judge?.organization ?? judge?.email}</p>
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
                      onClick={() => {
                        onRemoveJudge(slot.slotId, jid)
                        setOpenJudge(null)
                      }}
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
  )
}

// ─── ScheduleGrid ─────────────────────────────────────────────────────────────

interface ScheduleGridProps {
  day: number
  slots: PitchSlot[]
  persons: Person[]
  teamLookup: Array<{ teamId: string; teamName: string }>
  published: boolean
  onRemoveJudge: (slotId: string, judgeId: string) => void
}

const TRACKS = ['A', 'B', 'C'] as const
const ROOMS: Record<string, string> = { A: 'Room 101', B: 'Room 102', C: 'Room 103' }

function ScheduleGrid({ day, slots, persons, teamLookup, published, onRemoveJudge }: ScheduleGridProps) {
  const daySlots = slots.filter((s) => s.day === day)
  const times = Array.from(new Set(daySlots.map((s) => s.startTime))).sort()

  return (
    <div className="overflow-x-auto">
      <div
        style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr 1fr', gap: '8px', minWidth: '600px' }}
      >
        {/* Header */}
        <div />
        {TRACKS.map((track) => (
          <div key={track} className="rounded-lg bg-slate-100 px-3 py-2 text-center">
            <div className="text-[12px] font-bold text-slate-700">Track {track}</div>
            <div className="text-[10px] text-slate-400">{ROOMS[track]}</div>
          </div>
        ))}

        {/* Time rows */}
        {times.map((time) => (
          <Fragment key={time}>
            <div className="flex items-center justify-end pr-2 pt-3">
              <span className="text-[12px] font-medium text-slate-500">{time}</span>
            </div>
            {TRACKS.map((track) => {
              const slot = daySlots.find((s) => s.track === track && s.startTime === time)
              if (!slot)
                return (
                  <div
                    key={`${track}-${time}`}
                    className="min-h-[96px] rounded-lg border-2 border-dashed border-slate-200"
                  />
                )
              return (
                <SlotCell
                  key={slot.slotId}
                  slot={slot}
                  persons={persons}
                  teamLookup={teamLookup}
                  published={published}
                  onRemoveJudge={onRemoveJudge}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

// ─── ConflictPanel ────────────────────────────────────────────────────────────

interface ConflictPanelProps {
  slots: PitchSlot[]
  teamLookup: Array<{ teamId: string; teamName: string }>
  onResolve: (slotId: string, conflictIndex: number) => void
}

function ConflictPanel({ slots, teamLookup, onResolve }: ConflictPanelProps) {
  const allConflicts = slots.flatMap((slot) =>
    slot.conflicts.map((conflict, index) => ({ slot, conflict, index }))
  )
  if (allConflicts.length === 0) return null

  return (
    <div className="w-[272px] shrink-0 self-start rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={14} className="text-red-600" />
        <span className="text-[13px] font-semibold text-red-700">
          {allConflicts.length} Conflict{allConflicts.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {allConflicts.map(({ slot, conflict, index }) => {
          const team = teamLookup.find((t) => t.teamId === slot.teamId)
          return (
            <div
              key={`${slot.slotId}-${index}`}
              className="rounded-xl border border-red-200 bg-white p-3"
            >
              <span
                className={`mb-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide
                  ${conflict.type === 'double_booked_judge'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}
              >
                {conflict.type === 'double_booked_judge' ? 'Double Booked' : 'Conflict of Interest'}
              </span>
              <p className="mb-2 text-[11px] leading-relaxed text-slate-600">
                {conflict.description}
              </p>
              <p className="mb-3 text-[10px] text-slate-400">
                Track {slot.track} · {slot.room} · Day {slot.day} {slot.startTime}
                {team && ` · ${team.teamName}`}
              </p>
              <button
                onClick={() => onResolve(slot.slotId, index)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
              >
                Mark resolved
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const { pitchSlots, persons, teams, schedulePublished, resolveConflict, publishSchedule } =
    useStore()

  const teamLookup = teams.map((t) => ({ teamId: t.teamId, teamName: t.teamName }))

  const [localSlots, setLocalSlots] = useState<PitchSlot[]>(() =>
    detectConflicts(pitchSlots, persons)
  )
  const [activeDay, setActiveDay] = useState('1')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [published, setPublished] = useState(schedulePublished)

  const allConflicts = localSlots.flatMap((s) => s.conflicts)
  const hasConflicts = allConflicts.length > 0

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return

      const sourceId = active.id as string
      const targetId = over.id as string

      setLocalSlots((prev) => {
        const sourceSlot = prev.find((s) => s.slotId === sourceId)
        const targetSlot = prev.find((s) => s.slotId === targetId)
        if (!sourceSlot) return prev

        const next = prev.map((slot) => {
          if (slot.slotId === sourceId) return { ...slot, teamId: targetSlot?.teamId }
          if (slot.slotId === targetId) return { ...slot, teamId: sourceSlot.teamId }
          return slot
        })
        return detectConflicts(next, persons)
      })
    },
    [persons]
  )

  const handleResolve = useCallback(
    (slotId: string, conflictIndex: number) => {
      setLocalSlots((prev) =>
        prev.map((s) => {
          if (s.slotId !== slotId) return s
          return { ...s, conflicts: s.conflicts.filter((_, i) => i !== conflictIndex) }
        })
      )
      resolveConflict(slotId, conflictIndex)
    },
    [resolveConflict]
  )

  const handleRemoveJudge = useCallback(
    (slotId: string, judgeId: string) => {
      setLocalSlots((prev) => {
        const next = prev.map((s) => {
          if (s.slotId !== slotId) return s
          return { ...s, judgeIds: s.judgeIds.filter((j) => j !== judgeId) }
        })
        return detectConflicts(next, persons)
      })
    },
    [persons]
  )

  const handlePublish = () => {
    publishSchedule()
    setPublished(true)
    setConfirmOpen(false)
  }

  const draggingSlot = localSlots.find((s) => s.slotId === draggingId)
  const draggingTeam = draggingSlot?.teamId
    ? teamLookup.find((t) => t.teamId === draggingSlot.teamId)
    : null

  return (
    <div className="flex h-full flex-col">
      {/* Published banner */}
      {published && (
        <div className="flex items-center gap-2 border-b border-green-200 bg-green-50 px-6 py-2.5">
          <CheckCircle2 size={14} className="text-green-600" />
          <span className="text-[13px] font-medium text-green-700">
            Schedule published — judges and participants have been notified.
          </span>
          <Lock size={12} className="ml-1 text-green-500" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-[18px] font-semibold text-slate-900">Pitch Schedule</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">GSSC Worlds 2026 · May 19–20</p>
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
              <FileDown size={14} />
              Export PDF
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

      {/* Body */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-5 overflow-auto p-6">
          {/* Tabs + Grid */}
          <div className="min-w-0 flex-1">
            <Tabs value={activeDay} onValueChange={(v) => v && setActiveDay(v)}>
              <TabsList className="mb-5">
                <TabsTrigger value="1">Day 1 — May 19</TabsTrigger>
                <TabsTrigger value="2">Day 2 — May 20</TabsTrigger>
              </TabsList>
              <TabsContent value="1">
                <ScheduleGrid
                  day={1}
                  slots={localSlots}
                  persons={persons}
                  teamLookup={teamLookup}
                  published={published}
                  onRemoveJudge={handleRemoveJudge}
                />
              </TabsContent>
              <TabsContent value="2">
                <ScheduleGrid
                  day={2}
                  slots={localSlots}
                  persons={persons}
                  teamLookup={teamLookup}
                  published={published}
                  onRemoveJudge={handleRemoveJudge}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Conflict panel */}
          <ConflictPanel
            slots={localSlots}
            teamLookup={teamLookup}
            onResolve={handleResolve}
          />
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {draggingTeam && (
            <div className="rounded-lg border-2 border-blue-400 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 shadow-xl">
              {draggingTeam.teamName}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Publish confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-[16px] font-semibold text-slate-900">Publish Schedule?</h2>
            <p className="mb-1 text-[13px] leading-relaxed text-slate-600">
              This will make the schedule visible to all judges, mentors, and participants.
            </p>
            <p className="mb-6 text-[13px] leading-relaxed text-slate-600">
              Once published, slot assignments will be{' '}
              <span className="font-medium text-slate-800">locked</span> and cannot be changed
              without re-opening.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 rounded-xl bg-blue-600 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
              >
                Yes, Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
