import { createClient } from '@/lib/supabase/server'
import { ScoringClient } from './ScoringClient'

export default async function ScoringPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('user_id', user!.id)
    .single()

  const { data: profileRoles } = await supabase
    .from('profile_roles')
    .select('role, program_id')
    .eq('profile_id', profile!.id)

  const isJudge  = profileRoles?.some((r) => r.role === 'JUDGE') ?? false
  const programId = profileRoles?.find((r) => r.program_id)?.program_id ?? ''

  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id, name, track, stage, pitch_summary,
      universities (name, country)
    `)
    .order('name')

  const { data: scores } = await supabase
    .from('scores')
    .select('id, judge_id, team_id, track, innovation, market, team_score, traction, total, submitted_at')

  const { data: scoringTracks } = await supabase
    .from('scoring_tracks')
    .select('track, closed, closed_at')

  const { data: judges } = await supabase
    .from('profiles')
    .select(`
      id, full_name, organization_name,
      profile_roles!inner (role),
      judge_conflicts (team_id),
      rubric_acknowledgments (acknowledged_at)
    `)
    .eq('profile_roles.role', 'JUDGE')

  const { data: slots } = await supabase
    .from('pitch_slots')
    .select('id, track, team_id, pitch_slot_judges(profile_id)')

  return (
    <ScoringClient
      currentProfileId={profile!.id}
      currentProfileName={profile!.full_name ?? ''}
      isJudge={isJudge}
      programId={programId}
      teams={teams ?? []}
      scores={scores ?? []}
      scoringTracks={scoringTracks ?? []}
      judges={judges ?? []}
      slots={slots ?? []}
    />
  )
}
