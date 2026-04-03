import { create } from 'zustand'
import type { AppStore, VisaLetter } from './types'
import {
  programs,
  universities,
  expertiseTags,
  persons,
  teams,
  pitchSlots,
  scores,
  mentorMatches,
  visaLetters,
} from './seed'

export const useStore = create<AppStore>((set) => ({
  // ── Initial State ──
  activeRole: 'ADMIN',
  activeProgramId: 'prog_worlds_2026',
  persons,
  teams,
  universities,
  programs,
  expertiseTags,
  pitchSlots,
  scores,
  mentorMatches,
  visaLetters,
  schedulePublished: false,
  scoringClosed: {},

  // ── Actions ──
  setRole: (role) => set({ activeRole: role }),

  setActiveProgram: (programId) => set({ activeProgramId: programId }),

  confirmPerson: (person) =>
    set((state) => {
      const idx = state.persons.findIndex((p) => p.email === person.email)
      const updated = { ...person, status: 'confirmed' as const }
      if (idx >= 0) {
        const persons = [...state.persons]
        persons[idx] = updated
        return { persons }
      }
      return { persons: [...state.persons, updated] }
    }),

  acceptMentorMatch: (mentorId, teamId) =>
    set((state) => ({
      teams: state.teams.map((t) =>
        t.teamId === teamId ? { ...t, assignedMentorId: mentorId } : t
      ),
    })),

  submitScore: (score) =>
    set((state) => ({ scores: [...state.scores, score] })),

  closeScoring: (track) =>
    set((state) => ({
      scoringClosed: { ...state.scoringClosed, [track]: true },
    })),

  publishSchedule: () => set({ schedulePublished: true }),

  generateVisaLetters: () =>
    set((state) => {
      const eligible = state.persons.filter(
        (p) => p.needsVisa && p.status === 'confirmed'
      )
      const existing = new Set(state.visaLetters.map((v) => v.personId))
      const now = new Date().toISOString()
      const newLetters: VisaLetter[] = eligible
        .filter((p) => !existing.has(p.personId))
        .map((p) => ({
          letterId: `visa_${p.personId}_v1`,
          personId: p.personId,
          version: 1,
          generatedAt: now,
          status: 'generated' as const,
        }))
      return { visaLetters: [...state.visaLetters, ...newLetters] }
    }),

  markVisaLetterSent: (letterId) =>
    set((state) => ({
      visaLetters: state.visaLetters.map((v) =>
        v.letterId === letterId
          ? { ...v, status: 'sent' as const, sentAt: new Date().toISOString() }
          : v
      ),
    })),

  resolveConflict: (slotId, conflictIndex) =>
    set((state) => ({
      pitchSlots: state.pitchSlots.map((s) => {
        if (s.slotId !== slotId) return s
        const conflicts = s.conflicts.filter((_, i) => i !== conflictIndex)
        return { ...s, conflicts }
      }),
    })),
}))
