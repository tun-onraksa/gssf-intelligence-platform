import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from './ReportsClient'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: roleRow } = await supabase
    .from('profile_roles')
    .select('program_id')
    .eq('profile_id', profile!.id)
    .not('program_id', 'is', null)
    .limit(1)
    .single()

  const programId = roleRow?.program_id ?? ''

  const [
    { data: teams },
    { data: universities },
    { data: scores },
    { data: scoringTracks },
    { data: pitchSlots },
    { data: participants },
  ] = await Promise.all([
    supabase
      .from('teams')
      .select(`
        id, name, track, stage, qualifying_path, region_label, pitch_summary, university_id,
        universities (id, name, country),
        team_members (profiles (id, full_name))
      `)
      .order('name'),

    supabase
      .from('universities')
      .select(`
        id, name, country, active_status, cohort_history,
        university_pocs (profiles (id, full_name, email))
      `)
      .order('name'),

    supabase
      .from('scores')
      .select('id, judge_id, team_id, track, innovation, market, team_score, traction, total, submitted_at'),

    supabase
      .from('scoring_tracks')
      .select('track, closed, closed_at'),

    supabase
      .from('pitch_slots')
      .select('id, track, day, start_time, end_time, room, team_id')
      .order('day')
      .order('start_time'),

    supabase
      .from('profiles')
      .select(`
        id, full_name,
        profile_roles!inner (role, program_id)
      `)
      .eq('profile_roles.program_id', programId),
  ])

  // Pre-compute role counts on the server
  const allParticipants = participants ?? []
  const roleCounts = {
    student:   allParticipants.filter(p => p.profile_roles.some((r: { role: string }) => r.role === 'STUDENT')).length,
    mentor:    allParticipants.filter(p => p.profile_roles.some((r: { role: string }) => r.role === 'MENTOR') && !p.profile_roles.some((r: { role: string }) => r.role === 'STUDENT')).length,
    judge:     allParticipants.filter(p => p.profile_roles.some((r: { role: string }) => r.role === 'JUDGE')).length,
    organizer: allParticipants.filter(p =>
      (p.profile_roles.some((r: { role: string }) => r.role === 'ORGANIZER') || p.profile_roles.some((r: { role: string }) => r.role === 'ADMIN')) &&
      !p.profile_roles.some((r: { role: string }) => r.role === 'STUDENT') &&
      !p.profile_roles.some((r: { role: string }) => r.role === 'MENTOR') &&
      !p.profile_roles.some((r: { role: string }) => r.role === 'JUDGE')
    ).length,
    total: allParticipants.length,
  }

  return (
    <ReportsClient
      teams={teams ?? []}
      universities={universities ?? []}
      scores={scores ?? []}
      scoringTracks={scoringTracks ?? []}
      pitchSlots={pitchSlots ?? []}
      roleCounts={roleCounts}
    />
  )
}
