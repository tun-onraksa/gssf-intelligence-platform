'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptMentorMatch(mentorId: string, teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('teams')
    .update({ assigned_mentor_id: mentorId })
    .eq('id', teamId)

  if (error) throw new Error('Failed to assign mentor: ' + error.message)

  revalidatePath('/matching')
  revalidatePath('/teams')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function removeMentorAssignment(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('teams')
    .update({ assigned_mentor_id: null })
    .eq('id', teamId)

  if (error) throw new Error('Failed to remove assignment: ' + error.message)

  revalidatePath('/matching')
  revalidatePath('/teams')
  return { success: true }
}
