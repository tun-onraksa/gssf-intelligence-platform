'use client'

import { useStore } from '@/lib/store'

export default function DevCheckPage() {
  const {
    persons,
    teams,
    pitchSlots,
  } = useStore()

  const assignedTeams = teams.filter((t) => t.assignedMentorId)
  const visaNeeded = persons.filter((p) => p.needsVisa)
  const duplicates = persons.filter((p) => p.isDuplicate)
  const slotsWithConflicts = pitchSlots.filter((s) => s.conflicts.length > 0)

  const stats = {
    totalPersons: persons.length,
    totalTeams: teams.length,
    teamsWithMentor: assignedTeams.length,
    personsNeedingVisa: visaNeeded.length,
    duplicatePersons: duplicates.length,
    slotsWithConflicts: slotsWithConflicts.length,
  }

  console.log('[DEV CHECK]', stats)

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem' }}>
      <h1>Data Layer Verification</h1>
      <pre>{JSON.stringify(stats, null, 2)}</pre>

      <h2>Teams with assignedMentorId</h2>
      <pre>{JSON.stringify(assignedTeams.map((t) => ({ teamId: t.teamId, mentorId: t.assignedMentorId })), null, 2)}</pre>

      <h2>Persons needing visa</h2>
      <pre>{JSON.stringify(visaNeeded.map((p) => ({ name: p.name, country: p.country })), null, 2)}</pre>

      <h2>Duplicate persons</h2>
      <pre>{JSON.stringify(duplicates.map((p) => ({ name: p.name, email: p.email })), null, 2)}</pre>

      <h2>Slots with conflicts</h2>
      <pre>{JSON.stringify(slotsWithConflicts.map((s) => ({ slotId: s.slotId, conflicts: s.conflicts })), null, 2)}</pre>
    </div>
  )
}
