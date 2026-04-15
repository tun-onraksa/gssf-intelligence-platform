'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignTeamToSlot(slotId: string, teamId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('pitch_slots')
    .update({ team_id: teamId })
    .eq('id', slotId)

  if (error) throw new Error('Failed to assign team: ' + error.message)

  await recomputeSlotConflicts(slotId)

  revalidatePath('/schedule')
  return { success: true }
}

export async function assignJudgeToSlot(slotId: string, judgeId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pitch_slot_judges')
    .upsert({ slot_id: slotId, profile_id: judgeId },
      { onConflict: 'slot_id,profile_id' })

  if (error) throw new Error('Failed to assign judge: ' + error.message)

  await recomputeSlotConflicts(slotId)
  revalidatePath('/schedule')
  return { success: true }
}

export async function removeJudgeFromSlot(slotId: string, judgeId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pitch_slot_judges')
    .delete()
    .eq('slot_id', slotId)
    .eq('profile_id', judgeId)

  if (error) throw new Error('Failed to remove judge: ' + error.message)

  await recomputeSlotConflicts(slotId)
  revalidatePath('/schedule')
  return { success: true }
}

export async function publishSchedule(programId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify no unresolved conflicts exist
  const { data: slotIds } = await supabase
    .from('pitch_slots')
    .select('id')
    .eq('program_id', programId)

  const ids = (slotIds ?? []).map((s) => s.id)

  const { data: conflicts } = ids.length
    ? await supabase
        .from('slot_conflicts')
        .select('id')
        .eq('resolved', false)
        .in('slot_id', ids)
    : { data: [] }

  if (conflicts && conflicts.length > 0) {
    throw new Error(`Cannot publish: ${conflicts.length} unresolved conflicts remain`)
  }

  const { error } = await supabase
    .from('pitch_slots')
    .update({ schedule_published: true })
    .eq('program_id', programId)

  if (error) throw new Error('Failed to publish schedule: ' + error.message)

  revalidatePath('/schedule')
  return { success: true }
}

export async function resolveConflict(conflictId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('slot_conflicts')
    .update({ resolved: true })
    .eq('id', conflictId)

  if (error) throw new Error('Failed to resolve conflict: ' + error.message)

  revalidatePath('/schedule')
  return { success: true }
}

// Internal helper — recomputes and upserts conflicts for a slot
async function recomputeSlotConflicts(slotId: string) {
  const supabase = await createClient()

  const { data: slot } = await supabase
    .from('pitch_slots')
    .select('*, pitch_slot_judges(profile_id)')
    .eq('id', slotId)
    .single()

  if (!slot) return

  await supabase
    .from('slot_conflicts')
    .delete()
    .eq('slot_id', slotId)
    .eq('resolved', false)

  type ConflictType = 'double_booked_judge' | 'conflict_of_interest'
  const newConflicts: { slot_id: string; type: ConflictType; judge_id: string; description: string }[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const judgeIds = (slot.pitch_slot_judges as any[]).map((j) => j.profile_id as string)

  for (const judgeId of judgeIds) {
    if (slot.team_id) {
      const { data: coi } = await supabase
        .from('judge_conflicts')
        .select('id')
        .eq('profile_id', judgeId)
        .eq('team_id', slot.team_id)
        .maybeSingle()

      if (coi) {
        newConflicts.push({
          slot_id:     slotId,
          type:        'conflict_of_interest',
          judge_id:    judgeId,
          description: 'Judge declared a conflict of interest with this team',
        })
      }
    }

    const { data: overlapping } = await supabase
      .from('pitch_slots')
      .select('id, pitch_slot_judges!inner(profile_id)')
      .eq('day', slot.day)
      .eq('start_time', slot.start_time)
      .eq('pitch_slot_judges.profile_id', judgeId)
      .neq('id', slotId)

    if (overlapping && overlapping.length > 0) {
      newConflicts.push({
        slot_id:     slotId,
        type:        'double_booked_judge',
        judge_id:    judgeId,
        description: `Judge is assigned to another session at ${slot.start_time} on Day ${slot.day}`,
      })
    }
  }

  if (newConflicts.length > 0) {
    await supabase.from('slot_conflicts').insert(newConflicts)
  }
}
