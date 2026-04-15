'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitScore(scoreData: {
  teamId: string
  programId: string
  track: string
  innovation: number
  market: number
  team: number
  traction: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Verify judge is not submitting for a conflicted team
  const { data: conflict } = await supabase
    .from('judge_conflicts')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('team_id', scoreData.teamId)
    .maybeSingle()

  if (conflict) throw new Error('Cannot score a conflicted team')

  // Verify scoring is still open for this track
  const { data: trackStatus } = await supabase
    .from('scoring_tracks')
    .select('closed')
    .eq('program_id', scoreData.programId)
    .eq('track', scoreData.track)
    .maybeSingle()

  if (trackStatus?.closed) throw new Error('Scoring is closed for this track')

  const total = (
    scoreData.innovation * 0.30 +
    scoreData.market     * 0.25 +
    scoreData.team       * 0.25 +
    scoreData.traction   * 0.20
  )

  const { error } = await supabase
    .from('scores')
    .upsert({
      judge_id:    profile.id,
      team_id:     scoreData.teamId,
      program_id:  scoreData.programId,
      track:       scoreData.track,
      innovation:  scoreData.innovation,
      market:      scoreData.market,
      team_score:  scoreData.team,
      traction:    scoreData.traction,
      total:       Math.round(total * 100) / 100,
    }, { onConflict: 'judge_id,team_id' })

  if (error) throw new Error('Failed to submit score: ' + error.message)

  revalidatePath('/scoring')
  return { success: true }
}

export async function closeScoring(programId: string, track: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('scoring_tracks')
    .upsert({
      program_id: programId,
      track,
      closed:     true,
      closed_at:  new Date().toISOString(),
    }, { onConflict: 'program_id,track' })

  if (error) throw new Error('Failed to close scoring: ' + error.message)

  revalidatePath('/scoring')
  return { success: true }
}

export async function acknowledgeRubric(programId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { error } = await supabase
    .from('rubric_acknowledgments')
    .upsert({
      profile_id: profile.id,
      program_id: programId,
    }, { onConflict: 'profile_id,program_id' })

  if (error) throw new Error('Failed to acknowledge rubric: ' + error.message)

  revalidatePath('/scoring')
  return { success: true }
}
